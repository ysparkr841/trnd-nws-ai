import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  // content/ 파일시스템에서 생성된 콘텐츠 목록 조회
  const contentDir = path.join(process.cwd(), 'content')
  try {
    const [articles, scripts, cards] = await Promise.all([
      readdir(path.join(contentDir, 'articles')).catch(() => [] as string[]),
      readdir(path.join(contentDir, 'scripts')).catch(() => [] as string[]),
      readdir(path.join(contentDir, 'cards')).catch(() => [] as string[]),
    ])
    return NextResponse.json({ articles, scripts, cards })
  } catch {
    return NextResponse.json({ articles: [], scripts: [], cards: [] })
  }
}
