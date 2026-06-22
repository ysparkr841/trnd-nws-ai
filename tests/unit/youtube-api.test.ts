jest.mock('../../lib/util/youtube', () => ({
  searchRelatedVideos: jest.fn(),
  getYouTubeSearchUrl: jest.fn((q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`),
}))

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(body),
      status: init?.status ?? 200,
    }),
  },
}))

import { NextRequest } from 'next/server'
import { searchRelatedVideos } from '../../lib/util/youtube'
import { GET } from '../../app/api/youtube/route'

const mockSearchRelatedVideos = searchRelatedVideos as jest.MockedFunction<typeof searchRelatedVideos>

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/youtube')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return { nextUrl: { searchParams: url.searchParams } } as unknown as NextRequest
}

beforeEach(() => jest.clearAllMocks())

describe('GET /api/youtube', () => {
  it('q 파라미터 없으면 400 반환', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('q is required')
  })

  it('q가 공백만이면 400 반환', async () => {
    const res = await GET(makeRequest({ q: '   ' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('q is required')
  })

  it('정상 검색 시 videos + searchUrl + hasApiKey 반환', async () => {
    const videos = [
      { title: 'AI Trend', videoId: 'abc123', channelTitle: 'AI Channel', publishedAt: '2026-06-23', thumbnailUrl: '' },
    ]
    mockSearchRelatedVideos.mockResolvedValue(videos as never)
    const res = await GET(makeRequest({ q: 'AI trend', max: '2' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.videos).toEqual(videos)
    expect(body.searchUrl).toContain('AI%20trend')
    expect(typeof body.hasApiKey).toBe('boolean')
  })

  it('max 파라미터가 10 초과이면 10으로 클램핑', async () => {
    mockSearchRelatedVideos.mockResolvedValue([])
    await GET(makeRequest({ q: 'test', max: '99' }))
    expect(mockSearchRelatedVideos).toHaveBeenCalledWith('test', 10)
  })

  it('searchRelatedVideos 에러 시 빈 배열로 200 반환', async () => {
    mockSearchRelatedVideos.mockRejectedValue(new Error('API quota exceeded'))
    const res = await GET(makeRequest({ q: 'AI' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.videos).toEqual([])
    expect(body.searchUrl).toContain('AI')
  })
})
