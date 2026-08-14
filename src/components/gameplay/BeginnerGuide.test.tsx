import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BeginnerGuide } from './BeginnerGuide'

describe('BeginnerGuide', () => {
  it('teaches tile families, scoring shapes, and the turn loop visually', () => {
    const onClose = vi.fn()
    render(<BeginnerGuide isOpen onClose={onClose} />)

    expect(
      screen.getByRole('heading', { name: 'Mahjong in one minute' })
    ).toBeInTheDocument()
    expect(screen.getByText('Read the tile families')).toBeInTheDocument()
    expect(screen.getByText('The shapes to spot')).toBeInTheDocument()
    expect(screen.getByText('Pair')).toBeInTheDocument()
    expect(screen.getByText('Sequence')).toBeInTheDocument()
    expect(screen.getByText('Triplet')).toBeInTheDocument()
    expect(screen.getByText('Quad')).toBeInTheDocument()
    expect(screen.getAllByAltText(/Characters/).length).toBeGreaterThan(0)
    expect(screen.getAllByAltText(/Circles/).length).toBeGreaterThan(0)
    expect(screen.getAllByAltText(/Bamboo/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Show me a move' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
