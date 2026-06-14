import { NextRequest, NextResponse } from 'next/server'
import { saveRepoToNotion, flushNotionQueue } from '@/lib/notion/sync'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { feedId } = await request.json() as { feedId: string }
  if (!feedId) return NextResponse.json({ error: 'feedId 필요' }, { status: 400 })

  const feed = await db.feed.findUnique({ where: { id: feedId } })
  if (!feed) return NextResponse.json({ error: 'Feed 없음' }, { status: 404 })
  if (!feed.repoUrl || !feed.repoName) {
    return NextResponse.json({ error: '레포 정보 없음' }, { status: 400 })
  }

  const notionPageId = await saveRepoToNotion({
    repoName: feed.repoName,
    repoUrl: feed.repoUrl,
    summary: feed.summary ?? feed.content.slice(0, 200),
    sourceUrl: feed.sourceUrl,
  })

  if (notionPageId) {
    await db.feed.update({ where: { id: feedId }, data: { notionPageId } })
  }

  return NextResponse.json({ notionPageId })
}

export async function PATCH() {
  const result = await flushNotionQueue()
  return NextResponse.json(result)
}
