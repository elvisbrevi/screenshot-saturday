import type {
  BlueskySearchResponse,
  BlueskyPost,
  NormalizedPost,
  MediaInfo,
} from './types'

const BLUESKY_API = 'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts'
const POSTS_LIMIT = 25

interface ImageView {
  thumb: string
  fullsize: string
  alt?: string
  aspectRatio?: { width: number; height: number }
}

function extractFromImages(images: ImageView[]): { media: MediaInfo; mediaType: NormalizedPost['mediaType'] } | null {
  if (!images.length) return null
  const first = images[0]
  const width = first.aspectRatio?.width || 0
  const height = first.aspectRatio?.height || 0

  if (images.length > 1) {
    return {
      media: {
        url: first.fullsize,
        thumbnail: first.thumb,
        width,
        height,
        gallery: images.map((img) => ({
          url: img.fullsize,
          width: img.aspectRatio?.width || 0,
          height: img.aspectRatio?.height || 0,
        })),
      },
      mediaType: 'gallery',
    }
  }

  return {
    media: {
      url: first.fullsize,
      thumbnail: first.thumb,
      width,
      height,
    },
    mediaType: 'image',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMedia(embed: any): { media: MediaInfo; mediaType: NormalizedPost['mediaType'] } | null {
  if (!embed) return null

  const type = embed.$type as string

  if (type === 'app.bsky.embed.images#view' && embed.images?.length) {
    return extractFromImages(embed.images)
  }

  if (type === 'app.bsky.embed.video#view' && embed.thumbnail) {
    return {
      media: {
        url: embed.playlist || embed.thumbnail,
        thumbnail: embed.thumbnail,
        width: embed.aspectRatio?.width || 0,
        height: embed.aspectRatio?.height || 0,
      },
      mediaType: 'video',
    }
  }

  // recordWithMedia wraps media under .media
  if (type === 'app.bsky.embed.recordWithMedia#view' && embed.media) {
    return extractMedia(embed.media)
  }

  return null
}

function normalizePost(post: BlueskyPost): NormalizedPost | null {
  const extracted = extractMedia(post.embed)
  if (!extracted) return null

  const uriParts = post.uri.split('/')
  const rkey = uriParts[uriParts.length - 1]

  const title = post.record.text?.slice(0, 120) || 'Bluesky Post'
  const createdAt = new Date(post.record.createdAt).getTime() / 1000

  return {
    id: `bsky_${post.cid}`,
    title,
    description: post.record.text?.slice(0, 200) || '',
    author: post.author.displayName || post.author.handle,
    subreddit: 'bsky',
    date: createdAt,
    permalink: `https://bsky.app/profile/${post.author.handle}/post/${rkey}`,
    mediaType: extracted.mediaType,
    media: extracted.media,
    source: 'bluesky',
  }
}

export async function fetchBlueskyPosts(
  cursor?: string,
  dateFrom?: number,
  dateTo?: number
): Promise<{ posts: NormalizedPost[]; after: string | null }> {
  const params = new URLSearchParams({
    q: '#screenshotsaturday',
    sort: 'latest',
    limit: String(POSTS_LIMIT),
  })
  if (cursor) params.set('cursor', cursor)

  const url = `${BLUESKY_API}?${params}`

  let res: Response
  try {
    res = await fetch(url, {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
  } catch (err) {
    console.error('Bluesky API fetch error:', err)
    return { posts: [], after: null }
  }

  if (!res.ok) {
    console.error(`Bluesky API error: ${res.status}`)
    return { posts: [], after: null }
  }

  const json = (await res.json()) as BlueskySearchResponse
  const posts: NormalizedPost[] = []

  for (const item of json.posts) {
    const normalized = normalizePost(item)
    if (!normalized) continue
    if (dateFrom && normalized.date < dateFrom) continue
    if (dateTo && normalized.date > dateTo) continue
    posts.push(normalized)
  }

  return { posts, after: json.cursor || null }
}
