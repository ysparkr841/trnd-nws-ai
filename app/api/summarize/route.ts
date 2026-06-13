import { NextRequest, NextResponse } from 'next/server'
import { summarizeWithOllama } from '@/lib/ai/ollama'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json() as { text?: string; feedId?: string }

  if (!body.text && !body.feedId) {
    return NextResponse.json({ error: 'text 또는 feedId 필요' }, { status: 400 })
  }

  let content = body.text ?? ''

  if (body.feedId) {
    const feed = await db.feed.findUnique({ where: { id: body.feedId } })
    if (!feed) return NextResponse.json({ error: 'Feed 없음' }, { status: 404 })
    content = feed.content
  }

  const summary = await summarizeWithOllama(content)

  if (body.feedId) {
    await db.feed.update({ where: { id: body.feedId }, data: { summary } })
  }

  return NextResponse.json({ summary })
}
