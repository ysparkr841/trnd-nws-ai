import type { Octokit as OctokitType } from '@octokit/rest'

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(),
}))

import { Octokit } from '@octokit/rest'
import { fetchRepoDetails } from '@/lib/parser/content'

const BASE_REPO = {
  stargazers_count: 1234,
  language: 'TypeScript',
  description: 'AI 트렌드 허브',
  topics: ['ai', 'nextjs'],
}

describe('fetchRepoDetails', () => {
  let mockGet: jest.Mock
  let mockGetReadme: jest.Mock

  beforeEach(() => {
    mockGet = jest.fn()
    mockGetReadme = jest.fn()
    jest.mocked(Octokit).mockImplementation(() => ({
      repos: { get: mockGet, getReadme: mockGetReadme },
    }) as unknown as InstanceType<typeof OctokitType>)
  })

  afterEach(() => jest.clearAllMocks())

  it('정상 응답 — stars, language, readme 반환', async () => {
    mockGet.mockResolvedValue({ data: BASE_REPO })
    mockGetReadme.mockResolvedValue({
      data: { content: Buffer.from('# README\n테스트').toString('base64') },
    })

    const result = await fetchRepoDetails('owner', 'repo')

    expect(result).not.toBeNull()
    expect(result!.stars).toBe(1234)
    expect(result!.language).toBe('TypeScript')
    expect(result!.description).toBe('AI 트렌드 허브')
    expect(result!.topics).toEqual(['ai', 'nextjs'])
    expect(result!.readme).toContain('README')
  })

  it('README 수집 실패 — readme 빈 문자열, 나머지 정상', async () => {
    mockGet.mockResolvedValue({ data: BASE_REPO })
    mockGetReadme.mockRejectedValue(new Error('404'))

    const result = await fetchRepoDetails('owner', 'repo')

    expect(result).not.toBeNull()
    expect(result!.readme).toBe('')
    expect(result!.stars).toBe(1234)
  })

  it('레포 수집 실패 — null 반환', async () => {
    mockGet.mockRejectedValue(new Error('API Error'))
    mockGetReadme.mockResolvedValue({ data: { content: '' } })

    const result = await fetchRepoDetails('owner', 'repo')
    expect(result).toBeNull()
  })

  it('README 800자 초과 시 잘라냄', async () => {
    const longReadme = 'A'.repeat(1200)
    mockGet.mockResolvedValue({ data: BASE_REPO })
    mockGetReadme.mockResolvedValue({
      data: { content: Buffer.from(longReadme).toString('base64') },
    })

    const result = await fetchRepoDetails('owner', 'repo')
    expect(result!.readme.length).toBe(800)
  })

  it('language null 시 null 반환', async () => {
    mockGet.mockResolvedValue({ data: { ...BASE_REPO, language: null } })
    mockGetReadme.mockResolvedValue({ data: { content: '' } })

    const result = await fetchRepoDetails('owner', 'repo')
    expect(result!.language).toBeNull()
  })
})
