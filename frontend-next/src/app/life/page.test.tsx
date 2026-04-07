import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock all backend fetchers
vi.mock('@/lib/nexus-backend', () => ({
  getCareerCoachData: vi.fn().mockResolvedValue({
    targetDate: '2026-12-01',
    phase: 'Phase 2',
    domains: [{ name: 'CPT', progress: 60 }],
    overdueTodos: [],
    streak: 5,
  }),
  getHealthLatest: vi.fn().mockResolvedValue({
    body_fat_pct: 24.5,
    weight_kg: 54.0,
    sleep_hours: 7.0,
    resting_hr: 60,
    record_date: '2026-04-06',
  }),
  getSkincareToday: vi.fn().mockResolvedValue({
    am: [{ product: 'Cleanser', is_optional: false }],
    pm: [{ product: 'Moisturizer', is_optional: false }],
    banned: [],
    phase: 'Follicular',
    mode: 'normal',
  }),
  getSkincareCycle: vi.fn().mockResolvedValue({
    current_day: 10,
    phase: 'Follicular',
  }),
}))

vi.mock('@/lib/fetchers', () => ({
  getTaskStateDepartments: vi.fn().mockResolvedValue({}),
}))

// Mock child components to verify props are passed
vi.mock('@/components/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}))

vi.mock('@/components/TopBar', () => ({
  default: ({ departmentName }: { departmentName: string }) => (
    <div data-testid="topbar">{departmentName}</div>
  ),
}))

vi.mock('@/components/life/CareerCoachCard', () => ({
  default: ({ isLive }: { isLive: boolean }) => (
    <div data-testid="career-coach">{isLive ? 'live' : 'mock'}</div>
  ),
  MOCK_CAREER_COACH_DATA: {},
}))

vi.mock('@/components/life/HealthCycleCard', () => ({
  default: ({ health, cycle }: { health: unknown; cycle: unknown }) => (
    <div data-testid="health-cycle">
      {health ? 'health-data' : 'no-health'}
      {cycle ? 'cycle-data' : 'no-cycle'}
    </div>
  ),
}))

vi.mock('@/components/life/SkincareCard', () => ({
  default: ({ routine }: { routine: unknown }) => (
    <div data-testid="skincare">{routine ? 'routine-data' : 'no-routine'}</div>
  ),
}))

vi.mock('@/components/life/TaskReminderCard', () => ({
  default: () => <div data-testid="task-reminder" />,
}))

describe('LifePage integration', () => {
  it('renders HealthCycleCard with health and cycle data', async () => {
    const { default: LifePage } = await import('./page')
    const result = await LifePage()
    render(result)

    const healthCard = screen.getByTestId('health-cycle')
    expect(healthCard.textContent).toContain('health-data')
    expect(healthCard.textContent).toContain('cycle-data')
  })

  it('renders SkincareCard with routine data', async () => {
    const { default: LifePage } = await import('./page')
    const result = await LifePage()
    render(result)

    const skincareCard = screen.getByTestId('skincare')
    expect(skincareCard.textContent).toContain('routine-data')
  })
})
