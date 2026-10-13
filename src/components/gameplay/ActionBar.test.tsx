import { act, fireEvent, render, screen } from '@testing-library/react'
import type React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n, { changeLanguage } from '../../i18n'
import { ActionBar } from './ActionBar'

function renderActionBar(
  overrides: Partial<React.ComponentProps<typeof ActionBar>> = {}
) {
  return render(
    <ActionBar
      turnsLeft={4}
      freeRedraws={0}
      selectedCount={0}
      playAllowed={false}
      redrawAllowed={false}
      onRedraw={vi.fn()}
      onPlayHand={vi.fn()}
      {...overrides}
    />
  )
}

const buttons = () => screen.getAllByRole('button')

afterEach(async () => {
  await act(() => changeLanguage('en'))
})

describe('ActionBar', () => {
  it('offers exactly two actions, REDRAW and Play hand', () => {
    renderActionBar()
    expect(buttons().map((button) => button.textContent)).toEqual([
      'REDRAW',
      'Play hand',
    ])
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /discard/i })).toBeNull()
  })

  it.each([
    { selectedCount: 0, playAllowed: false },
    { selectedCount: 1, playAllowed: false },
    { selectedCount: 3, playAllowed: true },
    { selectedCount: 6, playAllowed: true, willClear: true },
  ])('keeps the same labels for every selection: %j', (props) => {
    renderActionBar(props)
    expect(
      screen.getByRole('button', { name: 'Play hand' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'REDRAW' })).toBeInTheDocument()
  })

  it('plays and redraws through separate callbacks', () => {
    const onPlayHand = vi.fn()
    const onRedraw = vi.fn()
    renderActionBar({
      selectedCount: 2,
      playAllowed: true,
      redrawAllowed: true,
      onPlayHand,
      onRedraw,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Play hand' }))
    expect(onPlayHand).toHaveBeenCalledOnce()
    expect(onRedraw).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'REDRAW' }))
    expect(onRedraw).toHaveBeenCalledOnce()
  })

  it('disables what the engine forbids and never calls it', () => {
    const onPlayHand = vi.fn()
    const onRedraw = vi.fn()
    renderActionBar({ selectedCount: 2, onPlayHand, onRedraw })
    const play = screen.getByRole('button', { name: 'Play hand' })
    const redraw = screen.getByRole('button', { name: 'REDRAW' })
    expect(play).toBeDisabled()
    expect(redraw).toBeDisabled()
    fireEvent.click(play)
    fireEvent.click(redraw)
    expect(onPlayHand).not.toHaveBeenCalled()
    expect(onRedraw).not.toHaveBeenCalled()
  })

  it('redraws independently of play legality', () => {
    renderActionBar({ selectedCount: 1, redrawAllowed: true })
    expect(screen.getByRole('button', { name: 'REDRAW' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Play hand' })).toBeDisabled()
  })

  it('shows the shared Turns counter', () => {
    const { container } = renderActionBar({ turnsLeft: 1 })
    const counter = container.querySelector('[data-turns-left]')!
    expect(counter).toHaveAttribute('data-turns-left', '1')
    expect(counter).toHaveAttribute('aria-label', '1 Turn left')
    expect(counter).toHaveTextContent('1Turns left')
  })

  it('marks free redraws on the REDRAW button', () => {
    const { container, rerender } = renderActionBar({ freeRedraws: 2 })
    expect(container.querySelector('[data-free-redraws="2"]')).toHaveTextContent(
      '+2 free'
    )
    rerender(
      <ActionBar
        turnsLeft={4}
        freeRedraws={0}
        selectedCount={0}
        playAllowed={false}
        redrawAllowed={false}
        onRedraw={vi.fn()}
        onPlayHand={vi.fn()}
      />
    )
    expect(container.querySelector('[data-free-redraws]')).toBeNull()
  })

  it('explains a blocked play only once tiles are chosen', () => {
    const { container, rerender } = renderActionBar({
      playReason: 'Locked tile: must be played',
    })
    expect(container.querySelector('[data-action-reason]')).toBeNull()

    rerender(
      <ActionBar
        turnsLeft={4}
        freeRedraws={0}
        selectedCount={3}
        playAllowed={false}
        redrawAllowed={false}
        playReason="Locked tile: must be played"
        onRedraw={vi.fn()}
        onPlayHand={vi.fn()}
      />
    )
    const reason = screen.getByRole('status')
    expect(reason).toHaveTextContent('Locked tile: must be played')
    expect(screen.getByRole('button', { name: 'Play hand' })).toHaveAttribute(
      'aria-describedby',
      reason.id
    )
  })

  it('gives the redraw reason as the disabled button title', () => {
    renderActionBar({
      selectedCount: 2,
      redrawReason: 'Not enough Turns to redraw',
    })
    expect(screen.getByRole('button', { name: 'REDRAW' })).toHaveAttribute(
      'title',
      'Not enough Turns to redraw'
    )
  })

  it('glows when the play would clear the round', () => {
    renderActionBar({ selectedCount: 3, playAllowed: true, willClear: true })
    expect(screen.getByRole('button', { name: 'Play hand' }).className).toMatch(
      /shadow-\[/
    )
  })

  it('translates the labels without changing them per selection', async () => {
    await act(() => changeLanguage('es'))
    renderActionBar({ selectedCount: 3, playAllowed: true, turnsLeft: 2 })
    const [redraw, play] = buttons()
    expect(play.textContent).toBe('Jugar mano')
    expect(redraw.textContent).toBe('RECAMBIAR')
    expect(i18n.language).toBe('es')
  })
})
