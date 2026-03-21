import type { EmployeeStatus } from '@/lib/types'

interface Props {
  employees: EmployeeStatus[]
}

const statusStyles: Record<EmployeeStatus['status'], { dot: string; text: string; label: string }> = {
  idle: {
    dot: 'bg-text-muted opacity-30',
    text: 'text-text-muted opacity-40',
    label: 'Idle',
  },
  executing: {
    dot: 'bg-primary',
    text: 'text-primary font-medium',
    label: 'Executing',
  },
  awaiting: {
    dot: 'bg-[#FFBD2E]',
    text: 'text-[#FFBD2E] font-medium',
    label: 'Awaiting',
  },
}

export default function DevEmployeeStatus({ employees }: Props) {
  if (employees.length === 0) {
    return (
      <div className="bg-white border border-[#E8E4DF] rounded-lg p-4">
        <p className="font-mono text-sm text-text-muted opacity-50">
          No employee data
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E8E4DF] rounded-lg p-4">
      <ul className="space-y-3">
        {employees.map((emp) => {
          const style = statusStyles[emp.status]
          return (
            <li key={emp.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                <div>
                  <p className="text-sm text-text-primary">{emp.name}</p>
                  <p className="font-mono text-xs text-text-muted">{emp.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono text-xs ${style.text}`}>{style.label}</p>
                {emp.taskLabel && (
                  <p className="font-mono text-[10px] text-text-muted opacity-60 mt-0.5">
                    {emp.taskLabel}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
