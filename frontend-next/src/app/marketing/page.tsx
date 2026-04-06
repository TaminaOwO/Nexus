'use client'

import useSWR from 'swr'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import CatLabPostCard from '@/components/marketing/CatLabPostCard'
import CatLabSkeleton from '@/components/marketing/CatLabSkeleton'
import CatLabError from '@/components/marketing/CatLabError'
import CatRecordTimeline from '@/components/marketing/CatRecordTimeline'
import type { CatLabApiResponse } from '@/lib/catlab-types'

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json() as Promise<CatLabApiResponse>
})

export default function MarketingPage() {
  const { data, error, isLoading } = useSWR(
    '/api/marketing/catlab',
    fetcher,
    { refreshInterval: 60_000 },
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar departmentName="Marketing" />
        <main className="flex-1 p-6">
          {isLoading && <CatLabSkeleton />}
          {error && <CatLabError message="Failed to load CatLab content. Please try again later." />}
          {data && !error && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Published — left column */}
                <div className="space-y-4">
                  <h3 className="font-display text-lg text-text-primary">
                    Published
                    <span className="ml-2 text-xs text-text-muted font-mono">
                      ({data.published.length})
                    </span>
                  </h3>
                  {data.published.length === 0 && (
                    <p className="text-sm text-text-muted">No published posts yet.</p>
                  )}
                  {data.published.map((post) => (
                    <CatLabPostCard key={post.slug} post={post} />
                  ))}
                </div>

                {/* Drafts — right column */}
                <div className="space-y-4">
                  <h3 className="font-display text-lg text-text-primary">
                    Drafts
                    <span className="ml-2 text-xs text-text-muted font-mono">
                      ({data.drafts.length})
                    </span>
                  </h3>
                  {data.drafts.length === 0 && (
                    <p className="text-sm text-text-muted">No drafts yet.</p>
                  )}
                  {data.drafts.map((post) => (
                    <CatLabPostCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>

              {/* Cat Record Timeline */}
              <CatRecordTimeline />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
