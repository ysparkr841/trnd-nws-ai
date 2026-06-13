const GITHUB_URL_PATTERN = /https?:\/\/github\.com\/([^/\s]+\/[^/\s]+)/g

export interface DetectedRepo {
  url: string
  owner: string
  name: string
}

export function detectGithubRepos(text: string): DetectedRepo[] {
  const matches: DetectedRepo[] = []
  const seen = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = GITHUB_URL_PATTERN.exec(text)) !== null) {
    const [owner, name] = match[1].split('/')
    const url = `https://github.com/${owner}/${name}`
    if (!seen.has(url)) {
      seen.add(url)
      matches.push({ url, owner, name })
    }
  }

  return matches
}
