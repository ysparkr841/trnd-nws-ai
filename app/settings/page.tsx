'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SourcesConfig } from '@/lib/config/sources'
import type { CollectState } from '@/lib/config/collect-state'

function relativeTime(iso: string | null): string {
  if (!iso) return '미수집'
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  return `${Math.floor(minutes / 60)}시간 전`
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SourcesConfig | null>(null)
  const [status, setStatus] = useState<CollectState | null>(null)
  const [loading, setLoading] = useState(true)
  const [rssName, setRssName] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [ghTopic, setGhTopic] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/sources').then((r) => r.json()),
      fetch('/api/collect/status').then((r) => r.json()),
    ]).then(([cfg, st]) => {
      setConfig(cfg as SourcesConfig)
      setStatus(st as CollectState)
    }).finally(() => setLoading(false))
  }, [])

  async function addRss() {
    if (!rssName.trim() || !rssUrl.trim()) { setError('이름과 URL을 입력하세요'); return }
    setError('')
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'rss', name: rssName.trim(), url: rssUrl.trim() }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    setConfig(await res.json())
    setRssName('')
    setRssUrl('')
  }

  async function removeRss(url: string) {
    const res = await fetch('/api/sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'rss', url }),
    })
    if (res.ok) setConfig(await res.json())
  }

  async function updateRssInterval(url: string, intervalMinutes: number) {
    const res = await fetch('/api/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'rss', url, intervalMinutes }),
    })
    if (res.ok) setConfig(await res.json())
  }

  async function updateGithubInterval(intervalMinutes: number) {
    const res = await fetch('/api/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'github', intervalMinutes }),
    })
    if (res.ok) setConfig(await res.json())
  }

  async function addGithub() {
    if (!ghTopic.trim()) { setError('토픽을 입력하세요'); return }
    setError('')
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'github', topic: ghTopic.trim() }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    setConfig(await res.json())
    setGhTopic('')
  }

  async function removeGithub(topic: string) {
    const res = await fetch('/api/sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'github', topic }),
    })
    if (res.ok) setConfig(await res.json())
  }

  const failures = status ? [
    ...Object.entries(status.rss)
      .filter(([, s]) => s.lastError)
      .map(([url, s]) => ({ label: config?.rss.find((r) => r.url === url)?.name ?? url, error: s.lastError! })),
    ...(status.github.lastError ? [{ label: 'GitHub Trending', error: status.github.lastError }] : []),
    ...(status.x.lastError ? [{ label: 'X (Twitter)', error: status.x.lastError }] : []),
    ...(status.threads.lastError ? [{ label: 'Threads', error: status.threads.lastError }] : []),
  ] : []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← 피드로 돌아가기</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">소스 설정</h1>

        {loading ? (
          <p className="text-gray-400">불러오는 중...</p>
        ) : config ? (
          <div className="space-y-6">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
            )}

            {/* 수집 실패 알림 */}
            {failures.length > 0 && (
              <section className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h2 className="font-semibold text-red-800 mb-2">수집 실패 알림</h2>
                <ul className="space-y-1">
                  {failures.map((f, i) => (
                    <li key={i} className="text-sm text-red-700">
                      <span className="font-medium">{f.label}</span>: {f.error}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 수집 상태 요약 */}
            {status && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 mb-3">수집 상태</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">GitHub Trending</div>
                  <div className="text-gray-700">{relativeTime(status.github.lastCollectedAt)}</div>
                  <div className="text-gray-500">X (Twitter)</div>
                  <div className="text-gray-700">{relativeTime(status.x.lastCollectedAt)}</div>
                  <div className="text-gray-500">Threads</div>
                  <div className="text-gray-700">{relativeTime(status.threads.lastCollectedAt)}</div>
                </div>
              </section>
            )}

            {/* RSS 소스 */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">RSS 소스</h2>
              <ul className="divide-y divide-gray-100 mb-4">
                {config.rss.map((s) => {
                  const srcStatus = status?.rss[s.url]
                  return (
                    <li key={s.url} className="py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-800">{s.name}</span>
                          {srcStatus?.lastError && (
                            <span className="ml-2 text-xs text-red-500">오류</span>
                          )}
                          <span className="text-xs text-gray-400 ml-2">{relativeTime(srcStatus?.lastCollectedAt ?? null)}</span>
                          <span className="text-xs text-gray-400 block truncate">{s.url}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1 text-xs text-gray-500">
                            <input
                              type="number"
                              min={5}
                              max={1440}
                              defaultValue={s.intervalMinutes ?? 60}
                              onBlur={(e) => updateRssInterval(s.url, Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            분
                          </label>
                          <button onClick={() => removeRss(s.url)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={rssName}
                  onChange={(e) => setRssName(e.target.value)}
                  placeholder="이름 (예: arXiv AI)"
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={rssUrl}
                  onChange={(e) => setRssUrl(e.target.value)}
                  placeholder="RSS URL"
                  className="flex-[2] min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addRss} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">추가</button>
              </div>
            </section>

            {/* GitHub 토픽 */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">GitHub 트렌딩 토픽</h2>
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  수집 주기
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    defaultValue={config.githubIntervalMinutes ?? 60}
                    onBlur={(e) => updateGithubInterval(Number(e.target.value))}
                    className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  분
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {config.githubTopics.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full">
                    {t}
                    <button onClick={() => removeGithub(t)} className="text-gray-400 hover:text-red-500 ml-0.5" aria-label={`${t} 삭제`}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ghTopic}
                  onChange={(e) => setGhTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGithub()}
                  placeholder="토픽 추가 (예: transformer)"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addGithub} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">추가</button>
              </div>
            </section>
          </div>
        ) : (
          <p className="text-gray-400">소스 설정을 불러오지 못했습니다.</p>
        )}
      </div>
    </main>
  )
}
