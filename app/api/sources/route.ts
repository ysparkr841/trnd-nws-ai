import { NextRequest, NextResponse } from 'next/server'
import { readSourcesConfig, writeSourcesConfig } from '@/lib/config/sources'

export async function GET() {
  return NextResponse.json(readSourcesConfig())
}

export async function POST(req: NextRequest) {
  const body: { type: string; name?: string; url?: string; topic?: string } = await req.json()
  const config = readSourcesConfig()

  if (body.type === 'rss') {
    if (!body.name || !body.url) {
      return NextResponse.json({ error: 'name과 url 필수' }, { status: 400 })
    }
    if (config.rss.some((s) => s.url === body.url)) {
      return NextResponse.json({ error: '이미 존재하는 URL' }, { status: 409 })
    }
    config.rss.push({ name: body.name, url: body.url })
  } else if (body.type === 'github') {
    if (!body.topic) {
      return NextResponse.json({ error: 'topic 필수' }, { status: 400 })
    }
    if (config.githubTopics.includes(body.topic)) {
      return NextResponse.json({ error: '이미 존재하는 토픽' }, { status: 409 })
    }
    config.githubTopics.push(body.topic)
  } else {
    return NextResponse.json({ error: 'type은 rss 또는 github' }, { status: 400 })
  }

  writeSourcesConfig(config)
  return NextResponse.json(config)
}

export async function PATCH(req: NextRequest) {
  const body: { type: 'rss' | 'github'; url?: string; intervalMinutes: number } = await req.json()
  const config = readSourcesConfig()

  if (body.type === 'rss') {
    if (!body.url) return NextResponse.json({ error: 'url 필수' }, { status: 400 })
    const source = config.rss.find((s) => s.url === body.url)
    if (!source) return NextResponse.json({ error: '소스 없음' }, { status: 404 })
    source.intervalMinutes = body.intervalMinutes
  } else if (body.type === 'github') {
    config.githubIntervalMinutes = body.intervalMinutes
  } else {
    return NextResponse.json({ error: 'type은 rss 또는 github' }, { status: 400 })
  }

  writeSourcesConfig(config)
  return NextResponse.json(config)
}

export async function DELETE(req: NextRequest) {
  const body: { type: string; url?: string; topic?: string } = await req.json()
  const config = readSourcesConfig()

  if (body.type === 'rss') {
    config.rss = config.rss.filter((s) => s.url !== body.url)
  } else if (body.type === 'github') {
    config.githubTopics = config.githubTopics.filter((t) => t !== body.topic)
  } else {
    return NextResponse.json({ error: 'type은 rss 또는 github' }, { status: 400 })
  }

  writeSourcesConfig(config)
  return NextResponse.json(config)
}
