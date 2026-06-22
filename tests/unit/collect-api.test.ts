jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('../../lib/db', () => ({
  db: {
    feed: { upsert: jest.fn() },
  },
}))

jest.mock('../../lib/collector/rss', () => ({
  collectRssFeeds: jest.fn(),
}))

jest.mock('../../lib/collector/github', () => ({
  collectGithubTrending: jest.fn(),
}))

jest.mock('../../lib/collector/x', () => {
  class XSessionExpiredError extends Error {
    constructor() {
      super('X 세션 만료')
      this.name = 'XSessionExpiredError'
    }
  }
  return { collectXFeeds: jest.fn(), XSessionExpiredError }
})

jest.mock('../../lib/collector/threads', () => {
  class ThreadsSessionExpiredError extends Error {
    constructor() {
      super('Threads 세션 만료')
      this.name = 'ThreadsSessionExpiredError'
    }
  }
  return { collectThreadsFeeds: jest.fn(), ThreadsSessionExpiredError }
})

jest.mock('../../lib/parser/repo-detect', () => ({
  detectGithubRepos: jest.fn().mockReturnValue([]),
}))

jest.mock('../../lib/parser/content', () => ({
  fetchRepoDetails: jest.fn(),
}))

jest.mock('../../lib/ai/ollama', () => ({
  summarizeRepoWithOllama: jest.fn().mockResolvedValue('요약'),
}))

jest.mock('../../lib/util/url', () => ({
  normalizeUrl: jest.fn((u: string) => u),
  urlHash: jest.fn((u: string) => u),
}))

jest.mock('../../lib/util/state', () => ({
  appendBlockingQuestion: jest.fn(),
}))

jest.mock('../../lib/config/collect-state', () => ({
  readCollectState: jest.fn(),
  writeCollectState: jest.fn(),
  isWithinInterval: jest.fn(),
}))

jest.mock('../../lib/config/sources', () => ({
  readSourcesConfig: jest.fn(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(body),
      status: init?.status ?? 200,
    }),
  },
}))

import { db } from '../../lib/db'
import { collectRssFeeds } from '../../lib/collector/rss'
import { collectGithubTrending } from '../../lib/collector/github'
import { collectXFeeds } from '../../lib/collector/x'
import { collectThreadsFeeds } from '../../lib/collector/threads'
import { appendBlockingQuestion } from '../../lib/util/state'
import { readCollectState, writeCollectState, isWithinInterval } from '../../lib/config/collect-state'
import { readSourcesConfig } from '../../lib/config/sources'
import { POST } from '../../app/api/collect/route'

const mockUpsert = db.feed.upsert as jest.MockedFunction<typeof db.feed.upsert>
const mockCollectRss = collectRssFeeds as jest.MockedFunction<typeof collectRssFeeds>
const mockCollectGithub = collectGithubTrending as jest.MockedFunction<typeof collectGithubTrending>
const mockCollectX = collectXFeeds as jest.MockedFunction<typeof collectXFeeds>
const mockCollectThreads = collectThreadsFeeds as jest.MockedFunction<typeof collectThreadsFeeds>
const mockAppendBlockingQuestion = appendBlockingQuestion as jest.MockedFunction<typeof appendBlockingQuestion>
const mockReadCollectState = readCollectState as jest.MockedFunction<typeof readCollectState>
const mockWriteCollectState = writeCollectState as jest.MockedFunction<typeof writeCollectState>
const mockIsWithinInterval = isWithinInterval as jest.MockedFunction<typeof isWithinInterval>
const mockReadSourcesConfig = readSourcesConfig as jest.MockedFunction<typeof readSourcesConfig>

