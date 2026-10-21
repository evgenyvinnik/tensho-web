import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { BossMandateBadge } from './RunHeader'
import { SHOWDOWN_MANDATE_DEFINITIONS as SHOWDOWN_MANDATES } from '../../config/mandateDefinitions'
import { getMandateIllustration } from '../../utils/assets'

const needle = {
  id: 'the_needle',
  effect: { type: 'single_hand' as const },
  name: 'The Needle',
  description: 'Only one Play this round (REDRAW is still allowed)',
}

const narrowScreen = window.matchMedia

/** Make the tablet-and-up query match, as on an iPad or a desktop. */
function wideScreen() {
  window.matchMedia = ((query: string) => ({
    ...narrowScreen(query),
    matches: query === '(min-width: 640px)',
  })) as typeof window.matchMedia
}

afterEach(() => {
  cleanup()
  window.matchMedia = narrowScreen
})

it('writes the whole Boss rule beside its portrait on wide screens', () => {
  wideScreen()
  const { container } = render(<BossMandateBadge mandate={needle} />)
  const panel = screen.getByRole('region', { name: 'The Needle' })
  expect(panel).toHaveTextContent('Only 1 Play')
  expect(panel).toHaveTextContent(needle.description)
  expect(panel.querySelector('img')).toHaveAttribute(
    'src',
    getMandateIllustration('the_needle')
  )
  expect(panel.querySelector('img')).toHaveAttribute('alt', '')
  // Nothing to open: no button, no popover.
  expect(container.querySelector('button')).toBeNull()
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('keeps the phone badge compact and opens the full rule on tap', () => {
  render(<BossMandateBadge mandate={needle} />)
  const opener = screen.getByRole('button', {
    name: 'The Needle: Only 1 Play',
  })
  expect(opener).toHaveAttribute('aria-haspopup', 'dialog')
  expect(opener).not.toHaveTextContent(needle.description)
  expect(opener.querySelector('img')).toHaveAttribute(
    'src',
    getMandateIllustration('the_needle')
  )
  fireEvent.click(opener)
  const dialog = screen.getByRole('dialog', { name: 'The Needle' })
  expect(dialog).toHaveTextContent(needle.description)
  expect(
    dialog.querySelector(`img[src="${getMandateIllustration('the_needle')}"]`)
  ).toHaveAttribute('alt', '')
})

it.each(SHOWDOWN_MANDATES)('shows $name with its painted portrait', (mandate) => {
  wideScreen()
  render(<BossMandateBadge mandate={mandate} />)
  expect(
    screen
      .getByRole('region', { name: mandate.name })
      .querySelector(`img[src="${getMandateIllustration(mandate.id)}"]`)
  ).not.toBeNull()
})
