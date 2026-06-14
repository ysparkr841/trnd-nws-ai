import { db } from '@/lib/db'
import { InfiniteFeeds } from '@/components/feed/InfiniteFeeds'
import { CollectButton } from '@/components/layout/CollectButton'
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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 뉴스 허브</h1>
            <p className="text-sm text-gray-500 mt-0.5">X, 스레드 AI 소식을 한 곳에서</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/content"
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              콘텐츠 보기
            </Link>
            <CollectButton />
          </div>
        </div>

        <InfiniteFeeds initialFeeds={feeds} initialCursor={nextCursor} />
      </div>
    </main>
  )
}
