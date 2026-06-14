const mockCreate = jest.fn()

jest.mock('@notionhq/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    pages: { create: mockCreate },
  })),
}))

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

import { db } from '../../lib/db'
import { saveRepoToNotion, flushNotionQueue } from '../../lib/notion/sync'

const ENV = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...ENV, NOTION_API_KEY: 'test-key', NOTION_DB_ID: 'test-db' }
})

afterAll(() => {
  process.env = ENV
})

const PAYLOAD = {
  repoName: 'test-repo',
  repoUrl: 'https://github.com/owner/test-repo',
  summary: '요약 텍스트',
  sourceUrl: 'https://x.com/post/1',
}

const FEED_BASE = {
  source: 'x', authorName: null, authorHandle: null, urlHash: null,
  repoStars: null, repoLanguage: null, repoReadme: null, repoSummary: null,
  isRead: false, isBookmarked: false,
  collectedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
}

describe('saveRepoToNotion', () => {
  it('Notion 페이지 생성 성공 시 page.id 반환', async () => {
    mockCreate.mockResolvedValue({ id: 'page-123' })
    const id = await saveRepoToNotion(PAYLOAD)
    expect(id).toBe('page-123')
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('Notion API 오류 시 null 반환', async () => {
    mockCreate.mockRejectedValue(new Error('API error'))
    const id = await saveRepoToNotion(PAYLOAD)
    expect(id).toBeNull()
  })

  it('NOTION_API_KEY 미설정 시 null 반환', async () => {
    delete process.env.NOTION_API_KEY
    const id = await saveRepoToNotion(PAYLOAD)
    expect(id).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('NOTION_DB_ID 미설정 시 null 반환', async () => {
    delete process.env.NOTION_DB_ID
    const id = await saveRepoToNotion(PAYLOAD)
    expect(id).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('flushNotionQueue', () => {
  it('pending 항목 없으면 succeeded/failed 모두 0', async () => {
    jest.mocked(db.feed.findMany).mockResolvedValue([])
    const result = await flushNotionQueue()
    expect(result).toEqual({ succeeded: 0, failed: 0 })
  })

  it('모든 pending 항목 저장 성공', async () => {
    jest.mocked(db.feed.findMany).mockResolvedValue([
      { ...FEED_BASE, id: '1', repoUrl: 'https://github.com/a/b', repoName: 'b', summary: '요약', content: '본문', sourceUrl: 'https://x.com/p/1', notionPageId: null },
      { ...FEED_BASE, id: '2', repoUrl: 'https://github.com/c/d', repoName: 'd', summary: null, content: '본문2', sourceUrl: 'https://x.com/p/2', notionPageId: null },
    ])
    mockCreate.mockResolvedValue({ id: 'page-ok' })
    jest.mocked(db.feed.update).mockResolvedValue({} as never)

    const result = await flushNotionQueue()
    expect(result).toEqual({ succeeded: 2, failed: 0 })
    expect(db.feed.update).toHaveBeenCalledTimes(2)
  })

  it('Notion 저장 실패 시 failed 카운트 증가', async () => {
    jest.mocked(db.feed.findMany).mockResolvedValue([
      { ...FEED_BASE, id: '1', repoUrl: 'https://github.com/a/b', repoName: 'b', summary: '요약', content: '본문', sourceUrl: 'https://x.com/p/1', notionPageId: null },
    ])
    mockCreate.mockRejectedValue(new Error('Notion error'))

    const result = await flushNotionQueue()
    expect(result).toEqual({ succeeded: 0, failed: 1 })
  })

  it('repoUrl 없는 항목은 failed 처리', async () => {
    jest.mocked(db.feed.findMany).mockResolvedValue([
      { ...FEED_BASE, id: '1', repoUrl: null, repoName: null, summary: null, content: '본문', sourceUrl: 'https://x.com/p/1', notionPageId: null },
    ])

    const result = await flushNotionQueue()
    expect(result).toEqual({ succeeded: 0, failed: 1 })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('summary 없을 때 content 앞 200자로 대체', async () => {
    const longContent = 'x'.repeat(300)
    jest.mocked(db.feed.findMany).mockResolvedValue([
      { ...FEED_BASE, id: '1', repoUrl: 'https://github.com/a/b', repoName: 'b', summary: null, content: longContent, sourceUrl: 'https://x.com/p/1', notionPageId: null },
    ])
    mockCreate.mockResolvedValue({ id: 'page-ok' })
    jest.mocked(db.feed.update).mockResolvedValue({} as never)

    await flushNotionQueue()

    const callArg = mockCreate.mock.calls[0][0] as { properties: { Summary: { rich_text: [{ text: { content: string } }] } } }
    expect(callArg.properties.Summary.rich_text[0].text.content).toBe(longContent.slice(0, 200))
  })
})
