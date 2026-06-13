// X 피드 수집 — Playwright + 로컬 세션 쿠키
import { chromium } from 'playwright'
import path from 'path'
import { existsSync } from 'fs'

export interface XFeedItem {
  source: 'x'
  sourceUrl: string
  authorName: string
  authorHandle: string
  content: string
  collectedAt: Date
}

const SESSION_PATH = path.join(process.cwd(), '.claude', 'browser-sessions', 'x-session.json')

export async function collectXFeeds(): Promise<XFeedItem[]> {
  if (!existsSync(SESSION_PATH)) {
    console.warn('X 세션 없음. scripts/save-x-session.ts 먼저 실행 필요')
    return []
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: SESSION_PATH })
  const page = await context.newPage()
  const results: XFeedItem[] = []

  try {
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle', timeout: 30000 })

    // 세션 만료 감지
    if (page.url().includes('/login') || page.url().includes('/i/flow')) {
      console.error('X 세션 만료 감지')
      return []
    }

    // 트윗 수집 (셀렉터는 X 구조 변경 시 수동 업데이트 필요)
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 })
    const tweets = await page.locator('[data-testid="tweet"]').all()

    for (const tweet of tweets.slice(0, 30)) {
      try {
        const text = await tweet.locator('[data-testid="tweetText"]').textContent()
        const handle = await tweet.locator('[data-testid="User-Name"] a').first().getAttribute('href')
        const name = await tweet.locator('[data-testid="User-Name"]').first().textContent()
        const tweetLink = await tweet.locator('a[href*="/status/"]').first().getAttribute('href')

        if (!text || !handle) continue

        results.push({
          source: 'x',
          sourceUrl: `https://twitter.com${tweetLink ?? ''}`,
          authorHandle: handle.replace('/', ''),
          authorName: name ?? '',
          content: text,
          collectedAt: new Date(),
        })
      } catch {
        // 개별 트윗 파싱 실패는 건너뜀
      }
    }
  } finally {
    await browser.close()
  }

  return results
}
