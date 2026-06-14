export interface FeedItem {
  id: string
  source: string
  sourceUrl: string
  authorName: string | null
  authorHandle: string | null
  content: string
  summary: string | null
  urlHash: string | null
  repoUrl: string | null
  repoName: string | null
  repoStars: number | null
  repoLanguage: string | null
  repoSummary: string | null
  notionPageId: string | null
  isRead: boolean
  isBookmarked: boolean
  collectedAt: Date
  createdAt: Date
}
