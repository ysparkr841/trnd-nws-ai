'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SourcesConfig } from '@/lib/config/sources'

export default function SettingsPage() {
  const [config, setConfig] = useState<SourcesConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [rssName, setRssName] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [ghTopic, setGhTopic] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/sources')
      .then((r) => r.json())
      .then(setConfig)
      .finally(() => setLoading(false))
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
          <div className="space-y-8">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
            )}

            {/* RSS 소스 */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">RSS 소스</h2>
              <ul className="divide-y divide-gray-100 mb-4">
                {config.rss.map((s) => (
                  <li key={s.url} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{s.name}</span>
                      <span className="text-xs text-gray-400 ml-2 truncate max-w-xs block">{s.url}</span>
                    </div>
                    <button
                      onClick={() => removeRss(s.url)}
                      className="text-xs text-red-500 hover:text-red-700 ml-3 shrink-0"
                    >
                      삭제
                    </button>
                  </li>
                ))}
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
                <button
                  onClick={addRss}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </section>

            {/* GitHub 토픽 */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">GitHub 트렌딩 토픽</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {config.githubTopics.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full"
                  >
                    {t}
                    <button
                      onClick={() => removeGithub(t)}
                      className="text-gray-400 hover:text-red-500 ml-0.5"
                      aria-label={`${t} 삭제`}
                    >
                      ×
                    </button>
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
                <button
                  onClick={addGithub}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  추가
                </button>
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
