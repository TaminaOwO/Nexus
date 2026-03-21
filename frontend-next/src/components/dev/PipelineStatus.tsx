import type { InboxItem } from '@/lib/types'

interface PipelineStatusProps {
  items: InboxItem[]
}

const STEPS = ['REQ', 'PROP', 'Approved', 'Engineer', 'QA', 'Archive'] as const
type Step = (typeof STEPS)[number]
type StepState = 'pending' | 'active' | 'done'

function deriveStepStates(items: InboxItem[]): Record<Step, StepState> {
  const states: Record<Step, StepState> = {
    REQ: 'pending',
    PROP: 'pending',
    Approved: 'pending',
    Engineer: 'pending',
    QA: 'pending',
    Archive: 'pending',
  }

  if (items.length === 0) return states

  const hasREQ = items.some(i => i.type === 'REQ')
  const hasPROP = items.some(i => i.type === 'PROP')

  if (hasREQ) {
    states.REQ = 'active'
  }
  if (hasPROP) {
    states.REQ = 'done'
    states.PROP = 'active'
  }

  return states
}

const stepStyles: Record<StepState, string> = {
  pending: 'border-border bg-surface text-text-primary/40',
  active: 'border-primary bg-primary/10 text-primary',
  done: 'border-[#27C93F] bg-[#27C93F]/10 text-[#27C93F]',
}

const lineStyles: Record<StepState, string> = {
  pending: 'bg-border',
  active: 'bg-primary',
  done: 'bg-[#27C93F]',
}

export default function PipelineStatus({ items }: PipelineStatusProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#E8E4DF] rounded-lg p-4 mb-3">
        <p className="font-mono text-sm text-text-muted opacity-50">
          Pipeline idle
        </p>
      </div>
    )
  }

  const states = deriveStepStates(items)

  return (
    <div className="bg-white border border-[#E8E4DF] rounded-lg p-4 mb-3">
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const state = states[step]
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${stepStyles[state]}`}
                >
                  <span className="text-[9px] font-mono font-bold leading-none">
                    {idx + 1}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-text-secondary mt-1">
                  {step}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${lineStyles[state]} mx-0.5 -mt-4`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
