export interface CardData {
  index: number
  title: string
  body: string
  highlight: string
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const result: string[] = []
  let remaining = text.trim()
  while (remaining.length > 0 && result.length < maxLines) {
    if (remaining.length <= maxChars) {
      result.push(remaining)
      break
    }
    result.push(remaining.slice(0, maxChars))
    remaining = remaining.slice(maxChars).trim()
  }
  if (result.length === maxLines && remaining.length > 0) {
    const last = result[result.length - 1]
    result[result.length - 1] = last.slice(0, maxChars - 1) + '…'
  }
  return result
}

const FONT = "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif"
const MONO = "monospace"

function textLines(
  lines: string[],
  x: number,
  startY: number,
  lineH: number,
  fontSize: number,
  fill: string,
  extra: string = '',
): string {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${startY + i * lineH}" font-size="${fontSize}" fill="${fill}" font-family="${FONT}" ${extra}>${escapeXml(line)}</text>`,
    )
    .join('\n  ')
}

export function generateCardSvg(card: CardData, total: number, date: string): string {
  const W = 1080
  const H = 1080
  const PAD = 64

  const titleLines = wrapLines(card.title, 19, 2)
  const bodyLines = wrapLines(card.body, 23, 8)
  const highlightLines = wrapLines(card.highlight, 25, 2)

  const titleY = 180
  const titleLineH = 68
  const dividerY = titleY + titleLines.length * titleLineH + 16
  const bodyY = dividerY + 48
  const bodyLineH = 46
  const divider2Y = Math.max(bodyY + bodyLines.length * bodyLineH + 24, 770)
  const highlightY = divider2Y + 56
  const highlightLineH = 52

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#0c0c1d"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="#7c3aed"/>
  <rect x="${PAD - 18}" y="110" width="4" height="${H - 230}" fill="#7c3aed" opacity="0.25"/>
  <text x="${PAD}" y="88" font-size="22" fill="#7c3aed" font-weight="bold" font-family="${MONO}">${card.index} / ${total}</text>
  <text x="${W - PAD}" y="88" font-size="18" fill="#555555" text-anchor="end" font-family="${MONO}">${escapeXml(date)}</text>
  ${textLines(titleLines, PAD, titleY, titleLineH, 50, '#ffffff', 'font-weight="bold"')}
  <rect x="${PAD}" y="${dividerY}" width="72" height="3" fill="#7c3aed"/>
  ${textLines(bodyLines, PAD, bodyY, bodyLineH, 29, '#c4c4c4')}
  <rect x="${PAD}" y="${divider2Y}" width="${W - PAD * 2}" height="1" fill="#2d2d4a"/>
  ${textLines(highlightLines, PAD, highlightY, highlightLineH, 32, '#a78bfa', 'font-weight="bold"')}
  <text x="${W / 2}" y="${H - 28}" font-size="16" fill="#3d3d5a" text-anchor="middle" font-family="${MONO}">AI News Hub</text>
</svg>`
}
