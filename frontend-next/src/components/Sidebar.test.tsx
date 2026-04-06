import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/marketing'),
}))

import Sidebar from './Sidebar'

describe('Sidebar', () => {
  it('renders Marketing link with href /marketing', () => {
    render(<Sidebar />)
    const marketingLink = screen.getByText('Marketing')
    expect(marketingLink.closest('a')).toBeTruthy()
    expect(marketingLink.closest('a')?.getAttribute('href')).toBe('/marketing')
  })

  it('Marketing link is not disabled (opacity-40)', () => {
    render(<Sidebar />)
    const marketingLink = screen.getByText('Marketing')
    const linkEl = marketingLink.closest('a')
    expect(linkEl).toBeTruthy()
    expect(linkEl?.className).not.toContain('opacity-40')
  })
})
