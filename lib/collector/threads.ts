// 스레드 피드 수집 — Playwright + 로컬 세션 쿠키
import { chromium } from 'playwright'
import path from 'path'
import { existsSync } from 'fs'

export interface ThreadsFeedItem {
  source: 'threads'
  sourceUrl: string
  authorName: string
  authorHandle: string
  content: string
  collectedAt: Date
}

const SESSION_PATH = path.join(process.cwd(), '.claude', 'browser-sessions', 'threads-session.json')

export async function collectThreadsFeeds(): Promise<ThreadsFeedItem[]> {
  if (!existsSync(SESSION_PATH)) {
    console.warn('스레드 세션 없음. scripts/save-threads-session.ts 먼저 실행 필요')
    return []
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: SESSION_PATH })
  const page = await context.newPage()
  const results: ThreadsFeedItem[] = []

  try {
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle', timeout: 30000 })

    if (page.url().includes('/login')) {
      console.error('스레드 세션 만료 감지')
      return []
    }

    // 스레드 게시물 수집 (셀렉터는 Threads 구조 변경 시 수동 업데이트 필요)
    await page.waitForSelector('article', { timeout: 15000 })
    const posts = await page.locator('article').all()

    for (const post of posts.slice(0, 30)) {
      try {
        const text = await post.locator('[dir="auto"]').first().textContent()
        const handle = await post.locator('a[href*="/@"]').first().getAttribute('href')
        const name = await post.locator('strong').first().textContent()
        const postLink = await post.locator('a[href*="/post/"]').first().getAttribute('href')

        if (!text) continue

        results.push({
          source: 'threads',
          sourceUrl: `https://www.threads.net${postLink ?? ''}`,
          authorHandle: handle?.replace('/@', '') ?? '',
          authorName: name ?? '',
          content: text,
          collectedAt: new Date(),
        })
      } catch {
        // 개별 포스트 파싱 실패는 건너뜀
      }
    }
  } finally {
    await browser.close()
  }

  return results
}
