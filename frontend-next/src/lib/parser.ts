/**
 * 從 Markdown 內容提取 frontmatter（YAML --- 區塊）
 */
export function extractFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const result: Record<string, string> = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    result[key] = value
  }
  return result
}

/**
 * 從 MANIFEST.md 提取關鍵欄位
 * 支援格式：**欄位名稱**：值 或 - 欄位名稱: 值
 */
export function parseManifest(content: string): {
  projectName?: string
  status?: string
  version?: string
  lastUpdated?: string
  testStatus?: string
  deployStatus?: string
  description?: string
} {
  const extract = (label: string): string | undefined => {
    // 支援 **Label**: value 或 - Label: value 或 | Label | value |
    const patterns = [
      new RegExp(`\\*\\*${label}\\*\\*[：:]\\s*(.+)`, 'i'),
      new RegExp(`^-\\s*${label}[：:]\\s*(.+)`, 'im'),
      new RegExp(`\\|\\s*${label}\\s*\\|\\s*(.+?)\\s*\\|`, 'i'),
      new RegExp(`${label}[：:]\\s*(.+)`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) return match[1].trim()
    }
    return undefined
  }

  return {
    projectName: extract('Project') ?? extract('專案'),
    status: extract('Status') ?? extract('狀態'),
    version: extract('Version') ?? extract('版本'),
    lastUpdated: extract('Last Updated') ?? extract('最後更新'),
    testStatus: extract('Test') ?? extract('測試'),
    deployStatus: extract('Deploy') ?? extract('部署'),
    description: extract('Description') ?? extract('描述'),
  }
}

/**
 * 從 task-state.json 格式提取狀態
 */
export function parseTaskState(jsonContent: string): {
  catlabStatus?: string
  kiteConfirmed?: boolean
  pendingApprovals?: string[]
  lastMorningRun?: string | null
} {
  try {
    const data = JSON.parse(jsonContent)
    return {
      catlabStatus: data?.catlab?.status,
      kiteConfirmed: data?.kite?.gate_confirmed,
      pendingApprovals: data?.dev_pipeline?.pending_approvals ?? [],
      lastMorningRun: data?.last_morning_run,
    }
  } catch {
    return {}
  }
}

/**
 * 從 task-state.json 提取各部門狀態摘要（Life Dashboard 用）
 */
export function parseTaskStateDepartments(jsonContent: string): {
  catlab?: string | null
  kite?: { gate_confirmed?: boolean } | null
  dev?: string | null
  life?: string | null
  choice_forge?: string | null
} {
  try {
    const data = JSON.parse(jsonContent)
    return {
      catlab: data?.catlab?.status ?? null,
      kite: data?.kite ? { gate_confirmed: data.kite.gate_confirmed ?? false } : null,
      dev: data?.dev_pipeline?.active_cases?.length > 0 ? 'pending' : null,
      life: data?.life?.pending_reminders?.length > 0 ? 'pending' : null,
      choice_forge: data?.choice_forge?.last_checked ?? null,
    }
  } catch {
    return {}
  }
}

/**
 * 列出 inbox/ 目錄中的 REQ/PROP 檔案，解析為流水線項目
 */
export function parseInboxItems(files: Array<{ name: string; path: string }>): Array<{
  id: string
  type: 'REQ' | 'PROP' | 'other'
  name: string
  path: string
}> {
  return files
    .filter(f => f.name.endsWith('.md'))
    .map(f => {
      const isREQ = f.name.startsWith('REQ_')
      const isPROP = f.name.startsWith('PROP_')
      return {
        id: f.name.replace('.md', ''),
        type: isREQ ? 'REQ' as const : isPROP ? 'PROP' as const : 'other' as const,
        name: f.name,
        path: f.path,
      }
    })
}
