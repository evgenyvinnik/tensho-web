import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RoundTypeIndicator } from './RoundTypeIndicator'
import { SHOWDOWN_MANDATE_DEFINITIONS as SHOWDOWN_MANDATES } from '../../config/mandateDefinitions'
import { getMandateIllustration } from '../../utils/assets'

afterEach(cleanup)
it.each(SHOWDOWN_MANDATES)(
  'shows $name in both badge and read-only rule dialog',
  (mandate) => {
    render(
      <RoundTypeIndicator
        roundType="Boss"
        mandateId={mandate.id}
        mandateName={mandate.name}
        mandateDescription={mandate.description}
      />
    )
    const opener = screen.getByRole('button', {
      name: mandate.name,
    })
    expect(opener.querySelector('img')).toHaveAttribute(
      'src',
      getMandateIllustration(mandate.id)
    )
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', {
      name: mandate.name,
    })
    expect(dialog).toHaveAccessibleDescription(mandate.description)
    expect(dialog.querySelector('img')).toHaveAttribute(
      'src',
      getMandateIllustration(mandate.id)
    )
    expect(dialog.querySelector('img')).toHaveAttribute('alt', '')
  }
)
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
