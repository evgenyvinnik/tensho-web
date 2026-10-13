import { useLayoutEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { useGameController } from './useGameController'
import { eventBus } from './EventBus'

afterEach(() => eventBus.clear())

it('renders the Turn a REDRAW spends', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  Object.assign(game.getState(), { redrawsRemaining: 0 })
  function TurnsView() {
    const controller = useGameController(game)
    return <output>{controller.state.handsRemaining}</output>
  }
  const view = render(<TurnsView />)
  const turns = game.getState().handsRemaining
  expect(screen.getByRole('status')).toHaveTextContent(String(turns))
  act(() => {
    expect(
      game.processAction({
        type: 'redraw',
        tileIds: [game.getHandTiles()[0].id],
      }).success
    ).toBe(true)
  })
  expect(screen.getByRole('status')).toHaveTextContent(String(turns - 1))
  view.unmount()
})

it('catches an update between the first render and subscribing to the game', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  function ShopView() {
    const controller = useGameController(game)
    useLayoutEffect(() => {
      // Commit-time delivery deliberately lands before passive subscriptions.
      // The view must not wait for another unrelated event to become current.
      Object.assign(game.getState(), { gold: 17, phase: 'shop' })
      eventBus.emit('shopUpdated', { isOpen: true })
    }, [])
    return (
      <output>
        {controller.phase}:{controller.gold}
      </output>
    )
  }
  const view = render(<ShopView />)
  expect(screen.getByRole('status')).toHaveTextContent('shop:17')
  act(() => {
    Object.assign(game.getState(), { gold: 12 })
    eventBus.emit('goldChanged', {
      previousGold: 17,
      newGold: 12,
      delta: -5,
      reason: 'test',
    })
  })
  expect(screen.getByRole('status')).toHaveTextContent('shop:12')
  view.unmount()
})
