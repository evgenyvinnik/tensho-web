import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ConsumableDialog } from './ConsumableDialog'

it.each([false, true])(
  'restores focus safely when the inventory trigger disappears: %s',
  (spent) => {
    const wall = createRef<HTMLButtonElement>()
    const onUse = vi.fn(() => ({ success: true, effects: [] }))
    const view = (open: boolean, owned: boolean) => (
      <>
        {owned && <button>Owned item</button>}
        <button ref={wall}>Wall</button>
        {open && (
          <ConsumableDialog
            title="Items"
            items={[]}
            tiles={[]}
            concealedIds={new Set()}
            canUse={() => false}
            onUse={onUse}
            onClose={() => {}}
            fallbackFocusRef={wall}
          />
        )}
      </>
    )
    const { rerender } = render(view(false, true))
    const trigger = screen.getByRole('button', { name: 'Owned item' })
    trigger.focus()
    rerender(view(true, true))
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    // A live inventory update must not move focus behind the modal.
    rerender(view(true, !spent))
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    rerender(view(false, !spent))
    expect(spent ? wall.current : trigger).toHaveFocus()
    expect(onUse).not.toHaveBeenCalled()
  }
)
