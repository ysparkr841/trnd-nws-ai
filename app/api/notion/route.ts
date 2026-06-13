import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: 노션 저장
  const { feedId } = await request.json() as { feedId: string }
  if (!feedId) return NextResponse.json({ error: 'feedId 필요' }, { status: 400 })
  return NextResponse.json({ notionPageId: null, status: 'not_implemented' }, { status: 501 })
}
