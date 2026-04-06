import { Octokit } from '@octokit/rest'

let _octokit: Octokit | null = null

function getOctokit(): Octokit {
  if (!_octokit) {
    const token = process.env.GITHUB_PAT
    if (!token) {
      console.error('[GitHub] GITHUB_PAT is not set')
    }
    _octokit = new Octokit({ auth: token, request: { timeout: 10_000 } })
  }
  return _octokit
}

function getOwner(): string {
  return process.env.GITHUB_OWNER ?? 'TaminaOwO'
}

function getRepo(): string {
  return process.env.GITHUB_REPO ?? 'HQ'
}

/**
 * 讀取 HQ repo 中的檔案內容（base64 decoded）
 */
export async function getFileContent(path: string): Promise<string | null> {
  try {
    const owner = getOwner()
    const repo = getRepo()
    console.log(`[GitHub] getFileContent: ${owner}/${repo}/${path}`)
    const response = await getOctokit().repos.getContent({
      owner,
      repo,
      path,
    })
    const data = response.data
    if ('content' in data && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return null
  } catch (error: unknown) {
    const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : 'unknown'
    console.error(`[GitHub] Failed to fetch ${getOwner()}/${getRepo()}/${path} (HTTP ${status}):`, error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * 列出 HQ repo 中目錄下的所有檔案
 */
export async function listDirectory(path: string): Promise<Array<{ name: string; path: string; type: string }>> {
  try {
    const owner = getOwner()
    const repo = getRepo()
    console.log(`[GitHub] listDirectory: ${owner}/${repo}/${path}`)
    const response = await getOctokit().repos.getContent({
      owner,
      repo,
      path,
    })
    const data = response.data
    if (Array.isArray(data)) {
      return data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
      }))
    }
    return []
  } catch (error: unknown) {
    const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : 'unknown'
    console.error(`[GitHub] Failed to list ${getOwner()}/${getRepo()}/${path} (HTTP ${status}):`, error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * 在 HQ repo 中建立或更新檔案
 */
export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
): Promise<{ sha: string }> {
  const owner = getOwner()
  const repo = getRepo()
  console.log(`[GitHub] createOrUpdateFile: ${owner}/${repo}/${path}`)

  // Check if file exists to get its SHA (required for updates)
  let sha: string | undefined
  try {
    const existing = await getOctokit().repos.getContent({ owner, repo, path })
    if ('sha' in existing.data) {
      sha = existing.data.sha
    }
  } catch {
    // File doesn't exist yet — create new
  }

  const response = await getOctokit().repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    ...(sha ? { sha } : {}),
  })

  return { sha: response.data.content?.sha ?? '' }
}

/**
 * 讀取多個檔案（批次，避免 rate limit）
 */
export async function getMultipleFiles(paths: string[]): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {}
  for (const path of paths) {
    results[path] = await getFileContent(path)
    // 小延遲避免 rate limit
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return results
}
