import { XSessionExpiredError } from '@/lib/collector/x'
import { ThreadsSessionExpiredError } from '@/lib/collector/threads'

// 세션 파일이 없을 때 빈 배열 반환 검증 (Playwright 없이 실행)
jest.mock('playwright', () => ({
  chromium: { launch: jest.fn() },
}))

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(false),
}))

describe('XSessionExpiredError', () => {
  it('올바른 메시지와 name을 가짐', () => {
    const err = new XSessionExpiredError()
    expect(err.name).toBe('XSessionExpiredError')
    expect(err.message).toContain('X 세션 만료')
  })

  it('Error 인스턴스임', () => {
    expect(new XSessionExpiredError()).toBeInstanceOf(Error)
  })
})

describe('ThreadsSessionExpiredError', () => {
  it('올바른 메시지와 name을 가짐', () => {
    const err = new ThreadsSessionExpiredError()
    expect(err.name).toBe('ThreadsSessionExpiredError')
    expect(err.message).toContain('Threads 세션 만료')
  })

  it('Error 인스턴스임', () => {
    expect(new ThreadsSessionExpiredError()).toBeInstanceOf(Error)
  })
})

describe('세션 파일 없을 때 빈 배열 반환', () => {
  it('collectXFeeds — 세션 없으면 []', async () => {
    const { collectXFeeds } = await import('@/lib/collector/x')
    const result = await collectXFeeds()
    expect(result).toEqual([])
  })

  it('collectThreadsFeeds — 세션 없으면 []', async () => {
    const { collectThreadsFeeds } = await import('@/lib/collector/threads')
    const result = await collectThreadsFeeds()
    expect(result).toEqual([])
  })
})
