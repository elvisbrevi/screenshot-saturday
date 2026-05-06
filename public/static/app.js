(function () {
  'use strict';

  const state = {
    posts: window.__INITIAL_DATA__?.posts || [],
    nextCursor: window.__INITIAL_DATA__?.nextCursor || null,
    hasMore: window.__INITIAL_DATA__?.hasMore ?? true,
    loading: false,
    modalIndex: -1,
    galleryIndex: 0,
  };

  // SVG icon strings
  const ICONS = {
    moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>',
    gallery: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  };

  // Theme toggle
  (function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    const isDark = () => root.getAttribute('data-theme') === 'dark';

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      localStorage.setItem('theme', theme);
    }

    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const saved = localStorage.getItem('theme');
    applyTheme(saved || getSystemTheme());

    btn.addEventListener('click', () => {
      applyTheme(isDark() ? 'light' : 'dark');
    });
  })();

  const grid = document.getElementById('posts-grid');
  const sentinel = document.getElementById('load-sentinel');
  const spinner = document.getElementById('loading-spinner');
  const noPostsEl = document.getElementById('no-posts');
  const modal = document.getElementById('modal');
  const modalMedia = document.getElementById('modal-media');
  const modalInfo = document.getElementById('modal-info');

  // Fetch posts from API
  async function fetchPosts(cursor) {
    const params = new URLSearchParams();
    if (cursor) params.set('after', cursor);

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
          <div class="play-icon">${ICONS.play}</div>
        </div>`;
    } else {
      mediaHTML = `<img src="${esc(post.media.thumbnail)}" alt="${esc(post.title)}" loading="lazy" />`;
    }

    const badgeHTML = isGallery
      ? `<span class="gallery-badge">${ICONS.gallery} ${galleryCount}</span>`
      : '';
    const galleryAttr = isGallery
      ? ` data-gallery='${JSON.stringify(post.media.gallery).replace(/'/g, '&#39;')}'`
      : '';
    const authorPrefix = source === 'reddit' ? 'u/' : source === 'mastodon' ? '@' : '';
    const subClass = source === 'bluesky'
      ? 'card-sub bluesky'
      : source === 'mastodon'
        ? 'card-sub mastodon'
        : 'card-sub reddit';
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
    const description = visibleDescription(post);
    const descriptionHTML = description
      ? `<p class="card-description">${esc(description)}</p>`
      : '';

    return `
      <article class="card" data-id="${esc(post.id)}" data-date="${post.date}">
        <div class="card-media" data-full-url="${esc(post.media.url)}" data-media-type="${post.mediaType}"${galleryAttr}>
          ${mediaHTML}
          ${badgeHTML}
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(post.title)}</h3>
          ${descriptionHTML}
          <div class="card-meta">
            <span class="card-author">${authorPrefix}${esc(post.author)}</span>
            <span class="${subClass}">${subLabel}</span>
            <span class="card-date">${dateStr}</span>
          </div>
          <a href="${esc(post.permalink)}" target="_blank" rel="noopener noreferrer" class="card-link">
            ${linkText} ${ICONS.arrow}
          </a>
        </div>
      </article>`;
  }

  function visibleDescription(post) {
    const description = (post.description || '').trim();
    if (!description) return '';

    const title = (post.title || '').trim();
    if (description === title || description.startsWith(title + '...')) return '';

    return description;
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

  // Infinite scroll
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore();
    },
    { rootMargin: '600px' }
  );
  observer.observe(sentinel);

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
      <a href="${esc(post.permalink)}" target="_blank" rel="noopener noreferrer" class="modal-info-link${modalLinkClass}">${modalLinkText} ${ICONS.arrow}</a>
      ${galleryCounter}`;
  }

  function navigateModal(dir) {
    const post = state.posts[state.modalIndex];
    if (!post) return;

    if (post.mediaType === 'gallery' && post.media.gallery) {
      const newIdx = state.galleryIndex + dir;
      if (newIdx >= 0 && newIdx < post.media.gallery.length) {
        state.galleryIndex = newIdx;
        renderModal();
        return;
      }
    }

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
  modal.querySelector('.modal-content').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
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
