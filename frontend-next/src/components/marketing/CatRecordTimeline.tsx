import type { CatRecordEntry } from '@/lib/catlab-types'

interface CatRecordTimelineProps {
  records?: CatRecordEntry[]
}

export default function CatRecordTimeline({ records }: CatRecordTimelineProps) {
  const hasRecords = records && records.length > 0

  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Cat Record Timeline
      </h3>

      {!hasRecords && (
        <p className="text-sm text-text-muted">No records available.</p>
      )}

      {hasRecords && (
        <div className="relative pl-6 space-y-3">
          {/* Timeline line */}
          <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />

          {records.map((entry, i) => (
            <div
              key={`${entry.time}-${i}`}
              data-testid="timeline-entry"
              className="relative flex items-start gap-3"
            >
              {/* Timeline dot */}
              <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-secondary border border-white" />

              {/* Time */}
              <span className="shrink-0 font-mono text-xs text-text-muted w-12">
                {entry.time}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary font-sans">
                    {entry.activity}
                  </span>
                  <span className="px-1.5 py-0.5 bg-secondary-subtle text-secondary text-xs rounded-sm font-sans">
                    {entry.cat}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