function freshState() {
  return {
    rss: {} as Record<string, { lastCollectedAt: string | null; lastError: string | null }>,
    github: { lastCollectedAt: null as string | null, lastError: null as string | null },
    x: { lastCollectedAt: null as string | null, lastError: null as string | null },
    threads: { lastCollectedAt: null as string | null, lastError: null as string | null },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockReadCollectState.mockReturnValue(freshState() as never)
  mockReadSourcesConfig.mockReturnValue({
    rss: [{ url: 'https://example.com/rss', intervalMinutes: 60 }],
    githubIntervalMinutes: 60,
  } as never)
  mockIsWithinInterval.mockReturnValue(true) // 기본: interval 내 → 수집 스킵
  mockCollectX.mockResolvedValue([])
  mockCollectThreads.mockResolvedValue([])
  mockCollectRss.mockResolvedValue({ items: [], errors: {} })
  mockCollectGithub.mockResolvedValue([])
  mockUpsert.mockResolvedValue({} as never)
})

describe('POST /api/collect', () => {
  it('모든 소스 interval 내이고 X/Threads 빈 결과면 total 0', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(0)
    expect(body.rss).toBe(0)
    expect(body.github).toBe(0)
    expect(body.x).toBe(0)
    expect(body.threads).toBe(0)
    expect(body.errors).toEqual([])
  })

  it('writeCollectState가 항상 호출됨', async () => {
    await POST()
    expect(mockWriteCollectState).toHaveBeenCalledTimes(1)
  })

  it('X 세션 만료 시 errors에 포함되고 appendBlockingQuestion 호출', async () => {
    const { XSessionExpiredError } = jest.requireMock('../../lib/collector/x')
    mockCollectX.mockRejectedValue(new XSessionExpiredError())
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.errors).toContain('X 세션 만료')
    expect(mockAppendBlockingQuestion).toHaveBeenCalledTimes(1)
  })

  it('Threads 세션 만료 시 errors에 포함되고 appendBlockingQuestion 호출', async () => {
    const { ThreadsSessionExpiredError } = jest.requireMock('../../lib/collector/threads')
    mockCollectThreads.mockRejectedValue(new ThreadsSessionExpiredError())
    const res = await POST()
    const body = await res.json()
    expect(body.errors).toContain('Threads 세션 만료')
    expect(mockAppendBlockingQuestion).toHaveBeenCalledTimes(1)
  })

  it('X 일반 에러 시 appendBlockingQuestion 미호출, errors에 포함', async () => {
    mockCollectX.mockRejectedValue(new Error('네트워크 오류'))
    const res = await POST()
    const body = await res.json()
    expect(body.errors.some((e: string) => e.includes('X 수집'))).toBe(true)
    expect(mockAppendBlockingQuestion).not.toHaveBeenCalled()
  })

  it('RSS interval 초과 시 수집 시도, 에러 발생 시 errors에 포함', async () => {
    mockIsWithinInterval.mockReturnValue(false) // 모든 interval 초과
    mockCollectRss.mockRejectedValue(new Error('RSS fetch failed'))
    const res = await POST()
    const body = await res.json()
    expect(body.errors.some((e: string) => e.includes('RSS 수집'))).toBe(true)
  })

  it('GitHub interval 초과 시 수집 시도, 에러 발생 시 errors에 포함', async () => {
    mockIsWithinInterval.mockReturnValue(false)
    mockCollectGithub.mockRejectedValue(new Error('GitHub rate limit'))
    const res = await POST()
    const body = await res.json()
    expect(body.errors.some((e: string) => e.includes('GitHub 수집'))).toBe(true)
  })

  it('RSS 아이템 수집 성공 시 rss 카운트 증가', async () => {
    mockIsWithinInterval.mockReturnValue(false)
    mockCollectRss.mockResolvedValue({
      items: [
        {
          source: 'rss',
          sourceUrl: 'https://example.com/post/1',
          content: 'AI 관련 뉴스',
          authorName: 'Author',
          collectedAt: new Date(),
        },
      ],
      errors: {},
    })
    const res = await POST()
    const body = await res.json()
    expect(body.rss).toBe(1)
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })
})
