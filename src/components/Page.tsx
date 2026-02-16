import type { FC } from 'hono/jsx'
import type { NormalizedPost, ApiResponse } from '../types'

const PostCard: FC<{ post: NormalizedPost }> = ({ post }) => {
  const dateStr = new Date(post.date * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isVideo = post.mediaType === 'video'
  const isGallery = post.mediaType === 'gallery'
  const galleryCount = post.media.gallery?.length || 0
  const isBluesky = post.source === 'bluesky'

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
          <span class="card-author">{isBluesky ? '' : 'u/'}{post.author}</span>
          <span class={`card-sub${isBluesky ? ' bluesky' : ''}`}>{isBluesky ? 'bsky' : `r/${post.subreddit}`}</span>
          <span class="card-date">{dateStr}</span>
        </div>
        <a href={post.permalink} target="_blank" rel="noopener noreferrer" class="card-link">
          {isBluesky ? 'View on Bluesky' : 'View on Reddit'} &rarr;
        </a>
      </div>
    </article>
  )
}

export const Page: FC<{ initialData: ApiResponse }> = ({ initialData }) => {
  return (
    <div id="app">
      <header class="site-header">
        <div class="header-content">
          <h1 class="site-title">
            <span class="title-icon">&#127918;</span> Screenshot Saturday
          </h1>
          <p class="site-subtitle">The best indie game screenshots from Reddit & Bluesky</p>
          <div class="filters">
            <select id="date-filter" class="filter-select">
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

      <div id="modal" class="modal" style="display:none">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <button class="modal-close" aria-label="Close">&times;</button>
          <button class="modal-nav modal-prev" aria-label="Previous">&#10094;</button>
          <button class="modal-nav modal-next" aria-label="Next">&#10095;</button>
          <div id="modal-media" class="modal-media"></div>
          <div id="modal-info" class="modal-info"></div>
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
