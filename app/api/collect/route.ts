import { NextResponse } from 'next/server'

export async function POST() {
  // TODO: X, 스레드, RSS, GitHub 수집 트리거
  return NextResponse.json({ message: '수집 시작', status: 'not_implemented' }, { status: 501 })
}
