import type { ManifestData, HealthStatus } from '@/lib/types'

interface ManifestCardProps {
  manifest: ManifestData
}

function resolveHealth(status?: string): HealthStatus {
  if (!status) return 'active'
  const s = status.toLowerCase()
  if (s.includes('error') || s.includes('fail')) return 'error'
  if (s.includes('warn')) return 'warning'
  if (s.includes('archived') || s.includes('archive')) return 'archived'
  return 'active'
}

const healthDotColor: Record<HealthStatus, string> = {
  active: 'bg-[#27C93F]',
  warning: 'bg-[#FFBD2E]',
  error: 'bg-[#FF5F56]',
  archived: 'bg-gray-400 opacity-40',
}

export default function ManifestCard({ manifest }: ManifestCardProps) {
  const health = resolveHealth(manifest.status)

  return (
    <div className="bg-white border border-[#E8E4DF] rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-text-primary">
          {manifest.projectName ?? 'Unknown Project'}
        </h3>
        {manifest.version && (
          <span className="font-mono text-sm text-text-secondary">
            {manifest.version}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className={`w-2.5 h-2.5 rounded-full ${healthDotColor[health]}`} />
        <span className="font-mono text-xs text-text-secondary capitalize">
          {health}
        </span>
      </div>

      {manifest.lastUpdated && (
        <p className="font-mono text-xs opacity-50 mt-3">
          {manifest.lastUpdated}
        </p>
      )}
    </div>
  )
}
