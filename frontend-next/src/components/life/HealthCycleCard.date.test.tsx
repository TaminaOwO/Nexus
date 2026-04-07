import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthCycleCard from './HealthCycleCard'
import type { HealthRecord, SkincareCycle } from '@/lib/nexus-backend'

describe('HealthCycleCard date attribution (AC-5)', () => {
  const cycle: SkincareCycle = { current_day: 5, phase: 'Menstrual' }

  it('displays record_date from backend as-is, no local timezone conversion', () => {
    // Scenario: user sleeps at 00:30 on 2026-04-06
    // Backend correctly attributes this to 2026-04-05 (previous day)
    // Frontend must display 2026-04-05 without re-interpreting
    const lateNightHealth: HealthRecord = {
      body_fat_pct: 25.0,
      weight_kg: 55.0,
      sleep_hours: 6.5,
      resting_hr: 64,
      record_date: '2026-04-05', // backend already resolved correct date
    }

    render(<HealthCycleCard health={lateNightHealth} cycle={cycle} />)

    // The record_date should appear as-is
    expect(screen.getByText('2026-04-05')).toBeDefined()
  })

  it('does not pass record_date through Date constructor (no timezone shift)', () => {
    // If the code were to do new Date('2026-04-05') it could shift dates
    // We verify the exact string is rendered
    const health: HealthRecord = {
      body_fat_pct: null,
      weight_kg: null,
      sleep_hours: null,
      resting_hr: null,
      record_date: '2026-04-05',
    }

    render(<HealthCycleCard health={health} cycle={cycle} />)

    // Exact string match — not "April 5" or "4/5" or any reformatted version
    expect(screen.getByText('2026-04-05')).toBeDefined()
  })
})
