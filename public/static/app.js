(function () {
  'use strict';

  const state = {
    posts: window.__INITIAL_DATA__?.posts || [],
    nextCursor: window.__INITIAL_DATA__?.nextCursor || null,
    hasMore: window.__INITIAL_DATA__?.hasMore ?? true,
    loading: false,
    modalIndex: -1,
    galleryIndex: 0,
    dateFilter: 'all',
  };

  // Theme toggle
  (function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const MOON = '\u263E';
    const SUN = '\u2600';

    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      btn.textContent = theme === 'dark' ? SUN : MOON;
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      localStorage.setItem('theme', theme);
    }

    const saved = localStorage.getItem('theme');
    applyTheme(saved || getSystemTheme());

    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  })();

  const grid = document.getElementById('posts-grid');
  const sentinel = document.getElementById('load-sentinel');
  const spinner = document.getElementById('loading-spinner');
  const noPostsEl = document.getElementById('no-posts');
  const modal = document.getElementById('modal');
  const modalMedia = document.getElementById('modal-media');
  const modalInfo = document.getElementById('modal-info');
  const dateFilter = document.getElementById('date-filter');

  // Date filter ranges
  function getDateRange(filter) {
    const now = Math.floor(Date.now() / 1000);
    switch (filter) {
      case 'week':
        return { date_from: now - 7 * 86400, date_to: now };
      case 'month':
        return { date_from: now - 30 * 86400, date_to: now };
      case '3months':
        return { date_from: now - 90 * 86400, date_to: now };
      default:
        return {};
    }
  }

  // Fetch posts from API
  async function fetchPosts(cursor) {
    const params = new URLSearchParams();
    if (cursor) params.set('after', cursor);
    const range = getDateRange(state.dateFilter);
    if (range.date_from) params.set('date_from', String(range.date_from));
    if (range.date_to) params.set('date_to', String(range.date_to));

    const res = await fetch('/api/posts?' + params.toString());
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }

  // Create card HTML
  function createCardHTML(post) {
    const dateStr = new Date(post.date * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const isVideo = post.mediaType === 'video';
    const isGallery = post.mediaType === 'gallery';
    const galleryCount = post.media.gallery?.length || 0;
    const source = post.source;

    let mediaHTML;
    if (isVideo) {
      mediaHTML = `
        <div class="video-thumb">
          <img src="${esc(post.media.thumbnail)}" alt="${esc(post.title)}" loading="lazy" />
          <div class="play-icon">&#9654;</div>
        </div>`;
    } else {
      mediaHTML = `<img src="${esc(post.media.thumbnail)}" alt="${esc(post.title)}" loading="lazy" />`;
    }

    const badgeHTML = isGallery ? `<span class="gallery-badge">${galleryCount} images</span>` : '';
    const galleryAttr = isGallery ? ` data-gallery='${JSON.stringify(post.media.gallery).replace(/'/g, '&#39;')}'` : '';
    const authorPrefix = source === 'reddit' ? 'u/' : source === 'mastodon' ? '@' : '';
    const subClass = source === 'bluesky'
      ? 'card-sub bluesky'
      : source === 'mastodon'
        ? 'card-sub mastodon'
        : 'card-sub';
    const subLabel = source === 'bluesky'
      ? 'bsky'
      : source === 'mastodon'
        ? 'mastodon'
        : `r/${esc(post.subreddit)}`;
    const linkText = source === 'bluesky'
      ? 'View on Bluesky'
      : source === 'mastodon'
        ? 'View on Mastodon'
        : 'View on Reddit';

    return `
      <article class="card" data-id="${esc(post.id)}" data-date="${post.date}">
        <div class="card-media" data-full-url="${esc(post.media.url)}" data-media-type="${post.mediaType}"${galleryAttr}>
          ${mediaHTML}
          ${badgeHTML}
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(post.title)}</h3>
          <div class="card-meta">
            <span class="card-author">${authorPrefix}${esc(post.author)}</span>
            <span class="${subClass}">${subLabel}</span>
            <span class="card-date">${dateStr}</span>
          </div>
          <a href="${esc(post.permalink)}" target="_blank" rel="noopener noreferrer" class="card-link">
            ${linkText} &rarr;
          </a>
        </div>
      </article>`;
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Load more posts
  async function loadMore() {
    if (state.loading || !state.hasMore) return;
    state.loading = true;
    spinner.style.display = '';

    try {
      const data = await fetchPosts(state.nextCursor);
      // Deduplicate
      const existingIds = new Set(state.posts.map((p) => p.id));
      const newPosts = data.posts.filter((p) => !existingIds.has(p.id));

      state.posts.push(...newPosts);
      state.nextCursor = data.nextCursor;
      state.hasMore = data.hasMore;

      const fragment = document.createDocumentFragment();
      for (const post of newPosts) {
        const temp = document.createElement('div');
        temp.innerHTML = createCardHTML(post);
        fragment.appendChild(temp.firstElementChild);
      }
      grid.appendChild(fragment);

      if (!state.hasMore) {
        spinner.style.display = 'none';
      }
      if (state.posts.length === 0) {
        noPostsEl.style.display = '';
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
      spinner.style.display = 'none';
    } finally {
      state.loading = false;
    }
  }

  // Reset grid with new filter
  async function resetGrid() {
    state.posts = [];
    state.nextCursor = null;
    state.hasMore = true;
    grid.innerHTML = '';
    noPostsEl.style.display = 'none';
    await loadMore();
  }

  // Infinite scroll
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore();
    },
    { rootMargin: '600px' }
  );
  observer.observe(sentinel);

  // Date filter
  dateFilter.addEventListener('change', (e) => {
    state.dateFilter = e.target.value;
    resetGrid();
  });

  // Modal
  function openModal(index) {
    state.modalIndex = index;
    state.galleryIndex = 0;
    renderModal();
    modal.style.display = '';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (modal.classList.contains('closing')) return;
    modal.classList.add('closing');
    modal.addEventListener('animationend', function handler() {
      modal.classList.remove('closing');
      modal.style.display = 'none';
      modal.removeEventListener('animationend', handler);
      state.modalIndex = -1;
      document.body.style.overflow = '';
      modalMedia.innerHTML = '';
      modalInfo.innerHTML = '';
    }, { once: true });
  }

  function renderModal() {
    const post = state.posts[state.modalIndex];
    if (!post) return;

    let mediaEl = '';
    if (post.mediaType === 'video') {
      mediaEl = `<video src="${esc(post.media.url)}" controls autoplay muted></video>`;
    } else if (post.mediaType === 'gallery' && post.media.gallery) {
      const img = post.media.gallery[state.galleryIndex];
      mediaEl = `<img src="${esc(img.url)}" alt="${esc(post.title)}" />`;
    } else {
      mediaEl = `<img src="${esc(post.media.url)}" alt="${esc(post.title)}" />`;
    }
    modalMedia.innerHTML = mediaEl;

    const dateStr = new Date(post.date * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    let galleryCounter = '';
    if (post.mediaType === 'gallery' && post.media.gallery) {
      galleryCounter = `<div class="modal-gallery-counter">${state.galleryIndex + 1} / ${post.media.gallery.length}</div>`;
    }

    const src = post.source;
    const modalAuthorPrefix = src === 'reddit' ? 'u/' : src === 'mastodon' ? '@' : '';
    const modalSubLabel = src === 'bluesky'
      ? 'bsky'
      : src === 'mastodon'
        ? 'mastodon'
        : `r/${esc(post.subreddit)}`;
    const modalLinkText = src === 'bluesky'
      ? 'View on Bluesky'
      : src === 'mastodon'
        ? 'View on Mastodon'
        : 'View on Reddit';
    const modalLinkClass = src === 'bluesky'
      ? ' bluesky'
      : src === 'mastodon'
        ? ' mastodon'
        : '';

    modalInfo.innerHTML = `
      <div class="modal-info-title">${esc(post.title)}</div>
      <div class="modal-info-meta">${modalAuthorPrefix}${esc(post.author)} &middot; ${modalSubLabel} &middot; ${dateStr}</div>
      <a href="${esc(post.permalink)}" target="_blank" rel="noopener noreferrer" class="modal-info-link${modalLinkClass}">${modalLinkText} &rarr;</a>
      ${galleryCounter}`;
  }

  function navigateModal(dir) {
    const post = state.posts[state.modalIndex];
    if (!post) return;

    // Gallery navigation
    if (post.mediaType === 'gallery' && post.media.gallery) {
      const newIdx = state.galleryIndex + dir;
      if (newIdx >= 0 && newIdx < post.media.gallery.length) {
        state.galleryIndex = newIdx;
        renderModal();
        return;
      }
    }

    // Post navigation
    const newIndex = state.modalIndex + dir;
    if (newIndex >= 0 && newIndex < state.posts.length) {
      state.modalIndex = newIndex;
      state.galleryIndex = 0;
      renderModal();
    }
  }

  // Click on card -> open modal (exclude card-link clicks)
  grid.addEventListener('click', (e) => {
    if (e.target.closest('.card-link')) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const idx = state.posts.findIndex((p) => p.id === id);
    if (idx !== -1) openModal(idx);
  });

  // Modal controls
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-prev').addEventListener('click', () => navigateModal(-1));
  modal.querySelector('.modal-next').addEventListener('click', () => navigateModal(1));

  document.addEventListener('keydown', (e) => {
    if (state.modalIndex === -1) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
  });
})();
