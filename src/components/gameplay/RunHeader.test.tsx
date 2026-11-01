import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { BossMandateBadge, RunHeader, StakeBadge } from './RunHeader'
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

it('opens the Stake rules on tap, so a phone player can read them', () => {
  render(<StakeBadge stake={2} />)
  const opener = screen.getByRole('button', {
    name: 'Red Stake · Active rules',
  })
  expect(opener).toHaveAttribute('aria-haspopup', 'dialog')
  expect(opener).toHaveTextContent('2')
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(opener)
  const dialog = screen.getByRole('dialog', { name: 'Red Stake' })
  expect(dialog).toHaveTextContent('No reward gold from Small Rounds.')
  expect(dialog).toHaveTextContent('Boss targets: 20% higher from Act 2.')
  expect(dialog).toHaveTextContent('Emergency Turns from Act 2')
  expect(dialog).toHaveTextContent(
    'Higher tiers include the earlier tiers’ rules.'
  )
})

it('lists every cumulative rule at the top Stake and the base rule on White', () => {
  const { unmount } = render(<StakeBadge stake={8} />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Gold Stake · Active rules' })
  )
  const dialog = screen.getByRole('dialog', { name: 'Gold Stake' })
  expect(dialog.querySelectorAll('li')).toHaveLength(8)
  unmount()
  render(<StakeBadge stake={1} />)
  fireEvent.click(
    screen.getByRole('button', { name: 'White Stake · Active rules' })
  )
  const white = screen.getByRole('dialog', { name: 'White Stake' })
  expect(white).toHaveTextContent('Base difficulty: no added penalties.')
  expect(white).not.toHaveTextContent('Higher tiers')
  expect(white).not.toHaveTextContent('Emergency Turns')
})

it('shows the Stake in the run header instead of hiding it in the Gold tooltip', () => {
  render(
    <RunHeader
      gold={12}
      stake={3}
      currentAct={2}
      hasEnteredEndless={false}
      roundType="Small"
      score={0}
      target={873}
      onHelp={() => {}}
      onExit={() => {}}
      onSettings={() => {}}
    />
  )
  expect(
    screen.getByRole('button', { name: 'Green Stake · Active rules' })
  ).toBeInTheDocument()
  expect(document.querySelector('[data-tutorial="gold"]')).not.toHaveAttribute(
    'title'
  )
})
