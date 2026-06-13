const OLLAMA_BASE = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = 'llama3.2:3b'
const TIMEOUT_MS = 30000
const FALLBACK_LENGTH = 200

export async function summarizeWithOllama(text: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `다음 텍스트를 한국어로 한 문장(50자 이내)으로 요약해:\n${text}`,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Ollama 응답 오류: ${res.status}`)
    const data = await res.json() as { response: string }
    return data.response.trim()
  } catch {
    // Ollama 실패 시 원문 200자 fallback
    return text.slice(0, FALLBACK_LENGTH)
  } finally {
    clearTimeout(timer)
  }
}
