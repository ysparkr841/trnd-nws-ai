import { NextResponse } from 'next/server'
import { collectRssFeeds } from '@/lib/collector/rss'
import { collectGithubTrending } from '@/lib/collector/github'
import { collectXFeeds, XSessionExpiredError } from '@/lib/collector/x'
import { collectThreadsFeeds, ThreadsSessionExpiredError } from '@/lib/collector/threads'
import { detectGithubRepos } from '@/lib/parser/repo-detect'
import { fetchRepoDetails } from '@/lib/parser/content'
import { db } from '@/lib/db'

async function resolveRepoFields(text: string) {
  const repos = detectGithubRepos(text)
  if (!repos[0]) return { repoUrl: null, repoName: null, repoStars: null, repoLanguage: null, repoReadme: null }
  const { owner, name, url } = repos[0]
  const details = await fetchRepoDetails(owner, name)
  return {
    repoUrl: url,
    repoName: `${owner}/${name}`,
    repoStars: details?.stars ?? null,
    repoLanguage: details?.language ?? null,
    repoReadme: details?.readme ?? null,
  }
}

export async function POST() {
  const stats = { rss: 0, github: 0, x: 0, threads: 0, errors: [] as string[] }

  // RSS 수집
  try {
    const rssItems = await collectRssFeeds()
    for (const item of rssItems) {
      const repoFields = await resolveRepoFields(item.content)
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: item.sourceUrl } },
          create: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            authorName: item.authorName,
            content: item.content,
            collectedAt: item.collectedAt,
            ...repoFields,
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

  // GitHub 수집
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

  // X 수집
  try {
    const xItems = await collectXFeeds()
    for (const item of xItems) {
      const repoFields = await resolveRepoFields(item.content)
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: item.sourceUrl } },
          create: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            authorName: item.authorName,
            authorHandle: item.authorHandle,
            content: item.content,
            collectedAt: item.collectedAt,
            ...repoFields,
          },
          update: {},
        })
        stats.x++
      } catch (err) {
        console.error('X 피드 저장 실패', err)
      }
    }
  } catch (err) {
    if (err instanceof XSessionExpiredError) {
      stats.errors.push('X 세션 만료')
    } else {
      stats.errors.push(`X 수집: ${String(err)}`)
    }
  }

  // Threads 수집
  try {
    const threadsItems = await collectThreadsFeeds()
    for (const item of threadsItems) {
      const repoFields = await resolveRepoFields(item.content)
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: item.sourceUrl } },
          create: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            authorName: item.authorName,
            authorHandle: item.authorHandle,
            content: item.content,
            collectedAt: item.collectedAt,
            ...repoFields,
          },
          update: {},
        })
        stats.threads++
      } catch (err) {
        console.error('Threads 피드 저장 실패', err)
      }
    }
  } catch (err) {
    if (err instanceof ThreadsSessionExpiredError) {
      stats.errors.push('Threads 세션 만료')
    } else {
      stats.errors.push(`Threads 수집: ${String(err)}`)
    }
  }

  return NextResponse.json({
    ...stats,
    total: stats.rss + stats.github + stats.x + stats.threads,
  })
}
