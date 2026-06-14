import { Octokit } from '@octokit/rest'

export interface RepoDetails {
  stars: number
  language: string | null
  description: string | null
  topics: string[]
  readme: string
}

export async function fetchRepoDetails(
  owner: string,
  name: string
): Promise<RepoDetails | null> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  try {
    const [repoRes, readmeRes] = await Promise.allSettled([
      octokit.repos.get({ owner, repo: name }),
      octokit.repos.getReadme({ owner, repo: name }),
    ])

    if (repoRes.status === 'rejected') return null

    const repo = repoRes.value.data
    let readme = ''

    if (readmeRes.status === 'fulfilled') {
      const raw = Buffer.from(readmeRes.value.data.content, 'base64').toString('utf-8')
      readme = raw.slice(0, 800).replace(/\r\n/g, '\n')
    }

    return {
      stars: repo.stargazers_count,
      language: repo.language ?? null,
      description: repo.description ?? null,
      topics: repo.topics ?? [],
      readme,
    }
  } catch (err) {
    console.error(`레포 상세 수집 실패 (${owner}/${name})`, err)
    return null
  }
}
