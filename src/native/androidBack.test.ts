import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeTopLayer } from './androidBack'

afterEach(() => {
  document.body.replaceChildren()
})

function add<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, value)
  document.body.append(element)
  return element
}

describe('closeTopLayer', () => {
  it('reports nothing open, so the app goes to the background', () => {
    add('main')
    add('div', { role: 'dialog', popover: 'auto' })
    expect(closeTopLayer()).toBe(false)
  })

  it('lets the topmost dialog decide through its cancel event', () => {
    const below = add('dialog')
    const top = add('dialog')
    below.showModal()
    top.showModal()
    const onCancel = vi.fn((event: Event) => event.preventDefault())
    top.addEventListener('cancel', onCancel)

    expect(closeTopLayer()).toBe(true)
    expect(onCancel).toHaveBeenCalledTimes(1)
    // The handler kept it open; its owner closes it through state.
    expect(top.open).toBe(true)
    expect(below.open).toBe(true)
  })

  it('closes a dialog nobody handles, as Escape would', () => {
    const dialog = add('dialog')
    dialog.showModal()
    expect(closeTopLayer()).toBe(true)
    expect(dialog.open).toBe(false)
  })

  it('hides the open popover before reaching overlays', () => {
    const popover = add('div', { role: 'dialog', popover: 'auto' })
    // JSDOM has no popovers; stand in for an open one.
    vi.spyOn(popover, 'matches').mockImplementation(
      (selector: string) => selector === ':popover-open'
    )
    popover.hidePopover = vi.fn()
    const onKey = vi.fn()
    document.addEventListener('keydown', onKey)

    expect(closeTopLayer()).toBe(true)
    expect(popover.hidePopover).toHaveBeenCalledTimes(1)
    expect(onKey).not.toHaveBeenCalled()
    document.removeEventListener('keydown', onKey)
  })

  it('sends Escape from the focused control to an overlay', () => {
    add('div', { role: 'dialog', 'aria-modal': 'true' })
    const button = add('button')
    button.focus()
    const keys: Array<[string, EventTarget | null]> = []
    const onKey = (event: KeyboardEvent) => keys.push([event.key, event.target])
    window.addEventListener('keydown', onKey)

    expect(closeTopLayer()).toBe(true)
    expect(keys).toEqual([['Escape', button]])
    window.removeEventListener('keydown', onKey)
  })
})
