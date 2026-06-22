jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
}))

// eslint-disable-next-line no-var
var mockSearchRepos: jest.Mock

jest.mock('@octokit/rest', () => {
  mockSearchRepos = jest.fn()
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      search: { repos: mockSearchRepos },
    })),
  }
})

import { collectGithubTrending } from '@/lib/collector/github'

const { readFileSync } = jest.requireMock('fs') as { readFileSync: jest.Mock }

const TWO_TOPICS_CONFIG = JSON.stringify({
  rss: [],
  githubTopics: ['machine-learning', 'llm'],
})

const MOCK_REPO = {
  full_name: 'owner/repo',
  html_url: 'https://github.com/owner/repo',
  description: 'AI 테스트 레포',
  stargazers_count: 500,
  language: 'Python',
  topics: ['ai', 'ml'],
}

describe('collectGithubTrending', () => {
  beforeEach(() => {
    readFileSync.mockReturnValue(TWO_TOPICS_CONFIG)
    mockSearchRepos.mockReset()
  })

  it('정상 수집 — source/repoName/repoUrl/repoStars 반환', async () => {
    mockSearchRepos.mockResolvedValue({ data: { items: [MOCK_REPO] } })

    const result = await collectGithubTrending()

    expect(result[0].source).toBe('github')
    expect(result[0].repoName).toBe('owner/repo')
    expect(result[0].repoUrl).toBe('https://github.com/owner/repo')
    expect(result[0].repoStars).toBe(500)
    expect(result[0].repoLanguage).toBe('Python')
    expect(result[0].repoTopics).toEqual(['ai', 'ml'])
  })

  it('중복 URL 제거 — 두 topic에 같은 레포가 있어도 1개만', async () => {
    mockSearchRepos.mockResolvedValue({ data: { items: [MOCK_REPO] } })

    const result = await collectGithubTrending()

    const urls = result.map((r) => r.repoUrl)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('description null 시 content에 "설명 없음" 포함, repoDescription은 null', async () => {
    mockSearchRepos.mockResolvedValue({
      data: { items: [{ ...MOCK_REPO, description: null }] },
    })

    const result = await collectGithubTrending()

    expect(result[0].content).toContain('설명 없음')
    expect(result[0].repoDescription).toBeNull()
  })

  it('topics 없을 때 빈 배열', async () => {
    mockSearchRepos.mockResolvedValue({
      data: { items: [{ ...MOCK_REPO, topics: undefined }] },
    })

    const result = await collectGithubTrending()

    expect(result[0].repoTopics).toEqual([])
  })

  it('language null 시 repoLanguage null', async () => {
    mockSearchRepos.mockResolvedValue({
      data: { items: [{ ...MOCK_REPO, language: null }] },
    })

    const result = await collectGithubTrending()

    expect(result[0].repoLanguage).toBeNull()
  })

  it('API 실패 시 해당 topic 건너뜀, 다른 topic은 계속', async () => {
    mockSearchRepos
      .mockRejectedValueOnce(new Error('API Rate Limit'))
      .mockResolvedValueOnce({
        data: {
          items: [
            { ...MOCK_REPO, html_url: 'https://github.com/other/repo', full_name: 'other/repo' },
          ],
        },
      })

    const result = await collectGithubTrending()

    expect(result.length).toBe(1)
    expect(result[0].repoName).toBe('other/repo')
  })

  it('githubTopics 빈 배열이면 API 미호출 + 빈 결과', async () => {
    readFileSync.mockReturnValue(JSON.stringify({ rss: [], githubTopics: [] }))

    const result = await collectGithubTrending()

    expect(result).toEqual([])
    expect(mockSearchRepos).not.toHaveBeenCalled()
  })

  it('collectedAt은 Date 타입', async () => {
    mockSearchRepos.mockResolvedValue({ data: { items: [MOCK_REPO] } })

    const result = await collectGithubTrending()

    expect(result[0].collectedAt).toBeInstanceOf(Date)
  })
})
