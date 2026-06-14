import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'content')

interface ContentItem {
  filename: string
  date: string
  topic: string
}

function parseFilename(filename: string): ContentItem {
  const base = filename.replace(/\.(md|json)$/, '')
  const match = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
  if (!match) return { filename, date: '', topic: base }
  return { filename, date: match[1], topic: match[2].replace(/-/g, ' ') }
}

async function listDir(subdir: string): Promise<ContentItem[]> {
  try {
    const files = await readdir(path.join(CONTENT_DIR, subdir))
    return files
      .filter((f) => !f.startsWith('.'))
      .map(parseFilename)
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export async function GET() {
  const [articles, scripts, cards] = await Promise.all([
    listDir('articles'),
    listDir('scripts'),
    listDir('cards'),
  ])
  return NextResponse.json({ articles, scripts, cards })
}
