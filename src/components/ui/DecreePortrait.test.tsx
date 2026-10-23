import { render, fireEvent, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { DecreeArtwork } from './DecreeArtwork'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { OfferArt } from '../shop/OfferArt'
import { RIVER_TAX } from '../../systems/DecreeSystem'
import type { DecreeEdition, OwnedDecree } from '../../systems/types'
import { getDecreeIllustration, illustrationAssets } from '../../utils/assets'

const editions: DecreeEdition[] = [
  'Foil',
  'Holographic',
  'Polychrome',
  'Negative',
]
const decree: OwnedDecree = {
  ...RIVER_TAX,
  acquiredRound: 1,
  roundsActive: 0,
}

it.each(editions)(
  'renders the authored %s portrait as one image without a frame',
  (edition) => {
    const { container } = render(
      <DecreeArtwork decreeId={decree.id} edition={edition} />
    )
    const portrait = container.querySelector(
      `[data-decree-edition-portrait="${edition}"]`
    )!
    expect(portrait).toHaveAttribute(
      'src',
      `/assets/illustrations/decree-editions/river_tax/${edition.toLowerCase()}.webp`
    )
    expect(portrait).toHaveAttribute('aria-hidden', 'true')
    expect(portrait).toHaveAttribute('alt', '')
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(container.querySelector('[data-decree-edition-frame]')).toBeNull()
    expect(container.querySelector('.decree-portrait__finish')).toBeNull()
    const bytes = readFileSync(`public${portrait.getAttribute('src')}`)
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
    expect(bytes[20] & 0x10).toBe(0x10)
    expect(bytes.readUIntLE(24, 3) + 1).toBe(256)
    expect(bytes.readUIntLE(27, 3) + 1).toBe(256)
    expect(bytes.length).toBeLessThan(80_000)
  }
)

it('keeps ordinary artwork plain and removes all edition clues face-down', () => {
  const { container, rerender } = render(<DecreeCardCompact decree={decree} />)
  expect(container.querySelector('[data-decree-edition-portrait]')).toBeNull()
  expect(container.querySelector('.decree-portrait__image')).toHaveAttribute(
    'src',
    getDecreeIllustration(decree.id)
  )
  rerender(<DecreeCardCompact decree={{ ...decree, edition: 'Foil' }} />)
  expect(
    container.querySelector('[data-decree-edition-portrait="Foil"]')
  ).not.toBeNull()
  fireEvent.focus(screen.getByRole('button'))
  expect(
    screen
      .getByRole('dialog')
      .querySelector('[data-decree-edition-portrait="Foil"]')
  ).not.toBeNull()
  rerender(
    <DecreeCardCompact decree={{ ...decree, edition: 'Foil' }} faceDown />
  )
  expect(document.querySelector('[data-decree-edition-portrait]')).toBeNull()
  expect(document.querySelector('[data-decree-edition-art="Foil"]')).toBeNull()
  expect(
    container.querySelector('.decree-portrait__image')
  ).not.toHaveAttribute('src', getDecreeIllustration(decree.id))
  expect(screen.getByRole('button')).toHaveAccessibleName('Face-down Decree')
})

it('reads the shop edition fallback, but gives the actual copy precedence', () => {
  const { container, rerender } = render(
    <OfferArt
      offering={{ itemType: 'Decree', item: decree, edition: 'Holographic' }}
    />
  )
  expect(
    container.querySelector('[data-decree-edition-portrait="Holographic"]')
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
    container.querySelector('[data-decree-edition-portrait="Negative"]')
  ).not.toBeNull()
  expect(
    container.querySelector('[data-decree-edition-portrait="Foil"]')
  ).toBeNull()
})

it('keeps the fallback portrait for an unknown decree without fabricating edition art', () => {
  const decreeId = 'unknown-decree'
  const { container } = render(
    <DecreeArtwork decreeId={decreeId} edition="Polychrome" />
  )
  expect(container.querySelector('.decree-portrait__image')).toHaveAttribute(
    'src',
    illustrationAssets.codex.decrees
  )
  expect(container.querySelector('[data-decree-edition-portrait]')).toBeNull()
  expect(container.querySelector('[data-decree-edition-frame]')).toBeNull()
  expect(container.querySelector('.decree-portrait__finish')).toBeNull()
})
