import type {
  MastodonStatus,
  MastodonAttachment,
  NormalizedPost,
  MediaInfo,
} from './types'

const MASTODON_INSTANCE = 'https://mastodon.gamedev.place'
const POSTS_LIMIT = 40

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMedia(
  attachments: MastodonAttachment[]
): { media: MediaInfo; mediaType: NormalizedPost['mediaType'] } | null {
  const usable = attachments.filter(
    (a) => a.type === 'image' || a.type === 'video' || a.type === 'gifv'
  )
  if (!usable.length) return null

  const first = usable[0]
  const isVideo = first.type === 'video' || first.type === 'gifv'
  const width = first.meta?.original?.width || 0
  const height = first.meta?.original?.height || 0

  if (!isVideo && usable.length > 1) {
    return {
      media: {
        url: first.url,
        thumbnail: first.preview_url,
        width,
        height,
        gallery: usable.map((a) => ({
          url: a.url,
          width: a.meta?.original?.width || 0,
          height: a.meta?.original?.height || 0,
        })),
      },
      mediaType: 'gallery',
    }
  }

  return {
    media: {
      url: first.url,
      thumbnail: first.preview_url || first.url,
      width,
      height,
    },
    mediaType: isVideo ? 'video' : 'image',
  }
}

function normalizePost(status: MastodonStatus): NormalizedPost | null {
  const extracted = extractMedia(status.media_attachments)
  if (!extracted) return null

  const text = stripHtml(status.content)
  const title = text.slice(0, 120) || 'Mastodon post'
  const date = new Date(status.created_at).getTime() / 1000

  return {
    id: `masto_${status.id}`,
    title,
    description: text.slice(0, 200),
    author: status.account.display_name?.trim() || status.account.username,
    subreddit: 'mastodon',
    date,
    permalink: status.url,
    mediaType: extracted.mediaType,
    media: extracted.media,
    source: 'mastodon',
  }
}

export async function fetchMastodonPosts(
  hashtag: string,
  maxId?: string,
  dateFrom?: number,
  dateTo?: number
): Promise<{ posts: NormalizedPost[]; after: string | null }> {
  const params = new URLSearchParams({ limit: String(POSTS_LIMIT), only_media: 'true' })
  if (maxId) params.set('max_id', maxId)
  const url = `${MASTODON_INSTANCE}/api/v1/timelines/tag/${hashtag}?${params}`

  let res: Response
  try {
    res = await fetch(url, {
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit)
  } catch (err) {
    console.error('Mastodon API fetch error:', err)
    return { posts: [], after: null }
  }

  if (!res.ok) {
    console.error(`Mastodon API error: ${res.status}`)
    return { posts: [], after: null }
  }

  const json = (await res.json()) as MastodonStatus[]
  const posts: NormalizedPost[] = []
  let lastId: string | null = null

  for (const status of json) {
    lastId = status.id
    const normalized = normalizePost(status)
    if (!normalized) continue
    if (dateFrom && normalized.date < dateFrom) continue
    if (dateTo && normalized.date > dateTo) continue
    posts.push(normalized)
  }

  return { posts, after: json.length >= POSTS_LIMIT ? lastId : null }
}
