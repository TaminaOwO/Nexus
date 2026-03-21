import { getFileContent, listDirectory } from './github'
import { parseManifest, parseInboxItems, parseTaskState, parseTaskStateDepartments } from './parser'
import { unstable_cache } from 'next/cache'

/**
 * 取得 Dev MANIFEST 資料（ISR 300s）
 */
export const getDevManifests = unstable_cache(
  async () => {
    const [nexusContent, choiceForgeContent] = await Promise.all([
      getFileContent('Dev/Nexus/MANIFEST.md'),
      getFileContent('Dev/choice-forge/MANIFEST.md').catch(() => null),
    ])
    return {
      nexus: nexusContent ? parseManifest(nexusContent) : null,
      choiceForge: choiceForgeContent ? parseManifest(choiceForgeContent) : null,
    }
  },
  ['hq-manifest'],
  { revalidate: 300, tags: ['hq-github', 'hq-manifest'] }
)

/**
 * 取得 Inbox 項目清單（ISR 120s）
 */
export const getInboxItems = unstable_cache(
  async () => {
    const files = await listDirectory('Dev/Architect-Office/inbox')
    return parseInboxItems(files)
  },
  ['hq-inbox'],
  { revalidate: 120, tags: ['hq-github', 'hq-inbox'] }
)

/**
 * 取得 Cat-Lab 草稿狀態（ISR 300s）
 */
export const getCatLabDrafts = unstable_cache(
  async () => {
    const files = await listDirectory('Marketing/Cat-Lab/drafts')
    return files.filter(f => f.name.endsWith('.md')).map(f => ({
      name: f.name,
      path: f.path,
    }))
  },
  ['hq-catlab'],
  { revalidate: 300, tags: ['hq-github', 'hq-catlab'] }
)

/**
 * 取得 task-state.json（ISR 60s）
 */
export const getTaskState = unstable_cache(
  async () => {
    const content = await getFileContent('Orchestrator/state/task-state.json')
    return content ? parseTaskState(content) : {}
  },
  ['hq-task-state'],
  { revalidate: 60, tags: ['hq-github', 'hq-task-state'] }
)

/**
 * 取得 task-state 各部門狀態摘要（Life Dashboard 用，ISR 60s）
 */
export const getTaskStateDepartments = unstable_cache(
  async () => {
    const content = await getFileContent('Orchestrator/state/task-state.json')
    return content ? parseTaskStateDepartments(content) : {}
  },
  ['hq-task-state-departments'],
  { revalidate: 60, tags: ['hq-github', 'hq-task-state'] }
)
