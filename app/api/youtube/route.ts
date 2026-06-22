import { NextRequest, NextResponse } from 'next/server'
import { searchRelatedVideos, getYouTubeSearchUrl } from '@/lib/util/youtube'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const max = Math.min(Number(req.nextUrl.searchParams.get('max') ?? '3'), 10)

  if (!q.trim()) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 })
  }

  try {
    const videos = await searchRelatedVideos(q, max)
    return NextResponse.json({
      videos,
      searchUrl: getYouTubeSearchUrl(q),
      hasApiKey: !!process.env.YOUTUBE_API_KEY,
    })
  } catch {
    return NextResponse.json(
      { videos: [], searchUrl: getYouTubeSearchUrl(q), hasApiKey: false },
      { status: 200 },
    )
  }
}
