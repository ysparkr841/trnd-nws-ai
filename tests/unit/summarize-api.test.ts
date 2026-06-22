jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('../../lib/db', () => ({
  db: {
    feed: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('../../lib/ai/ollama', () => ({
  summarizeWithOllama: jest.fn(),
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

import { db } from '../../lib/db'
import { summarizeWithOllama } from '../../lib/ai/ollama'
import { POST } from '../../app/api/summarize/route'

const mockFindUnique = db.feed.findUnique as jest.MockedFunction<typeof db.feed.findUnique>
const mockUpdate = db.feed.update as jest.MockedFunction<typeof db.feed.update>
const mockSummarize = summarizeWithOllama as jest.MockedFunction<typeof summarizeWithOllama>

function makePostRequest(body: object) {
  return { json: () => Promise.resolve(body) } as Parameters<typeof POST>[0]
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/summarize', () => {
  it('text와 feedId 모두 없으면 400 반환', async () => {
    const res = await POST(makePostRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('text 또는 feedId 필요')
  })

  it('text 직접 전달 시 Ollama 요약 반환', async () => {
    mockSummarize.mockResolvedValue('요약 결과')
    const res = await POST(makePostRequest({ text: '원문 내용' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary).toBe('요약 결과')
    expect(mockSummarize).toHaveBeenCalledWith('원문 내용')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('feedId 조회 — Feed 없으면 404', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makePostRequest({ feedId: 'non-existent' }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Feed 없음')
    expect(mockSummarize).not.toHaveBeenCalled()
  })

  it('feedId 조회 — 요약 후 DB 업데이트', async () => {
    mockFindUnique.mockResolvedValue({ id: 'feed-1', content: 'Feed 내용' } as never)
    mockSummarize.mockResolvedValue('Feed 요약')
    mockUpdate.mockResolvedValue({} as never)

    const res = await POST(makePostRequest({ feedId: 'feed-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary).toBe('Feed 요약')
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'feed-1' } })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'feed-1' },
      data: { summary: 'Feed 요약' },
    })
  })

  it('text와 feedId 동시 전달 시 feedId DB 조회가 우선', async () => {
    mockFindUnique.mockResolvedValue({ id: 'feed-1', content: 'DB 원문' } as never)
    mockSummarize.mockResolvedValue('DB 요약')
    mockUpdate.mockResolvedValue({} as never)

    const res = await POST(makePostRequest({ text: '직접 텍스트', feedId: 'feed-1' }))
    expect(res.status).toBe(200)
    // feedId가 있으면 DB 내용으로 덮어쓰기
    expect(mockSummarize).toHaveBeenCalledWith('DB 원문')
    expect(mockFindUnique).toHaveBeenCalled()
  })
})
