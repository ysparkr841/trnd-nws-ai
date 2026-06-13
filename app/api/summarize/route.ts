import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: Ollama llama3.2:3b 요약
  const { text } = await request.json() as { text: string }
  if (!text) return NextResponse.json({ error: 'text 필요' }, { status: 400 })
  return NextResponse.json({ summary: null, status: 'not_implemented' }, { status: 501 })
}
