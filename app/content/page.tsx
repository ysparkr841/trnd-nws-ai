import { readdir } from 'fs/promises'
import path from 'path'
import Link from 'next/link'

const CONTENT_DIR = path.join(process.cwd(), 'content')

interface ContentItem {
  filename: string
  date: string
  topic: string
}

function parseFilename(filename: string): ContentItem {
  const base = filename.replace(/\.(md|json)$/, '')
  const match = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
  if (!match) return { filename, date: '', topic: base }
  return { filename, date: match[1], topic: match[2].replace(/-/g, ' ') }
}

async function listContent(subdir: string): Promise<ContentItem[]> {
  try {
    const files = await readdir(path.join(CONTENT_DIR, subdir))
    return files
      .filter((f) => !f.startsWith('.'))
      .map(parseFilename)
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
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
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {title} <span className="text-sm font-normal text-gray-400">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">아직 생성된 콘텐츠가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.filename}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{item.topic}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
              </div>
              <a
                href={`/api/content/${type}/${item.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                보기 →
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default async function ContentPage() {
  const [articles, scripts, cards] = await Promise.all([
    listContent('articles'),
    listContent('scripts'),
    listContent('cards'),
  ])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← 피드로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">생성 콘텐츠</h1>
          <Link
            href="/content/archive"
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            주간 아카이브 →
          </Link>
        </div>

        <ContentSection title="아티클" items={articles} type="articles" />
        <ContentSection title="유튜브 대본" items={scripts} type="scripts" />
        <ContentSection title="카드뉴스" items={cards} type="cards" />
      </div>
    </main>
  )
}
