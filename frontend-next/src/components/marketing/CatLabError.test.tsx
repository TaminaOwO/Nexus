import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CatLabError from './CatLabError'

describe('CatLabError', () => {
  it('renders error message', () => {
    render(<CatLabError message="Failed to load content" />)
    expect(screen.getByText('Failed to load content')).toBeTruthy()
  })

  it('renders default message when none provided', () => {
    render(<CatLabError />)
    expect(screen.getByText('Unable to load CatLab content. Please try again later.')).toBeTruthy()
  })

  it('renders error icon area', () => {
    render(<CatLabError />)
    expect(screen.getByTestId('error-container')).toBeTruthy()
  })
})
