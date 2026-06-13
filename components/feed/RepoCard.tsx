import type { FeedItem } from './types'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return '방금 전'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
  return `${Math.floor(seconds / 86400)}일 전`
}

export function RepoCard({ feed }: { feed: FeedItem }) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-700 text-white">
            GitHub
          </span>
          {feed.repoName && (
            <a
              href={feed.repoUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {feed.repoName}
            </a>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{timeAgo(feed.collectedAt)}</span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
        {feed.summary ?? feed.content}
      </p>

      {feed.notionPageId && (
        <div className="mt-2">
          <span className="text-xs text-green-600 font-medium">✓ Notion 저장됨</span>
        </div>
      )}
    </article>
  )
}
