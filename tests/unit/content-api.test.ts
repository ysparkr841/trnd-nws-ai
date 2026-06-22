/**
 * parseFilename 순수 함수 유닛 테스트
 * app/api/content/route.ts의 export된 함수를 직접 테스트합니다.
 */
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(body),
      status: init?.status ?? 200,
    }),
  },
}))

import { parseFilename } from '../../app/api/content/route'

describe('parseFilename', () => {
  it('날짜-주제 패턴 — date와 topic 파싱', () => {
    const result = parseFilename('2026-06-23-AI-트렌드.md')
    expect(result.filename).toBe('2026-06-23-AI-트렌드.md')
    expect(result.date).toBe('2026-06-23')
    expect(result.topic).toBe('AI 트렌드')
  })

  it('json 확장자 제거', () => {
    const result = parseFilename('2026-06-23-카드뉴스.json')
    expect(result.date).toBe('2026-06-23')
    expect(result.topic).toBe('카드뉴스')
  })

  it('날짜 패턴 없는 파일명 — date 빈 문자열, base가 topic', () => {
    const result = parseFilename('no-date-file.md')
    expect(result.date).toBe('')
    expect(result.topic).toBe('no-date-file')
    expect(result.filename).toBe('no-date-file.md')
  })

  it('하이픈 구분 topic을 공백으로 변환', () => {
    const result = parseFilename('2026-06-23-gpt-5-출시.md')
    expect(result.topic).toBe('gpt 5 출시')
  })

  it('날짜만 있고 topic 없는 파일명은 패턴 불일치', () => {
    const result = parseFilename('2026-06-23.md')
    expect(result.date).toBe('')
    expect(result.topic).toBe('2026-06-23')
  })

  it('확장자 없어도 날짜 패턴 매치 시 정상 파싱', () => {
    const result = parseFilename('2026-06-23-test')
    expect(result.date).toBe('2026-06-23')
    expect(result.topic).toBe('test')
  })
})
