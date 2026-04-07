import { NextResponse } from 'next/server'
import matter from 'gray-matter'
import { listDirectory, getFileContent } from '@/lib/github'
import type { CatLabPost, CatLabApiResponse } from '@/lib/catlab-types'

// --- In-memory cache ---
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const PUBLISHED_TTL = 600_000 // 600s
const DRAFTS_TTL = 60_000    // 60s

let publishedCache: CacheEntry<CatLabPost[]> | null = null
let draftsCache: CacheEntry<CatLabPost[]> | null = null

function isCacheValid<T>(entry: CacheEntry<T> | null, ttl: number): entry is CacheEntry<T> {
  if (!entry) return false
  return Date.now() - entry.timestamp < ttl
}

// --- Parsing ---
function parseCatLabFile(raw: string, filePath: string, status: 'published' | 'draft'): CatLabPost {
  const { data: fm, content, excerpt } = matter(raw, { excerpt: true, excerpt_separator: '\n\n' })

  const slug = filePath.split('/').pop()?.replace(/\.md$/, '') ?? filePath

  return {
    slug,
    title: (fm.title as string) ?? slug,
    persona: (['observer', 'researcher'].includes(fm.persona) ? fm.persona : 'unknown') as CatLabPost['persona'],
    status,
    date: (fm.date as string) ?? null,
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    excerpt: excerpt ?? content.slice(0, 200),
    content,
  }
}

async function fetchPosts(dirSuffix: string, status: 'published' | 'draft'): Promise<CatLabPost[]> {
  const basePath = `Marketing/Cat-Lab/${dirSuffix}`
  const files = await listDirectory(basePath)
  const mdFiles = files.filter(f => f.name.endsWith('.md'))

  const posts: CatLabPost[] = []
  for (const file of mdFiles) {
    const raw = await getFileContent(file.path)
    if (raw) {
      posts.push(parseCatLabFile(raw, file.path, status))
    }
  }

  return posts
}

// --- Route handler ---
export async function GET(): Promise<NextResponse<CatLabApiResponse | { error: string }>> {
  try {
    let published: CatLabPost[]
    let drafts: CatLabPost[]

    if (isCacheValid(publishedCache, PUBLISHED_TTL)) {
      published = publishedCache.data
    } else {
      published = await fetchPosts('posts', 'published')
      publishedCache = { data: published, timestamp: Date.now() }
    }

    if (isCacheValid(draftsCache, DRAFTS_TTL)) {
      drafts = draftsCache.data
    } else {
      drafts = await fetchPosts('drafts', 'draft')
      draftsCache = { data: drafts, timestamp: Date.now() }
    }

    const response: CatLabApiResponse = {
      published,
      drafts,
      cachedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[CatLab BFF] Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CatLab content' },
      { status: 500 },
    )
  }
}

// Export for testing — reset cache
export function _resetCache() {
  publishedCache = null
  draftsCache = null
}
