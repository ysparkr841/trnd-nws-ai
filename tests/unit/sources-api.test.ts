import { readSourcesConfig, writeSourcesConfig } from '@/lib/config/sources'

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

const DEFAULT_CONFIG = {
  rss: [
    { name: 'arXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
    { name: 'arXiv ML', url: 'https://rss.arxiv.org/rss/cs.LG' },
    { name: 'HuggingFace Blog', url: 'https://huggingface.co/blog/feed.xml' },
    { name: 'Anthropic News', url: 'https://www.anthropic.com/news.rss' },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
  ],
  githubTopics: ['machine-learning', 'llm', 'ai', 'deep-learning'],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('readSourcesConfig', () => {
  it('파일 읽기 성공 시 파싱된 설정 반환', () => {
    const config = { rss: [{ name: 'Test', url: 'https://test.com/rss' }], githubTopics: ['llm'] }
    readFileSync.mockReturnValue(JSON.stringify(config))
    expect(readSourcesConfig()).toEqual(config)
  })

  it('파일 읽기 실패 시 기본값 반환', () => {
    readFileSync.mockImplementation(() => { throw new Error('ENOENT') })
    const result = readSourcesConfig()
    expect(result.rss).toHaveLength(5)
    expect(result.githubTopics).toContain('llm')
  })

  it('잘못된 JSON 시 기본값 반환', () => {
    readFileSync.mockReturnValue('{ invalid json }')
    const result = readSourcesConfig()
    expect(result).toEqual(DEFAULT_CONFIG)
  })
})

describe('writeSourcesConfig', () => {
  it('JSON 파일에 설정 저장', () => {
    const config = { rss: [{ name: 'Test', url: 'https://test.com/rss' }], githubTopics: ['ai'] }
    writeSourcesConfig(config)
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('sources.json'),
      JSON.stringify(config, null, 2),
      'utf-8'
    )
  })
})
