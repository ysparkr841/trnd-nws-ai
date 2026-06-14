// X 피드 수집 — Playwright + 로컬 세션 쿠키
import { chromium } from 'playwright'
import path from 'path'
import { existsSync } from 'fs'

const SESSION_PATH = path.join(process.cwd(), '.claude', 'browser-sessions', 'x-session.json')
const FEED_URL = 'https://twitter.com/home'
const MAX_POSTS = 20

export interface XFeedItem {
  source: 'x'
  sourceUrl: string
  authorName: string
  authorHandle: string
  content: string
  collectedAt: Date
}

export class XSessionExpiredError extends Error {
  constructor() {
    super('X 세션 만료 — scripts/save-x-session.ts 를 다시 실행하세요')
    this.name = 'XSessionExpiredError'
  }
}

export async function collectXFeeds(): Promise<XFeedItem[]> {
  if (!existsSync(SESSION_PATH)) {
    console.warn('X 세션 파일 없음 — 수집 건너뜀 (scripts/save-x-session.ts 실행 필요)')
    return []
  }

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ storageState: SESSION_PATH })
    const page = await context.newPage()

    await page.goto(FEED_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
      throw new XSessionExpiredError()
    }

    await page.waitForSelector('[data-testid="tweet"]', { timeout: 20000 })

    const rawItems = await page.evaluate((maxPosts: number) => {
      const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]')).slice(0, maxPosts)
      return tweets.map((tweet) => {
        const nameEl = tweet.querySelector('[data-testid="User-Name"]')
        // status 링크: /username/status/id 형태
        const statusLink = tweet.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null
        const contentEl = tweet.querySelector('[data-testid="tweetText"]')
        const timeEl = tweet.querySelector('time')

        const href = statusLink?.getAttribute('href') ?? ''
        const handleMatch = href.match(/^\/([^/]+)\/status\//)
        const handle = handleMatch ? handleMatch[1] : ''

        return {
          authorName: nameEl?.querySelector('span')?.textContent?.trim() ?? handle,
          authorHandle: handle ? `@${handle}` : '',
          content: contentEl?.textContent?.trim() ?? '',
          sourceUrl: href ? `https://twitter.com${href}` : '',
          collectedAt: timeEl?.getAttribute('datetime') ?? '',
        }
      }).filter((item) => item.content && item.sourceUrl)
    }, MAX_POSTS)

    return rawItems.map((item) => ({
      source: 'x' as const,
      sourceUrl: item.sourceUrl,
      authorName: item.authorName,
      authorHandle: item.authorHandle,
      content: item.content,
      collectedAt: item.collectedAt ? new Date(item.collectedAt) : new Date(),
    }))
  } finally {
    await browser.close()
  }
}
