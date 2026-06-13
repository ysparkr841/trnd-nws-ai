'use client'

import { useState } from 'react'

interface CollectResult {
  total: number
  rss: number
  github: number
  errors: string[]
}

export function CollectButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [result, setResult] = useState<CollectResult | null>(null)

  async function handleCollect() {
    setStatus('loading')
    try {
      const res = await fetch('/api/collect', { method: 'POST' })
      const data = await res.json() as CollectResult
      setResult(data)
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status === 'done' && result && (
        <span className="text-sm text-green-600 font-medium">
          RSS {result.rss}건 · GitHub {result.github}건 수집됨
        </span>
      )}
      <button
        onClick={handleCollect}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? '수집 중...' : '지금 수집'}
      </button>
    </div>
  )
}
