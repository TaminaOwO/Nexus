import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CatRecordTimeline from './CatRecordTimeline'
import type { CatRecordEntry } from '@/lib/catlab-types'

const mockRecords: CatRecordEntry[] = [
  { time: '06:00', activity: 'Breakfast', cat: '胖胖', notes: 'Ate well' },
  { time: '08:30', activity: 'Sleep', cat: '瘦瘦' },
  { time: '12:00', activity: 'Play', cat: '胖胖', notes: 'Feather toy' },
]

describe('CatRecordTimeline', () => {
  it('renders timeline title', () => {
    render(<CatRecordTimeline />)
    expect(screen.getByText('Cat Record Timeline')).toBeTruthy()
  })

  it('shows empty state when no records', () => {
    render(<CatRecordTimeline />)
    expect(screen.getByText('No records available.')).toBeTruthy()
  })

  it('renders records when provided', () => {
    render(<CatRecordTimeline records={mockRecords} />)
    expect(screen.getByText('06:00')).toBeTruthy()
    expect(screen.getByText('Breakfast')).toBeTruthy()
    expect(screen.getAllByText('胖胖').length).toBeGreaterThanOrEqual(1)
  })

  it('renders all record entries', () => {
    render(<CatRecordTimeline records={mockRecords} />)
    const entries = screen.getAllByTestId('timeline-entry')
    expect(entries).toHaveLength(3)
  })

  it('renders notes when present', () => {
    render(<CatRecordTimeline records={mockRecords} />)
    expect(screen.getByText('Ate well')).toBeTruthy()
    expect(screen.getByText('Feather toy')).toBeTruthy()
  })
})
