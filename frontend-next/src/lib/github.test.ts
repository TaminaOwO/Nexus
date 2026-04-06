import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCreateOrUpdateFileContents = vi.fn().mockResolvedValue({
  data: { content: { sha: 'abc123' } },
})
const mockGetContent = vi.fn()

vi.mock('@octokit/rest', () => ({
  Octokit: function () {
    return {
      repos: {
        createOrUpdateFileContents: mockCreateOrUpdateFileContents,
        getContent: mockGetContent,
      },
    }
  },
}))

describe('github.ts createOrUpdateFile', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_PAT', 'test-pat-token')
    vi.stubEnv('GITHUB_OWNER', 'TestOwner')
    vi.stubEnv('GITHUB_REPO', 'TestRepo')
    vi.resetModules()
    mockCreateOrUpdateFileContents.mockClear()
    mockCreateOrUpdateFileContents.mockResolvedValue({
      data: { content: { sha: 'abc123' } },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function loadModule() {
    return await import('./github')
  }

  it('calls repos.createOrUpdateFileContents with correct params', async () => {
    const mod = await loadModule()
    await mod.createOrUpdateFile('Dev/inbox/test.md', 'Hello World', 'test commit')

    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'TestOwner',
        repo: 'TestRepo',
        path: 'Dev/inbox/test.md',
        message: 'test commit',
        content: Buffer.from('Hello World').toString('base64'),
      })
    )
  })

  it('converts content to base64 correctly for unicode', async () => {
    const mod = await loadModule()
    await mod.createOrUpdateFile('test.md', '中文測試', 'commit msg')

    const call = mockCreateOrUpdateFileContents.mock.calls[0][0]
    expect(Buffer.from(call.content, 'base64').toString('utf-8')).toBe('中文測試')
  })

  it('throws when GitHub API fails', async () => {
    mockCreateOrUpdateFileContents.mockRejectedValueOnce(
      new Error('API rate limit exceeded')
    )

    const mod = await loadModule()
    await expect(mod.createOrUpdateFile('test.md', 'content', 'msg')).rejects.toThrow('API rate limit exceeded')
  })
})
