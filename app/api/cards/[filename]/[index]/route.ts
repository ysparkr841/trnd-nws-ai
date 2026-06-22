import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { generateCardSvg, type CardData } from '@/lib/util/card-svg'

interface CardsFile {
  topic: string
  date: string
  cards: CardData[]
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string; index: string }> },
) {
  const { filename, index: indexStr } = await params

  if (/\.\.|[/\\]/.test(filename) || !filename.endsWith('.json')) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 })
  }

  const cardIndex = parseInt(indexStr, 10)
  if (isNaN(cardIndex) || cardIndex < 1) {
    return NextResponse.json({ error: 'invalid index' }, { status: 400 })
  }

  try {
    const filepath = path.join(process.cwd(), 'content', 'cards', filename)
    const raw = await readFile(filepath, 'utf-8')
    const data: CardsFile = JSON.parse(raw)

    const card = data.cards.find((c) => c.index === cardIndex)
    if (!card) {
      return NextResponse.json({ error: 'card not found' }, { status: 404 })
    }

    const svg = generateCardSvg(card, data.cards.length, data.date)

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
