import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock github module
vi.mock('@/lib/github', () => ({
  listDirectory: vi.fn(),
  getFileContent: vi.fn(),
}))

import { listDirectory, getFileContent } from '@/lib/github'
import type { CatLabApiResponse } from '@/lib/catlab-types'

const mockListDirectory = vi.mocked(listDirectory)
const mockGetFileContent = vi.mocked(getFileContent)

// We need to reset cache between tests
async function importRoute() {
  // Clear module cache to reset in-memory cache
  vi.resetModules()
  vi.doMock('@/lib/github', () => ({
    listDirectory: mockListDirectory,
    getFileContent: mockGetFileContent,
  }))
  const mod = await import('./route')
  return mod
}

const SAMPLE_PUBLISHED_MD = `---
title: "觀察員日記 #1"
persona: observer
date: "2026-04-01"
tags: [sleep, behavior]
---

This is a published post about cat behavior.
`

const SAMPLE_DRAFT_MD = `---
title: "研究員分析 #1"
persona: researcher
tags: [aggression]
---

Draft analysis content.
`

describe('GET /api/marketing/catlab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDirectory.mockResolvedValue([])
    mockGetFileContent.mockResolvedValue(null)
  })

  it('returns published and drafts arrays', async () => {
    mockListDirectory.mockImplementation(async (path: string) => {
      if (path.includes('posts')) {
        return [{ name: 'post1.md', path: 'Marketing/Cat-Lab/posts/post1.md', type: 'file' }]
      }
      if (path.includes('drafts')) {
        return [{ name: 'draft1.md', path: 'Marketing/Cat-Lab/drafts/draft1.md', type: 'file' }]
      }
      return []
    })
    mockGetFileContent.mockImplementation(async (path: string) => {
      if (path.includes('posts')) return SAMPLE_PUBLISHED_MD
      if (path.includes('drafts')) return SAMPLE_DRAFT_MD
      return null
    })

    const { GET } = await importRoute()
    const response = await GET()
    const data: CatLabApiResponse = await response.json()

    expect(data.published).toHaveLength(1)
    expect(data.drafts).toHaveLength(1)
    expect(data.published[0].title).toBe('觀察員日記 #1')
    expect(data.published[0].persona).toBe('observer')
    expect(data.published[0].status).toBe('published')
    expect(data.drafts[0].title).toBe('研究員分析 #1')
    expect(data.drafts[0].persona).toBe('researcher')
    expect(data.drafts[0].status).toBe('draft')
  })

  it('parses frontmatter tags correctly', async () => {
    mockListDirectory.mockImplementation(async (path: string) => {
      if (path.includes('posts')) {
        return [{ name: 'post1.md', path: 'Marketing/Cat-Lab/posts/post1.md', type: 'file' }]
      }
      return []
    })
    mockGetFileContent.mockResolvedValue(SAMPLE_PUBLISHED_MD)

    const { GET } = await importRoute()
    const data: CatLabApiResponse = await (await GET()).json()

    expect(data.published[0].tags).toEqual(['sleep', 'behavior'])
  })

  it('uses cache on second call within TTL (AC-6)', async () => {
    mockListDirectory.mockImplementation(async (path: string) => {
      if (path.includes('posts')) {
        return [{ name: 'post1.md', path: 'Marketing/Cat-Lab/posts/post1.md', type: 'file' }]
      }
      return []
    })
    mockGetFileContent.mockResolvedValue(SAMPLE_PUBLISHED_MD)

    const { GET } = await importRoute()

    // First call - fetches from GitHub
    await GET()
    expect(mockListDirectory).toHaveBeenCalled()

    const callCountAfterFirst = mockListDirectory.mock.calls.length

    // Second call - should use cache
    await GET()
    expect(mockListDirectory.mock.calls.length).toBe(callCountAfterFirst)
  })

  it('returns empty arrays when GitHub returns no files', async () => {
    mockListDirectory.mockResolvedValue([])

    const { GET } = await importRoute()
    const data: CatLabApiResponse = await (await GET()).json()

    expect(data.published).toEqual([])
    expect(data.drafts).toEqual([])
  })

  it('handles GitHub errors gracefully', async () => {
    mockListDirectory.mockRejectedValue(new Error('GitHub API error'))

    const { GET } = await importRoute()
    const response = await GET()

    expect(response.status).toBe(500)
  })
})
