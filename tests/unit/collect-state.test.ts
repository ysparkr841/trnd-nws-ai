import { readCollectState, writeCollectState, isWithinInterval } from '@/lib/config/collect-state'

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}))

const { readFileSync, writeFileSync } = jest.requireMock('fs') as {
  readFileSync: jest.Mock
  writeFileSync: jest.Mock
}

beforeEach(() => jest.clearAllMocks())

describe('readCollectState', () => {
  it('파일 없으면 기본 빈 상태 반환', () => {
    readFileSync.mockImplementation(() => { throw new Error('ENOENT') })
    const state = readCollectState()
    expect(state.rss).toEqual({})
    expect(state.github).toEqual({ lastCollectedAt: null, lastError: null })
    expect(state.x).toEqual({ lastCollectedAt: null, lastError: null })
    expect(state.threads).toEqual({ lastCollectedAt: null, lastError: null })
  })

  it('파일 읽기 성공 시 파싱된 상태 반환', () => {
    const stored = {
      rss: { 'https://example.com/rss': { lastCollectedAt: '2026-06-23T00:00:00Z', lastError: null } },
      github: { lastCollectedAt: '2026-06-23T00:00:00Z', lastError: null },
      x: { lastCollectedAt: null, lastError: 'X 세션 만료' },
      threads: { lastCollectedAt: null, lastError: null },
    }
    readFileSync.mockReturnValue(JSON.stringify(stored))
    expect(readCollectState()).toEqual(stored)
  })

  it('잘못된 JSON이면 기본 상태 반환', () => {
    readFileSync.mockReturnValue('{ bad json }')
    const state = readCollectState()
    expect(state.rss).toEqual({})
  })
})

describe('writeCollectState', () => {
  it('collect-state.json에 상태 저장', () => {
    const state = {
      rss: {},
      github: { lastCollectedAt: '2026-06-23T00:00:00Z', lastError: null },
      x: { lastCollectedAt: null, lastError: null },
      threads: { lastCollectedAt: null, lastError: null },
    }
    writeCollectState(state)
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('collect-state.json'),
      JSON.stringify(state, null, 2),
      'utf-8'
    )
  })
})

describe('isWithinInterval', () => {
  it('lastCollectedAt이 null이면 false', () => {
    expect(isWithinInterval(null, 60)).toBe(false)
  })

  it('인터벌 내 수집이면 true', () => {
    const recent = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(isWithinInterval(recent, 60)).toBe(true)
  })

  it('인터벌 초과하면 false', () => {
    const old = new Date(Date.now() - 90 * 60 * 1000).toISOString()
    expect(isWithinInterval(old, 60)).toBe(false)
  })

  it('정확히 인터벌 경계에서 false', () => {
    const exact = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    expect(isWithinInterval(exact, 60)).toBe(false)
  })
})
