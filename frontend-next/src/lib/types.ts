/**
 * Parsed MANIFEST data — mirrors parseManifest() return shape
 */
export interface ManifestData {
  projectName?: string
  status?: string
  version?: string
  lastUpdated?: string
  testStatus?: string
  deployStatus?: string
  description?: string
}

/**
 * Parsed inbox item — mirrors parseInboxItems() return shape
 */
export interface InboxItem {
  id: string
  type: 'REQ' | 'PROP' | 'other'
  name: string
  path: string
}

/**
 * Health status derived from MANIFEST status field
 */
export type HealthStatus = 'active' | 'warning' | 'error' | 'archived'

/**
 * Raw task-state per department — used by Life Dashboard TaskReminderCard
 */
export interface TaskState {
  catlab?: string | null
  kite?: { gate_confirmed?: boolean } | null
  dev?: string | null
  life?: string | null
  choice_forge?: string | null
}
