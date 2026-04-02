import { NextRequest, NextResponse } from 'next/server'

const NEXUS_BACKEND_URL = process.env.NEXUS_BACKEND_URL
const NEXUS_API_KEY = process.env.NEXUS_API_KEY

export async function GET(request: NextRequest) {
  const strategyId = request.nextUrl.searchParams.get('strategy_id')
  if (!strategyId) {
    return NextResponse.json({ error: 'strategy_id is required' }, { status: 400 })
  }

  if (!NEXUS_BACKEND_URL) {
    return NextResponse.json({ error: 'backend not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${NEXUS_BACKEND_URL}/api/v1/kite/strategy/indicators?strategy_id=${encodeURIComponent(strategyId)}`,
      {
        headers: { 'X-API-Key': NEXUS_API_KEY ?? '' },
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: `backend error: ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'failed to fetch indicators' }, { status: 502 })
  }
}
