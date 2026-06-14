export interface DetectedRepo {
  url: string
  owner: string
  name: string
}

export function detectGithubRepos(text: string): DetectedRepo[] {
  // 모듈 레벨 /g 정규식은 lastIndex가 누적되어 다음 호출에서 오동작하므로 함수 내부에 생성
  const regex = /https?:\/\/github\.com\/([^/\s]+\/[^/\s]+)/g
  const matches: DetectedRepo[] = []
  const seen = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const parts = match[1].split('/')
    const owner = parts[0]
    const name = parts[1]
    if (!owner || !name) continue
    const url = `https://github.com/${owner}/${name}`
    if (!seen.has(url)) {
      seen.add(url)
      matches.push({ url, owner, name })
    }
  }

  return matches
}
