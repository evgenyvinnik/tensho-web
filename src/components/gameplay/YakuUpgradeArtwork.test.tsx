import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CELESTIAL_ORBS } from '../../systems/CelestialOrbSystem'
import { getItemArt } from '../../utils/itemArt'
import { illustrationAssets } from '../../utils/assets'
import { YakuUpgradeArtwork } from './YakuUpgradeArtwork'

/** Orbs whose portrait is commissioned but not delivered yet. */
const ORBS_AWAITING_ART = new Set(['moon_orb'])

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
      const src = art.querySelector('img')?.getAttribute('src')
      // Pairs keeps its own two-tile picture; every other family is pictured
      // by the Orb that raises it, and one still awaiting its portrait shows
      // the shared family artwork until it lands.
      if (family === 'Pairs')
        expect(src).not.toBe(getItemArt('orbs', orb.id).src)
      else if (ORBS_AWAITING_ART.has(orb.id))
        expect(src).toBe(illustrationAssets.yakuLedger)
      else expect(src).toBe(getItemArt('orbs', orb.id).src)
    }
  )

  it('distinguishes ordinary pairs from the Three Pairs family', () => {
    const { container } = render(
      <>
        <YakuUpgradeArtwork family="Pairs" />
        <YakuUpgradeArtwork family="ThreePairs" />
      </>
    )
    const pairs = container.querySelector('[data-upgrade-art="Pairs"]')!
    const threePairs = container.querySelector(
      '[data-upgrade-art="ThreePairs"]'
    )!
    expect(pairs.textContent).toBe('')
    expect(pairs.querySelector('img')).toHaveAttribute(
      'src',
      getItemArt('yakuUpgrades', 'Pairs').src
    )
    expect(pairs.querySelector('svg')).toBeNull()
    expect(threePairs.querySelector('img')).toHaveAttribute(
      'src',
      getItemArt('yakuUpgrades', 'ThreePairs').src
    )
    expect(pairs.querySelector('img')?.getAttribute('src')).not.toBe(
      threePairs.querySelector('img')?.getAttribute('src')
    )
    expect(pairs.querySelector('img')).toHaveAttribute(
      'data-upgrade-orb',
      'pluto_orb'
    )
    expect(threePairs.querySelector('img')).toHaveAttribute(
      'data-upgrade-orb',
      'planet_x_orb'
    )
  })
})
