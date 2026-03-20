import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
})

const OWNER = process.env.GITHUB_OWNER ?? ''
const REPO = process.env.GITHUB_REPO ?? 'HQ'

/**
 * 讀取 HQ repo 中的檔案內容（base64 decoded）
 */
export async function getFileContent(path: string): Promise<string | null> {
  try {
    const response = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
    })
    const data = response.data
    if ('content' in data && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return null
  } catch (error) {
    console.error(`[GitHub] Failed to fetch ${path}:`, error)
    return null
  }
}

/**
 * 列出 HQ repo 中目錄下的所有檔案
 */
export async function listDirectory(path: string): Promise<Array<{ name: string; path: string; type: string }>> {
  try {
    const response = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
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
  } catch (error) {
    console.error(`[GitHub] Failed to list ${path}:`, error)
    return []
  }
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
