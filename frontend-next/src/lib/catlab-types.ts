/**
 * CatLab post parsed from GitHub Markdown files
 */
export interface CatLabPost {
  slug: string
  title: string
  persona: 'observer' | 'researcher' | 'unknown'
  status: 'draft' | 'published'
  date: string | null
  tags: string[]
  excerpt: string
  content: string
}

/**
 * CatLab API response shape
 */
export interface CatLabApiResponse {
  published: CatLabPost[]
  drafts: CatLabPost[]
  cachedAt: string | null
}

/**
 * Cat record entry for timeline display
 */
export interface CatRecordEntry {
  time: string
  activity: string
  cat: string
  notes?: string
}
