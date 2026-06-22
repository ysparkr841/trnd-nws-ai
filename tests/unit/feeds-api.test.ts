jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('../../lib/db', () => ({
  db: {
    feed: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
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
import { GET, PATCH } from '../../app/api/feeds/route'

const mockFindMany = db.feed.findMany as jest.MockedFunction<typeof db.feed.findMany>
const mockUpdate = db.feed.update as jest.MockedFunction<typeof db.feed.update>

function makeGetRequest(url: string) {
  return { nextUrl: new URL(url) } as Parameters<typeof GET>[0]
}

function makePatchRequest(body: object) {
  return { json: () => Promise.resolve(body) } as Parameters<typeof PATCH>[0]
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/feeds', () => {
  it('소스 필터 없이 전체 피드 반환', async () => {
    mockFindMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never)
    const res = await GET(makeGetRequest('http://localhost/api/feeds'))
    const data = await res.json()
    expect(data.items).toHaveLength(2)
    expect(data.nextCursor).toBeNull()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it('source 파라미터로 필터링', async () => {
    mockFindMany.mockResolvedValue([{ id: 'c' }] as never)
    const res = await GET(makeGetRequest('http://localhost/api/feeds?source=github'))
    const data = await res.json()
    expect(data.items).toHaveLength(1)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { source: 'github' } })
    )
  })

  it('search 파라미터로 content/repoName 검색', async () => {
    mockFindMany.mockResolvedValue([{ id: 'd' }] as never)
    const res = await GET(makeGetRequest('http://localhost/api/feeds?search=claude'))
    const data = await res.json()
    expect(data.items).toHaveLength(1)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { content: { contains: 'claude' } },
            { repoName: { contains: 'claude' } },
          ],
        },
      })
    )
  })

  it('source + search 동시 필터링', async () => {
    mockFindMany.mockResolvedValue([] as never)
    await GET(makeGetRequest('http://localhost/api/feeds?source=github&search=llm'))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          source: 'github',
          OR: [
            { content: { contains: 'llm' } },
            { repoName: { contains: 'llm' } },
          ],
        },
      })
    )
  })
})

describe('PATCH /api/feeds', () => {
  it('isRead 토글 성공', async () => {
    mockUpdate.mockResolvedValue({ id: 'feed-1' } as never)
    const res = await PATCH(makePatchRequest({
      id: 'feed-1',
      field: 'isRead',
      value: true,
    }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'feed-1' },
      data: { isRead: true },
    })
  })

  it('isBookmarked 토글 성공', async () => {
    mockUpdate.mockResolvedValue({ id: 'feed-2' } as never)
    const res = await PATCH(makePatchRequest({
      id: 'feed-2',
      field: 'isBookmarked',
      value: false,
    }))
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'feed-2' },
      data: { isBookmarked: false },
    })
  })

  it('허용되지 않은 field는 400 반환', async () => {
    const res = await PATCH(makePatchRequest({
      id: 'feed-1',
      field: 'content',
      value: 'hack',
    }))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('id 누락 시 400 반환', async () => {
    const res = await PATCH(makePatchRequest({
      field: 'isRead',
      value: true,
    }))
    expect(res.status).toBe(400)
  })

  it('value가 boolean이 아니면 400 반환', async () => {
    const res = await PATCH(makePatchRequest({
      id: 'feed-1',
      field: 'isRead',
      value: 'yes',
    }))
    expect(res.status).toBe(400)
  })
})
