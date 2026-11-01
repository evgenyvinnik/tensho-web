import { fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AnchoredPopover } from './AnchoredPopover'

function Harness({ onPointerLeave }: { onPointerLeave: () => void }) {
  const anchor = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={anchor}>Jade Tablet, 4 Gold</button>
      <AnchoredPopover
        open
        anchorRef={anchor}
        title="Jade Tablet"
        onClose={vi.fn()}
        onPointerLeave={onPointerLeave}
        footer={<button>Buy · 4 Gold</button>}
      >
        <p>+50 Points</p>
      </AnchoredPopover>
    </>
  )
}

describe('AnchoredPopover', () => {
  it('pins its actions to the bottom edge, after the details', () => {
    render(<Harness onPointerLeave={vi.fn()} />)
    const panel = screen.getByRole('dialog', { name: 'Jade Tablet' })
    const footer = panel.querySelector('[data-popover-footer]')
    expect(footer).toHaveClass('sticky')
    expect(panel.lastElementChild).toBe(footer)
    expect(footer).toContainElement(
      screen.getByRole('button', { name: 'Buy · 4 Gold' })
    )
  })

  it('closes on hover-out for a mouse only: a finger leaves on every lift and scroll', () => {
    const leave = vi.fn()
    render(<Harness onPointerLeave={leave} />)
    const panel = screen.getByRole('dialog', { name: 'Jade Tablet' })
    fireEvent.pointerLeave(panel, { pointerType: 'touch' })
    expect(leave).not.toHaveBeenCalled()
    fireEvent.pointerLeave(panel, { pointerType: 'mouse' })
    expect(leave).toHaveBeenCalledOnce()
  })
})
