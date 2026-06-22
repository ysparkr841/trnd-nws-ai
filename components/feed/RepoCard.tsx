import type { FeedItem } from './types'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return '방금 전'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
  return `${Math.floor(seconds / 86400)}일 전`
}

interface Props {
  feed: FeedItem
  onToggle?: (id: string, field: 'isRead' | 'isBookmarked', value: boolean) => void
}

export function RepoCard({ feed, onToggle }: Props) {
  return (
    <article className={`bg-white dark:bg-gray-800 rounded-lg border p-4 transition-colors ${
      feed.isRead
        ? 'border-gray-100 dark:border-gray-700 opacity-60'
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
    }`}>
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
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {feed.repoName}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle?.(feed.id, 'isBookmarked', !feed.isBookmarked)}
            className={`text-base leading-none transition-colors ${
              feed.isBookmarked ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
            }`}
            title={feed.isBookmarked ? '북마크 해제' : '북마크'}
          >
            {feed.isBookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={() => onToggle?.(feed.id, 'isRead', !feed.isRead)}
            className={`text-xs font-medium transition-colors ${
              feed.isRead ? 'text-blue-400' : 'text-gray-300 dark:text-gray-600 hover:text-blue-400'
            }`}
            title={feed.isRead ? '안읽음으로 표시' : '읽음으로 표시'}
          >
            {feed.isRead ? '읽음' : '읽기'}
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(feed.collectedAt)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
        {feed.summary ?? feed.content}
      </p>

      {(feed.repoStars != null || feed.repoLanguage) && (
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {feed.repoStars != null && <span>★ {feed.repoStars.toLocaleString()}</span>}
          {feed.repoLanguage && <span>{feed.repoLanguage}</span>}
        </div>
      )}

      {feed.notionPageId && (
        <div className="mt-2">
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Notion 저장됨</span>
        </div>
      )}
    </article>
  )
}
