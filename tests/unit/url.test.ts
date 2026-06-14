import { normalizeUrl, urlHash } from '@/lib/util/url'

describe('normalizeUrl', () => {
  it('utm 파라미터 제거', () => {
    expect(normalizeUrl('https://arxiv.org/abs/2401.00001?utm_source=newsletter&utm_medium=email'))
      .toBe('https://arxiv.org/abs/2401.00001')
  })

  it('프로토콜을 https로 통일', () => {
    expect(normalizeUrl('http://github.com/foo/bar'))
      .toBe('https://github.com/foo/bar')
  })

  it('trailing slash 제거', () => {
    expect(normalizeUrl('https://github.com/foo/bar/'))
      .toBe('https://github.com/foo/bar')
  })

  it('의미 있는 쿼리 파라미터는 보존', () => {
    expect(normalizeUrl('https://arxiv.org/search/?query=llm&searchtype=all'))
      .toBe('https://arxiv.org/search/?query=llm&searchtype=all')
  })

  it('fbclid 제거', () => {
    expect(normalizeUrl('https://example.com/post?fbclid=abc123'))
      .toBe('https://example.com/post')
  })

  it('잘못된 URL은 소문자로만 처리', () => {
    expect(normalizeUrl('not-a-url/PATH/')).toBe('not-a-url/path')
  })
})

describe('urlHash', () => {
  it('같은 URL은 같은 해시', () => {
    expect(urlHash('https://github.com/foo/bar')).toBe(urlHash('https://github.com/foo/bar'))
  })

  it('utm 파라미터 다른 URL은 같은 해시', () => {
    expect(urlHash('https://github.com/foo/bar?utm_source=x'))
      .toBe(urlHash('https://github.com/foo/bar'))
  })

  it('다른 URL은 다른 해시', () => {
    expect(urlHash('https://github.com/foo/bar')).not.toBe(urlHash('https://github.com/foo/baz'))
  })

  it('해시 길이 16자', () => {
    expect(urlHash('https://example.com')).toHaveLength(16)
  })
})
