import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import CareerCoachCard from '@/components/life/CareerCoachCard'
import SkincareCard from '@/components/life/SkincareCard'
import HealthCycleCard from '@/components/life/HealthCycleCard'
import TaskReminderCard from '@/components/life/TaskReminderCard'
import { getTaskStateDepartments } from '@/lib/fetchers'
import type { TaskState } from '@/lib/types'

export default async function LifePage() {
  let taskState: TaskState

  try {
    taskState = await getTaskStateDepartments()
  } catch {
    taskState = {}
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar departmentName="Life" />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <CareerCoachCard />
            </div>

            {/* Middle column */}
            <div className="space-y-6">
              <SkincareCard />
              <HealthCycleCard />
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
