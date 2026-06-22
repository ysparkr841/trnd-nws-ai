jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
}))

// eslint-disable-next-line no-var
var mockParseURL: jest.Mock

jest.mock('rss-parser', () => {
  mockParseURL = jest.fn()
  return jest.fn().mockImplementation(() => ({
    parseURL: mockParseURL,
  }))
})

import { collectRssFeeds } from '@/lib/collector/rss'

const { readFileSync } = jest.requireMock('fs') as { readFileSync: jest.Mock }

const TWO_SOURCES_CONFIG = JSON.stringify({
  rss: [
    { name: 'arXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
    { name: 'HuggingFace Blog', url: 'https://huggingface.co/blog/feed.xml' },
  ],
  githubTopics: [],
})

const MOCK_ITEM = {
  link: 'https://example.com/article-1',
  title: 'AI 최신 논문',
  pubDate: '2026-06-23T00:00:00.000Z',
}

describe('collectRssFeeds', () => {
  beforeEach(() => {
    readFileSync.mockReturnValue(TWO_SOURCES_CONFIG)
    mockParseURL.mockReset()
  })

  it('정상 수집 — 복수 소스에서 아이템 반환', async () => {
    mockParseURL.mockResolvedValue({ items: [MOCK_ITEM] })

    const { items, errors } = await collectRssFeeds()

    expect(items.length).toBe(2)
    expect(items[0].source).toBe('rss')
    expect(items[0].sourceUrl).toBe('https://example.com/article-1')
    expect(Object.keys(errors).length).toBe(0)
  })

  it('authorName이 소스 name으로 설정됨', async () => {
    mockParseURL.mockResolvedValue({ items: [MOCK_ITEM] })

    const { items } = await collectRssFeeds()

    expect(items[0].authorName).toBe('arXiv AI')
    expect(items[1].authorName).toBe('HuggingFace Blog')
  })

  it('link 없는 아이템은 제외', async () => {
    mockParseURL.mockResolvedValue({
      items: [{ title: 'No link item' }, MOCK_ITEM],
    })

    const { items } = await collectRssFeeds()

    expect(items.every((i) => !!i.sourceUrl)).toBe(true)
    expect(items.length).toBe(2)
  })

  it('10건 초과 시 소스당 10건만 수집', async () => {
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      link: `https://example.com/item-${i}`,
      title: `제목 ${i}`,
    }))
    mockParseURL.mockResolvedValue({ items: manyItems })

    const { items } = await collectRssFeeds()

    const arXivItems = items.filter((i) => i.authorName === 'arXiv AI')
    expect(arXivItems.length).toBe(10)
  })

  it('소스 수집 실패 시 errors에 기록, 나머지 소스 계속', async () => {
    mockParseURL
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce({ items: [MOCK_ITEM] })

    const { items, errors } = await collectRssFeeds()

    expect(items.length).toBe(1)
    expect(Object.keys(errors).length).toBe(1)
    expect(errors['https://rss.arxiv.org/rss/cs.AI']).toContain('Connection refused')
  })

  it('pubDate 없으면 Date 객체 생성', async () => {
    mockParseURL.mockResolvedValue({
      items: [{ link: 'https://example.com/no-date', title: '날짜 없음' }],
    })

    const { items } = await collectRssFeeds([{ name: 'Test', url: 'https://test.com/rss' }])

    expect(items[0].collectedAt).toBeInstanceOf(Date)
  })

  it('title 없으면 contentSnippet fallback', async () => {
    mockParseURL.mockResolvedValue({
      items: [{ link: 'https://example.com/snippet', contentSnippet: '본문 일부' }],
    })

    const { items } = await collectRssFeeds([{ name: 'Test', url: 'https://test.com/rss' }])

    expect(items[0].content).toBe('본문 일부')
  })

  it('sources 파라미터로 직접 소스 지정 가능', async () => {
    mockParseURL.mockResolvedValue({ items: [MOCK_ITEM] })

    const { items } = await collectRssFeeds([{ name: 'Custom', url: 'https://custom.feed/rss' }])

    expect(items[0].authorName).toBe('Custom')
    expect(mockParseURL).toHaveBeenCalledWith('https://custom.feed/rss')
  })

  it('모든 소스 실패 시 빈 배열 + 전체 에러 기록', async () => {
    mockParseURL.mockRejectedValue(new Error('Timeout'))

    const { items, errors } = await collectRssFeeds()

    expect(items).toEqual([])
    expect(Object.keys(errors).length).toBe(2)
  })
})
