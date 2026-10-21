import { describe, expect, it } from 'vitest'
import { loneTileFix, type RackItem } from './useNoLoneTile'

const GAP = 4
const tile: RackItem = { width: 44, tiles: 1 }
const spacer: RackItem = { width: 8, tiles: 0 }
const group = (tiles: number): RackItem => ({
  width: tiles * 44 + (tiles - 1) * 4 + 4,
  tiles,
})
const tiles = (count: number) => Array.from({ length: count }, () => tile)

/** Tiles per row once the fix's margins are applied, as flexbox wraps them. */
function rows(items: RackItem[], available: number): number[] {
  const fix = loneTileFix(items, GAP, available)
  const sized = items.map((item, index) => ({
    ...item,
    width:
      item.width +
      (fix && (index === fix.index || index === items.length - 1)
        ? fix.margin
        : 0),
  }))
  const lines: { width: number; tiles: number }[] = []
  for (const item of sized) {
    const line = lines[lines.length - 1]
    if (line && line.width + GAP + item.width <= available) {
      line.width += GAP + item.width
      line.tiles += item.tiles
    } else lines.push({ width: item.width, tiles: item.tiles })
  }
  return lines.map((line) => line.tiles)
}

describe('loneTileFix', () => {
  it('leaves a rack that fits one row alone', () => {
    expect(loneTileFix(tiles(7), GAP, 340)).toBeNull()
  })

  it('leaves a last row that already holds two tiles alone', () => {
    expect(loneTileFix(tiles(9), GAP, 340)).toBeNull()
    expect(rows(tiles(9), 340)).toEqual([7, 2])
  })

  it('brings the lone tile its neighbour, keeping every earlier row', () => {
    // Seven 44px tiles fit a 340px rack row: 15 tiles would wrap 7/7/1.
    expect(loneTileFix(tiles(15), GAP, 340)).toEqual({ index: 13, margin: 9 })
    expect(rows(tiles(15), 340)).toEqual([7, 6, 2])
  })

  it('fixes racks whose rows are all full', () => {
    expect(rows(tiles(16), 250)).toEqual([5, 5, 4, 2])
  })

  it('takes the tile before a suit spacer, and the spacer with it', () => {
    const rack = [...tiles(13), spacer, tile]
    const fix = loneTileFix(rack, GAP, 340)
    expect(fix?.index).toBe(12)
    expect(rows(rack, 340)).toEqual([7, 5, 2])
  })

  it('moves a whole group when it is the neighbour', () => {
    const rack = [...tiles(11), group(3), tile]
    expect(loneTileFix(rack, GAP, 340)?.index).toBe(11)
    expect(rows(rack, 340)).toEqual([7, 4, 4])
  })

  it('gives up when the neighbour and the lone tile cannot share a row', () => {
    // A seven-tile group fills its row by itself.
    const rack = [...tiles(3), group(7), tile]
    expect(loneTileFix(rack, GAP, 340)).toBeNull()
  })

  it('does nothing before the rack has been laid out', () => {
    expect(loneTileFix(tiles(15), GAP, 0)).toBeNull()
  })
})
