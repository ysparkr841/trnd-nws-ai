import { readFile } from 'fs/promises'
import path from 'path'
import Link from 'next/link'

interface CardData {
  index: number
  title: string
  body: string
  highlight: string
}

interface CardsFile {
  topic: string
  date: string
  cards: CardData[]
}

export default async function CardGalleryPage({
  params,
}: {
  params: Promise<{ filename: string }>
}) {
  const { filename } = await params

  if (/[./\\]/.test(filename) || !filename.endsWith('.json')) {
    return (
      <main className="p-8 text-red-500">잘못된 요청입니다.</main>
    )
  }

  let data: CardsFile
  try {
    const filepath = path.join(process.cwd(), 'content', 'cards', filename)
    const raw = await readFile(filepath, 'utf-8')
    data = JSON.parse(raw)
  } catch {
    return (
      <main className="p-8 text-red-500">카드뉴스를 찾을 수 없습니다.</main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/content"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← 콘텐츠 목록
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{data.topic}</h1>
        <p className="text-sm text-gray-400 mb-8">
          {data.date} · 카드뉴스 {data.cards.length}장
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.cards.map((card) => (
            <div
              key={card.index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <a
                href={`/api/cards/${filename}/${card.index}`}
                target="_blank"
                rel="noopener noreferrer"
                title="클릭하면 SVG 이미지가 열립니다"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/cards/${filename}/${card.index}`}
                  alt={card.title}
                  className="w-full aspect-square object-contain bg-gray-900"
                  loading="lazy"
                />
              </a>
              <div className="p-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  {card.index} / {data.cards.length}
                </p>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{card.title}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 italic">{card.highlight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
