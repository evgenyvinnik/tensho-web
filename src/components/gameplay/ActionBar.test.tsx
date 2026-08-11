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
      isCompleteHandSelection={false}
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
  it('requires a tactical selection when the hand is incomplete', () => {
    renderActionBar()

    const play = screen.getByRole('button', {
      name: /Select 2 to 5 tiles for a tactical play/i,
    })

    expect(play).toBeDisabled()
    expect(play).toHaveTextContent('SELECT 2–5')
  })

  it('stages a complete hand before it can be confirmed', () => {
    renderActionBar({ isCompleteHandSelection: true })

    const play = screen.getByRole('button', {
      name: /Move all 14 tiles to the board for confirmation/i,
    })

    expect(play).toBeEnabled()
    expect(play).toHaveTextContent('STAGE HAND')
  })

  it('asks for confirmation after a complete hand is staged', () => {
    renderActionBar({
      selectedTileCount: 14,
      isCompleteHandSelection: true,
    })

    const play = screen.getByRole('button', {
      name: /Confirm the complete 14-tile hand/i,
    })

    expect(play).toBeEnabled()
    expect(play).toHaveTextContent('CONFIRM HAND')
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

  it('rejects oversized selections that are not complete hands', () => {
    renderActionBar({
      selectedTileCount: 6,
      projectedScore: undefined,
    })

    const play = screen.getByRole('button', {
      name: /not a complete hand/i,
    })

    expect(play).toBeDisabled()
    expect(play).toHaveTextContent('NOT COMPLETE')
  })

  it('describes a winning tactical forecast without renaming the action', () => {
    renderActionBar({ selectedTileCount: 3, willClear: true })

    const play = screen.getByRole('button', {
      name: /enough to win the round/i,
    })

    expect(play).toHaveTextContent('PLAY 3')
    expect(play).toHaveTextContent('Wins round')
    expect(play).not.toHaveTextContent(/^CLEAR$/)
  })

  it('reflects an exact-size Boss Mandate before enabling play', () => {
    renderActionBar({
      selectedTileCount: 3,
      requiredPlaySize: 5,
      projectedScore: undefined,
    })

    const play = screen.getByRole('button', {
      name: /Select 2 more tiles to meet the Boss Mandate/i,
    })

    expect(play).toBeDisabled()
    expect(play).toHaveTextContent('SELECT 2 MORE')
  })
})
