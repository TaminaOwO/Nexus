import type { HealthRecord, SkincareCycle } from '@/lib/nexus-backend'

interface HealthCycleCardProps {
  health: HealthRecord
  cycle: SkincareCycle | null
}

function formatMetric(value: number | null | undefined, suffix: string): string {
  if (value == null) return 'N/A'
  return `${value}${suffix}`
}

export default function HealthCycleCard({ health, cycle }: HealthCycleCardProps) {
  const metrics = [
    { value: formatMetric(health.body_fat_pct, '%'), label: 'Body Fat %' },
    { value: formatMetric(health.sleep_hours, 'h'), label: 'Sleep' },
    { value: formatMetric(health.resting_hr, ''), label: 'Resting HR' },
  ]

  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Health &amp; Cycle
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="font-mono text-3xl text-primary">{m.value}</p>
            <p className="text-xs text-text-secondary opacity-50 mt-1">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {cycle && (
        <div className="mt-4">
          <span className="text-xs font-mono text-text-muted">
            Day {cycle.current_day} &middot; {cycle.phase}
          </span>
        </div>
      )}

      <div className="mt-2">
        <span className="text-xs opacity-30 font-mono">
          {health.record_date}
        </span>
      </div>
    </div>
  )
}
