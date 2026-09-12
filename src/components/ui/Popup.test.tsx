import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AlertPopup, ConfirmPopup, Popup } from './Popup'

describe('ConfirmPopup', () => {
  it('centers its title across the popup', () => {
    render(
      <ConfirmPopup
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Exit Game"
        message="Your current run progress will be lost."
      />
    )

    const title = screen.getByRole('heading', { name: 'Exit Game' })

    expect(title).toHaveClass('w-full', 'text-center')
    expect(title.parentElement).toHaveClass('justify-center')
  })

  it('names and describes a modal, initially focusing the safe action', () => {
    render(
      <ConfirmPopup
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Exit"
        message="Progress will be lost."
      />
    )
    const dialog = screen.getByRole('dialog', { name: 'Exit' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Progress will be lost.')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('does not reset focus when callbacks change and restores the opener when closed', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const { rerender } = render(
      <ConfirmPopup
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Exit"
        message="Warning"
      />
    )
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    confirm.focus()
    rerender(
      <ConfirmPopup
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Exit"
        message="New warning"
      />
    )
    expect(confirm).toHaveFocus()
    rerender(
      <ConfirmPopup
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Exit"
        message="Warning"
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('wraps Tab around enabled visible controls only', () => {
    render(
      <Popup isOpen onClose={vi.fn()} title="Controls" showCloseButton={false}>
        <button disabled>Disabled</button>
        <div style={{ display: 'none' }}>
          <button>Hidden</button>
        </div>
        <button>First</button>
        <button>Last</button>
        <button tabIndex={-1}>Not in tab order</button>
      </Popup>
    )
    const dialog = screen.getByRole('dialog')
    const first = screen.getByRole('button', { name: 'First' })
    const last = screen.getByRole('button', { name: 'Last' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(first).toHaveFocus()
  })

  it('routes native cancellation through onClose, never onConfirm', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmPopup
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Exit"
        message="Warning"
      />
    )
    const cancel = new Event('cancel', { cancelable: true })
    fireEvent(screen.getByRole('dialog'), cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('only dismisses when the press starts and ends on an allowed backdrop', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Popup isOpen onClose={onClose} title="Guide">
        <p>Content</p>
      </Popup>
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.pointerDown(screen.getByText('Content'))
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.pointerDown(dialog)
    fireEvent.pointerCancel(dialog)
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledOnce()
    rerender(
      <Popup isOpen onClose={onClose} title="Guide" closeOnBackdrop={false}>
        <p>Content</p>
      </Popup>
    )
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('focuses acknowledgement in an alert and describes its message', () => {
    render(
      <AlertPopup
        isOpen
        onClose={vi.fn()}
        title="Reset complete"
        message="Tutorial reset."
      />
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Tutorial reset.'
    )
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus()
  })
})
