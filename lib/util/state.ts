import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const STATE_PATH = join(process.cwd(), '.claude', 'STATE.md')

export function appendBlockingQuestion(question: string, task: string): void {
  try {
    const content = readFileSync(STATE_PATH, 'utf-8')
    if (content.includes('## 블로킹 질문')) return
    const addition = `\n## 블로킹 질문\n- 질문 내용: ${question}\n- 관련 작업: ${task}\n- 답변란: \n`
    writeFileSync(STATE_PATH, content + addition, 'utf-8')
  } catch (err) {
    console.error('STATE.md 블로킹 질문 기록 실패:', err)
  }
}
