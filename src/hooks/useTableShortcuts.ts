/**
 * useTableShortcuts
 *
 * One-key shortcuts for the Classic table, for players at a keyboard
 * (desktop, or an iPad with a keyboard):
 *
 *   P    Play hand
 *   R    REDRAW
 *   A    Select all / Clear all
 *   Esc  Put every tile back in the rack
 *
 * Letters are matched by the character typed, then by the physical key, so
 * they work on AZERTY and on non-Latin layouts (Russian, Thai) alike. They
 * stand down while anything else owns the keyboard: a text field, an open
 * dialog or popover, the deal, an IME composition, or a modifier key. Escape
 * also waits while tile details are showing, since Escape closes those first.
 *
 * Single-character shortcuts can be turned off in Settings (WCAG 2.1.4).
 *
 * @module hooks/useTableShortcuts
 */

import { useEffect, useRef } from 'react'

/** The key shown on each control, also used for `aria-keyshortcuts`. */
export const TABLE_SHORTCUTS = {
  play: 'P',
  redraw: 'R',
  selectAll: 'A',
  clear: 'Escape',
} as const

export interface TableShortcutActions {
  /** Called only when the action is currently allowed. */
  onPlay?: (() => void) | null
  onRedraw?: (() => void) | null
  onToggleAll?: (() => void) | null
  onClear?: (() => void) | null
}

/** Something other than the table owns the keyboard right now. */
const BLOCKERS =
  'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-wall-draw]'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.matches('input, textarea, select, [contenteditable="true"]')
  )
}

/** The Latin letter a key event stands for, whatever the keyboard layout. */
export function shortcutLetter(event: {
  key: string
  code: string
}): string | null {
  if (/^[a-z]$/i.test(event.key)) return event.key.toUpperCase()
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3)
  return null
}

export function useTableShortcuts(
  enabled: boolean,
  actions: TableShortcutActions
): void {
  // The listener is installed once per `enabled`; actions change every render.
  const latest = useRef(actions)
  useEffect(() => {
    latest.current = actions
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditable(event.target) ||
        document.querySelector(BLOCKERS)
      )
        return
      const { onPlay, onRedraw, onToggleAll, onClear } = latest.current
      let action: (() => void) | null | undefined
      if (event.key === 'Escape') {
        // Escape closes tile details before it touches the selection.
        if (document.querySelector('[role="tooltip"]')) return
        action = onClear
      } else {
        const letter = shortcutLetter(event)
        if (letter === TABLE_SHORTCUTS.play) action = onPlay
        else if (letter === TABLE_SHORTCUTS.redraw) action = onRedraw
        else if (letter === TABLE_SHORTCUTS.selectAll) action = onToggleAll
      }
      if (!action) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
