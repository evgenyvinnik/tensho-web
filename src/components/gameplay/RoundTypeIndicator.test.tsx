import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RoundTypeIndicator } from './RoundTypeIndicator'

afterEach(cleanup)
it('opens the illustrated boss rule without making artwork the accessible name', () => {
  render(
    <RoundTypeIndicator
      roundType="Boss"
      mandateId="cerulean_bell"
      mandateName="Campana Cerúlea"
      mandateDescription="El bloqueo anterior se libera."
    />
  )
  const control = screen.getByRole('button', { name: 'Campana Cerúlea' })
  expect(control).toHaveAttribute('aria-haspopup', 'dialog')
  expect(control.querySelector('img')).toHaveAttribute('alt', '')
  fireEvent.click(control)
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Campana Cerúlea')
  expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
    'El bloqueo anterior se libera.'
  )
})
it('does not show Bell art on an unrelated mandate or a non-boss round without a mandate', () => {
  const { container, rerender } = render(
    <RoundTypeIndicator
      roundType="Boss"
      mandateId="the_hook"
      mandateName="The Hook"
      mandateDescription="Draw rule"
    />
  )
  expect(container.querySelector('img')).toBeNull()
  rerender(<RoundTypeIndicator roundType="Small" />)
  expect(screen.queryByRole('button')).toBeNull()
})
