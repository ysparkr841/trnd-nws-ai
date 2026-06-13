import { db } from '@/lib/db'
import { FeedList } from '@/components/feed/FeedList'
import { CollectButton } from '@/components/layout/CollectButton'
import type { FeedItem } from '@/components/feed/types'

async function getFeeds(): Promise<FeedItem[]> {
  try {
    return await db.feed.findMany({
      orderBy: { collectedAt: 'desc' },
      take: 50,
    })
  } catch {
    return []
  }
}

export default async function Home() {
  const feeds = await getFeeds()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 뉴스 허브</h1>
            <p className="text-sm text-gray-500 mt-0.5">X, 스레드 AI 소식을 한 곳에서</p>
          </div>
          <CollectButton />
        </div>

        <FeedList feeds={feeds} />
      </div>
    </main>
  )
}
