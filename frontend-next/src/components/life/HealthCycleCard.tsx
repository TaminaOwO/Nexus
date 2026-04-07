import type { HealthRecord, HealthRecommendation, SkincareCycle } from '@/lib/nexus-backend'

const PHASE_LABELS: Record<string, string> = {
  follicular: '濾泡期',
  ovulation:  '排卵期',
  luteal:     '黃體期',
  menstrual:  '月經期',
}

interface HealthCycleCardProps {
  health: HealthRecord
  cycle: SkincareCycle | null
  recommendation?: HealthRecommendation | null
}

function formatMetric(value: number | null | undefined, suffix: string, decimals = 1): string {
  if (value == null) return 'N/A'
  return `${Number(value).toFixed(decimals)}${suffix}`
}

export default function HealthCycleCard({ health, cycle, recommendation }: HealthCycleCardProps) {
  const metrics = [
    { value: formatMetric(health.body_fat_pct, '%', 1), label: 'Body Fat %' },
    { value: formatMetric(health.sleep_hours, 'h', 1), label: 'Sleep' },
    { value: formatMetric(health.resting_hr, '', 0), label: 'Resting HR' },
  ]

  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Health &amp; Cycle
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="font-mono text-2xl text-primary truncate">{m.value}</p>
            <p className="text-xs text-text-secondary opacity-50 mt-1">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {cycle && (
        <div className="mt-4">
          <span className="text-xs font-mono text-text-muted">
            Day {cycle.current_day} &middot; {PHASE_LABELS[cycle.phase] ?? cycle.phase}
          </span>
        </div>
      )}

      <div className="mt-2">
        <span className="text-xs opacity-30 font-mono">
          {health.record_date}
        </span>
      </div>

      {recommendation && (
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          {recommendation.alert && (
            <p className="text-xs text-red-600 whitespace-pre-line">{recommendation.alert}</p>
          )}
          {recommendation.diet && (
            <p className="text-xs text-text-secondary whitespace-pre-line">{recommendation.diet}</p>
          )}
          {recommendation.training && (
            <p className="text-xs text-text-secondary whitespace-pre-line">{recommendation.training}</p>
          )}
        </div>
      )}
    </div>
  )
}
