import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

export interface SourceState {
  lastCollectedAt: string | null
  lastError: string | null
}

export interface CollectState {
  rss: Record<string, SourceState>
  github: SourceState
  x: SourceState
  threads: SourceState
}

const STATE_PATH = path.join(process.cwd(), 'config', 'collect-state.json')

const EMPTY: SourceState = { lastCollectedAt: null, lastError: null }

export function readCollectState(): CollectState {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as CollectState
  } catch {
    return { rss: {}, github: { ...EMPTY }, x: { ...EMPTY }, threads: { ...EMPTY } }
  }
}

export function writeCollectState(state: CollectState): void {
  mkdirSync(path.dirname(STATE_PATH), { recursive: true })
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8')
}

export function isWithinInterval(lastCollectedAt: string | null, intervalMinutes: number): boolean {
  if (!lastCollectedAt) return false
  return Date.now() - new Date(lastCollectedAt).getTime() < intervalMinutes * 60 * 1000
}
