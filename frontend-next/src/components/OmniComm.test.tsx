import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = vi.fn()

describe('OmniComm', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    vi.resetModules()
  })

  async function renderOmniComm() {
    const { default: OmniComm } = await import('./OmniComm')
    return render(<OmniComm />)
  }

  // AC-1: Cmd+K toggles command palette
  it('opens command palette on Cmd+K', async () => {
    await renderOmniComm()

    // Panel should not be visible initially
    expect(screen.queryByPlaceholderText(/輸入指令/)).not.toBeInTheDocument()

    // Trigger Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    expect(screen.getByPlaceholderText(/輸入指令/)).toBeInTheDocument()
  })

  it('opens command palette on Ctrl+K', async () => {
    await renderOmniComm()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(screen.getByPlaceholderText(/輸入指令/)).toBeInTheDocument()
  })

  it('closes command palette on second Cmd+K', async () => {
    await renderOmniComm()

    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByPlaceholderText(/輸入指令/)).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.queryByPlaceholderText(/輸入指令/)).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    await renderOmniComm()

    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByPlaceholderText(/輸入指令/)).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByPlaceholderText(/輸入指令/)).not.toBeInTheDocument()
  })

  // AC-4: Loading spinner during dispatch
  it('shows loading state during dispatch', async () => {
    let resolvePromise: (value: Response) => void
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolvePromise = resolve
      })
    )

    await renderOmniComm()
    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText(/輸入指令/)
    fireEvent.change(input, { target: { value: '#req 測試需求' } })

    const submitBtn = screen.getByRole('button', { name: /送出/ })
    fireEvent.click(submitBtn)

    // Loading indicator should appear
    expect(screen.getByText(/送出中/)).toBeInTheDocument()

    // Resolve the promise
    await act(async () => {
      resolvePromise!(new Response(JSON.stringify({ success: true, path: 'test.md' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    })
  })

  // AC-4: Toast with git pull reminder
  it('shows toast with git pull reminder on success', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, path: 'Dev/inbox/test.md' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await renderOmniComm()
    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText(/輸入指令/)
    fireEvent.change(input, { target: { value: '#req 測試需求' } })

    const submitBtn = screen.getByRole('button', { name: /送出/ })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/git pull/)).toBeInTheDocument()
    })
    expect(screen.getByText(/已送出至遠端/)).toBeInTheDocument()
  })

  // AC-5: Error message display
  it('shows error message on dispatch failure', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad credentials' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await renderOmniComm()
    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    const input = screen.getByPlaceholderText(/輸入指令/)
    fireEvent.change(input, { target: { value: '#req test' } })

    const submitBtn = screen.getByRole('button', { name: /送出/ })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/Bad credentials/)).toBeInTheDocument()
    })
  })
})
