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
  it('owns a direct grid item for the Wall even when the control has a tutorial wrapper', () => {
    const { container } = renderActionBar({
      wall: (
        <div data-tutorial="wall">
          <button data-wall-chip>Wall</button>
        </div>
      ),
    })
    const slot = container.querySelector(
      '.gameplay-action-controls > [data-action-wall]'
    )
    expect(slot).not.toBeNull()
    expect(slot?.querySelector('[data-wall-chip]')).toBe(
      screen.getByRole('button', { name: 'Wall' })
    )
  })

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
    expect(
      container.querySelector('[data-free-redraws="2"]')
    ).toHaveTextContent('+2 free')
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

  describe('emergency Turn', () => {
    it('is absent unless one is on offer', () => {
      const { container } = renderActionBar()
      expect(container.querySelector('[data-emergency-turn]')).toBeNull()
    })

    it("takes REDRAW's place on the last Turn, with its price, and buys on tap", () => {
      const onBuyTurn = vi.fn()
      const { container } = renderActionBar({
        turnsLeft: 1,
        emergencyTurn: { cost: 15, affordable: true },
        onBuyTurn,
      })
      const buy = screen.getByRole('button', {
        name: 'Buy one more Turn for 15 Gold',
      })
      expect(buy).toHaveTextContent('+1 Turn')
      expect(buy).toHaveTextContent('15')
      expect(buy).toBeEnabled()
      // Same slot, same bar height: REDRAW is gone, Play hand stays.
      expect(container.querySelector('[data-game-action="redraw"]')).toBeNull()
      expect(buy.parentElement).toBe(
        container.querySelector('.gameplay-action-controls')
      )
      expect(
        buttons().map(
          (button) => button.getAttribute('aria-label') ?? button.textContent
        )
      ).toEqual(['Buy one more Turn for 15 Gold', 'Play hand'])
      fireEvent.click(buy)
      expect(onBuyTurn).toHaveBeenCalledOnce()
    })

    it('leaves REDRAW in place while a free redraw is left', () => {
      const { container } = renderActionBar({
        turnsLeft: 1,
        freeRedraws: 1,
        redrawAllowed: true,
        emergencyTurn: { cost: 15, affordable: true },
      })
      expect(container.querySelector('[data-emergency-turn]')).toBeNull()
      expect(screen.getByRole('button', { name: /REDRAW/ })).toBeEnabled()
    })

    it('stays visible but disabled, with the reason, when Gold is short', () => {
      const onBuyTurn = vi.fn()
      renderActionBar({
        turnsLeft: 1,
        emergencyTurn: { cost: 30, affordable: false },
        onBuyTurn,
      })
      const buy = screen.getByRole('button', {
        name: 'Buy one more Turn for 30 Gold',
      })
      expect(buy).toBeDisabled()
      expect(buy).toHaveAccessibleDescription(
        'Not enough Gold: one more Turn costs 30'
      )
      fireEvent.click(buy)
      expect(onBuyTurn).not.toHaveBeenCalled()
    })

    it('keeps the play reason floating alongside it', () => {
      const { container } = renderActionBar({
        turnsLeft: 1,
        selectedCount: 1,
        playReason: 'Select at least 2 tiles',
        emergencyTurn: { cost: 10, affordable: true },
      })
      expect(container.querySelector('[data-emergency-turn]')).not.toBeNull()
      expect(container.querySelector('[data-action-reason]')).toHaveTextContent(
        'Select at least 2 tiles'
      )
    })

    it('localizes the offer in Japanese', async () => {
      await act(() => changeLanguage('ja'))
      renderActionBar({
        turnsLeft: 1,
        emergencyTurn: { cost: 10, affordable: true },
      })
      expect(
        screen.getByRole('button', {
          name: i18n.t('gameplay.emergencyTurn.label', { cost: '10' }),
        })
      ).toHaveTextContent(i18n.t('gameplay.emergencyTurn.buy'))
    })
  })
})
