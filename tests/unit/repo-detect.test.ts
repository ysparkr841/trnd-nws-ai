import { detectGithubRepos } from '../../lib/parser/repo-detect'

describe('detectGithubRepos', () => {
  it('단순 GitHub URL 감지', () => {
    const result = detectGithubRepos('Check out https://github.com/anthropics/anthropic-sdk-python')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      url: 'https://github.com/anthropics/anthropic-sdk-python',
      owner: 'anthropics',
      name: 'anthropic-sdk-python',
    })
  })

  it('여러 URL 감지', () => {
    const text = 'See https://github.com/openai/openai-python and https://github.com/anthropics/claude'
    const result = detectGithubRepos(text)
    expect(result).toHaveLength(2)
    expect(result[0].owner).toBe('openai')
    expect(result[1].owner).toBe('anthropics')
  })

  it('중복 URL 제거', () => {
    const text = 'https://github.com/foo/bar 링크가 두 번 등장 https://github.com/foo/bar'
    const result = detectGithubRepos(text)
    expect(result).toHaveLength(1)
  })

  it('GitHub URL 없으면 빈 배열', () => {
    const result = detectGithubRepos('아무런 링크 없는 텍스트입니다.')
    expect(result).toHaveLength(0)
  })

  it('연속 호출해도 정확히 동작 (lastIndex 오염 없음)', () => {
    const r1 = detectGithubRepos('https://github.com/a/b')
    const r2 = detectGithubRepos('https://github.com/c/d')
    expect(r1).toHaveLength(1)
    expect(r1[0].owner).toBe('a')
    expect(r2).toHaveLength(1)
    expect(r2[0].owner).toBe('c')
  })

  it('http와 https 둘 다 감지', () => {
    const text = 'http://github.com/foo/bar 또는 https://github.com/baz/qux'
    const result = detectGithubRepos(text)
    expect(result).toHaveLength(2)
  })
})
