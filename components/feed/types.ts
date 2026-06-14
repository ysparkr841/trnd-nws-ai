export interface FeedItem {
  id: string
  source: string
  sourceUrl: string
  authorName: string | null
  authorHandle: string | null
  content: string
  summary: string | null
  repoUrl: string | null
  repoName: string | null
  notionPageId: string | null
  collectedAt: Date
  createdAt: Date
}
