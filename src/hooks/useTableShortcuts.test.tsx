import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  shortcutLetter,
  useTableShortcuts,
  type TableShortcutActions,
} from './useTableShortcuts'

function press(
  init: KeyboardEventInit & { key: string },
  target: EventTarget = window
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

function setup(enabled = true, overrides: TableShortcutActions = {}) {
  const actions = {
    onPlay: vi.fn(),
    onRedraw: vi.fn(),
    onToggleAll: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  }
  const hook = renderHook(({ on, a }) => useTableShortcuts(on, a), {
    initialProps: { on: enabled, a: actions as TableShortcutActions },
  })
  return { actions, hook }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('shortcutLetter', () => {
  it('reads the typed letter, then the physical key on other layouts', () => {
    expect(shortcutLetter({ key: 'p', code: 'KeyP' })).toBe('P')
    // AZERTY: the key labelled A sits where QWERTY has Q.
    expect(shortcutLetter({ key: 'a', code: 'KeyQ' })).toBe('A')
    // Russian and Thai layouts type their own letters on the same keys.
    expect(shortcutLetter({ key: 'з', code: 'KeyP' })).toBe('P')
    expect(shortcutLetter({ key: 'ร', code: 'KeyI' })).toBe('I')
    expect(shortcutLetter({ key: 'Enter', code: 'Enter' })).toBeNull()
    expect(shortcutLetter({ key: '1', code: 'Digit1' })).toBeNull()
  })
})

describe('useTableShortcuts', () => {
  it('maps P, R, A and Escape to their actions and claims the key', () => {
    const { actions } = setup()
    expect(press({ key: 'p', code: 'KeyP' }).defaultPrevented).toBe(true)
    press({ key: 'R', code: 'KeyR' })
    press({ key: 'a', code: 'KeyA' })
    press({ key: 'Escape', code: 'Escape' })
    expect(actions.onPlay).toHaveBeenCalledOnce()
    expect(actions.onRedraw).toHaveBeenCalledOnce()
    expect(actions.onToggleAll).toHaveBeenCalledOnce()
    expect(actions.onClear).toHaveBeenCalledOnce()
  })

  it('leaves the key to the page when its action is unavailable', () => {
    const { actions } = setup(true, { onPlay: null })
    expect(press({ key: 'p', code: 'KeyP' }).defaultPrevented).toBe(false)
    expect(press({ key: 'x', code: 'KeyX' }).defaultPrevented).toBe(false)
    expect(actions.onRedraw).not.toHaveBeenCalled()
  })

  it('uses the latest actions without reinstalling', () => {
    const { actions, hook } = setup()
    const onPlay = vi.fn()
    hook.rerender({ on: true, a: { ...actions, onPlay } })
    press({ key: 'p', code: 'KeyP' })
    expect(onPlay).toHaveBeenCalledOnce()
    expect(actions.onPlay).not.toHaveBeenCalled()
  })

  it('does nothing while turned off', () => {
    const { actions, hook } = setup(false)
    press({ key: 'p', code: 'KeyP' })
    expect(actions.onPlay).not.toHaveBeenCalled()
    hook.rerender({ on: true, a: actions })
    press({ key: 'p', code: 'KeyP' })
    expect(actions.onPlay).toHaveBeenCalledOnce()
    hook.unmount()
    press({ key: 'p', code: 'KeyP' })
    expect(actions.onPlay).toHaveBeenCalledOnce()
  })

  it('ignores modifiers, repeats, compositions and handled keys', () => {
    const { actions } = setup()
    press({ key: 'p', code: 'KeyP', ctrlKey: true })
    press({ key: 'p', code: 'KeyP', metaKey: true })
    press({ key: 'p', code: 'KeyP', altKey: true })
    press({ key: 'P', code: 'KeyP', shiftKey: true })
    press({ key: 'p', code: 'KeyP', repeat: true })
    press({ key: 'p', code: 'KeyP', isComposing: true })
    const handled = new KeyboardEvent('keydown', {
      key: 'p',
      code: 'KeyP',
      cancelable: true,
    })
    handled.preventDefault()
    window.dispatchEvent(handled)
    expect(actions.onPlay).not.toHaveBeenCalled()
  })

  it('stands down for text fields, dialogs and the deal', () => {
    const { actions } = setup()
    const input = document.createElement('input')
    document.body.append(input)
    press({ key: 'p', code: 'KeyP' }, input)
    expect(actions.onPlay).not.toHaveBeenCalled()

    for (const blocker of [
      '<dialog open></dialog>',
      '<div role="dialog"></div>',
      '<div role="alertdialog"></div>',
      '<div aria-modal="true"></div>',
      '<div data-wall-draw></div>',
    ]) {
      document.body.innerHTML = blocker
      press({ key: 'p', code: 'KeyP' })
      press({ key: 'Escape', code: 'Escape' })
    }
    expect(actions.onPlay).not.toHaveBeenCalled()
    expect(actions.onClear).not.toHaveBeenCalled()
  })

  it('lets Escape close tile details before it clears the selection', () => {
    const { actions } = setup()
    document.body.innerHTML = '<div role="tooltip">Details</div>'
    press({ key: 'Escape', code: 'Escape' })
    expect(actions.onClear).not.toHaveBeenCalled()
    // Other shortcuts still work while details are showing.
    press({ key: 'p', code: 'KeyP' })
    expect(actions.onPlay).toHaveBeenCalledOnce()
  })
})
