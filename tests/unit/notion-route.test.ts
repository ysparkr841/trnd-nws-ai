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

jest.mock('../../lib/notion/sync', () => ({
  saveRepoToNotion: jest.fn(),
  flushNotionQueue: jest.fn(),
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
import { saveRepoToNotion, flushNotionQueue } from '../../lib/notion/sync'
import { POST, PATCH } from '../../app/api/notion/route'

const mockFindUnique = db.feed.findUnique as jest.MockedFunction<typeof db.feed.findUnique>
const mockUpdate = db.feed.update as jest.MockedFunction<typeof db.feed.update>
const mockSaveRepoToNotion = saveRepoToNotion as jest.MockedFunction<typeof saveRepoToNotion>
const mockFlushNotionQueue = flushNotionQueue as jest.MockedFunction<typeof flushNotionQueue>

function makePostRequest(body: object) {
  return { json: () => Promise.resolve(body) } as Parameters<typeof POST>[0]
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/notion', () => {
  it('feedId 없으면 400', async () => {
    const res = await POST(makePostRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('feedId 필요')
  })

  it('Feed 없으면 404', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makePostRequest({ feedId: 'not-exist' }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Feed 없음')
  })

  it('repoUrl/repoName 없으면 400', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'feed-1',
      repoUrl: null,
      repoName: null,
      content: 'x',
      sourceUrl: 'https://example.com',
    } as never)
    const res = await POST(makePostRequest({ feedId: 'feed-1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('레포 정보 없음')
  })

  it('Notion 저장 성공 시 DB notionPageId 업데이트', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'feed-1',
      repoUrl: 'https://github.com/user/repo',
      repoName: 'user/repo',
      summary: '요약',
      content: '내용',
      sourceUrl: 'https://example.com',
    } as never)
    mockSaveRepoToNotion.mockResolvedValue('notion-page-id')
    mockUpdate.mockResolvedValue({} as never)

    const res = await POST(makePostRequest({ feedId: 'feed-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.notionPageId).toBe('notion-page-id')
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'feed-1' },
      data: { notionPageId: 'notion-page-id' },
    })
  })

  it('Notion 저장 실패(null) 시 DB 업데이트 안 함', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'feed-1',
      repoUrl: 'https://github.com/user/repo',
      repoName: 'user/repo',
      summary: null,
      content: '내용',
      sourceUrl: 'https://example.com',
    } as never)
    mockSaveRepoToNotion.mockResolvedValue(null)

    const res = await POST(makePostRequest({ feedId: 'feed-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.notionPageId).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('summary 없으면 content 앞 200자를 summary로 사용', async () => {
    const longContent = 'a'.repeat(300)
    mockFindUnique.mockResolvedValue({
      id: 'feed-1',
      repoUrl: 'https://github.com/user/repo',
      repoName: 'user/repo',
      summary: null,
      content: longContent,
      sourceUrl: 'https://example.com',
    } as never)
    mockSaveRepoToNotion.mockResolvedValue('page-id')
    mockUpdate.mockResolvedValue({} as never)

    await POST(makePostRequest({ feedId: 'feed-1' }))
    expect(mockSaveRepoToNotion).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'a'.repeat(200) }),
    )
  })
})

describe('PATCH /api/notion', () => {
  it('큐 플러시 결과 반환', async () => {
    mockFlushNotionQueue.mockResolvedValue({ flushed: 3, failed: 0 } as never)
    const res = await PATCH()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.flushed).toBe(3)
    expect(body.failed).toBe(0)
  })
})
