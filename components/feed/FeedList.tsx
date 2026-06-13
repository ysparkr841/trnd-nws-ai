import type { FeedItem } from './types'
import { FeedCard } from './FeedCard'
import { RepoCard } from './RepoCard'

export function FeedList({ feeds }: { feeds: FeedItem[] }) {
  if (feeds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">피드가 없습니다</p>
        <p className="text-sm mt-1">수집 버튼을 눌러 RSS/GitHub 소식을 가져오세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {feeds.map((feed) =>
        feed.source === 'github' && feed.repoName ? (
          <RepoCard key={feed.id} feed={feed} />
        ) : (
          <FeedCard key={feed.id} feed={feed} />
        )
      )}
    </div>
  )
}
