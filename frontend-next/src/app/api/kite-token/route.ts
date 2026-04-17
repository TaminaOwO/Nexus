import { NextRequest, NextResponse } from 'next/server'

const NEXUS_BACKEND_URL = process.env.NEXUS_BACKEND_URL
const NEXUS_API_KEY = process.env.NEXUS_API_KEY

export async function POST(request: NextRequest) {
  if (!NEXUS_BACKEND_URL) {
    return NextResponse.json({ error: 'backend not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()

    if (!body.refresh_token) {
      return NextResponse.json({ error: 'refresh_token is required' }, { status: 400 })
    }

    const res = await fetch(`${NEXUS_BACKEND_URL}/api/v1/kite/token`, {
      method: 'POST',
      headers: {
        'X-API-Key': NEXUS_API_KEY ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: body.refresh_token }),
      signal: AbortSignal.timeout(15_000),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'failed to update token' }, { status: 502 })
  }
}
