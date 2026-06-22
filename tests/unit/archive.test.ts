import { getWeekLabel } from '@/lib/util/week'

describe('getWeekLabel', () => {
  it('첫째 주 (1~7일)', () => {
    const { weekKey, weekLabel } = getWeekLabel('2026-06-01')
    expect(weekKey).toBe('2026-06-W1')
    expect(weekLabel).toBe('2026년 6월 1주차')
  })

  it('둘째 주 (8~14일)', () => {
    const { weekKey, weekLabel } = getWeekLabel('2026-06-08')
    expect(weekKey).toBe('2026-06-W2')
    expect(weekLabel).toBe('2026년 6월 2주차')
  })

  it('셋째 주 (15~21일)', () => {
    const { weekKey, weekLabel } = getWeekLabel('2026-06-22')
    expect(weekKey).toBe('2026-06-W4')
    expect(weekLabel).toBe('2026년 6월 4주차')
  })

  it('넷째 주 경계 (21일)', () => {
    const { weekKey, weekLabel } = getWeekLabel('2026-06-21')
    expect(weekKey).toBe('2026-06-W3')
    expect(weekLabel).toBe('2026년 6월 3주차')
  })

  it('다섯째 주 (29~31일)', () => {
    const { weekKey, weekLabel } = getWeekLabel('2026-06-29')
    expect(weekKey).toBe('2026-06-W5')
    expect(weekLabel).toBe('2026년 6월 5주차')
  })

  it('월 변경 시 월 번호 정확', () => {
    const { weekLabel } = getWeekLabel('2026-01-01')
    expect(weekLabel).toBe('2026년 1월 1주차')
  })

  it('weekKey 정렬 순서 — 최신이 더 큼', () => {
    const a = getWeekLabel('2026-06-22').weekKey
    const b = getWeekLabel('2026-06-01').weekKey
    expect(a > b).toBe(true)
  })
})
