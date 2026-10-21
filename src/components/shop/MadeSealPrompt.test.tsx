import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { eventBus } from '../../game/EventBus'
import { FATE_SEALS, FateSealSystem } from '../../systems/FateSealSystem'
import { MadeSealPrompt } from './MadeSealPrompt'

const seal = (id: string) =>
  FateSealSystem.createFateSealInstance(FATE_SEALS[id])
const wall = [
  new Tile(TileSuit.Manzu, 1, 'm1'),
  new Tile(TileSuit.Pinzu, 2, 'p2'),
]

afterEach(() => eventBus.clear())

it('asks for the wall tiles at once, with no way to keep the Seal', () => {
  const glass = seal('seal_of_glass')
  const settle = vi.fn(() => null)
  const onUsed = vi.fn()
  render(
    <MadeSealPrompt
      seals={[glass]}
      wall={wall}
      settle={settle}
      onUsed={onUsed}
    />
  )
  const dialog = screen.getByRole('dialog', { name: 'Seal of Glass' })
  expect(
    within(dialog).queryByRole('button', { name: 'Cancel' })
  ).not.toBeInTheDocument()
  expect(
    within(dialog).queryByRole('button', { name: 'Close' })
  ).not.toBeInTheDocument()
  fireEvent.click(within(dialog).getByRole('button', { name: '2 of Circles' }))
  fireEvent.click(dialog.querySelector('[data-seal-wall-confirm]')!)
  expect(settle).toHaveBeenCalledExactlyOnceWith(glass.instanceId, ['p2'])
  expect(onUsed).toHaveBeenCalledExactlyOnceWith([
    { seal: glass, changes: [expect.objectContaining({ before: wall[1] })] },
  ])
})

it('waits while another dialog has the screen', () => {
  render(
    <MadeSealPrompt
      seals={[seal('seal_of_glass')]}
      wall={wall}
      paused
      settle={vi.fn(() => null)}
      onUsed={vi.fn()}
    />
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('announces a made Seal that worked without tiles, after its maker', async () => {
  const onUsed = vi.fn()
  render(
    <MadeSealPrompt seals={[]} wall={wall} settle={vi.fn()} onUsed={onUsed} />
  )
  act(() => {
    eventBus.emit('fateSealUsed', {
      sealId: 'seal_of_the_hermit',
      effect: '',
      source: 'generated',
    })
    // A bought Seal is announced by the screen that sold it.
    eventBus.emit('fateSealUsed', {
      sealId: 'seal_of_wealth',
      effect: '',
      source: 'purchase',
    })
    expect(onUsed).not.toHaveBeenCalled()
  })
  await act(async () => {})
  expect(onUsed).toHaveBeenCalledExactlyOnceWith([
    {
      seal: expect.objectContaining({ id: 'seal_of_the_hermit' }),
      changes: [],
    },
  ])
})
