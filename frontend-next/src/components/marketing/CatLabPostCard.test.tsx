import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CatLabPostCard from './CatLabPostCard'
import type { CatLabPost } from '@/lib/catlab-types'

const mockPublished: CatLabPost = {
  slug: 'post-1',
  title: '觀察員日記 #1',
  persona: 'observer',
  status: 'published',
  date: '2026-04-01',
  tags: ['sleep', 'behavior'],
  excerpt: 'Cat sleeping pattern analysis.',
  content: 'Full content here.',
}

const mockDraft: CatLabPost = {
  slug: 'draft-1',
  title: '研究員分析 #1',
  persona: 'researcher',
  status: 'draft',
  date: null,
  tags: ['aggression'],
  excerpt: 'Draft analysis.',
  content: 'Draft content.',
}

describe('CatLabPostCard', () => {
  it('renders post title', () => {
    render(<CatLabPostCard post={mockPublished} />)
    expect(screen.getByText('觀察員日記 #1')).toBeTruthy()
  })

  it('renders observer persona badge', () => {
    render(<CatLabPostCard post={mockPublished} />)
    expect(screen.getByText('觀察員')).toBeTruthy()
  })

  it('renders researcher persona badge', () => {
    render(<CatLabPostCard post={mockDraft} />)
    expect(screen.getByText('研究員')).toBeTruthy()
  })

  it('renders published status badge', () => {
    render(<CatLabPostCard post={mockPublished} />)
    expect(screen.getByText('Published')).toBeTruthy()
  })

  it('renders draft status badge', () => {
    render(<CatLabPostCard post={mockDraft} />)
    expect(screen.getByText('Draft')).toBeTruthy()
  })

  it('renders tags', () => {
    render(<CatLabPostCard post={mockPublished} />)
    expect(screen.getByText('sleep')).toBeTruthy()
    expect(screen.getByText('behavior')).toBeTruthy()
  })

  it('renders excerpt', () => {
    render(<CatLabPostCard post={mockPublished} />)
    expect(screen.getByText('Cat sleeping pattern analysis.')).toBeTruthy()
  })

  it('renders date when present', () => {
    render(<CatLabPostCard post={mockPublished} />)
    expect(screen.getByText('2026-04-01')).toBeTruthy()
  })
})
