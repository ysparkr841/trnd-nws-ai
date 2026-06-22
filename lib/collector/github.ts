import { Octokit } from '@octokit/rest'
import { readSourcesConfig } from '@/lib/config/sources'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export interface GithubTrendingItem {
  source: 'github'
  sourceUrl: string
  repoName: string
  repoUrl: string
  content: string
  collectedAt: Date
  repoStars: number
  repoLanguage: string | null
  repoDescription: string | null
  repoTopics: string[]
}

export async function collectGithubTrending(): Promise<GithubTrendingItem[]> {
  const results: GithubTrendingItem[] = []
  const seen = new Set<string>()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { githubTopics: GITHUB_TRENDING_TOPICS } = readSourcesConfig()

  for (const topic of GITHUB_TRENDING_TOPICS) {
    try {
      const { data } = await octokit.search.repos({
        q: `topic:${topic} created:>${since}`,
        sort: 'stars',
        order: 'desc',
        per_page: 10,
      })

      for (const repo of data.items) {
        if (seen.has(repo.html_url)) continue
        seen.add(repo.html_url)
        results.push({
          source: 'github',
          sourceUrl: repo.html_url,
          repoName: repo.full_name,
          repoUrl: repo.html_url,
          content: `${repo.full_name}: ${repo.description ?? '설명 없음'}`,
          collectedAt: new Date(),
          repoStars: repo.stargazers_count,
          repoLanguage: repo.language ?? null,
          repoDescription: repo.description ?? null,
          repoTopics: repo.topics ?? [],
        })
      }
    } catch (err) {
      console.error(`GitHub Trending 수집 실패 (topic: ${topic})`, err)
    }
  }

  return results
}
