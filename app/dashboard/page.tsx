import { db } from '@/lib/db'
import { readCollectState } from '@/lib/config/collect-state'
import { readdir } from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

async function getStats() {
  const [total, bySource, repoCount, notionCount, bookmarkCount] = await Promise.all([
    db.feed.count(),
    db.feed.groupBy({ by: ['source'], _count: { _all: true } }),
    db.feed.count({ where: { repoUrl: { not: null } } }),
    db.feed.count({ where: { notionPageId: { not: null } } }),
    db.feed.count({ where: { isBookmarked: true } }),
  ])

  const sourceMap: Record<string, number> = {}
  for (const row of bySource) {
    sourceMap[row.source] = row._count._all
  }

  const contentBase = path.join(process.cwd(), 'content')
  const [articles, scripts, cards] = await Promise.all([
    readdir(path.join(contentBase, 'articles')).then(f => f.filter(x => x.endsWith('.md')).length).catch(() => 0),
    readdir(path.join(contentBase, 'scripts')).then(f => f.filter(x => x.endsWith('.md')).length).catch(() => 0),
    readdir(path.join(contentBase, 'cards')).then(f => f.filter(x => x.endsWith('.json')).length).catch(() => 0),
  ])

  const collectState = readCollectState()

  return {
    feeds: { total, bySource: sourceMap, repos: repoCount, bookmarked: bookmarkCount, notionSynced: notionCount },
    content: { articles, scripts, cards },
    collectState,
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return '미수집'
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / 1440)}일 전`
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

const SOURCE_LABEL: Record<string, string> = {
  rss: 'RSS',
  github: 'GitHub',
  x: 'X',
  threads: 'Threads',
}

const NON_RSS_SOURCES = ['github', 'x', 'threads'] as const

export default async function DashboardPage() {
  const { feeds, content, collectState } = await getStats()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">수집 현황 대시보드</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">소스별 수집 통계 및 콘텐츠 현황</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              피드
            </Link>
            <Link href="/content" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline">
              콘텐츠
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">피드 통계</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="전체 피드" value={feeds.total} />
          <StatCard label="GitHub 레포" value={feeds.repos} sub="레포 URL 감지됨" />
          <StatCard label="북마크" value={feeds.bookmarked} />
          <StatCard label="Notion 동기화" value={feeds.notionSynced} />
        </div>

        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">소스별 수집 현황</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 mb-8">
          {/* RSS — 소스별 세부 표시 */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-900 dark:text-gray-50">RSS</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{feeds.bySource['rss'] ?? 0}건</span>
            </div>
            {Object.keys(collectState.rss).length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">소스 없음</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(collectState.rss).map(([key, rs]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-[60%]">{key}</span>
                    <div className="flex items-center gap-2">
                      {rs.lastError && <span className="text-red-500">오류</span>}
                      <span className="text-gray-400 dark:text-gray-500">{relativeTime(rs.lastCollectedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GitHub / X / Threads */}
          {NON_RSS_SOURCES.map((src) => {
            const state = collectState[src]
            return (
              <div key={src} className="flex items-center justify-between p-4">
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-50">{SOURCE_LABEL[src]}</span>
                  {state.lastError && (
                    <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate">{state.lastError}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{feeds.bySource[src] ?? 0}건</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{relativeTime(state.lastCollectedAt)}</p>
                </div>
              </div>
            )
          })}
        </div>

        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">생성된 콘텐츠</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="아티클" value={content.articles} sub="content/articles/" />
          <StatCard label="유튜브 대본" value={content.scripts} sub="content/scripts/" />
          <StatCard label="카드뉴스" value={content.cards} sub="content/cards/" />
        </div>
      </div>
    </main>
  )
}
