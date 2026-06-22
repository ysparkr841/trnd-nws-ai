import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const LIMIT = 20
const ALLOWED_FIELDS = ['isRead', 'isBookmarked'] as const
type ToggleField = (typeof ALLOWED_FIELDS)[number]

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get('cursor')
  const source = req.nextUrl.searchParams.get('source')
  const search = req.nextUrl.searchParams.get('search')

  const where: Prisma.FeedWhereInput = {}
  if (source) where.source = source
  if (search) where.OR = [
    { content: { contains: search } },
    { repoName: { contains: search } },
  ]
  const hasWhere = !!(source || search)

  try {
    const rows = await db.feed.findMany({
      orderBy: { collectedAt: 'desc' },
      take: LIMIT + 1,
      where: hasWhere ? where : undefined,
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; field: ToggleField; value: boolean }
    const { id, field, value } = body

    if (!id || !(ALLOWED_FIELDS as readonly string[]).includes(field) || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const updated = await db.feed.update({ where: { id }, data: { [field]: value } })
    return NextResponse.json({ ok: true, id: updated.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
