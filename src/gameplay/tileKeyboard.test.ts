import { afterEach, describe, expect, it } from 'vitest'
import {
  focusAfterMove,
  focusTile,
  keyboardActivation,
  moveTileFocus,
  tileInDirection,
} from './tileKeyboard'

/**
 * A felt with `felt` tiles above a rack laid out in rows of `perRow`. Each
 * tile is 40×56 with 4px gaps, so geometry is predictable for Up/Down.
 */
function table(felt: string[], rack: string[], perRow = 4) {
  document.body.innerHTML = `
    <div data-play-zone="felt">${felt
      .map((id) => `<button data-play-tile="${id}">${id}</button>`)
      .join('')}</div>
    <div data-play-zone="hand">${rack
      .map((id) =>
        id.startsWith('slot')
          ? `<span data-rack-slot="${id}"></span>`
          : `<button data-play-tile="${id}">${id}</button>`
      )
      .join('')}</div>`
  const place = (button: Element, x: number, y: number) => {
    button.getBoundingClientRect = () =>
      ({
        left: x,
        top: y,
        right: x + 40,
        bottom: y + 56,
        width: 40,
        height: 56,
        x,
        y,
        toJSON: () => ({}),
      }) as DOMRect
  }
  document
    .querySelectorAll('[data-play-zone="felt"] [data-play-tile]')
    .forEach((button, index) => place(button, 100 + index * 44, 0))
  // Slots keep their place in the rack, so count them when laying out rows.
  ;[
    ...document.querySelectorAll(
      '[data-play-zone="hand"] [data-play-tile], [data-play-zone="hand"] [data-rack-slot]'
    ),
  ].forEach((node, index) =>
    place(node, (index % perRow) * 44, 200 + Math.floor(index / perRow) * 70)
  )
}

const tile = (id: string, zone: 'hand' | 'felt' = 'hand') =>
  document.querySelector<HTMLButtonElement>(
    `[data-play-zone="${zone}"] [data-play-tile="${id}"]`
  )!

afterEach(() => {
  document.body.innerHTML = ''
})

describe('focusAfterMove', () => {
  it('stays in the zone on the next tile, then the previous one', () => {
    table([], ['a', 'b', 'c'])
    expect(focusAfterMove(tile('a'))).toEqual({ zone: 'hand', id: 'b' })
    expect(focusAfterMove(tile('c'))).toEqual({ zone: 'hand', id: 'b' })
  })

  it('skips empty slots and disabled tiles', () => {
    table([], ['a', 'slot-1', 'b', 'c'])
    tile('b').disabled = true
    expect(focusAfterMove(tile('a'))).toEqual({ zone: 'hand', id: 'c' })
  })

  it('follows the tile into the other zone once its own is empty', () => {
    table(['x'], ['a'])
    expect(focusAfterMove(tile('a'))).toEqual({ zone: 'felt', id: 'a' })
    expect(focusAfterMove(tile('x', 'felt'))).toEqual({ zone: 'hand', id: 'x' })
  })
})

describe('focusTile', () => {
  it('focuses the tile in the named zone, and reports a missing one', () => {
    table(['x'], ['a', 'b'])
    expect(focusTile({ zone: 'hand', id: 'b' })).toBe(true)
    expect(document.activeElement).toBe(tile('b'))
    expect(focusTile({ zone: 'felt', id: 'b' })).toBe(false)
    expect(document.activeElement).toBe(tile('b'))
  })
})

describe('keyboardActivation', () => {
  it('treats a click with no pointer detail as keyboard or assistive input', () => {
    table([], ['a'])
    expect(keyboardActivation({ detail: 0 }, tile('a'))).toBe(true)
    expect(keyboardActivation({ detail: 1 }, tile('a'))).toBe(false)
  })
})

describe('tileInDirection', () => {
  it('walks the zone with Left/Right and jumps with Home/End', () => {
    table(['x', 'y'], ['a', 'b', 'c', 'd', 'e'])
    expect(tileInDirection(tile('b'), 'ArrowRight')).toBe(tile('c'))
    expect(tileInDirection(tile('b'), 'ArrowLeft')).toBe(tile('a'))
    expect(tileInDirection(tile('a'), 'ArrowLeft')).toBeNull()
    expect(tileInDirection(tile('c'), 'Home')).toBe(tile('a'))
    expect(tileInDirection(tile('c'), 'End')).toBe(tile('e'))
    expect(tileInDirection(tile('e'), 'End')).toBeNull()
    // Left/Right never leave the zone.
    expect(tileInDirection(tile('y', 'felt'), 'ArrowRight')).toBeNull()
    expect(tileInDirection(tile('a'), 'Enter')).toBeNull()
  })

  it('moves Up/Down to the nearest tile on the next row, across zones', () => {
    // Rack rows: a b c d / e f g h. The felt sits above, starting at x=100.
    table(['x', 'y'], ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(tileInDirection(tile('f'), 'ArrowUp')).toBe(tile('b'))
    expect(tileInDirection(tile('b'), 'ArrowDown')).toBe(tile('f'))
    expect(tileInDirection(tile('h'), 'ArrowDown')).toBeNull()
    // From the rack's top row Up reaches the felt, nearest horizontally.
    expect(tileInDirection(tile('d'), 'ArrowUp')).toBe(tile('y', 'felt'))
    expect(tileInDirection(tile('x', 'felt'), 'ArrowDown')).toBe(tile('c'))
    expect(tileInDirection(tile('x', 'felt'), 'ArrowUp')).toBeNull()
  })
})

describe('moveTileFocus', () => {
  const key = (
    currentTarget: HTMLButtonElement,
    keyName: string,
    modifiers: Partial<
      Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>
    > = {}
  ) => {
    let prevented = false
    moveTileFocus({
      key: keyName,
      currentTarget,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      ...modifiers,
      preventDefault: () => {
        prevented = true
      },
    })
    return prevented
  }

  it('focuses the tile it moves to and claims the key', () => {
    table([], ['a', 'b'])
    expect(key(tile('a'), 'ArrowRight')).toBe(true)
    expect(document.activeElement).toBe(tile('b'))
  })

  it('leaves the key alone when there is nowhere to go or a modifier is held', () => {
    table([], ['a', 'b'])
    tile('a').focus()
    expect(key(tile('a'), 'ArrowLeft')).toBe(false)
    expect(key(tile('a'), 'ArrowRight', { shiftKey: true })).toBe(false)
    expect(key(tile('a'), 'ArrowRight', { metaKey: true })).toBe(false)
    expect(document.activeElement).toBe(tile('a'))
  })
})
