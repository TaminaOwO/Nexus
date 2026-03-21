interface Metric {
  value: string
  label: string
}

const METRICS: Metric[] = [
  { value: '—', label: 'Weight Trend' },
  { value: '??', label: 'Body Fat %' },
  { value: '—', label: 'Cycle Day' },
]

export default function HealthCycleCard() {
  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Health &amp; Cycle
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div key={m.label}>
            <p className="font-mono text-3xl text-primary">{m.value}</p>
            <p className="text-xs text-text-secondary opacity-50 mt-1">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <span className="text-xs opacity-30 font-mono">
          [HealthAutoExport Integration: Phase 1.3]
        </span>
      </div>
    </div>
  )
}
