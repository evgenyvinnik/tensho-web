import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DecreeCardCompact } from './DecreeBar'
import { ALL_DECREES } from '../../systems/DecreeSystem'
import { useSettingsStore } from '../../stores/settingsStore'
import { changeLanguage } from '../../i18n'

const owned = {
  ...ALL_DECREES.find((d) => d.id === 'decree-half-suited')!,
  acquiredRound: 1,
  roundsActive: 0,
}

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

it('does not reveal a face-down Eternal name through its disabled sale control', () => {
  render(
    <DecreeCardCompact
      decree={{ ...owned, sticker: { type: 'Eternal' } }}
      faceDown
      onSell={vi.fn()}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Face-down Decree' }))
  expect(
    screen.queryByRole('button', { name: /Half Suited/ })
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Hidden Decree.*cannot be sold/ })
  ).toBeDisabled()
})

it('explains the edition and actual rental fee inside the scroll details', () => {
  render(
    <DecreeCardCompact
      decree={{
        ...owned,
        edition: 'Foil',
        sticker: { type: 'Rental', goldPerRound: 0 },
      }}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Half Suited' }))
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveTextContent('Foil')
  expect(dialog).toHaveTextContent('+50 Chips')
  expect(dialog).toHaveTextContent('Costs 0 gold at the end of each round.')
})

it('shows the live Perishable countdown and distinguishes expiry from temporary suppression', () => {
  const { rerender } = render(
    <DecreeCardCompact
      decree={{ ...owned, sticker: { type: 'Perishable', roundsRemaining: 2 } }}
      disabledByMandate
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Half Suited' }))
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Rounds remaining: 2'
  )
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Disabled by Crimson Heart this hand'
  )
  rerender(
    <DecreeCardCompact
      decree={{
        ...owned,
        isDebuffed: true,
        sticker: { type: 'Perishable', roundsRemaining: 0 },
      }}
    />
  )
  expect(screen.getByRole('dialog')).toHaveTextContent('Expired')
  expect(screen.getByRole('dialog')).not.toHaveTextContent('Crimson Heart')
})

it('opens motion-free details immediately when the app reduces motion', () => {
  useSettingsStore.setState({ reducedMotion: true })
  render(<DecreeCardCompact decree={owned} />)
  fireEvent.click(screen.getByRole('button', { name: 'Half Suited' }))
  expect(screen.getByRole('dialog')).toHaveStyle({
    opacity: '1',
    transform: 'none',
  })
  expect(
    screen.getByRole('button', { name: 'Half Suited' }).querySelector('img')
  ).toHaveStyle({ transform: 'none', transition: 'none' })
})
