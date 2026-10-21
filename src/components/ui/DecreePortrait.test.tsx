import { render, fireEvent, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { DecreeArtwork } from './DecreeArtwork'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { OfferArt } from '../shop/OfferArt'
import { STARTER_DECREES } from '../../systems/DecreeSystem'
import type { DecreeEdition, OwnedDecree } from '../../systems/types'
import { getDecreeIllustration } from '../../utils/assets'

const editions: DecreeEdition[] = [
  'Foil',
  'Holographic',
  'Polychrome',
  'Negative',
]
const decree: OwnedDecree = {
  ...STARTER_DECREES[0],
  acquiredRound: 1,
  roundsActive: 0,
}

it.each(editions)(
  'renders %s without replacing the underlying Decree identity',
  (edition) => {
    const { container } = render(
      <DecreeArtwork decreeId={decree.id} edition={edition} />
    )
    expect(container.querySelector('.decree-portrait__image')).toHaveAttribute(
      'src',
      getDecreeIllustration(decree.id)
    )
    const frame = container.querySelector(
      `[data-decree-edition-frame="${edition}"]`
    )!
    expect(frame).toHaveAttribute('aria-hidden', 'true')
    const bytes = readFileSync(`public${frame.getAttribute('src')}`)
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
    expect(bytes[20] & 0x10).toBe(0x10)
    expect(bytes.readUIntLE(24, 3) + 1).toBe(224)
    expect(bytes.readUIntLE(27, 3) + 1).toBe(224)
    expect(bytes.length).toBeLessThan(24_000)
  }
)

it('keeps ordinary artwork plain and removes all edition clues face-down', () => {
  const { container, rerender } = render(<DecreeCardCompact decree={decree} />)
  expect(container.querySelector('[data-decree-edition-frame]')).toBeNull()
  rerender(<DecreeCardCompact decree={{ ...decree, edition: 'Foil' }} />)
  expect(
    container.querySelector('[data-decree-edition-frame="Foil"]')
  ).not.toBeNull()
  fireEvent.focus(screen.getByRole('button'))
  expect(
    screen
      .getByRole('dialog')
      .querySelector('[data-decree-edition-frame="Foil"]')
  ).not.toBeNull()
  rerender(
    <DecreeCardCompact decree={{ ...decree, edition: 'Foil' }} faceDown />
  )
  expect(document.querySelector('[data-decree-edition-frame]')).toBeNull()
  expect(screen.getByRole('button')).toHaveAccessibleName('Face-down Decree')
})

it('reads the shop edition fallback, but gives the actual copy precedence', () => {
  const { container, rerender } = render(
    <OfferArt
      offering={{ itemType: 'Decree', item: decree, edition: 'Holographic' }}
    />
  )
  expect(
    container.querySelector('[data-decree-edition-frame="Holographic"]')
  ).not.toBeNull()
  rerender(
    <OfferArt
      offering={{
        itemType: 'Decree',
        item: { ...decree, edition: 'Negative' },
        edition: 'Foil',
      }}
    />
  )
  expect(
    container.querySelector('[data-decree-edition-frame="Negative"]')
  ).not.toBeNull()
  expect(
    container.querySelector('[data-decree-edition-frame="Foil"]')
  ).toBeNull()
})
