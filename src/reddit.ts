import type {
  RedditResponse,
  RedditPost,
  NormalizedPost,
  MediaInfo,
  ApiResponse,
} from './types'

const SUBREDDITS = ['gamedev', 'indiegaming', 'IndieDev', 'screenshotsaturday']
const POSTS_PER_SUB = 25
const USER_AGENT = 'screenshot-saturday/1.0'

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractMedia(post: RedditPost['data']): MediaInfo | null {
  if (post.is_gallery && post.gallery_data && post.media_metadata) {
    const gallery: Array<{ url: string; width: number; height: number }> = []
    for (const item of post.gallery_data.items) {
      const meta = post.media_metadata[item.media_id]
      if (meta?.status === 'valid' && meta.s?.u) {
        gallery.push({
          url: decodeHtmlEntities(meta.s.u),
          width: meta.s.x,
          height: meta.s.y,
        })
      }
    }
    if (gallery.length === 0) return null
    const first = gallery[0]
    return {
      url: first.url,
      thumbnail: first.url,
      width: first.width,
      height: first.height,
      gallery,
    }
  }

  if (post.is_video && post.media?.reddit_video) {
    const video = post.media.reddit_video
    const thumb =
      post.preview?.images?.[0]?.source?.url
        ? decodeHtmlEntities(post.preview.images[0].source.url)
        : post.thumbnail || ''
    return {
      url: decodeHtmlEntities(video.fallback_url),
      thumbnail: thumb,
      width: video.width,
      height: video.height,
    }
  }

  if (
    post.post_hint === 'image' ||
    (post.preview?.images?.[0] && !post.is_video && !post.is_gallery)
  ) {
    const source = post.preview?.images?.[0]?.source
    if (!source) return null
    const url = decodeHtmlEntities(source.url)
    const resolutions = post.preview?.images?.[0]?.resolutions || []
    const thumbRes =
      resolutions.find((r) => r.width >= 320) || resolutions[resolutions.length - 1]
    return {
      url,
      thumbnail: thumbRes ? decodeHtmlEntities(thumbRes.url) : url,
      width: source.width,
      height: source.height,
    }
  }

  if (
    post.url &&
    /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(post.url)
  ) {
    return {
      url: post.url,
      thumbnail: post.url,
      width: post.thumbnail_width || 0,
      height: post.thumbnail_height || 0,
    }
  }

  return null
}

function normalizePost(raw: RedditPost): NormalizedPost | null {
  const post = raw.data
  const media = extractMedia(post)
  if (!media) return null

  let mediaType: NormalizedPost['mediaType'] = 'image'
  if (post.is_video) mediaType = 'video'
  else if (post.is_gallery && media.gallery) mediaType = 'gallery'

  return {
    id: post.id,
    title: post.title,
    description: post.selftext?.slice(0, 200) || '',
    author: post.author,
    subreddit: post.subreddit,
    date: post.created_utc,
    permalink: `https://www.reddit.com${post.permalink}`,
    mediaType,
    media,
  }
}

async function fetchSubreddit(
  subreddit: string,
  after?: string,
  dateFrom?: number,
  dateTo?: number
): Promise<{ posts: NormalizedPost[]; after: string | null }> {
  const params = new URLSearchParams({
    q: 'screenshot saturday',
    restrict_sr: '1',
    sort: 'new',
    limit: String(POSTS_PER_SUB),
  })
  if (after) params.set('after', after)

  const url = `https://www.reddit.com/r/${subreddit}/search.json?${params}`

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    cf: { cacheTtl: 300, cacheEverything: true },
  } as RequestInit)

  if (!res.ok) {
    console.error(`Reddit API error for r/${subreddit}: ${res.status}`)
    return { posts: [], after: null }
  }

  const json = (await res.json()) as RedditResponse
  const posts: NormalizedPost[] = []

  for (const child of json.data.children) {
    const normalized = normalizePost(child)
    if (!normalized) continue
    if (dateFrom && normalized.date < dateFrom) continue
    if (dateTo && normalized.date > dateTo) continue
    posts.push(normalized)
  }

  return { posts, after: json.data.after }
}

export async function fetchPosts(options: {
  after?: string
  dateFrom?: number
  dateTo?: number
}): Promise<ApiResponse> {
  const { after, dateFrom, dateTo } = options

  const cursors: Record<string, string> = {}
  if (after) {
    try {
      const decoded = JSON.parse(atob(after))
      Object.assign(cursors, decoded)
    } catch {
      // If not a composite cursor, use for first subreddit
      cursors[SUBREDDITS[0]] = after
    }
  }

  const results = await Promise.all(
    SUBREDDITS.map((sub) => fetchSubreddit(sub, cursors[sub], dateFrom, dateTo))
  )

  const allPosts: NormalizedPost[] = []
  const nextCursors: Record<string, string> = {}
  let hasMore = false

  for (let i = 0; i < SUBREDDITS.length; i++) {
    allPosts.push(...results[i].posts)
    if (results[i].after) {
      nextCursors[SUBREDDITS[i]] = results[i].after!
      hasMore = true
    }
  }

  allPosts.sort((a, b) => b.date - a.date)

  const nextCursor = hasMore ? btoa(JSON.stringify(nextCursors)) : null

  return { posts: allPosts, nextCursor, hasMore }
}
