import type { ActiveCase } from '@/lib/types'

interface Props {
  cases: ActiveCase[]
}

export default function ActiveCasesCard({ cases }: Props) {
  if (cases.length === 0) {
    return (
      <div className="bg-white border border-[#E8E4DF] rounded-lg p-4">
        <p className="font-mono text-sm text-text-muted opacity-50">
          No active cases
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cases.map((c) => (
        <div
          key={c.id}
          className="bg-white border border-[#E8E4DF] rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="font-mono text-xs text-primary font-medium">
              {c.id}
            </span>
            {c.updated && (
              <span className="font-mono text-[10px] text-text-muted opacity-50">
                {c.updated}
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary mb-1">{c.title}</p>
          <p className="font-mono text-xs text-text-secondary">{c.status}</p>
          {c.current_step && (
            <p className="font-mono text-[11px] text-text-muted opacity-70 mt-1">
              {c.current_step}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
