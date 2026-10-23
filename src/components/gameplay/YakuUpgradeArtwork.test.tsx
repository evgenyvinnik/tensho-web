import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CELESTIAL_ORBS } from '../../systems/CelestialOrbSystem'
import { getItemArt } from '../../utils/itemArt'
import { YakuUpgradeArtwork } from './YakuUpgradeArtwork'

describe('Yaku upgrade artwork', () => {
  it.each(Object.values(CELESTIAL_ORBS))(
    'shows the family illustration for $name without tile overlays',
    (orb) => {
      const family = orb.effect.targetYaku
      const { container } = render(<YakuUpgradeArtwork family={family} />)
      const art = container.querySelector(`[data-upgrade-art="${family}"]`)!
      expect(art).toHaveAttribute('aria-hidden', 'true')
      expect(art.querySelector('img')).toHaveAttribute(
        'src',
        getItemArt('yakuUpgrades', family).src
      )
      expect(art.querySelector('img')).toHaveAttribute('alt', '')
      expect(art.querySelector('img')).toHaveAttribute(
        'data-upgrade-orb',
        orb.id
      )
      expect(art.querySelectorAll('img')).toHaveLength(1)
      expect(art.querySelector('svg')).toBeNull()
      expect(art.querySelector('[data-upgrade-pattern-caption]')).toBeNull()
      if (family !== 'All')
        expect(art.querySelector('img')?.getAttribute('src')).not.toBe(
          getItemArt('orbs', orb.id).src
        )
    }
  )

  it('distinguishes ordinary pairs from the Seven Pairs family', () => {
    const { container } = render(
      <>
        <YakuUpgradeArtwork family="Pairs" />
        <YakuUpgradeArtwork family="SevenPairs" />
      </>
    )
    const pairs = container.querySelector('[data-upgrade-art="Pairs"]')!
    const sevenPairs = container.querySelector(
      '[data-upgrade-art="SevenPairs"]'
    )!
    expect(pairs).not.toHaveTextContent('×7')
    expect(pairs.querySelector('img')).toHaveAttribute(
      'src',
      getItemArt('yakuUpgrades', 'Pairs').src
    )
    expect(pairs.querySelector('svg')).toBeNull()
    expect(sevenPairs.querySelector('img')).toHaveAttribute(
      'src',
      getItemArt('yakuUpgrades', 'SevenPairs').src
    )
    expect(pairs.querySelector('img')?.getAttribute('src')).not.toBe(
      sevenPairs.querySelector('img')?.getAttribute('src')
    )
    expect(pairs.querySelector('img')).toHaveAttribute(
      'data-upgrade-orb',
      'pluto_orb'
    )
    expect(sevenPairs.querySelector('img')).toHaveAttribute(
      'data-upgrade-orb',
      'planet_x_orb'
    )
  })
})
