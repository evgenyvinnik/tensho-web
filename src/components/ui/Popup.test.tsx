import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmPopup } from './Popup'

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
})
