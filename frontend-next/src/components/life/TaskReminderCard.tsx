import type { TaskState } from '@/lib/types'

interface Props {
  taskState: TaskState
}

interface DepartmentEntry {
  key: keyof TaskState
  name: string
  icon: string
}

const DEPARTMENTS: DepartmentEntry[] = [
  { key: 'catlab', name: 'Cat-Lab', icon: 'CL' },
  { key: 'kite', name: 'Kite', icon: 'KT' },
  { key: 'dev', name: 'Dev', icon: 'DV' },
  { key: 'life', name: 'Life', icon: 'LF' },
  { key: 'choice_forge', name: 'Choice Forge', icon: 'CF' },
]

function resolveStatus(value: unknown): { label: string; style: string } {
  if (value === null || value === undefined) {
    return { label: 'idle', style: 'text-text-muted opacity-30' }
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    if ('gate_confirmed' in obj) {
      return obj.gate_confirmed
        ? { label: 'confirmed', style: 'text-success' }
        : { label: 'pending', style: 'text-primary font-medium' }
    }
    return { label: 'active', style: 'text-text-secondary opacity-70' }
  }
  if (typeof value === 'string') {
    if (value === 'pending') {
      return { label: 'pending', style: 'text-primary font-medium' }
    }
    return { label: value, style: 'text-text-secondary opacity-70' }
  }
  return { label: 'idle', style: 'text-text-muted opacity-30' }
}

export default function TaskReminderCard({ taskState }: Props) {
  return (
    <div className="bg-white border border-border rounded-md p-4">
      <h3 className="font-display text-lg text-text-primary mb-3">
        Tasks &amp; Reminders
      </h3>

      <ul className="space-y-2">
        {DEPARTMENTS.map((dept) => {
          const raw = taskState[dept.key]
          const { label, style } = resolveStatus(raw)

          return (
            <li
              key={dept.key}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-muted w-5">
                  {dept.icon}
                </span>
                <span className="text-text-primary">{dept.name}</span>
              </span>
              <span className={`font-mono text-xs ${style}`}>{label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
