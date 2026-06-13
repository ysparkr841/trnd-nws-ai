import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DB_ID = process.env.NOTION_DB_ID ?? ''

export interface NotionRepoPayload {
  repoName: string
  repoUrl: string
  summary: string
  sourceUrl: string
}

export async function saveRepoToNotion(payload: NotionRepoPayload): Promise<string | null> {
  if (!process.env.NOTION_API_KEY || !DB_ID) {
    console.warn('Notion API 키 또는 DB ID 미설정')
    return null
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
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
