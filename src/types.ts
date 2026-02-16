export interface RedditPost {
  kind: string
  data: {
    id: string
    title: string
    selftext: string
    author: string
    subreddit: string
    created_utc: number
    permalink: string
    url: string
    post_hint?: string
    is_video?: boolean
    is_gallery?: boolean
    gallery_data?: {
      items: Array<{ media_id: string; id: number }>
    }
    media_metadata?: Record<
      string,
      {
        status: string
        s?: { u?: string; gif?: string; x: number; y: number }
        p?: Array<{ u: string; x: number; y: number }>
      }
    >
    media?: {
      reddit_video?: {
        fallback_url: string
        width: number
        height: number
        duration: number
      }
    }
    preview?: {
      images: Array<{
        source: { url: string; width: number; height: number }
        resolutions: Array<{ url: string; width: number; height: number }>
      }>
    }
    thumbnail?: string
    thumbnail_width?: number
    thumbnail_height?: number
  }
}

export interface RedditResponse {
  data: {
    after: string | null
    children: RedditPost[]
  }
}

export interface MediaInfo {
  url: string
  thumbnail: string
  width: number
  height: number
  gallery?: Array<{ url: string; width: number; height: number }>
}

export interface NormalizedPost {
  id: string
  title: string
  description: string
  author: string
  subreddit: string
  date: number
  permalink: string
  mediaType: 'image' | 'video' | 'gallery'
  media: MediaInfo
  source: 'reddit' | 'bluesky'
}

export interface BlueskyPost {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  record: {
    text: string
    createdAt: string
  }
  embed?: {
    $type: string
    images?: Array<{
      thumb: string
      fullsize: string
      alt?: string
      aspectRatio?: { width: number; height: number }
    }>
    thumbnail?: string
    playlist?: string
    aspectRatio?: { width: number; height: number }
  }
  indexedAt: string
}

export interface BlueskySearchResponse {
  posts: BlueskyPost[]
  cursor?: string
}

export interface ApiResponse {
  posts: NormalizedPost[]
  nextCursor: string | null
  hasMore: boolean
}
