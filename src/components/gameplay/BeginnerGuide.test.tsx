import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BeginnerGuide } from './BeginnerGuide'
import { Tile, TileSuit } from '../../core/Tile'
import { MeldType } from '../../core/Meld'
import {
  parsePartialHand,
  toPartialParsedHand,
} from '../../rules/PartialHandParser'
import { calculateScore, createScoringContext } from '../../rules/ScoringEngine'

describe('BeginnerGuide', () => {
  it.each([
    [MeldType.Pair, TileSuit.Pinzu, [5, 5]],
    [MeldType.Sequence, TileSuit.Souzu, [2, 3, 4]],
    [MeldType.Triplet, TileSuit.Manzu, [7, 7, 7]],
    [MeldType.Quad, TileSuit.Pinzu, [9, 9, 9, 9]],
  ] as const)(
    'teaches the engine-paid %s structure bonus, not the total',
    (type, suit, ranks) => {
      const tiles = ranks.map(
        (rank, i) => new Tile(suit, rank, `guide-score-${i}`)
      )
      const parsed = parsePartialHand(tiles)
      const score = calculateScore(
        createScoringContext(tiles, toPartialParsedHand(parsed, tiles), {
          partialMelds: parsed.groups,
          previewMode: true,
        })
      )
      const { container } = render(<BeginnerGuide isOpen onClose={vi.fn()} />)
      // Popup is portalled; inspect the rendered example rather than an exported constant.
      expect(
        document.querySelector(
          `[data-guide-pattern="${type}"] [data-guide-bonus]`
        )
      ).toHaveTextContent(`+${score.structurePoints} shape bonus`)
      expect(score.finalScore).toBeGreaterThan(score.structurePoints)
      expect(container.querySelector('[data-beginner-guide]')).toBeNull()
      expect(
        screen.getByText(/Shape bonuses add to tile points/)
      ).toBeInTheDocument()
    }
  )

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
