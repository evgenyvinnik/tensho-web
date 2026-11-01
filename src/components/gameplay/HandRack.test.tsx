import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { HINT_FADE_DELAY_MS, HINT_FADE_MS, HandRack } from './HandRack'
import { useSettingsStore } from '../../stores/settingsStore'

const tiles = [1, 2, 3, 4, 5].map(
  (rank) => new Tile(TileSuit.Manzu, rank, `m${rank}`)
)
const ids = (zone: Element | null) =>
  [...(zone?.querySelectorAll('[data-play-tile]') ?? [])].map((node) =>
    node.getAttribute('data-play-tile')
  )

afterEach(() => {
  act(() => useSettingsStore.setState({ reducedMotion: false }))
})

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
      <HandRack
        tiles={tiles}
        selectedIds={new Set(['m2'])}
        onToggle={onToggle}
      />
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

  it('holds the group brackets back during the deal, then fades them in after a beat', () => {
    useSettingsStore.setState({ reducedMotion: false })
    const pair = [
      new Tile(TileSuit.Pinzu, 5, 'p5a'),
      new Tile(TileSuit.Pinzu, 5, 'p5b'),
    ]
    const props = {
      tiles: pair,
      selectedIds: new Set<string>(),
      onToggle: vi.fn(),
    }
    const { container, rerender } = render(
      <HandRack {...props} groupRules={{}} hintsHeld />
    )
    const label = () =>
      container.querySelector<HTMLElement>('[data-hand-group-label]')!
    // The bracket keeps its place but shows nothing while tiles fly in.
    expect(label()).toHaveAttribute('data-hint-held', 'true')
    expect(label().style.opacity).toBe('0')
    expect(label().style.transition).toBe('none')

    rerender(<HandRack {...props} groupRules={{}} hintsHeld={false} />)
    expect(label()).not.toHaveAttribute('data-hint-held')
    expect(label().style.opacity).toBe('1')
    expect(label().style.transition).toBe(
      `opacity ${HINT_FADE_MS}ms ease-out ${HINT_FADE_DELAY_MS}ms`
    )
  })

  it('shows the brackets at once with reduced motion', () => {
    useSettingsStore.setState({ reducedMotion: true })
    const pair = [
      new Tile(TileSuit.Pinzu, 5, 'p5a'),
      new Tile(TileSuit.Pinzu, 5, 'p5b'),
    ]
    const { container } = render(
      <HandRack
        tiles={pair}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        groupRules={{}}
      />
    )
    const label = container.querySelector<HTMLElement>(
      '[data-hand-group-label]'
    )!
    expect(label.style.opacity).toBe('1')
    expect(label.style.transition).toBe('none')
  })

  describe('keyboard focus', () => {
    /** A rack whose selection follows its own toggles, like the table's. */
    function LiveRack() {
      const [selected, setSelected] = useState<string[]>([])
      return (
        <HandRack
          tiles={tiles}
          selectedIds={new Set(selected)}
          onToggle={(tile) =>
            setSelected((ids) =>
              ids.includes(tile.id)
                ? ids.filter((id) => id !== tile.id)
                : [...ids, tile.id]
            )
          }
        />
      )
    }
    const tile = (zone: 'hand' | 'felt', id: string) =>
      document.querySelector<HTMLButtonElement>(
        `[data-play-zone="${zone}"] [data-play-tile="${id}"]`
      )!
    const focused = () => {
      const active = document.activeElement as HTMLElement
      return `${active.closest('[data-play-zone]')?.getAttribute('data-play-zone')}:${active.dataset.playTile}`
    }

    it('keeps its place in the rack, then follows the last tile to the felt', () => {
      render(<LiveRack />)
      // Enter or Space on a button is a click with no pointer detail.
      for (const [id, next] of [
        ['m1', 'hand:m2'],
        ['m2', 'hand:m3'],
        ['m3', 'hand:m4'],
        ['m4', 'hand:m5'],
        ['m5', 'felt:m5'],
      ]) {
        tile('hand', id).focus()
        fireEvent.click(tile('hand', id))
        expect(focused()).toBe(next)
      }
      // Back from the felt: the neighbouring felt tile, then the rack.
      fireEvent.click(tile('felt', 'm5'))
      expect(focused()).toBe('felt:m4')
      for (const id of ['m4', 'm3', 'm2']) fireEvent.click(tile('felt', id))
      expect(focused()).toBe('felt:m1')
      fireEvent.click(tile('felt', 'm1'))
      expect(focused()).toBe('hand:m1')
    })

    it('moves between tiles with the arrow keys', () => {
      render(<LiveRack />)
      tile('hand', 'm2').focus()
      fireEvent.keyDown(tile('hand', 'm2'), { key: 'ArrowRight' })
      expect(focused()).toBe('hand:m3')
      fireEvent.keyDown(tile('hand', 'm3'), { key: 'End' })
      expect(focused()).toBe('hand:m5')
      fireEvent.keyDown(tile('hand', 'm5'), { key: 'Home' })
      expect(focused()).toBe('hand:m1')
    })

    it('leaves focus alone for a tap or mouse click', () => {
      render(<LiveRack />)
      const button = tile('hand', 'm2')
      button.focus()
      fireEvent.click(button, { detail: 1 })
      expect(tile('felt', 'm2')).toBeTruthy()
      expect(document.activeElement).toBe(document.body)
    })
  })
})
