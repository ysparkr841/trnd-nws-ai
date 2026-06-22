import Parser from 'rss-parser'
import { readSourcesConfig, type RssSource } from '@/lib/config/sources'

const parser = new Parser()

export interface RssFeedItem {
  source: 'rss'
  sourceUrl: string
  authorName: string
  content: string
  collectedAt: Date
}

export interface RssCollectResult {
  items: RssFeedItem[]
  errors: Record<string, string>
}

export async function collectRssFeeds(sources?: RssSource[]): Promise<RssCollectResult> {
  const items: RssFeedItem[] = []
  const errors: Record<string, string> = {}
  const RSS_SOURCES = sources ?? readSourcesConfig().rss

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      for (const item of feed.items.slice(0, 10)) {
        if (!item.link) continue
        items.push({
          source: 'rss',
          sourceUrl: item.link,
          authorName: source.name,
          content: item.title ?? item.contentSnippet ?? '',
          collectedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        })
      }
    } catch (err) {
      console.error(`RSS 수집 실패: ${source.name}`, err)
      errors[source.url] = String(err)
    }
  }

  return { items, errors }
}
