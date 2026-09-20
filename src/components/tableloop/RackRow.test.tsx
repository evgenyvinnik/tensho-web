import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { RackRow } from './RackRow'

vi.mock('../tiles/TileImage', () => ({
  TileImage: ({
    tile,
    detailsVisible,
  }: {
    tile: Tile
    detailsVisible: boolean
  }) => (
    <span
      data-testid={`details-${tile.id}`}
      data-visible={String(detailsVisible)}
    />
  ),
}))

it.each(['touch', 'pen'])(
  'selects with %s without leaving a focus tooltip, then restores keyboard details',
  (pointerType) => {
    const onToggle = vi.fn()
    const tiles = [
      new Tile(TileSuit.Souzu, 3, 'first'),
      new Tile(TileSuit.Pinzu, 7, 'second'),
    ]
    render(<RackRow tiles={tiles} selectedIds={[]} onToggle={onToggle} />)
    const first = screen.getByTestId('rack-tile-first')
    const down = new Event('pointerdown', { bubbles: true })
    Object.defineProperty(down, 'pointerType', { value: pointerType })
    fireEvent(first, down)
    act(() => first.focus())
    fireEvent.click(first)
    expect(onToggle).toHaveBeenCalledExactlyOnceWith('first')
    expect(screen.getByTestId('details-first')).toHaveAttribute(
      'data-visible',
      'false'
    )
    expect(first).not.toHaveAttribute('aria-describedby')
    fireEvent.keyDown(first, { key: 'Tab' })
    act(() => screen.getByTestId('rack-tile-second').focus())
    expect(screen.getByTestId('details-second')).toHaveAttribute(
      'data-visible',
      'true'
    )
    expect(screen.getByTestId('rack-tile-second')).toHaveAttribute(
      'aria-describedby'
    )
  }
)
