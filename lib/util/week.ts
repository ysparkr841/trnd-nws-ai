export function getWeekLabel(dateStr: string): { weekKey: string; weekLabel: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekOfMonth = Math.ceil(day / 7)
  const weekKey = `${year}-${String(month).padStart(2, '0')}-W${weekOfMonth}`
  return { weekKey, weekLabel: `${year}년 ${month}월 ${weekOfMonth}주차` }
}
