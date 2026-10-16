import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { HandRack } from './HandRack'

const tiles = [1, 2, 3, 4, 5].map(
  (rank) => new Tile(TileSuit.Manzu, rank, `m${rank}`)
)
const ids = (zone: Element | null) =>
  [...(zone?.querySelectorAll('[data-play-tile]') ?? [])].map((node) =>
    node.getAttribute('data-play-tile')
  )

describe('HandRack and the felt', () => {
  it('keeps every tile in the rack, and no felt, while nothing is picked', () => {
    const { container } = render(
      <HandRack tiles={tiles} selectedIds={new Set()} onToggle={vi.fn()} />
    )
    expect(container.querySelector('[data-play-zone="felt"]')).toBeNull()
    const rack = container.querySelector('[data-play-zone="hand"]')
    expect(ids(rack)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5'])
    for (const button of within(rack as HTMLElement).getAllByRole('button'))
      expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('lays picked tiles on the felt in pick order and holds their rack slots', () => {
    const { container } = render(
      <HandRack
        tiles={tiles}
        selectedIds={new Set(['m4', 'm2'])}
        onToggle={vi.fn()}
      />
    )
    const felt = screen.getByRole('group', { name: 'Tiles to play' })
    expect(felt).toHaveAttribute('data-play-zone', 'felt')
    expect(ids(felt)).toEqual(['m4', 'm2'])
    for (const button of within(felt).getAllByRole('button'))
      expect(button).toHaveAttribute('aria-pressed', 'true')
    const rack = container.querySelector('[data-play-zone="hand"]')!
    expect(ids(rack)).toEqual(['m1', 'm3', 'm5'])
    // Empty slots keep the rack exactly where it was.
    expect(
      [...rack.querySelectorAll('[data-play-tile], [data-rack-slot]')].map(
        (node) =>
          node.getAttribute('data-play-tile') ??
          `slot:${node.getAttribute('data-rack-slot')}`
      )
    ).toEqual(['m1', 'slot:m2', 'm3', 'slot:m4', 'm5'])
    for (const slot of rack.querySelectorAll('[data-rack-slot]'))
      expect(slot).toHaveAttribute('aria-hidden', 'true')
  })

  it('moves a tile either way with one tap', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <HandRack tiles={tiles} selectedIds={new Set(['m2'])} onToggle={onToggle} />
    )
    fireEvent.click(
      container.querySelector('[data-play-zone="hand"] [data-play-tile="m3"]')!
    )
    expect(onToggle).toHaveBeenLastCalledWith(tiles[2])
    fireEvent.click(
      container.querySelector('[data-play-zone="felt"] [data-play-tile="m2"]')!
    )
    expect(onToggle).toHaveBeenLastCalledWith(tiles[1])
  })

  it('locks both zones while the table is closed', () => {
    render(
      <HandRack
        tiles={tiles}
        selectedIds={new Set(['m1'])}
        onToggle={vi.fn()}
        disabled
      />
    )
    for (const button of screen.getAllByRole('button'))
      expect(button).toBeDisabled()
  })
})
