import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock SWR
const mockUseSWR = vi.fn()
vi.mock('swr', () => ({
  default: (...args: unknown[]) => mockUseSWR(...args),
}))

// Mock child components
vi.mock('@/components/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}))

vi.mock('@/components/TopBar', () => ({
  default: ({ departmentName }: { departmentName: string }) => (
    <div data-testid="topbar">{departmentName}</div>
  ),
}))

vi.mock('@/components/marketing/CatLabPostCard', () => ({
  default: ({ post }: { post: { title: string } }) => (
    <div data-testid="post-card">{post.title}</div>
  ),
}))

vi.mock('@/components/marketing/CatLabSkeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}))

vi.mock('@/components/marketing/CatLabError', () => ({
  default: ({ message }: { message?: string }) => (
    <div data-testid="error">{message}</div>
  ),
}))

vi.mock('@/components/marketing/CatRecordTimeline', () => ({
  default: () => <div data-testid="timeline" />,
}))

describe('MarketingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders TopBar with Marketing department name', async () => {
    mockUseSWR.mockReturnValue({
      data: { published: [], drafts: [] },
      error: undefined,
      isLoading: false,
    })

    const { default: MarketingPage } = await import('./page')
    render(<MarketingPage />)

    expect(screen.getByTestId('topbar').textContent).toBe('Marketing')
  })

  it('shows skeleton when loading', async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    })

    const { default: MarketingPage } = await import('./page')
    render(<MarketingPage />)

    expect(screen.getByTestId('skeleton')).toBeTruthy()
  })

  it('shows error when fetch fails', async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('fetch failed'),
      isLoading: false,
    })

    const { default: MarketingPage } = await import('./page')
    render(<MarketingPage />)

    expect(screen.getByTestId('error')).toBeTruthy()
  })

  it('renders Published and Drafts column headers', async () => {
    mockUseSWR.mockReturnValue({
      data: {
        published: [
          { slug: 'p1', title: 'Published Post', persona: 'observer', status: 'published', date: '2026-04-01', tags: [], excerpt: '', content: '' },
        ],
        drafts: [
          { slug: 'd1', title: 'Draft Post', persona: 'researcher', status: 'draft', date: null, tags: [], excerpt: '', content: '' },
        ],
      },
      error: undefined,
      isLoading: false,
    })

    const { default: MarketingPage } = await import('./page')
    render(<MarketingPage />)

    expect(screen.getByText('Published')).toBeTruthy()
    expect(screen.getByText('Drafts')).toBeTruthy()
  })

  it('renders post cards from data', async () => {
    mockUseSWR.mockReturnValue({
      data: {
        published: [
          { slug: 'p1', title: 'Published Post', persona: 'observer', status: 'published', date: '2026-04-01', tags: [], excerpt: '', content: '' },
        ],
        drafts: [
          { slug: 'd1', title: 'Draft Post', persona: 'researcher', status: 'draft', date: null, tags: [], excerpt: '', content: '' },
        ],
      },
      error: undefined,
      isLoading: false,
    })

    const { default: MarketingPage } = await import('./page')
    render(<MarketingPage />)

    const cards = screen.getAllByTestId('post-card')
    expect(cards).toHaveLength(2)
    expect(screen.getByText('Published Post')).toBeTruthy()
    expect(screen.getByText('Draft Post')).toBeTruthy()
  })

  it('calls useSWR with /api/marketing/catlab endpoint', async () => {
    mockUseSWR.mockReturnValue({
      data: { published: [], drafts: [] },
      error: undefined,
      isLoading: false,
    })

    const { default: MarketingPage } = await import('./page')
    render(<MarketingPage />)

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/marketing/catlab',
      expect.any(Function),
      expect.any(Object),
    )
  })
})
