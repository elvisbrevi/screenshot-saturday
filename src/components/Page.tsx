import type { FC } from 'hono/jsx'
import type { NormalizedPost, ApiResponse } from '../types'

const REPO_URL = 'https://github.com/elvisbrevi/screenshot-saturday'
const AUTHOR_URL = 'https://elvisbrevi.cl'
const AUTHOR_NAME = 'Elvis Brevi'

const GithubIcon: FC = () => (
  <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

const sourceLabel = (source: NormalizedPost['source'], subreddit: string) => {
  if (source === 'bluesky') return 'bsky'
  if (source === 'mastodon') return 'mastodon'
  return `r/${subreddit}`
}

const sourceClass = (source: NormalizedPost['source']) => {
  if (source === 'bluesky') return 'card-sub bluesky'
  if (source === 'mastodon') return 'card-sub mastodon'
  return 'card-sub'
}

const authorPrefix = (source: NormalizedPost['source']) =>
  source === 'reddit' ? 'u/' : source === 'mastodon' ? '@' : ''

const PostCard: FC<{ post: NormalizedPost }> = ({ post }) => {
  const dateStr = new Date(post.date * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isVideo = post.mediaType === 'video'
  const isGallery = post.mediaType === 'gallery'
  const galleryCount = post.media.gallery?.length || 0
  const linkText =
    post.source === 'bluesky'
      ? 'View on Bluesky'
      : post.source === 'mastodon'
        ? 'View on Mastodon'
        : 'View on Reddit'

  return (
    <article class="card" data-id={post.id} data-date={String(post.date)}>
      <div class="card-media" data-full-url={post.media.url} data-media-type={post.mediaType}
        data-gallery={isGallery ? JSON.stringify(post.media.gallery) : undefined}>
        {isVideo ? (
          <div class="video-thumb">
            <img
              src={post.media.thumbnail}
              alt={post.title}
              loading="lazy"
              width={post.media.width || undefined}
              height={post.media.height || undefined}
            />
            <div class="play-icon">&#9654;</div>
          </div>
        ) : (
          <img
            src={post.media.thumbnail}
            alt={post.title}
            loading="lazy"
            width={post.media.width || undefined}
            height={post.media.height || undefined}
          />
        )}
        {isGallery && <span class="gallery-badge">{galleryCount} images</span>}
      </div>
      <div class="card-body">
        <h3 class="card-title">{post.title}</h3>
        <div class="card-meta">
          <span class="card-author">{authorPrefix(post.source)}{post.author}</span>
          <span class={sourceClass(post.source)}>{sourceLabel(post.source, post.subreddit)}</span>
          <span class="card-date">{dateStr}</span>
        </div>
        <a href={post.permalink} target="_blank" rel="noopener noreferrer" class="card-link">
          {linkText} &rarr;
        </a>
      </div>
    </article>
  )
}

export const Page: FC<{ initialData: ApiResponse }> = ({ initialData }) => {
  return (
    <div id="app">
      <div class="topbar">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="icon-button"
          aria-label="View source on GitHub"
        >
          <GithubIcon />
        </a>
        <button id="theme-toggle" class="icon-button theme-toggle" aria-label="Toggle theme">&#9790;</button>
      </div>

      <header class="site-header">
        <div class="header-content">
          <p class="site-eyebrow">Indie game showcase</p>
          <h1 class="site-title">
            <span class="title-icon">&#127918;</span> Screenshot Saturday
          </h1>
          <p class="site-subtitle">
            The best indie game screenshots from across the fediverse and Reddit.
          </p>
          <ul class="source-chips" aria-label="Sources">
            <li class="chip chip-reddit">Reddit</li>
            <li class="chip chip-bluesky">Bluesky</li>
            <li class="chip chip-mastodon">Mastodon</li>
            <li class="chip chip-tag">#screenshotsaturday</li>
            <li class="chip chip-tag">#gamedev</li>
          </ul>
          <div class="filters">
            <select id="date-filter" class="filter-select" aria-label="Filter by date">
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>
        </div>
      </header>

      <main class="gallery">
        <div id="posts-grid" class="posts-grid">
          {initialData.posts.map((post) => (
            <PostCard post={post} key={post.id} />
          ))}
        </div>
        <div id="load-sentinel" class="load-sentinel">
          <div id="loading-spinner" class="spinner"></div>
        </div>
        <div id="no-posts" class="no-posts" style="display:none">
          No screenshots found for this time period.
        </div>
      </main>

      <footer class="site-footer">
        <p class="footer-credit">
          Created by{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            {AUTHOR_NAME}
          </a>
          {' · '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Source on GitHub
          </a>
        </p>
        <p class="footer-meta">
          Aggregating <strong>#screenshotsaturday</strong> &amp; <strong>#gamedev</strong> from
          Reddit, Bluesky and Mastodon.
        </p>
      </footer>

      <div id="modal" class="modal" style="display:none">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <button class="modal-close" aria-label="Close">&times;</button>
          <button class="modal-nav modal-prev" aria-label="Previous">&#10094;</button>
          <button class="modal-nav modal-next" aria-label="Next">&#10095;</button>
          <div class="modal-inner">
            <div id="modal-media" class="modal-media"></div>
            <div id="modal-info" class="modal-info"></div>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};`,
        }}
      />
    </div>
  )
}
