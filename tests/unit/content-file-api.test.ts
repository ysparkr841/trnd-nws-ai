/**
 * @jest-environment node
 */
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: () => Promise.resolve(body),
      status: init?.status ?? 200,
    }),
  },
}))

import { GET } from '../../app/api/content/[type]/[filename]/route'

type RouteParams = Parameters<typeof GET>[1]

function makeParams(type: string, filename: string): RouteParams {
  return { params: { type, filename } }
}

describe('GET /api/content/[type]/[filename] — guard 조건', () => {
  it('허용되지 않은 type이면 404', async () => {
    const res = await GET({} as never, makeParams('invalid', 'test.md'))
    expect(res.status).toBe(404)
  })

  it('경로 순회 문자(..) 포함 filename이면 404', async () => {
    const res = await GET({} as never, makeParams('articles', '../secret.md'))
    expect(res.status).toBe(404)
  })

  it('슬래시(/) 포함 filename이면 404', async () => {
    const res = await GET({} as never, makeParams('scripts', 'sub/file.md'))
    expect(res.status).toBe(404)
  })

  it('백슬래시(\\) 포함 filename이면 404', async () => {
    const res = await GET({} as never, makeParams('cards', 'sub\\file.md'))
    expect(res.status).toBe(404)
  })

  it('존재하지 않는 파일이면 404', async () => {
    // 실제 파일 시스템 → 존재하지 않는 경로 → ENOENT → catch → 404
    const res = await GET({} as never, makeParams('articles', 'nonexistent-file-xyz.md'))
    expect(res.status).toBe(404)
  })
})
