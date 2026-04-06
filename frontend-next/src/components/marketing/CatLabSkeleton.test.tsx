import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CatLabSkeleton from './CatLabSkeleton'

describe('CatLabSkeleton', () => {
  it('renders skeleton cards for both columns', () => {
    render(<CatLabSkeleton />)
    const skeletonCards = screen.getAllByTestId('skeleton-card')
    expect(skeletonCards.length).toBeGreaterThanOrEqual(4)
  })

  it('renders Published and Drafts column headers', () => {
    render(<CatLabSkeleton />)
    expect(screen.getByText('Published')).toBeTruthy()
    expect(screen.getByText('Drafts')).toBeTruthy()
  })
})
