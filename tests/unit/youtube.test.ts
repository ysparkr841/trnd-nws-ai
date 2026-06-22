import { getYouTubeSearchUrl, searchRelatedVideos } from '@/lib/util/youtube'

const MOCK_ITEM = {
  id: { videoId: 'abc123' },
  snippet: {
    title: 'Noam Shazeer joins OpenAI',
    channelTitle: 'AI News',
    publishedAt: '2026-06-18T10:00:00Z',
    thumbnails: {
      medium: { url: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg' },
    },
  },
}

describe('getYouTubeSearchUrl', () => {
  it('encodes simple query', () => {
    const url = getYouTubeSearchUrl('AI trend')
    expect(url).toBe('https://www.youtube.com/results?search_query=AI%20trend')
  })

  it('encodes Korean query', () => {
    const url = getYouTubeSearchUrl('노암 샤지어 OpenAI')
    expect(url).toContain('https://www.youtube.com/results?search_query=')
    expect(url).toContain('OpenAI')
  })

  it('encodes special characters', () => {
    const url = getYouTubeSearchUrl('GPT-4 & Claude')
    expect(url).not.toContain(' ')
    expect(url).not.toContain('&')
  })
})

describe('searchRelatedVideos', () => {
  const origFetch = global.fetch
  const origEnv = process.env.YOUTUBE_API_KEY

  afterEach(() => {
    global.fetch = origFetch
    if (origEnv === undefined) {
      delete process.env.YOUTUBE_API_KEY
    } else {
      process.env.YOUTUBE_API_KEY = origEnv
    }
  })

  it('returns empty array when no API key', async () => {
    delete process.env.YOUTUBE_API_KEY
    const results = await searchRelatedVideos('AI trend')
    expect(results).toEqual([])
  })

  it('returns mapped videos on success', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [MOCK_ITEM] }),
    }) as jest.Mock

    const results = await searchRelatedVideos('Noam Shazeer', 1)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      id: 'abc123',
      title: 'Noam Shazeer joins OpenAI',
      channelTitle: 'AI News',
      publishedAt: '2026-06-18',
      url: 'https://www.youtube.com/watch?v=abc123',
    })
  })

  it('uses default thumbnail when medium missing', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key'
    const itemNoMedium = {
      ...MOCK_ITEM,
      snippet: {
        ...MOCK_ITEM.snippet,
        thumbnails: { default: { url: 'https://i.ytimg.com/vi/abc123/default.jpg' } },
      },
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [itemNoMedium] }),
    }) as jest.Mock

    const results = await searchRelatedVideos('test', 1)
    expect(results[0].thumbnailUrl).toBe('https://i.ytimg.com/vi/abc123/default.jpg')
  })

  it('returns empty array on HTTP error', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }) as jest.Mock

    const results = await searchRelatedVideos('test')
    expect(results).toEqual([])
  })

  it('returns empty array when items is missing', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'quota exceeded' }),
    }) as jest.Mock

    const results = await searchRelatedVideos('test')
    expect(results).toEqual([])
  })

  it('passes maxResults param to API URL', async () => {
    process.env.YOUTUBE_API_KEY = 'test-key'
    let capturedUrl = ''
    global.fetch = jest.fn().mockImplementation((url: string) => {
      capturedUrl = url
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) })
    }) as jest.Mock

    await searchRelatedVideos('test', 5)
    expect(capturedUrl).toContain('maxResults=5')
    expect(capturedUrl).toContain('type=video')
    expect(capturedUrl).toContain('relevanceLanguage=ko')
  })
})
