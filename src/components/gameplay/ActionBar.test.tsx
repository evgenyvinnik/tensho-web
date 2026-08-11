import { render, screen } from '@testing-library/react'
import type { TFunction } from 'i18next'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ActionBar } from './ActionBar'

const t = ((key: string) => key) as TFunction

function renderActionBar(
  overrides: Partial<React.ComponentProps<typeof ActionBar>> = {}
) {
  return render(
    <ActionBar
      wallRemaining={114}
      handsRemaining={4}
      discardsRemaining={3}
      redrawsRemaining={3}
      selectedTileCount={0}
      handTileCount={14}
      currentRound={1}
      onSkip={vi.fn()}
      onRedraw={vi.fn()}
      onPlayHand={vi.fn()}
      projectedScore={181}
      t={t}
      {...overrides}
    />
  )
}

describe('ActionBar play action', () => {
  it('makes the full-hand fallback explicit when nothing is selected', () => {
    renderActionBar()

    const play = screen.getByRole('button', {
      name: /Play all 14 tiles for a forecast of 181 points/i,
    })

    expect(play).toBeEnabled()
    expect(play).toHaveTextContent('PLAY ALL')
  })

  it('asks for one more tile when only one is selected', () => {
    renderActionBar({ selectedTileCount: 1, projectedScore: undefined })

    const play = screen.getByRole('button', {
      name: 'Select one more tile before playing',
    })

    expect(play).toBeDisabled()
    expect(play).toHaveTextContent('SELECT 1 MORE')
  })

  it('shows how many selected tiles will be played', () => {
    renderActionBar({ selectedTileCount: 3 })

    const play = screen.getByRole('button', {
      name: /Play 3 selected tiles/i,
    })

    expect(play).toBeEnabled()
    expect(play).toHaveTextContent('PLAY 3')
  })

  it('describes a winning forecast without renaming the action to Clear', () => {
    renderActionBar({ willClear: true })

    const play = screen.getByRole('button', {
      name: /enough to win the round/i,
    })

    expect(play).toHaveTextContent('PLAY ALL')
    expect(play).toHaveTextContent('Wins round')
    expect(play).not.toHaveTextContent(/^CLEAR$/)
  })
})
