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
  UPGRADE_FAMILY_IDS,
  getCelestialOrbByYaku,
} from '../../../systems/CelestialOrbSystem'
import { getTileImagePath } from '../../../utils/assets'
import {
  PATTERN_UPGRADE_FAMILIES,
  TILE_UPGRADE_FAMILIES,
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

const ALL_FAMILIES = [...PATTERN_UPGRADE_FAMILIES, ...TILE_UPGRADE_FAMILIES]

describe('Yaku upgrade examples', () => {
  it('cover every family, each raised by its own Orb', () => {
    expect([...ALL_FAMILIES].sort()).toEqual([...UPGRADE_FAMILY_IDS].sort())
    for (const family of ALL_FAMILIES)
      expect(getCelestialOrbByYaku(family), family).toBeDefined()
  })

  it.each(ALL_FAMILIES)(
    'every %s example is an ordinary play that scores the family',
    (family) => {
      expect(UPGRADE_FAMILY_EXAMPLES[family].length).toBeGreaterThanOrEqual(1)
      for (const example of UPGRADE_FAMILY_EXAMPLES[family]) {
        expect(exampleTiles(example).length).toBeLessThanOrEqual(6)
        expect(
          readUpgradeExample(example).families.map((entry) => entry.family)
        ).toContain(family)
        // The live play gets the family's Orb bonus.
        const base = previewExample(example).finalScore
        const raised = previewExample(example, [
          getCelestialOrbByYaku(family)!.id as keyof typeof CELESTIAL_ORBS,
        ]).finalScore
        expect(raised).toBeGreaterThan(base)
      }
    }
  )

  it('a pattern example scores exactly one pattern family', () => {
    for (const family of PATTERN_UPGRADE_FAMILIES)
      for (const example of UPGRADE_FAMILY_EXAMPLES[family])
        expect(
          readUpgradeExample(example).families.filter(({ family: f }) =>
            (PATTERN_UPGRADE_FAMILIES as readonly string[]).includes(f)
          )
        ).toEqual([{ family, times: 1 }])
  })
})

describe('the Yaku upgrade Codex', () => {
  it('works the Sequence example exactly as the engine scores it', async () => {
    const wrapper = await englishWrapper()
    const { container } = render(<YakuUpgradeCodex section="intro" />, {
      wrapper,
    })
    const example = UPGRADE_FAMILY_EXAMPLES.Sequence[0]
    const before = previewExample(example).finalScore
    const after = previewExample(example, ['venus_orb']).finalScore
    expect(container).toHaveTextContent(`= ${before}`)
    expect(container).toHaveTextContent(`= ${after}`)
  })

  it.each([
    ['patterns', PATTERN_UPGRADE_FAMILIES],
    ['tiles', TILE_UPGRADE_FAMILIES],
  ] as const)(
    'shows every %s family with its Orb, numbers and tile examples',
    async (section, families) => {
      const wrapper = await englishWrapper()
      const { container } = render(<YakuUpgradeCodex section={section} />, {
        wrapper,
      })
      for (const family of families) {
        const card = container.querySelector(
          `[data-codex-upgrade-family="${family}"]`
        ) as HTMLElement
        expect(card, family).not.toBeNull()
        const orb = getCelestialOrbByYaku(family)!
        const text = within(card)
        text.getByRole('heading', { name: en.upgradeFamilies[family].name })
        text.getByText(en.upgradeFamilies[family].covers)
        text.getByText(
          family === 'Loose'
            ? `Each level, per loose tile: +${orb.effect.chipsPerLevel} base points`
            : `Each level: +${orb.effect.chipsPerLevel} base points · +${orb.effect.multPerLevel} Mult`
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
    }
  )

  it('lists every family a play scores, counting each loose tile', async () => {
    const wrapper = await englishWrapper()
    const { container } = render(<YakuUpgradeCodex section="tiles" />, {
      wrapper,
    })
    expect(container).toHaveTextContent(
      'Scores: Pairs · Winds · Dragons · Loose Tiles ×2'
    )
  })
})
