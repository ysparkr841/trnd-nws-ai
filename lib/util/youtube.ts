export interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  url: string
}

export function getYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export async function searchRelatedVideos(
  query: string,
  maxResults = 3,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', apiKey)
  url.searchParams.set('relevanceLanguage', 'ko')
  url.searchParams.set('order', 'relevance')

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = (await res.json()) as {
    items?: Array<{
      id: { videoId: string }
      snippet: {
        title: string
        channelTitle: string
        publishedAt: string
        thumbnails: { medium?: { url: string }; default?: { url: string } }
      }
    }>
  }

  return (data.items ?? []).map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt.slice(0, 10),
    thumbnailUrl:
      item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }))
}
