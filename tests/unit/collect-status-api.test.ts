jest.mock('../../lib/config/collect-state', () => ({
  readCollectState: jest.fn(),
  writeCollectState: jest.fn(),
  isWithinInterval: jest.fn(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(body),
      status: init?.status ?? 200,
    }),
  },
}))

import { readCollectState } from '../../lib/config/collect-state'
import { GET } from '../../app/api/collect/status/route'

const mockReadCollectState = readCollectState as jest.MockedFunction<typeof readCollectState>

beforeEach(() => jest.clearAllMocks())

describe('GET /api/collect/status', () => {
  it('readCollectState 결과를 그대로 JSON으로 반환', async () => {
    const fakeState = {
      rss: { 'https://example.com/rss': { lastCollectedAt: '2026-06-23T00:00:00.000Z', lastError: null } },
      github: { lastCollectedAt: '2026-06-23T00:00:00.000Z', lastError: null },
      x: { lastCollectedAt: null, lastError: null },
      threads: { lastCollectedAt: null, lastError: null },
    }
    mockReadCollectState.mockReturnValue(fakeState as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(fakeState)
  })

  it('빈 상태도 정상 반환', async () => {
    const emptyState = { rss: {}, github: { lastCollectedAt: null, lastError: null }, x: { lastCollectedAt: null, lastError: null }, threads: { lastCollectedAt: null, lastError: null } }
    mockReadCollectState.mockReturnValue(emptyState as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.rss).toEqual({})
  })
})
