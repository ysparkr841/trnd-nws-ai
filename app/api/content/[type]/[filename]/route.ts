import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const ALLOWED_TYPES = new Set(['articles', 'scripts', 'cards'])

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; filename: string } }
) {
  const { type, filename } = params

  if (!ALLOWED_TYPES.has(type) || !/^[\w.-]+$/.test(filename)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const content = await readFile(path.join(CONTENT_DIR, type, filename), 'utf-8')
    const isJson = filename.endsWith('.json')
    return new NextResponse(content, {
      headers: {
        'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
