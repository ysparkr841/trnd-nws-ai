import { NextResponse } from 'next/server'
import { readCollectState } from '@/lib/config/collect-state'

export async function GET() {
  return NextResponse.json(readCollectState())
}
