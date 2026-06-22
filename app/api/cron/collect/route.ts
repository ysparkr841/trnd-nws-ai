import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Vercel Cron이 매시간 호출. CRON_SECRET 환경변수로 인증.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const origin = request.nextUrl.origin
  const res = await fetch(`${origin}/api/collect`, { method: 'POST' })
  const data = await res.json() as Record<string, unknown>
  return NextResponse.json({ triggered: true, ...data })
}
