// X 세션 저장 — 최초 1회 수동 실행
// npx ts-node scripts/save-x-session.ts
import { chromium } from 'playwright'
import path from 'path'
import { mkdirSync } from 'fs'

const SESSION_DIR = path.join(process.cwd(), '.claude', 'browser-sessions')
const SESSION_PATH = path.join(SESSION_DIR, 'x-session.json')

async function main() {
  mkdirSync(SESSION_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('브라우저가 열립니다. X(Twitter)에 로그인 후 Enter를 누르세요.')
  await page.goto('https://twitter.com/login')

  // 사용자가 수동으로 로그인할 때까지 대기
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve())
  })

  await context.storageState({ path: SESSION_PATH })
  console.log(`세션 저장 완료: ${SESSION_PATH}`)
  await browser.close()
  process.exit(0)
}

main().catch(console.error)
