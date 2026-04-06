import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock github module
const mockCreateOrUpdateFile = vi.fn().mockResolvedValue({ sha: 'abc123' })
vi.mock('@/lib/github', () => ({
  createOrUpdateFile: mockCreateOrUpdateFile,
}))

describe('/api/omni-comm/dispatch', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_PAT', 'test-token')
    vi.resetModules()
    mockCreateOrUpdateFile.mockClear()
    mockCreateOrUpdateFile.mockResolvedValue({ sha: 'abc123' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function loadRoute() {
    return await import('./route')
  }

  function makeRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost:3000/api/omni-comm/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  // AC-6: Missing GITHUB_PAT returns 500
  it('returns 500 when GITHUB_PAT is not configured', async () => {
    vi.stubEnv('GITHUB_PAT', '')
    const { POST } = await loadRoute()
    const res = await POST(makeRequest({ hashtag: '#req', content: 'test' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain('GITHUB_PAT')
  })

  // AC-3: #req maps to Dev/Architect-Office/inbox/
  it('dispatches #req to correct path', async () => {
    const { POST } = await loadRoute()
    const res = await POST(makeRequest({ hashtag: '#req', content: '測試需求' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
      expect.stringContaining('Dev/Architect-Office/inbox/'),
      expect.stringContaining('測試需求'),
      expect.any(String),
    )
  })

  // AC-3: Generated markdown contains frontmatter
  it('generates markdown with frontmatter', async () => {
    const { POST } = await loadRoute()
    await POST(makeRequest({ hashtag: '#req', content: '需求內容' }))

    const writtenContent = mockCreateOrUpdateFile.mock.calls[0][1] as string
    expect(writtenContent).toContain('---')
    expect(writtenContent).toContain('hashtag: "#req"')
    expect(writtenContent).toContain('source: "omni-comm"')
    expect(writtenContent).toContain('需求內容')
  })

  // AC-5: GitHub API failure returns specific error
  it('returns specific error message on GitHub API failure', async () => {
    mockCreateOrUpdateFile.mockRejectedValueOnce(new Error('Bad credentials'))
    const { POST } = await loadRoute()
    const res = await POST(makeRequest({ hashtag: '#req', content: 'test' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain('Bad credentials')
  })

  // Validation: missing hashtag
  it('returns 400 when hashtag is missing', async () => {
    const { POST } = await loadRoute()
    const res = await POST(makeRequest({ content: 'test' }))

    expect(res.status).toBe(400)
  })

  // Validation: unknown hashtag
  it('returns 400 for unknown hashtag', async () => {
    const { POST } = await loadRoute()
    const res = await POST(makeRequest({ hashtag: '#unknown', content: 'test' }))

    expect(res.status).toBe(400)
  })
})
