import type { SkincareRoutine, SkincareStep } from '@/lib/nexus-backend'

interface SkincareCardProps {
  routine: SkincareRoutine
}

function StepItem({ step }: { step: SkincareStep }) {
  return (
    <li className="flex items-start gap-2 text-sm text-text-primary py-0.5">
      <span className="w-3.5 h-3.5 border border-border rounded-xs inline-flex items-center justify-center flex-shrink-0 mt-0.5" />
      <span className="flex flex-wrap items-center gap-1 min-w-0">
      <span className="break-words">{step.product}</span>
      {step.badges?.map((badge) => (
        <span
          key={badge}
          className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm font-mono"
        >
          {badge}
        </span>
      ))}
      {step.is_optional && (
        <span className="text-[10px] text-text-muted opacity-50">(optional)</span>
      )}
      </span>
    </li>
  )
}

export default function SkincareCard({ routine }: SkincareCardProps) {
  const am = routine.am ?? []
  const pm = routine.pm ?? []
  const banned = routine.banned ?? []

  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Skincare SOP
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-mono text-text-muted mb-2">AM</p>
          <ul className="space-y-1">
            {am.map((step) => (
              <StepItem key={step.product} step={step} />
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-mono text-text-muted mb-2">PM</p>
          <ul className="space-y-1">
            {pm.map((step) => (
              <StepItem key={step.product} step={step} />
            ))}
          </ul>
        </div>
      </div>

      {banned.length > 0 && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-sm">
          <p className="text-xs font-mono text-red-600 mb-1">Banned</p>
          <div className="flex gap-2">
            {banned.map((item) => (
              <span
                key={item}
                className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-sm font-mono"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
