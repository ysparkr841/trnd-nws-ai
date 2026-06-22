/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/cron/collect/route'

describe('GET /api/cron/collect', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-xyz'
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ total: 5, rss: 3, github: 2, x: 0, threads: 0, errors: [] }),
    } as unknown as Response)
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
    jest.restoreAllMocks()
  })

  it('Authorization 헤더 없으면 401 반환', async () => {
    const req = new NextRequest('http://localhost/api/cron/collect')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('잘못된 시크릿이면 401 반환', async () => {
    const req = new NextRequest('http://localhost/api/cron/collect', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('올바른 시크릿이면 200 + 수집 트리거', async () => {
    const req = new NextRequest('http://localhost/api/cron/collect', {
      headers: { authorization: 'Bearer test-secret-xyz' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.triggered).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost/api/collect',
      { method: 'POST' }
    )
  })

  it('CRON_SECRET 미설정 시 401 반환', async () => {
    delete process.env.CRON_SECRET
    const req = new NextRequest('http://localhost/api/cron/collect', {
      headers: { authorization: 'Bearer undefined' },
    })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
