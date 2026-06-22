import Parser from 'rss-parser'
import { readSourcesConfig } from '@/lib/config/sources'

const parser = new Parser()

export interface RssFeedItem {
  source: 'rss'
  sourceUrl: string
  authorName: string
  content: string
  collectedAt: Date
}

export async function collectRssFeeds(): Promise<RssFeedItem[]> {
  const results: RssFeedItem[] = []
  const { rss: RSS_SOURCES } = readSourcesConfig()

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      for (const item of feed.items.slice(0, 10)) {
        if (!item.link) continue
        results.push({
          source: 'rss',
          sourceUrl: item.link,
          authorName: source.name,
          content: item.title ?? item.contentSnippet ?? '',
          collectedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        })
      }
    } catch (err) {
      console.error(`RSS 수집 실패: ${source.name}`, err)
    }
  }

  return results
}
