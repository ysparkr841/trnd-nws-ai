import { db } from '@/lib/db'
import { InfiniteFeeds } from '@/components/feed/InfiniteFeeds'
import { CollectButton } from '@/components/layout/CollectButton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { FeedItem } from '@/components/feed/types'
import Link from 'next/link'

const LIMIT = 20

async function getInitialFeeds(): Promise<{ feeds: FeedItem[]; nextCursor: string | null }> {
  try {
    const rows = await db.feed.findMany({
      orderBy: { collectedAt: 'desc' },
      take: LIMIT + 1,
    })
    const hasMore = rows.length > LIMIT
    const items = hasMore ? rows.slice(0, LIMIT) : rows
    return {
      feeds: items as FeedItem[],
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }
  } catch {
    return { feeds: [], nextCursor: null }
  }
}

export default async function Home() {
  const { feeds, nextCursor } = await getInitialFeeds()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">AI 뉴스 허브</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">X, 스레드 AI 소식을 한 곳에서</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/content"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              콘텐츠 보기
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              대시보드
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
            >
              소스 설정
            </Link>
            <ThemeToggle />
            <CollectButton />
          </div>
        </div>

        <InfiniteFeeds initialFeeds={feeds} initialCursor={nextCursor} />
      </div>
    </main>
  )
}
