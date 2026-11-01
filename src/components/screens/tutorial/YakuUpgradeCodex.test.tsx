import { cleanup, render, within } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import en from '../../../i18n/locales/en.json'
import { GameOrchestrator } from '../../../game/GameOrchestrator'
import type { OrchestratorState } from '../../../game/GameOrchestrator'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
  getCelestialOrbByYaku,
  mapYakuIdToCategory,
} from '../../../systems/CelestialOrbSystem'
import { getTileImagePath } from '../../../utils/assets'
import {
  COMPLETE_HAND_UPGRADE_FAMILIES,
  PLAY_UPGRADE_FAMILIES,
  UPGRADE_FAMILY_EXAMPLES,
  exampleTiles,
  readUpgradeExample,
  type UpgradeExample,
} from './yakuUpgradeExamples'
import { YakuUpgradeCodex } from './YakuUpgradeCodex'

afterEach(cleanup)

async function englishWrapper() {
  const instance = createInstance()
  await instance.init({
    lng: 'en',
    fallbackLng: false,
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
  })
  return ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={instance}>{children}</I18nextProvider>
  )
}

/** Score an example through the live orchestrator, as a real play. */
function previewExample(
  example: UpgradeExample,
  orbIds: (keyof typeof CELESTIAL_ORBS)[] = []
) {
  const game = new GameOrchestrator()
  game.startNewRun(12345)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  for (const id of orbIds)
    state.celestialOrbSystem.useOrb(
      CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS[id])
    )
  const tiles = exampleTiles(example)
  state.handTiles = tiles
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  const preview = game.previewScore(tiles.map((tile) => tile.id))
  expect(preview).not.toBeNull()
  return preview!
}

describe('Yaku upgrade examples', () => {
  it('cover all twelve families, every Orb but the Black Hole', () => {
    const families = [
      ...PLAY_UPGRADE_FAMILIES,
      ...COMPLETE_HAND_UPGRADE_FAMILIES,
    ]
    expect(new Set(families).size).toBe(12)
    for (const orb of Object.values(CELESTIAL_ORBS))
      if (orb.effect.targetYaku !== 'All')
        expect(families).toContain(orb.effect.targetYaku)
  })

  it.each(PLAY_UPGRADE_FAMILIES)(
    'every %s example is an ordinary play that scores the family',
    (family) => {
      expect(UPGRADE_FAMILY_EXAMPLES[family].length).toBeGreaterThanOrEqual(2)
      for (const example of UPGRADE_FAMILY_EXAMPLES[family]) {
        expect(example.complete).toBeFalsy()
        expect(exampleTiles(example).length).toBeLessThanOrEqual(6)
        expect(readUpgradeExample(example).families).toContain(family)
        // The live play gets the family's Orb bonus.
        const base = previewExample(example).finalScore
        const raised = previewExample(example, [
          getCelestialOrbByYaku(family)!.id as keyof typeof CELESTIAL_ORBS,
        ]).finalScore
        expect(raised).toBeGreaterThan(base)
      }
    }
  )

  it.each(COMPLETE_HAND_UPGRADE_FAMILIES)(
    'the %s example is a complete hand whose Yaku scores the family',
    (family) => {
      for (const example of UPGRADE_FAMILY_EXAMPLES[family]) {
        expect(example.complete).toBe(true)
        expect(exampleTiles(example)).toHaveLength(14)
        const preview = previewExample(example)
        expect(preview.pattern.id).toBe('mahjong')
        expect(
          preview.detectedYaku.map((yaku) =>
            mapYakuIdToCategory(yaku.definition.id)
          )
        ).toContain(family)
      }
    }
  )
})

describe('the Yaku upgrade Codex', () => {
  it('works the Sequence example exactly as the engine scores it', async () => {
    const wrapper = await englishWrapper()
    const { container } = render(<YakuUpgradeCodex section="intro" />, {
      wrapper,
    })
    const example = UPGRADE_FAMILY_EXAMPLES.Pinfu[0]
    const before = previewExample(example).finalScore
    const after = previewExample(example, ['venus_orb']).finalScore
    expect(container).toHaveTextContent(`= ${before}`)
    expect(container).toHaveTextContent(`= ${after}`)
  })

  it('shows every ordinary family with its Orb, numbers and tile examples', async () => {
    const wrapper = await englishWrapper()
    const { container } = render(<YakuUpgradeCodex section="plays" />, {
      wrapper,
    })
    for (const family of PLAY_UPGRADE_FAMILIES) {
      const card = container.querySelector(
        `[data-codex-upgrade-family="${family}"]`
      ) as HTMLElement
      expect(card, family).not.toBeNull()
      const orb = getCelestialOrbByYaku(family)!
      const text = within(card)
      text.getByText(en.upgradeFamilies[family].name)
      text.getByText(en.upgradeFamilies[family].covers)
      text.getByText(
        `Each level: +${orb.effect.chipsPerLevel} base points · +${orb.effect.multPerLevel} Mult`
      )
      const examples = card.querySelectorAll('[data-codex-upgrade-example]')
      expect(examples).toHaveLength(UPGRADE_FAMILY_EXAMPLES[family].length)
      // Each example draws its own tiles.
      UPGRADE_FAMILY_EXAMPLES[family].forEach((example, index) => {
        const sources = [...examples[index].querySelectorAll('img')].map(
          (image) => image.getAttribute('src')
        )
        expect(sources).toEqual(
          exampleTiles(example).map((tile) =>
            getTileImagePath(tile.suit, tile.rank)
          )
        )
      })
    }
    expect(container).toHaveTextContent(
      'Scores: Sequences · All Simples · Mixed Triple'
    )
  })

  it('lists the complete-hand families with how their secret Orbs unlock', async () => {
    const wrapper = await englishWrapper()
    const { container } = render(<YakuUpgradeCodex section="hands" />, {
      wrapper,
    })
    for (const family of COMPLETE_HAND_UPGRADE_FAMILIES) {
      const card = container.querySelector(
        `[data-codex-upgrade-family="${family}"]`
      ) as HTMLElement
      const orb = getCelestialOrbByYaku(family)!
      expect(card).toHaveTextContent(en.codexUpgrades.completeHand)
      expect(card).toHaveTextContent(
        en.consumableUnlocks[orb.id as keyof typeof en.consumableUnlocks]
      )
      expect(card.querySelectorAll('img').length).toBe(1 + 14)
    }
  })
})
