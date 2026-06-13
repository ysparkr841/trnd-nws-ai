import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export interface GithubTrendingItem {
  source: 'github'
  sourceUrl: string
  repoName: string
  repoUrl: string
  content: string
  collectedAt: Date
}

export async function collectGithubTrending(): Promise<GithubTrendingItem[]> {
  const results: GithubTrendingItem[] = []
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    const { data } = await octokit.search.repos({
      q: `topic:llm created:>${since}`,
      sort: 'stars',
      order: 'desc',
      per_page: 20,
    })

    for (const repo of data.items) {
      results.push({
        source: 'github',
        sourceUrl: repo.html_url,
        repoName: repo.full_name,
        repoUrl: repo.html_url,
        content: `${repo.full_name}: ${repo.description ?? ''}`,
        collectedAt: new Date(),
      })
    }
  } catch (err) {
    console.error('GitHub Trending 수집 실패', err)
  }

  return results
}
