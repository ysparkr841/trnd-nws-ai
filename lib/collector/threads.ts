// 스레드 피드 수집 — Playwright + 로컬 세션 쿠키
import { chromium } from 'playwright'
import path from 'path'
import { existsSync } from 'fs'

const SESSION_PATH = path.join(process.cwd(), '.claude', 'browser-sessions', 'threads-session.json')
const FEED_URL = 'https://www.threads.net/'
const MAX_POSTS = 20

export interface ThreadsFeedItem {
  source: 'threads'
  sourceUrl: string
  authorName: string
  authorHandle: string
  content: string
  collectedAt: Date
}

export class ThreadsSessionExpiredError extends Error {
  constructor() {
    super('Threads 세션 만료 — scripts/save-threads-session.ts 를 다시 실행하세요')
    this.name = 'ThreadsSessionExpiredError'
  }
}

export async function collectThreadsFeeds(): Promise<ThreadsFeedItem[]> {
  if (!existsSync(SESSION_PATH)) {
    console.warn('Threads 세션 파일 없음 — 수집 건너뜀 (scripts/save-threads-session.ts 실행 필요)')
    return []
  }

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ storageState: SESSION_PATH })
    const page = await context.newPage()

    await page.goto(FEED_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('accounts/login')) {
      throw new ThreadsSessionExpiredError()
    }

    // post permalink 링크가 로드될 때까지 대기
    await page.waitForSelector('a[href*="/post/"]', { timeout: 20000 })

    const rawItems = await page.evaluate((maxPosts: number) => {
      // /@username/post/id 패턴의 링크로 포스트 식별
      const postLinks = Array.from(document.querySelectorAll('a[href*="/post/"]'))
        .filter((a) => /^\/@[^/]+\/post\//.test((a as HTMLAnchorElement).getAttribute('href') ?? ''))
        .slice(0, maxPosts)

      return postLinks.map((link) => {
        const href = (link as HTMLAnchorElement).getAttribute('href') ?? ''
        const handleMatch = href.match(/^\/@([^/]+)\/post\//)
        const handle = handleMatch ? handleMatch[1] : ''

        // 가장 가까운 article 또는 role=article 컨테이너에서 텍스트 추출
        const container =
          link.closest('article') ??
          link.closest('[role="article"]') ??
          link.parentElement

        const paragraphs = container
          ? Array.from(container.querySelectorAll('p, span[dir]'))
          : []
        const content = paragraphs
          .map((p) => p.textContent?.trim())
          .filter(Boolean)
          .join(' ')
          .slice(0, 500)

        const timeEl = container?.querySelector('time')

        return {
          authorName: handle,
          authorHandle: `@${handle}`,
          content,
          sourceUrl: `https://www.threads.net${href}`,
          collectedAt: timeEl?.getAttribute('datetime') ?? '',
        }
      }).filter((item) => item.content && item.sourceUrl)
    }, MAX_POSTS)

    return rawItems.map((item) => ({
      source: 'threads' as const,
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
