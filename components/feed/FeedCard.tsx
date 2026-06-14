import type { FeedItem } from './types'

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  x: { label: 'X', className: 'bg-black text-white' },
  threads: { label: 'Threads', className: 'bg-purple-600 text-white' },
  rss: { label: 'RSS', className: 'bg-orange-500 text-white' },
  github: { label: 'GitHub', className: 'bg-gray-700 text-white' },
}

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

export function FeedCard({ feed, onToggle }: Props) {
  const source = SOURCE_LABELS[feed.source] ?? { label: feed.source, className: 'bg-gray-400 text-white' }

  return (
    <article className={`bg-white rounded-lg border p-4 transition-colors ${
      feed.isRead ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${source.className}`}>
            {source.label}
          </span>
          {feed.authorName && (
            <span className="text-sm text-gray-500">{feed.authorName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle?.(feed.id, 'isBookmarked', !feed.isBookmarked)}
            className={`text-base leading-none transition-colors ${
              feed.isBookmarked ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
            }`}
            title={feed.isBookmarked ? '북마크 해제' : '북마크'}
          >
            {feed.isBookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={() => onToggle?.(feed.id, 'isRead', !feed.isRead)}
            className={`text-xs font-medium transition-colors ${
              feed.isRead ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'
            }`}
            title={feed.isRead ? '안읽음으로 표시' : '읽음으로 표시'}
          >
            {feed.isRead ? '읽음' : '읽기'}
          </button>
          <span className="text-xs text-gray-400">{timeAgo(feed.collectedAt)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
        {feed.summary ?? feed.content}
      </p>

      {feed.repoUrl && feed.repoName && (
        <div className="mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <a
            href={feed.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {feed.repoName}
          </a>
        </div>
      )}

      <div className="mt-2">
        <a
          href={feed.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          원문 보기 →
        </a>
      </div>
    </article>
  )
}
