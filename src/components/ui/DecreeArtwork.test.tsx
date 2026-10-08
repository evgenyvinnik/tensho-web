import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { DecreeArtwork } from './DecreeArtwork'

it.each([
  ['decree-riichi-devotee', /riichi-devotee\.webp$/],
  ['yaku_repetition_charter', /yaku-repetition\.webp$/],
  ['closed_hand_austerity', /closed-hand-austerity\.webp$/],
  ['decree-blueprint', /blueprint\.webp$/],
  ['decree-doppelganger', /doppelganger\.webp$/],
  ['decree-supernova', /supernova\.webp$/],
  ['decree-perfectionist', /perfectionist\.webp$/],
  ['decree-echo-stone', /echo-stone\.webp$/],
  ['celestial_wildcard', /celestial-wildcard\.webp$/],
  ['yakuman_succession', /yakuman-succession\.webp$/],
  ['shanten_clemency', /shanten-clemency\.webp$/],
  ['decree-wealth-engine', /wealth-engine\.png$/],
  ['decree-half-suited', /half-suited\.webp$/],
  ['decree-phoenix', /phoenix\.webp$/],
  ['decree-polished-stone', /polished-stone\.webp$/],
] as const)(
  'uses a decorative contained portrait for %s with the existing icon fallback',
  (id, path) => {
    const { container, rerender } = render(
      <DecreeArtwork decreeId={id} size={48} />
    )
    const image = container.querySelector('img')!
    expect(image).toHaveAttribute('src', expect.stringMatching(path))
    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('aria-hidden', 'true')
    expect(image).toHaveStyle({ width: '48px', height: '48px' })
    rerender(<DecreeArtwork decreeId="missing-artwork" size={32} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  }
)
