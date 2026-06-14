const OLLAMA_BASE = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = 'llama3.2:3b'
const TIMEOUT_MS = 30000
const FALLBACK_LENGTH = 200

async function callOllama(prompt: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Ollama 응답 오류: ${res.status}`)
    const data = await res.json() as { response: string }
    return data.response.trim()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function summarizeWithOllama(text: string): Promise<string> {
  const result = await callOllama(`다음 텍스트를 한국어로 한 문장(50자 이내)으로 요약해:\n${text}`)
  return result ?? text.slice(0, FALLBACK_LENGTH)
}

export interface RepoSummaryInput {
  name: string
  description: string | null
  language: string | null
  topics: string[]
  readme: string
}

export async function summarizeRepoWithOllama(repo: RepoSummaryInput): Promise<string | null> {
  const context = [
    `레포지토리: ${repo.name}`,
    repo.description ? `설명: ${repo.description}` : '',
    repo.language ? `언어: ${repo.language}` : '',
    repo.topics.length > 0 ? `토픽: ${repo.topics.join(', ')}` : '',
    repo.readme ? `README(일부):\n${repo.readme.slice(0, 500)}` : '',
  ].filter(Boolean).join('\n')

  const prompt = `다음 GitHub 레포지토리 정보를 한국어로 2-3문장으로 요약해. AI/ML 관점에서 핵심 기능과 활용 방법을 포함해:\n\n${context}`

  return callOllama(prompt)
}
