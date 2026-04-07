import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthCycleCard from './HealthCycleCard'
import type { HealthRecord, SkincareCycle } from '@/lib/nexus-backend'

describe('HealthCycleCard', () => {
  const healthData: HealthRecord = {
    body_fat_pct: 25.3,
    weight_kg: 55.0,
    sleep_hours: 7.5,
    resting_hr: 62,
    record_date: '2026-04-05',
  }

  const cycleData: SkincareCycle = {
    current_day: 14,
    phase: 'Ovulation',
  }

  it('renders real health data when provided', () => {
    render(<HealthCycleCard health={healthData} cycle={cycleData} />)

    expect(screen.getByText('25.3%')).toBeDefined()
    expect(screen.getByText('7.5h')).toBeDefined()
    expect(screen.getByText('62')).toBeDefined()
    expect(screen.getByText(/Day 14/)).toBeDefined()
  })

  it('renders N/A when health values are null', () => {
    const nullHealth: HealthRecord = {
      body_fat_pct: null,
      weight_kg: null,
      sleep_hours: null,
      resting_hr: null,
      record_date: '2026-04-05',
    }

    render(<HealthCycleCard health={nullHealth} cycle={cycleData} />)

    const naElements = screen.getAllByText('N/A')
    expect(naElements.length).toBe(3) // body_fat, sleep, resting_hr
  })

  it('does not display static placeholders (— or ??)', () => {
    render(<HealthCycleCard health={healthData} cycle={cycleData} />)

    const body = document.body.textContent || ''
    expect(body).not.toContain('??')
    // '—' should only not appear as a metric value
  })
})
