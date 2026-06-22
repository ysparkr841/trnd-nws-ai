'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedItem } from './types'
import { FeedCard } from './FeedCard'
import { RepoCard } from './RepoCard'

const SOURCES = [
  { key: '', label: '전체' },
  { key: 'x', label: 'X' },
  { key: 'threads', label: 'Threads' },
  { key: 'rss', label: 'RSS' },
  { key: 'github', label: 'GitHub' },
]

const AI_KEYWORDS = ['LLM', 'GPT', 'Claude', 'Gemini', 'RAG', 'AGI', 'Transformer', '파인튜닝']

interface Props {
  initialFeeds: FeedItem[]
  initialCursor: string | null
}

export function InfiniteFeeds({ initialFeeds, initialCursor }: Props) {
  const [feeds, setFeeds] = useState(initialFeeds)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(!initialCursor)
  const [source, setSource] = useState('')
  const [search, setSearch] = useState('')
  const [bookmarked, setBookmarked] = useState(false)

  const cursorRef = useRef<string | null>(initialCursor)
  const sourceRef = useRef('')
  const searchRef = useRef('')
  const bookmarkedRef = useRef(false)
  const loadingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPage = useCallback(async (cursor: string | null, src: string, reset: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      if (src) params.set('source', src)
      if (searchRef.current) params.set('search', searchRef.current)
      if (bookmarkedRef.current) params.set('bookmarked', 'true')
      const res = await fetch(`/api/feeds?${params}`)
      const data: { items: FeedItem[]; nextCursor: string | null } = await res.json()
      setFeeds((prev) => reset ? data.items : [...prev, ...data.items])
      cursorRef.current = data.nextCursor
      setDone(!data.nextCursor)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!cursorRef.current) return
    fetchPage(cursorRef.current, sourceRef.current, false)
  }, [fetchPage])

  const handleSourceChange = useCallback((src: string) => {
    sourceRef.current = src
    setSource(src)
    cursorRef.current = null
    fetchPage(null, src, true)
  }, [fetchPage])

  const handleSearchChange = useCallback((q: string) => {
    setSearch(q)
    searchRef.current = q
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      cursorRef.current = null
      fetchPage(null, sourceRef.current, true)
    }, 300)
  }, [fetchPage])

  const handleKeywordClick = useCallback((kw: string) => {
    const next = searchRef.current === kw ? '' : kw
    setSearch(next)
    searchRef.current = next
    cursorRef.current = null
    fetchPage(null, sourceRef.current, true)
  }, [fetchPage])

  const handleBookmarkedToggle = useCallback(() => {
    const next = !bookmarkedRef.current
    bookmarkedRef.current = next
    setBookmarked(next)
    cursorRef.current = null
    fetchPage(null, sourceRef.current, true)
  }, [fetchPage])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const toggleField = useCallback(async (id: string, field: 'isRead' | 'isBookmarked', value: boolean) => {
    setFeeds((prev) => prev.map((f) => f.id === id ? { ...f, [field]: value } : f))
    try {
      await fetch('/api/feeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      })
    } catch {
      setFeeds((prev) => prev.map((f) => f.id === id ? { ...f, [field]: !value } : f))
    }
  }, [])

  return (
    <div>
      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="피드 검색..."
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {SOURCES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSourceChange(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              source === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={handleBookmarkedToggle}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ml-auto ${
            bookmarked
              ? 'bg-yellow-400 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          ★ 북마크
        </button>
      </div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {AI_KEYWORDS.map((kw) => (
          <button
            key={kw}
            onClick={() => handleKeywordClick(kw)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              search === kw
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'
            }`}
          >
            {kw}
          </button>
        ))}
      </div>

      {feeds.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg">피드가 없습니다</p>
          <p className="text-sm mt-1">수집 버튼을 눌러 RSS/GitHub 소식을 가져오세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feeds.map((feed) =>
            feed.source === 'github' && feed.repoName ? (
              <RepoCard key={feed.id} feed={feed} onToggle={toggleField} />
            ) : (
              <FeedCard key={feed.id} feed={feed} onToggle={toggleField} />
            )
          )}
          <div ref={sentinelRef} className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {loading ? '불러오는 중...' : done ? '모든 피드를 불러왔습니다' : null}
          </div>
        </div>
      )}
    </div>
  )
}
