import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import ManifestCard from '@/components/dev/ManifestCard'
import PipelineStatus from '@/components/dev/PipelineStatus'
import QAWarningBlock from '@/components/dev/QAWarningBlock'
import { getDevManifests, getInboxItems } from '@/lib/fetchers'
import type { ManifestData, InboxItem } from '@/lib/types'

export default async function DevPage() {
  let manifests: { nexus: ManifestData | null; choiceForge: ManifestData | null }
  let inboxItems: InboxItem[]

  try {
    manifests = await getDevManifests()
  } catch {
    manifests = { nexus: null, choiceForge: null }
  }

  try {
    inboxItems = await getInboxItems()
  } catch {
    inboxItems = []
  }

  const manifestList = [manifests.nexus, manifests.choiceForge].filter(
    (m): m is ManifestData => m !== null
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar departmentName="Dev" />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left column — 2/3 */}
            <div className="col-span-2 space-y-4">
              <h2 className="font-display text-xl text-text-primary mb-2">
                MANIFEST Health
              </h2>
              {manifestList.length === 0 ? (
                <p className="font-mono text-sm text-text-muted opacity-50">
                  No manifests loaded
                </p>
              ) : (
                manifestList.map((m, idx) => (
                  <ManifestCard key={m.projectName ?? idx} manifest={m} />
                ))
              )}

              <h2 className="font-display text-xl text-text-primary mt-6 mb-2">
                Pipeline
              </h2>
              <PipelineStatus items={inboxItems} />
            </div>

            {/* Right column — 1/3 */}
            <div className="col-span-1 space-y-4">
              <h2 className="font-display text-xl text-text-primary mb-2">
                Alerts
              </h2>
              <QAWarningBlock items={inboxItems} />
              <div className="bg-white border border-[#E8E4DF] rounded-lg p-4">
                <p className="font-mono text-xs text-text-muted opacity-50">
                  Inbox: {inboxItems.length} item{inboxItems.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
