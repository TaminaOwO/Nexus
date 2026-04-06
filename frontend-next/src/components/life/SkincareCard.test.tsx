import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkincareCard from './SkincareCard'
import type { SkincareRoutine } from '@/lib/nexus-backend'

describe('SkincareCard', () => {
  const routine: SkincareRoutine = {
    am: [
      { product: 'Gentle Cleanser', badges: ['gentle'], is_optional: false },
      { product: 'Sunscreen SPF50', is_optional: false },
    ],
    pm: [
      { product: 'Oil Cleanser', is_optional: false },
      { product: 'Retinol Serum', badges: ['active'], is_optional: true },
      { product: 'Moisturizer', badges: ['ceramide'], is_optional: false },
    ],
    banned: ['AHA', 'BHA'],
    phase: 'Follicular',
    mode: 'normal',
  }

  it('renders AM steps from routine data', () => {
    render(<SkincareCard routine={routine} />)

    expect(screen.getByText('Gentle Cleanser')).toBeDefined()
    expect(screen.getByText('Sunscreen SPF50')).toBeDefined()
  })

  it('renders PM steps from routine data', () => {
    render(<SkincareCard routine={routine} />)

    expect(screen.getByText('Oil Cleanser')).toBeDefined()
    expect(screen.getByText('Retinol Serum')).toBeDefined()
    expect(screen.getByText('Moisturizer')).toBeDefined()
  })

  it('renders product badges', () => {
    render(<SkincareCard routine={routine} />)

    expect(screen.getByText('gentle')).toBeDefined()
    expect(screen.getByText('active')).toBeDefined()
    expect(screen.getByText('ceramide')).toBeDefined()
  })

  it('renders banned ingredients warning', () => {
    render(<SkincareCard routine={routine} />)

    expect(screen.getByText('AHA')).toBeDefined()
    expect(screen.getByText('BHA')).toBeDefined()
  })

  it('marks optional steps', () => {
    render(<SkincareCard routine={routine} />)

    // Retinol Serum is optional — expect "(optional)" text nearby
    expect(screen.getByText(/optional/)).toBeDefined()
  })

  it('does not render hardcoded AM_STEPS/PM_STEPS', () => {
    render(<SkincareCard routine={routine} />)

    const body = document.body.textContent || ''
    // Old hardcoded Chinese values should not appear
    expect(body).not.toContain('潔顏')
    expect(body).not.toContain('卸妝')
  })
})
