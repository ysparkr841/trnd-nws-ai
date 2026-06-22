import { readdir, readFile } from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import { evaluateContent, type QualityResult } from '@/lib/util/content-quality'
import { getYouTubeSearchUrl, type YouTubeVideo } from '@/lib/util/youtube'

const CONTENT_DIR = path.join(process.cwd(), 'content')

interface ContentItem {
  filename: string
  date: string
  topic: string
  quality: QualityResult | null
}

interface VideoItem {
  filename: string
  date: string
  topic: string
  videos: YouTubeVideo[]
  searchUrl: string
}

function parseFilename(filename: string): Pick<ContentItem, 'filename' | 'date' | 'topic'> {
  const base = filename.replace(/\.(md|json)$/, '')
  const match = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
  if (!match) return { filename, date: '', topic: base }
  return { filename, date: match[1], topic: match[2].replace(/-/g, ' ') }
}

async function listContent(
  subdir: 'articles' | 'scripts' | 'cards',
): Promise<ContentItem[]> {
  try {
    const dir = path.join(CONTENT_DIR, subdir)
    const files = await readdir(dir)
    const items = await Promise.all(
      files
        .filter((f) => !f.startsWith('.'))
        .map(async (filename) => {
          const base = parseFilename(filename)
          let quality: QualityResult | null = null
          try {
            const content = await readFile(path.join(dir, filename), 'utf-8')
            quality = evaluateContent(subdir, content)
          } catch {
            // ignore unreadable files
          }
          return { ...base, quality }
        }),
    )
    return items.sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

async function listVideos(): Promise<VideoItem[]> {
  try {
    const dir = path.join(CONTENT_DIR, 'videos')
    const files = await readdir(dir)
    const items = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (filename) => {
          const base = parseFilename(filename)
          let videos: YouTubeVideo[] = []
          try {
            const raw = await readFile(path.join(dir, filename), 'utf-8')
            videos = JSON.parse(raw) as YouTubeVideo[]
          } catch {
            // ignore parse errors
          }
          return {
            ...base,
            videos,
            searchUrl: getYouTubeSearchUrl(base.topic),
          }
        }),
    )
    return items.sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  B: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  C: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  D: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
}

function GradeBadge({ quality }: { quality: QualityResult | null }) {
  if (!quality) return null
  const style = GRADE_STYLE[quality.grade] ?? ''
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style}`}
      title={`통과: ${quality.passed.join(', ')}${quality.failed.length ? ` | 미통과: ${quality.failed.join(', ')}` : ''}`}
    >
      {quality.grade} ({quality.score}/4)
    </span>
  )
}

function ContentSection({
  title,
  items,
  type,
}: {
  title: string
  items: ContentItem[]
  type: string
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        {title} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">아직 생성된 콘텐츠가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.filename}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 capitalize">{item.topic}</p>
                  <GradeBadge quality={item.quality} />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.date}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {type === 'cards' && (
                  <Link
                    href={`/content/cards/${item.filename}`}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    이미지 갤러리 →
                  </Link>
                )}
                <a
                  href={`/api/content/${type}/${item.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  보기 →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function VideoSection({ items }: { items: VideoItem[] }) {
  if (items.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          관련 YouTube 영상 <span className="text-sm font-normal text-gray-400 dark:text-gray-500">(0)</span>
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          콘텐츠 파이프라인 실행 시 자동으로 관련 영상이 탐색됩니다.
        </p>
      </section>
    )
  }
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        관련 YouTube 영상{' '}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({items.length}개 주제)</span>
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.filename} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50 capitalize">{item.topic}</p>
              <a
                href={item.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-600 hover:underline shrink-0"
              >
                YouTube에서 검색 →
              </a>
            </div>
            {item.videos.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">저장된 영상 없음</p>
            ) : (
              <div className="space-y-2">
                {item.videos.map((v) => (
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                  >
                    {v.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        width={80}
                        height={45}
                        className="rounded shrink-0 object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 group-hover:text-red-600 line-clamp-2">
                        {v.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {v.channelTitle} · {v.publishedAt}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function ContentPage() {
  const [articles, scripts, cards, videoItems] = await Promise.all([
    listContent('articles'),
    listContent('scripts'),
    listContent('cards'),
    listVideos(),
  ])

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            ← 피드로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">생성 콘텐츠</h1>
          <Link
            href="/content/archive"
            className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            주간 아카이브 →
          </Link>
        </div>

        <ContentSection title="아티클" items={articles} type="articles" />
        <ContentSection title="유튜브 대본" items={scripts} type="scripts" />
        <ContentSection title="카드뉴스" items={cards} type="cards" />
        <VideoSection items={videoItems} />
      </div>
    </main>
  )
}
