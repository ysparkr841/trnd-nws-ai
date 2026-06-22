import { readdir } from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import { getWeekLabel } from '@/lib/util/week'

const CONTENT_DIR = path.join(process.cwd(), 'content')

interface ContentPackage {
  key: string
  date: string
  topic: string
  displayTopic: string
  articleFile?: string
  scriptFile?: string
  cardFile?: string
}

interface WeekGroup {
  weekKey: string
  weekLabel: string
  packages: ContentPackage[]
}

function parseFilename(filename: string) {
  const base = filename.replace(/\.(md|json)$/, '')
  const match = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
  if (!match) return null
  return { date: match[1], topic: match[2], filename }
}

async function buildArchive(): Promise<WeekGroup[]> {
  const [articleFiles, scriptFiles, cardFiles] = await Promise.all([
    readdir(path.join(CONTENT_DIR, 'articles')).catch(() => [] as string[]),
    readdir(path.join(CONTENT_DIR, 'scripts')).catch(() => [] as string[]),
    readdir(path.join(CONTENT_DIR, 'cards')).catch(() => [] as string[]),
  ])

  const packages = new Map<string, ContentPackage>()

  function upsert(subdir: 'articleFile' | 'scriptFile' | 'cardFile', files: string[]) {
    for (const f of files.filter((f) => !f.startsWith('.'))) {
      const parsed = parseFilename(f)
      if (!parsed) continue
      const key = `${parsed.date}-${parsed.topic}`
      const existing = packages.get(key) ?? {
        key,
        date: parsed.date,
        topic: parsed.topic,
        displayTopic: parsed.topic.replace(/-/g, ' '),
      }
      packages.set(key, { ...existing, [subdir]: f })
    }
  }

  upsert('articleFile', articleFiles)
  upsert('scriptFile', scriptFiles)
  upsert('cardFile', cardFiles)

  const weekMap = new Map<string, WeekGroup>()
  for (const pkg of Array.from(packages.values()).sort((a, b) => b.date.localeCompare(a.date))) {
    const { weekKey, weekLabel } = getWeekLabel(pkg.date)
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { weekKey, weekLabel, packages: [] })
    }
    weekMap.get(weekKey)!.packages.push(pkg)
  }

  return Array.from(weekMap.values()).sort((a, b) => b.weekKey.localeCompare(a.weekKey))
}

function PackageCard({ pkg }: { pkg: ContentPackage }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">{pkg.displayTopic}</p>
          <p className="text-xs text-gray-400 mt-0.5">{pkg.date}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {pkg.articleFile && (
            <a
              href={`/api/content/articles/${pkg.articleFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded"
            >
              아티클
            </a>
          )}
          {pkg.scriptFile && (
            <a
              href={`/api/content/scripts/${pkg.scriptFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded"
            >
              대본
            </a>
          )}
          {pkg.cardFile && (
            <a
              href={`/api/content/cards/${pkg.cardFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded"
            >
              카드뉴스
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function ArchivePage() {
  const weeks = await buildArchive()
  const totalTopics = weeks.reduce((sum, w) => sum + w.packages.length, 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/content" className="text-sm text-gray-500 hover:text-gray-700">
            ← 콘텐츠
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">주간 아카이브</h1>
        </div>
        <p className="text-sm text-gray-400 mb-8">
          {weeks.length}주 · {totalTopics}개 주제
        </p>

        {weeks.length === 0 ? (
          <p className="text-sm text-gray-400">아직 생성된 콘텐츠가 없습니다.</p>
        ) : (
          <div className="space-y-8">
            {weeks.map((week) => (
              <section key={week.weekKey}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  {week.weekLabel}
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {week.packages.length}개 주제
                  </span>
                </h2>
                <div className="space-y-3">
                  {week.packages.map((pkg) => (
                    <PackageCard key={pkg.key} pkg={pkg} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
