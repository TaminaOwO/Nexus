import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // 驗證 GitHub Webhook signature
  const signature = request.headers.get('x-hub-signature-256')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const body = await request.text()
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 觸發所有 HQ 相關快取重新驗證
  revalidateTag('hq-github', 'default')
  revalidateTag('hq-manifest', 'default')
  revalidateTag('hq-inbox', 'default')
  revalidateTag('hq-catlab', 'default')
  revalidateTag('hq-task-state', 'default')

  return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() })
}
