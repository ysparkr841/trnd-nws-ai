import { NextResponse } from 'next/server'
import { collectRssFeeds } from '@/lib/collector/rss'
import { collectGithubTrending } from '@/lib/collector/github'
import { detectGithubRepos } from '@/lib/parser/repo-detect'
import { db } from '@/lib/db'

export async function POST() {
  const stats = { rss: 0, github: 0, errors: [] as string[] }

  try {
    const rssItems = await collectRssFeeds()
    for (const item of rssItems) {
      const repos = detectGithubRepos(item.content)
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: item.sourceUrl } },
          create: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            authorName: item.authorName,
            content: item.content,
            repoUrl: repos[0]?.url ?? null,
            repoName: repos[0] ? `${repos[0].owner}/${repos[0].name}` : null,
            collectedAt: item.collectedAt,
          },
          update: {},
        })
        stats.rss++
      } catch (err) {
        console.error('RSS 피드 저장 실패', err)
      }
    }
  } catch (err) {
    stats.errors.push(`RSS 수집: ${String(err)}`)
  }

  try {
    const ghItems = await collectGithubTrending()
    for (const item of ghItems) {
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: item.sourceUrl } },
          create: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            repoName: item.repoName,
            repoUrl: item.repoUrl,
            content: item.content,
            collectedAt: item.collectedAt,
          },
          update: {},
        })
        stats.github++
      } catch (err) {
        console.error('GitHub 피드 저장 실패', err)
      }
    }
  } catch (err) {
    stats.errors.push(`GitHub 수집: ${String(err)}`)
  }

  return NextResponse.json({ ...stats, total: stats.rss + stats.github })
}
