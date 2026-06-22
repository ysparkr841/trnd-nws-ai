export interface QualityResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  passed: string[]
  failed: string[]
}

function toGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 4) return 'A'
  if (score === 3) return 'B'
  if (score === 2) return 'C'
  return 'D'
}

function toResult(checks: Array<[string, boolean]>): QualityResult {
  const passed = checks.filter(([, v]) => v).map(([k]) => k)
  const failed = checks.filter(([, v]) => !v).map(([k]) => k)
  return { score: passed.length, grade: toGrade(passed.length), passed, failed }
}

export function evaluateArticle(content: string): QualityResult {
  return toResult([
    ['분량 충분 (500자+)', content.length >= 500],
    ['소제목 3개 이상', (content.match(/^##\s/gm) ?? []).length >= 3],
    ['출처/참고/URL 포함', /출처|참고|http/i.test(content)],
    ['날짜 메타데이터', /\d{4}-\d{2}-\d{2}/.test(content)],
  ])
}

export function evaluateScript(content: string): QualityResult {
  return toResult([
    ['분량 충분 (1000자+)', content.length >= 1000],
    ['인트로/아웃트로 포함', /인트로|아웃트로|intro|outro/i.test(content)],
    ['타임코드 포함', /\d+:\d{2}/.test(content)],
    ['섹션 3개 이상', (content.match(/^##\s/gm) ?? []).length >= 3],
  ])
}

export function evaluateCards(content: string): QualityResult {
  type Card = { title?: unknown; body?: unknown }
  let parsed: { cards?: Card[] } = {}
  try {
    parsed = JSON.parse(content) as { cards?: Card[] }
  } catch {
    // invalid JSON
  }
  const cards = Array.isArray(parsed.cards) ? parsed.cards : []
  const allHaveTitle = cards.length > 0 && cards.every((c) => typeof c.title === 'string')
  const allHaveBody =
    cards.length > 0 &&
    cards.every((c) => typeof c.body === 'string' && (c.body as string).length >= 50)

  return toResult([
    ['cards 배열 존재', cards.length > 0],
    ['카드 7장', cards.length === 7],
    ['모든 카드 제목 있음', allHaveTitle],
    ['모든 카드 본문 충분 (50자+)', allHaveBody],
  ])
}

export function evaluateContent(
  type: 'articles' | 'scripts' | 'cards',
  content: string,
): QualityResult {
  if (type === 'articles') return evaluateArticle(content)
  if (type === 'scripts') return evaluateScript(content)
  return evaluateCards(content)
}
