import { createHash } from 'crypto'

const TRACKING_PARAMS = /^utm_|^fbclid|^gclid|^ref$|^source$/

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    const toDelete: string[] = []
    u.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.test(key)) toDelete.push(key)
    })
    toDelete.forEach(key => u.searchParams.delete(key))
    u.protocol = 'https:'
    u.hash = ''
    let result = u.toString().toLowerCase()
    if (result.endsWith('/')) result = result.slice(0, -1)
    return result
  } catch {
    return raw.toLowerCase().replace(/\/$/, '')
  }
}

export function urlHash(url: string): string {
  return createHash('sha256').update(normalizeUrl(url)).digest('hex').slice(0, 16)
}
