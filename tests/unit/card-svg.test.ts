import { generateCardSvg } from '@/lib/util/card-svg'

const sampleCard = {
  index: 1,
  title: '트랜스포머를 만든 사람이 OpenAI로 갔다',
  body: '2026년 6월 18일, Noam Shazeer가 Google을 떠나 OpenAI에 합류한다고 발표했습니다. 그는 ChatGPT·Claude·Gemini 모든 AI의 뼈대가 된 트랜스포머 아키텍처를 2017년 공동 발명한 인물입니다.',
  highlight: 'AI 역사상 가장 중요한 인물 중 하나가 OpenAI를 선택했습니다.',
}

describe('generateCardSvg', () => {
  it('유효한 SVG 문자열을 반환한다', () => {
    const svg = generateCardSvg(sampleCard, 7, '2026-06-23')
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('카드 번호와 총 장수를 포함한다', () => {
    const svg = generateCardSvg(sampleCard, 7, '2026-06-23')
    expect(svg).toContain('1 / 7')
  })

  it('날짜를 포함한다', () => {
    const svg = generateCardSvg(sampleCard, 7, '2026-06-23')
    expect(svg).toContain('2026-06-23')
  })

  it('제목 텍스트를 포함한다', () => {
    const svg = generateCardSvg(sampleCard, 7, '2026-06-23')
    expect(svg).toContain('트랜스포머를 만든 사람이')
  })

  it('하이라이트 텍스트를 포함한다', () => {
    const svg = generateCardSvg(sampleCard, 7, '2026-06-23')
    expect(svg).toContain('AI 역사상 가장 중요한 인물')
  })

  it('XML 특수문자를 이스케이프한다', () => {
    const card = { ...sampleCard, title: 'A & B <test> "quote"' }
    const svg = generateCardSvg(card, 7, '2026-06-23')
    expect(svg).not.toContain('<test>')
    expect(svg).toContain('&amp;')
    expect(svg).toContain('&lt;')
    expect(svg).toContain('&quot;')
  })

  it('긴 제목은 여러 줄로 나눈다', () => {
    const card = {
      ...sampleCard,
      title: '이것은 매우 길고 긴 제목으로서 한 줄에 다 들어가지 않아야 한다는 것을 확인합니다',
    }
    const svg = generateCardSvg(card, 7, '2026-06-23')
    // 19자씩 나뉘므로 두 번째 text 요소가 생성됨
    const textCount = (svg.match(/<text /g) ?? []).length
    expect(textCount).toBeGreaterThan(3)
  })

  it('마지막 카드도 정상 처리된다', () => {
    const lastCard = { ...sampleCard, index: 7 }
    const svg = generateCardSvg(lastCard, 7, '2026-06-23')
    expect(svg).toContain('7 / 7')
  })

  it('1080x1080 뷰박스를 갖는다', () => {
    const svg = generateCardSvg(sampleCard, 7, '2026-06-23')
    expect(svg).toContain('width="1080"')
    expect(svg).toContain('height="1080"')
    expect(svg).toContain('viewBox="0 0 1080 1080"')
  })
})
