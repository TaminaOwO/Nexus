import type { ActiveCase } from '@/lib/types'

interface CasePipelineProps {
  activeCase: ActiveCase
}

const STEPS = ['REQ', 'PROP', 'Approved', 'Engineer', 'QA', 'Archive'] as const
type Step = (typeof STEPS)[number]
type StepState = 'pending' | 'active' | 'done'

function deriveStepStatesForCase(c: ActiveCase): Record<Step, StepState> {
  const states: Record<Step, StepState> = {
    REQ: 'pending',
    PROP: 'pending',
    Approved: 'pending',
    Engineer: 'pending',
    QA: 'pending',
    Archive: 'pending',
  }

  const statusLower = (c.status ?? '').toLowerCase()
  const stepLower = (c.current_step ?? '').toLowerCase()

  // Determine which step is active based on status + current_step
  if (statusLower.includes('archived') || statusLower.includes('verified')) {
    states.REQ = 'done'
    states.PROP = 'done'
    states.Approved = 'done'
    states.Engineer = 'done'
    states.QA = 'done'
    states.Archive = 'done'
  } else if (statusLower.includes('qa') || stepLower.includes('qa')) {
    states.REQ = 'done'
    states.PROP = 'done'
    states.Approved = 'done'
    states.Engineer = 'done'
    states.QA = 'active'
  } else if (statusLower.includes('executing') || stepLower.includes('engineer')) {
    states.REQ = 'done'
    states.PROP = 'done'
    states.Approved = 'done'
    states.Engineer = 'active'
  } else if (statusLower.includes('approved')) {
    states.REQ = 'done'
    states.PROP = 'done'
    states.Approved = 'active'
  } else if (statusLower.includes('prop') || stepLower.includes('prop')) {
    states.REQ = 'done'
    states.PROP = 'active'
  } else if (statusLower.includes('req') || stepLower.includes('req')) {
    states.REQ = 'active'
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

export default function CasePipeline({ activeCase }: CasePipelineProps) {
  const states = deriveStepStatesForCase(activeCase)

  return (
    <div className="flex items-center gap-0.5 mt-2">
      {STEPS.map((step, idx) => {
        const state = states[step]
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center ${stepStyles[state]}`}
              >
                <span className="text-[7px] font-mono font-bold leading-none">
                  {idx + 1}
                </span>
              </div>
              <span className="font-mono text-[10px] text-text-secondary mt-0.5">
                {step}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${lineStyles[state]} mx-0.5 -mt-3`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
