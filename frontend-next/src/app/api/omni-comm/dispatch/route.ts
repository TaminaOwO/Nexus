import { NextResponse } from 'next/server'
import { createOrUpdateFile } from '@/lib/github'

/** Hashtag → HQ repo path mapping */
const HASHTAG_PATHS: Record<string, string> = {
  '#req': 'Dev/Architect-Office/inbox/',
  '#prop': 'Dev/Architect-Office/inbox/',
  '#note': 'Context/notes/',
}

function generateFilename(hashtag: string): string {
  const now = new Date()
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const tag = hashtag.replace('#', '').toUpperCase()
  return `${tag}_omni-comm_${ts}.md`
}

function generateMarkdown(hashtag: string, content: string): string {
  const now = new Date().toISOString()
  return [
    '---',
    `date: "${now}"`,
    `source: "omni-comm"`,
    `hashtag: "${hashtag}"`,
    '---',
    '',
    content,
    '',
  ].join('\n')
}

export async function POST(request: Request): Promise<NextResponse> {
  // AC-6: Check GITHUB_PAT
  if (!process.env.GITHUB_PAT) {
    return NextResponse.json(
      { error: 'GITHUB_PAT is not configured' },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { hashtag, content } = body as { hashtag?: string; content?: string }

    // Validation
    if (!hashtag || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: hashtag, content' },
        { status: 400 },
      )
    }

    const basePath = HASHTAG_PATHS[hashtag]
    if (!basePath) {
      return NextResponse.json(
        { error: `Unknown hashtag: ${hashtag}` },
        { status: 400 },
      )
    }

    // Generate file
    const filename = generateFilename(hashtag)
    const filePath = `${basePath}${filename}`
    const markdown = generateMarkdown(hashtag, content)

    // Write to GitHub
    const result = await createOrUpdateFile(filePath, markdown, `omni-comm: ${hashtag} dispatch`)

    return NextResponse.json({
      success: true,
      path: filePath,
      sha: result.sha,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Dispatch failed: ${message}` },
      { status: 500 },
    )
  }
}
