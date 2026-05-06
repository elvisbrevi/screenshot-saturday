import type { FC } from 'hono/jsx'
import type { NormalizedPost, ApiResponse } from '../types'

const REPO_URL = 'https://github.com/elvisbrevi/screenshot-saturday'

const GithubIcon: FC = () => (
  <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

const MoonIcon: FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const PlayIcon: FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <polygon points="5,3 19,12 5,21" />
  </svg>
)

const GalleryIcon: FC = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const ArrowRightIcon: FC = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const LogoIcon: FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="14" y1="10" x2="14" y2="14" />
    <line x1="18" y1="9" x2="18" y2="15" />
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
  return 'card-sub reddit'
}

const authorPrefix = (source: NormalizedPost['source']) =>
  source === 'reddit' ? 'u/' : source === 'mastodon' ? '@' : ''

const visibleDescription = (post: NormalizedPost) => {
  const description = post.description.trim()
  if (!description) return ''

  const title = post.title.trim()
  if (description === title || description.startsWith(`${title}...`)) return ''

  return description
}

const PostCard: FC<{ post: NormalizedPost }> = ({ post }) => {
  const dateStr = new Date(post.date * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isVideo = post.mediaType === 'video'
  const isGallery = post.mediaType === 'gallery'
  const galleryCount = post.media.gallery?.length || 0
  const description = visibleDescription(post)
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
            <div class="play-icon"><PlayIcon /></div>
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
        {isGallery && (
          <span class="gallery-badge">
            <GalleryIcon /> {galleryCount}
          </span>
        )}
      </div>
      <div class="card-body">
        <h3 class="card-title">{post.title}</h3>
        {description && <p class="card-description">{description}</p>}
        <div class="card-meta">
          <span class="card-author">{authorPrefix(post.source)}{post.author}</span>
          <span class={sourceClass(post.source)}>{sourceLabel(post.source, post.subreddit)}</span>
          <span class="card-date">{dateStr}</span>
        </div>
        <a href={post.permalink} target="_blank" rel="noopener noreferrer" class="card-link">
          {linkText} <ArrowRightIcon />
        </a>
      </div>
    </article>
  )
}

export const Page: FC<{ initialData: ApiResponse }> = ({ initialData }) => {
  return (
    <div id="app">
      <div class="topbar">
        <a href="/" class="topbar-brand" aria-label="Screenshot Saturday home">
          <LogoIcon />
        </a>
        <div class="topbar-actions">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="icon-button"
            aria-label="View source on GitHub"
          >
            <GithubIcon />
          </a>
          <button id="theme-toggle" class="icon-button" aria-label="Toggle theme">
            <MoonIcon />
          </button>
        </div>
      </div>

      <header class="site-header">
        <h1 class="site-title">Screenshot Saturday</h1>
        <p class="site-subtitle">
          The best indie game screenshots from across the fediverse and Reddit.
        </p>
        <ul class="source-chips" aria-label="Sources">
          <li class="chip"><span class="chip-dot reddit"></span>Reddit</li>
          <li class="chip"><span class="chip-dot bluesky"></span>Bluesky</li>
          <li class="chip"><span class="chip-dot mastodon"></span>Mastodon</li>
          <li class="chip"><span class="chip-dot tag"></span>#screenshotsaturday</li>
          <li class="chip"><span class="chip-dot tag"></span>#gamedev</li>
        </ul>
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
        <p class="footer-meta">
          Aggregating <strong>#screenshotsaturday</strong> &amp; <strong>#gamedev</strong> from
          Reddit, Bluesky and Mastodon.
        </p>
      </footer>

      <div id="modal" class="modal" style="display:none">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <button class="modal-close" aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button class="modal-nav modal-prev" aria-label="Previous">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button class="modal-nav modal-next" aria-label="Next">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
