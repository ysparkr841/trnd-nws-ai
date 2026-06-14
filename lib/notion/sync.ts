import { Client } from '@notionhq/client'
import { db } from '@/lib/db'

export interface NotionRepoPayload {
  repoName: string
  repoUrl: string
  summary: string
  sourceUrl: string
}

export async function saveRepoToNotion(payload: NotionRepoPayload): Promise<string | null> {
  const apiKey = process.env.NOTION_API_KEY
  const dbId = process.env.NOTION_DB_ID ?? ''
  if (!apiKey || !dbId) {
    console.warn('Notion API 키 또는 DB ID 미설정')
    return null
  }

  const notion = new Client({ auth: apiKey })
  try {
    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Name: { title: [{ text: { content: payload.repoName } }] },
        URL: { url: payload.repoUrl },
        Summary: { rich_text: [{ text: { content: payload.summary } }] },
        SourceURL: { url: payload.sourceUrl },
        SavedAt: { date: { start: new Date().toISOString() } },
      },
    })
    return page.id
  } catch (err) {
    console.error('Notion 저장 실패', err)
    return null
  }
}

export async function flushNotionQueue(): Promise<{ succeeded: number; failed: number }> {
  // notionPageId가 null이고 repoUrl이 있는 항목 = 저장 실패 큐
  const pending = await db.feed.findMany({
    where: { repoUrl: { not: null }, repoName: { not: null }, notionPageId: null },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  let succeeded = 0
  let failed = 0

  for (const feed of pending) {
    if (!feed.repoUrl || !feed.repoName) { failed++; continue }
    const notionPageId = await saveRepoToNotion({
      repoName: feed.repoName,
      repoUrl: feed.repoUrl,
      summary: feed.summary ?? feed.content.slice(0, 200),
      sourceUrl: feed.sourceUrl,
    })
    if (notionPageId) {
      await db.feed.update({ where: { id: feed.id }, data: { notionPageId } })
      succeeded++
    } else {
      failed++
    }
  }

  return { succeeded, failed }
}
