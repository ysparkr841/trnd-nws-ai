/**
 * @jest-environment node
 */
jest.mock('next/server', () => {
  class MockNextResponse {
    body: unknown
    headers: Record<string, string>
    status: number
    constructor(body: unknown, init?: { headers?: Record<string, string>; status?: number }) {
      this.body = body
      this.headers = init?.headers ?? {}
      this.status = init?.status ?? 200
    }
    static json(body: unknown, init?: { status?: number }) {
      return {
        json: () => Promise.resolve(body),
        status: init?.status ?? 200,
      }
    }
  }
  return { NextRequest: jest.fn(), NextResponse: MockNextResponse }
})

import { GET } from '../../app/api/cards/[filename]/[index]/route'

function makeParams(filename: string, index: string) {
  return { params: { filename, index } } as never
}

describe('GET /api/cards/[filename]/[index] — 가드 조건', () => {
  it('경로 순회(..) 포함 filename이면 400', async () => {
    const res = await GET({} as never, makeParams('..subfolder.json', '1'))
    expect(res.status).toBe(400)
  })

  it('슬래시(/) 포함 filename이면 400', async () => {
    const res = await GET({} as never, makeParams('sub/file.json', '1'))
    expect(res.status).toBe(400)
  })

  it('백슬래시(\\) 포함 filename이면 400', async () => {
    const res = await GET({} as never, makeParams('sub\\file.json', '1'))
    expect(res.status).toBe(400)
  })

  it('.json 확장자가 아니면 400', async () => {
    const res = await GET({} as never, makeParams('2026-06-23-topic.md', '1'))
    expect(res.status).toBe(400)
  })

  it('숫자가 아닌 index이면 400', async () => {
    const res = await GET({} as never, makeParams('2026-06-23-topic.json', 'abc'))
    expect(res.status).toBe(400)
  })

  it('index가 0 이하이면 400', async () => {
    const res = await GET({} as never, makeParams('2026-06-23-topic.json', '0'))
    expect(res.status).toBe(400)
  })

  it('존재하지 않는 파일이면 404', async () => {
    // 실제 fs → ENOENT → catch → 404
    const res = await GET({} as never, makeParams('nonexistent-xyz-99999.json', '1'))
    expect(res.status).toBe(404)
  })
})
