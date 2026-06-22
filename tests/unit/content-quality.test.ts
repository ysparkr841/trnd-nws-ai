import {
  evaluateArticle,
  evaluateScript,
  evaluateCards,
  evaluateContent,
} from '../../lib/util/content-quality'

const GOOD_ARTICLE = `# 제목
**날짜:** 2026-06-23

## 요약
테스트 요약 내용입니다.

## 배경
${'x'.repeat(400)}

## 분석
내용 분석입니다.

## 결론
마무리입니다.

출처: https://example.com
`

const GOOD_SCRIPT = `# 유튜브 대본
**날짜:** 2026-06-23
**영상 길이:** 약 15분

## [인트로 — 0:00~1:00]
인트로 내용입니다.

## [1부 — 1:00~5:00]
${'a'.repeat(1100)}

## [2부 — 5:00~10:00]
내용2

## [아웃트로 — 10:00~12:00]
아웃트로 내용입니다.
`

const GOOD_CARDS = JSON.stringify({
  topic: '테스트',
  date: '2026-06-23',
  cards: Array.from({ length: 7 }, (_, i) => ({
    index: i + 1,
    title: `카드 ${i + 1}`,
    body: '이것은 테스트 카드 본문입니다. 충분한 길이를 갖추고 있습니다. 50자 이상이어야 합니다.',
  })),
})

describe('evaluateArticle', () => {
  it('좋은 아티클은 A 등급을 받는다', () => {
    const result = evaluateArticle(GOOD_ARTICLE)
    expect(result.grade).toBe('A')
    expect(result.score).toBe(4)
    expect(result.failed).toHaveLength(0)
  })

  it('짧은 아티클은 분량 기준 실패', () => {
    const result = evaluateArticle('짧은 내용')
    expect(result.passed).not.toContain('분량 충분 (500자+)')
  })

  it('소제목 없으면 기준 실패', () => {
    const noHeadings = '날짜: 2026-01-01\n출처: http://a.com\n' + 'x'.repeat(600)
    const result = evaluateArticle(noHeadings)
    expect(result.passed).not.toContain('소제목 3개 이상')
  })

  it('출처 없으면 기준 실패', () => {
    const noSource = '2026-06-23\n## a\n## b\n## c\n' + 'x'.repeat(500)
    const result = evaluateArticle(noSource)
    expect(result.passed).not.toContain('출처/참고/URL 포함')
  })

  it('날짜 없으면 기준 실패', () => {
    const noDate = '## a\n## b\n## c\nhttp://example.com\n' + 'x'.repeat(500)
    const result = evaluateArticle(noDate)
    expect(result.passed).not.toContain('날짜 메타데이터')
  })
})

describe('evaluateScript', () => {
  it('좋은 대본은 A 등급을 받는다', () => {
    const result = evaluateScript(GOOD_SCRIPT)
    expect(result.grade).toBe('A')
    expect(result.score).toBe(4)
  })

  it('짧은 대본은 분량 기준 실패', () => {
    const result = evaluateScript('짧은 대본')
    expect(result.passed).not.toContain('분량 충분 (1000자+)')
  })

  it('인트로/아웃트로 없으면 기준 실패', () => {
    const noIntroOutro = '0:00 내용\n## 1부\n## 2부\n## 3부\n' + 'x'.repeat(1000)
    const result = evaluateScript(noIntroOutro)
    expect(result.passed).not.toContain('인트로/아웃트로 포함')
  })

  it('타임코드 없으면 기준 실패', () => {
    const noTime = '인트로\n아웃트로\n## a\n## b\n## c\n' + 'x'.repeat(1000)
    const result = evaluateScript(noTime)
    expect(result.passed).not.toContain('타임코드 포함')
  })
})

describe('evaluateCards', () => {
  it('좋은 카드뉴스는 A 등급을 받는다', () => {
    const result = evaluateCards(GOOD_CARDS)
    expect(result.grade).toBe('A')
    expect(result.score).toBe(4)
  })

  it('잘못된 JSON은 모든 기준 실패', () => {
    const result = evaluateCards('not json')
    expect(result.score).toBe(0)
    expect(result.grade).toBe('D')
  })

  it('카드 7장 미만이면 기준 실패', () => {
    const fewCards = JSON.stringify({
      cards: Array.from({ length: 5 }, (_, i) => ({
        title: `카드 ${i}`,
        body: '충분한 길이를 갖추고 있습니다. 테스트 본문입니다. 50자 이상이어야 합니다.',
      })),
    })
    const result = evaluateCards(fewCards)
    expect(result.passed).not.toContain('카드 7장')
  })

  it('title 없는 카드가 있으면 기준 실패', () => {
    const noTitle = JSON.stringify({
      cards: Array.from({ length: 7 }, (_, i) => ({
        ...(i === 3 ? {} : { title: `카드 ${i}` }),
        body: '충분한 본문 내용이 있습니다. 50자를 넘겨야 합니다. 잘 작동하는지 확인합니다.',
      })),
    })
    const result = evaluateCards(noTitle)
    expect(result.passed).not.toContain('모든 카드 제목 있음')
  })

  it('본문이 짧은 카드가 있으면 기준 실패', () => {
    const shortBody = JSON.stringify({
      cards: Array.from({ length: 7 }, (_, i) => ({
        title: `카드 ${i}`,
        body: i === 2 ? '짧음' : '충분한 본문 내용이 있습니다. 50자를 넘겨야 합니다.',
      })),
    })
    const result = evaluateCards(shortBody)
    expect(result.passed).not.toContain('모든 카드 본문 충분 (50자+)')
  })
})

describe('evaluateContent 디스패처', () => {
  it('articles 타입은 evaluateArticle을 호출한다', () => {
    const result = evaluateContent('articles', GOOD_ARTICLE)
    expect(result.grade).toBe('A')
  })

  it('scripts 타입은 evaluateScript를 호출한다', () => {
    const result = evaluateContent('scripts', GOOD_SCRIPT)
    expect(result.grade).toBe('A')
  })

  it('cards 타입은 evaluateCards를 호출한다', () => {
    const result = evaluateContent('cards', GOOD_CARDS)
    expect(result.grade).toBe('A')
  })
})
