import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const LIMIT = 20

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get('cursor')

  try {
    const rows = await db.feed.findMany({
      orderBy: { collectedAt: 'desc' },
      take: LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = rows.length > LIMIT
    const items = hasMore ? rows.slice(0, LIMIT) : rows

    return NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
