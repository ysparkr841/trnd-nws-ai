'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedItem } from './types'
import { FeedCard } from './FeedCard'
import { RepoCard } from './RepoCard'

interface Props {
  initialFeeds: FeedItem[]
  initialCursor: string | null
}

export function InfiniteFeeds({ initialFeeds, initialCursor }: Props) {
  const [feeds, setFeeds] = useState(initialFeeds)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(!initialCursor)
  const cursorRef = useRef(initialCursor)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursorRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/feeds?cursor=${cursorRef.current}`)
      const data: { items: FeedItem[]; nextCursor: string | null } = await res.json()
      setFeeds((prev) => [...prev, ...data.items])
      cursorRef.current = data.nextCursor
      if (!data.nextCursor) setDone(true)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

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
      <div ref={sentinelRef} className="py-6 text-center text-sm text-gray-400">
        {loading ? '불러오는 중...' : done ? '모든 피드를 불러왔습니다' : null}
      </div>
    </div>
  )
}
