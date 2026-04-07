export const dynamic = 'force-dynamic'

import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import CareerCoachCard, { MOCK_CAREER_COACH_DATA } from '@/components/life/CareerCoachCard'
import SkincareCard from '@/components/life/SkincareCard'
import HealthCycleCard from '@/components/life/HealthCycleCard'
import TaskReminderCard from '@/components/life/TaskReminderCard'
import { getTaskStateDepartments } from '@/lib/fetchers'
import {
  getCareerCoachData,
  getHealthLatest,
  getHealthRecommendation,
  getSkincareToday,
  getSkincareCycle,
} from '@/lib/nexus-backend'
import type { TaskState } from '@/lib/types'
import type { HealthRecord, HealthRecommendation, SkincareRoutine, SkincareCycle } from '@/lib/nexus-backend'

const FALLBACK_HEALTH: HealthRecord = {
  body_fat_pct: null,
  weight_kg: null,
  sleep_hours: null,
  resting_hr: null,
  record_date: 'N/A',
}

const FALLBACK_SKINCARE: SkincareRoutine = {
  am: [],
  pm: [],
  banned: [],
  phase: 'unknown',
  mode: 'unknown',
}

export default async function LifePage() {
  let taskState: TaskState

  try {
    taskState = await getTaskStateDepartments()
  } catch {
    taskState = {}
  }

  let careerCoachIsLive = true
  const careerCoachData = await getCareerCoachData().catch(() => {
    careerCoachIsLive = false
    return MOCK_CAREER_COACH_DATA
  })

  const healthLatest = await getHealthLatest().catch(() => FALLBACK_HEALTH)
  const skincareToday = await getSkincareToday().catch(() => FALLBACK_SKINCARE)
  const skincareCycle: SkincareCycle | null = await getSkincareCycle().catch(() => null)
  const healthRec: HealthRecommendation | null = await getHealthRecommendation().catch(() => null)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar departmentName="Life" />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <CareerCoachCard data={careerCoachData} isLive={careerCoachIsLive} />
            </div>

            {/* Middle column */}
            <div className="space-y-6">
              <SkincareCard routine={skincareToday} />
              <HealthCycleCard health={healthLatest} cycle={skincareCycle} recommendation={healthRec} />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <TaskReminderCard taskState={taskState} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
