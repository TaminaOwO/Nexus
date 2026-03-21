import type { CareerCoachData } from '@/lib/nexus-backend'

const DOMAIN_NAME_MAP: Record<string, string> = {
  'Exercise Science': '運動科學',
  'Client Relations': '客戶關係',
  'Program Design': '課程設計',
  'Safety': '安全',
}

interface CareerCoachCardProps {
  data: CareerCoachData
  isLive: boolean
}

export const MOCK_CAREER_COACH_DATA: CareerCoachData = {
  targetDate: '2026-12-31',
  phase: 'Phase 2 — 空大報名中',
  domains: [
    { name: '運動科學', progress: 40 },
    { name: '營養學', progress: 25 },
    { name: '教練實務', progress: 15 },
  ],
  overdueTodos: ['完成空大選課系統註冊，確認 113-2 學期課程'],
  streak: 0,
}

export default function CareerCoachCard({ data, isLive }: CareerCoachCardProps) {
  const avgProgress = data.domains.length > 0
    ? Math.round(data.domains.reduce((sum, d) => sum + d.progress, 0) / data.domains.length)
    : 0

  return (
    <div className="bg-white border border-border rounded-md p-4">
      <span className="text-xs opacity-40 font-mono">
        {isLive ? '[LIVE - nexus-backend]' : '[MOCK - backend unreachable]'}
      </span>

      <h3 className="font-display text-lg text-text-primary mt-3 mb-2">
        Career Coach
      </h3>

      <p className="text-sm text-text-secondary mb-1">
        Current Phase
      </p>
      <p className="font-mono text-base text-primary mb-3">
        {data.phase}
      </p>

      {data.domains.map((domain) => {
        const displayName = DOMAIN_NAME_MAP[domain.name] ?? domain.name
        return (
        <div key={domain.name} className="mb-2">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>{displayName}</span>
            <span className="font-mono">{domain.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-raised rounded-none overflow-hidden">
            <div
              className="h-full bg-primary rounded-none"
              style={{ width: `${domain.progress}%` }}
            />
          </div>
        </div>
      )})}

      {data.streak > 0 && (
        <p className="text-xs text-text-muted mt-2 font-mono">
          Streak: {data.streak} days
        </p>
      )}

      {data.overdueTodos.length > 0 && (
        <>
          <p className="text-sm text-text-secondary mt-3">
            {data.overdueTodos.length === 1 ? 'Next Action' : 'Overdue'}
          </p>
          {data.overdueTodos.map((todo, i) => (
            <p key={i} className="text-sm text-text-primary">
              {todo}
            </p>
          ))}
        </>
      )}

      <p className="text-xs text-text-muted mt-3 font-mono">
        Target: {data.targetDate}
      </p>
    </div>
  )
}
