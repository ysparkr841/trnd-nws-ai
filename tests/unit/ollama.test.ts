import { summarizeWithOllama, summarizeRepoWithOllama, RepoSummaryInput } from '@/lib/ai/ollama'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

function ollamaOk(response: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response }),
  })
}

function ollamaFail() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
}

const sampleRepo: RepoSummaryInput = {
  name: 'huggingface/transformers',
  description: 'State-of-the-art ML for PyTorch, TensorFlow, and JAX',
  language: 'Python',
  topics: ['nlp', 'deep-learning', 'transformers'],
  readme: '# Transformers\nBuild ML models easily.',
}

describe('summarizeWithOllama', () => {
  it('Ollama 응답을 트림해서 반환한다', async () => {
    ollamaOk('  AI 뉴스 요약입니다.  ')
    const result = await summarizeWithOllama('some text')
    expect(result).toBe('AI 뉴스 요약입니다.')
  })

  it('Ollama 실패 시 원문 200자를 반환한다', async () => {
    ollamaFail()
    const longText = 'a'.repeat(300)
    const result = await summarizeWithOllama(longText)
    expect(result).toBe('a'.repeat(200))
  })

  it('네트워크 오류 시 원문 fallback', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const result = await summarizeWithOllama('fallback text')
    expect(result).toBe('fallback text')
  })
})

describe('summarizeRepoWithOllama', () => {
  it('Ollama 응답을 반환한다', async () => {
    ollamaOk('HuggingFace Transformers는 NLP 모델 구축 라이브러리입니다.')
    const result = await summarizeRepoWithOllama(sampleRepo)
    expect(result).toBe('HuggingFace Transformers는 NLP 모델 구축 라이브러리입니다.')
  })

  it('Ollama 실패 시 null을 반환한다', async () => {
    ollamaFail()
    const result = await summarizeRepoWithOllama(sampleRepo)
    expect(result).toBeNull()
  })

  it('레포 이름·언어·토픽 정보가 프롬프트에 포함된다', async () => {
    ollamaOk('요약 결과')
    await summarizeRepoWithOllama(sampleRepo)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.prompt).toContain('huggingface/transformers')
    expect(body.prompt).toContain('Python')
    expect(body.prompt).toContain('nlp')
  })

  it('description이 null이어도 정상 동작한다', async () => {
    ollamaOk('요약')
    const result = await summarizeRepoWithOllama({ ...sampleRepo, description: null })
    expect(result).toBe('요약')
  })
})
