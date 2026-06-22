import { NextResponse } from 'next/server'
import { collectRssFeeds } from '@/lib/collector/rss'
import { collectGithubTrending } from '@/lib/collector/github'
import { collectXFeeds, XSessionExpiredError } from '@/lib/collector/x'
import { collectThreadsFeeds, ThreadsSessionExpiredError } from '@/lib/collector/threads'
import { detectGithubRepos } from '@/lib/parser/repo-detect'
import { fetchRepoDetails } from '@/lib/parser/content'
import { summarizeRepoWithOllama } from '@/lib/ai/ollama'
import { normalizeUrl, urlHash } from '@/lib/util/url'
import { appendBlockingQuestion } from '@/lib/util/state'
import { readCollectState, writeCollectState, isWithinInterval } from '@/lib/config/collect-state'
import { readSourcesConfig } from '@/lib/config/sources'
import { db } from '@/lib/db'

async function resolveRepoFields(text: string) {
  const repos = detectGithubRepos(text)
  if (!repos[0]) return { repoUrl: null, repoName: null, repoStars: null, repoLanguage: null, repoReadme: null, repoSummary: null }
  const { owner, name, url } = repos[0]
  const details = await fetchRepoDetails(owner, name)
  if (!details) return { repoUrl: url, repoName: `${owner}/${name}`, repoStars: null, repoLanguage: null, repoReadme: null, repoSummary: null }

  const repoSummary = await summarizeRepoWithOllama({
    name: `${owner}/${name}`,
    description: details.description,
    language: details.language,
    topics: details.topics,
    readme: details.readme,
  })

  return {
    repoUrl: url,
    repoName: `${owner}/${name}`,
    repoStars: details.stars,
    repoLanguage: details.language,
    repoReadme: details.readme,
    repoSummary,
  }
}

export async function POST() {
  const stats = { rss: 0, github: 0, x: 0, threads: 0, errors: [] as string[] }
  const collectState = readCollectState()
  const config = readSourcesConfig()
  const now = new Date().toISOString()

  // RSS 수집 — 주기가 지난 소스만 수집
  const dueSources = config.rss.filter(
    (s) => !isWithinInterval(collectState.rss[s.url]?.lastCollectedAt ?? null, s.intervalMinutes ?? 60)
  )
  if (dueSources.length > 0) {
    try {
      const { items: rssItems, errors: rssErrors } = await collectRssFeeds(dueSources)
      for (const source of dueSources) {
        collectState.rss[source.url] = rssErrors[source.url]
          ? { lastCollectedAt: collectState.rss[source.url]?.lastCollectedAt ?? null, lastError: rssErrors[source.url] }
          : { lastCollectedAt: now, lastError: null }
      }
      for (const item of rssItems) {
        const repoFields = await resolveRepoFields(item.content)
        const normalizedUrl = normalizeUrl(item.sourceUrl)
        const hash = urlHash(item.sourceUrl)
        try {
          await db.feed.upsert({
            where: { source_sourceUrl: { source: item.source, sourceUrl: normalizedUrl } },
            create: {
              source: item.source,
              sourceUrl: normalizedUrl,
              urlHash: hash,
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
  }

  // GitHub 수집 — 주기 체크
  const githubInterval = config.githubIntervalMinutes ?? 60
  if (!isWithinInterval(collectState.github.lastCollectedAt, githubInterval)) {
    try {
      const ghItems = await collectGithubTrending()
      collectState.github = { lastCollectedAt: now, lastError: null }
      for (const item of ghItems) {
        const normalizedUrl = normalizeUrl(item.sourceUrl)
        const hash = urlHash(item.sourceUrl)
        const repoSummary = await summarizeRepoWithOllama({
          name: item.repoName,
          description: item.repoDescription,
          language: item.repoLanguage,
          topics: item.repoTopics,
          readme: '',
        })
        try {
          await db.feed.upsert({
            where: { source_sourceUrl: { source: item.source, sourceUrl: normalizedUrl } },
            create: {
              source: item.source,
              sourceUrl: normalizedUrl,
              urlHash: hash,
              repoName: item.repoName,
              repoUrl: item.repoUrl,
              repoStars: item.repoStars,
              repoLanguage: item.repoLanguage,
              repoSummary,
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
      collectState.github = { ...collectState.github, lastError: String(err) }
      stats.errors.push(`GitHub 수집: ${String(err)}`)
    }
  }

  // X 수집
  try {
    const xItems = await collectXFeeds()
    collectState.x = { lastCollectedAt: now, lastError: null }
    for (const item of xItems) {
      const repoFields = await resolveRepoFields(item.content)
      const normalizedUrl = normalizeUrl(item.sourceUrl)
      const hash = urlHash(item.sourceUrl)
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: normalizedUrl } },
          create: {
            source: item.source,
            sourceUrl: normalizedUrl,
            urlHash: hash,
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
      collectState.x = { ...collectState.x, lastError: 'X 세션 만료' }
      stats.errors.push('X 세션 만료')
      appendBlockingQuestion(
        'X 세션이 만료되었습니다. scripts/save-x-session.ts를 실행해 세션을 갱신해주세요.',
        'X 피드 수집'
      )
    } else {
      collectState.x = { ...collectState.x, lastError: String(err) }
      stats.errors.push(`X 수집: ${String(err)}`)
    }
  }

  // Threads 수집
  try {
    const threadsItems = await collectThreadsFeeds()
    collectState.threads = { lastCollectedAt: now, lastError: null }
    for (const item of threadsItems) {
      const repoFields = await resolveRepoFields(item.content)
      const normalizedUrl = normalizeUrl(item.sourceUrl)
      const hash = urlHash(item.sourceUrl)
      try {
        await db.feed.upsert({
          where: { source_sourceUrl: { source: item.source, sourceUrl: normalizedUrl } },
          create: {
            source: item.source,
            sourceUrl: normalizedUrl,
            urlHash: hash,
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
      collectState.threads = { ...collectState.threads, lastError: 'Threads 세션 만료' }
      stats.errors.push('Threads 세션 만료')
      appendBlockingQuestion(
        'Threads 세션이 만료되었습니다. scripts/save-threads-session.ts를 실행해 세션을 갱신해주세요.',
        'Threads 피드 수집'
      )
    } else {
      collectState.threads = { ...collectState.threads, lastError: String(err) }
      stats.errors.push(`Threads 수집: ${String(err)}`)
    }
  }

  writeCollectState(collectState)

  return NextResponse.json({
    ...stats,
    total: stats.rss + stats.github + stats.x + stats.threads,
  })
}
