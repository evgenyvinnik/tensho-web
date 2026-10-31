import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CollectibleRail, type CollectibleRailProps } from './CollectibleRail'
import { GameOrchestrator } from '../../game/GameOrchestrator'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../../systems/CelestialOrbSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../../systems/VoidScriptSystem'
import { eventBus } from '../../game/EventBus'
import { useFloraRevealQueue } from '../../game/floraRevealQueue'
import { runRandom } from '../../game/RunRandom'
import { FlowerType, Tile } from '../../core/Tile'
import { illustrationAssets } from '../../utils/assets'
import type { SeasonTile } from '../../systems/types'
import { useOmenStore } from '../../stores/omenStore'
import { OmenTagSystem } from '../../systems/OmenTagSystem'
import { ALL_OMENS } from '../../config/omenDefinitions'
import i18n, {
  loadLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../i18n'

afterEach(async () => {
  eventBus.clear()
  runRandom.reset()
  act(() => useFloraRevealQueue.setState({ queue: [] }))
  act(() => useOmenStore.getState().clearForNewRun())
  await i18n.changeLanguage('en')
})

function renderRail(overrides: Partial<CollectibleRailProps> = {}) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  const props: CollectibleRailProps = {
    flora: game.getFloraState(),
    celestialOrbs: [orb],
    voidScripts: [],
    levelOf: () => 1,
    validateUse: () => ({ isValid: true, errors: [] }),
    onUse: vi.fn(() => ({ success: true, effects: [] })),
    onChooseTargets: vi.fn(),
    ...overrides,
  }
  render(<CollectibleRail {...props} />)
  return { props, orb }
}

const open = (instanceId: string) =>
  fireEvent.click(
    document.querySelector(`[data-consumable-instance="${instanceId}"]`)!,
    { detail: 1 }
  )

it('uses an Orb straight from its own panel, naming that exact copy', () => {
  const { props, orb } = renderRail()
  open(orb.instanceId)
  fireEvent.click(screen.getByRole('button', { name: 'Use item' }))
  expect(props.onUse).toHaveBeenCalledExactlyOnceWith({
    type: 'useOrb',
    orbId: orb.instanceId,
  })
})

it('sends a Script that needs tiles to target selection instead of using it', () => {
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_cryptid
  )
  const { props } = renderRail({ voidScripts: [script] })
  open(script.instanceId)
  fireEvent.click(screen.getByRole('button', { name: 'Choose tiles' }))
  expect(props.onChooseTargets).toHaveBeenCalledWith(script)
  expect(props.onUse).not.toHaveBeenCalled()
})

it('explains a use the engine refuses and never calls it', () => {
  const { props, orb } = renderRail({
    validateUse: () => ({ isValid: false, errors: ['Orb is at max level'] }),
  })
  open(orb.instanceId)
  const use = screen.getByRole('button', { name: 'Use item' })
  expect(use).toBeDisabled()
  fireEvent.click(use)
  expect(props.onUse).not.toHaveBeenCalled()
  expect(screen.getByRole('status')).toBeInTheDocument()
})

it('shows the engine’s reason when a use fails', () => {
  const { orb } = renderRail({
    onUse: () => ({ success: false, effects: [], errors: ['No room'] }),
  })
  open(orb.instanceId)
  fireEvent.click(screen.getByRole('button', { name: 'Use item' }))
  expect(screen.getByRole('alert')).toHaveTextContent('No room')
})

it('names the engine’s specific reason for a refused use', () => {
  const { orb } = renderRail({
    validateUse: () => ({
      isValid: false,
      errors: ['No room for the created Decree'],
    }),
  })
  open(orb.instanceId)
  expect(screen.getByRole('status')).toHaveTextContent(
    'Make space for the reward before using this item.'
  )
})

it('shows a Void Script’s cost before the tap that uses it', () => {
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_wraith
  )
  renderRail({ voidScripts: [script] })
  open(script.instanceId)
  expect(document.querySelector('[data-script-cost]')).toHaveTextContent(
    'Void cost: Lose all gold.'
  )
})

it('shows when an Omen cancels a Void Script’s cost', () => {
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_wraith
  )
  renderRail({ voidScripts: [script], scriptDownsideProtected: true })
  open(script.instanceId)
  expect(document.querySelector('[data-script-cost]')).toHaveTextContent(
    'Omen protection cancels the additional penalty.'
  )
})

it('explains what using an Orb gives up under the Observatory', () => {
  const { orb } = renderRail({ observatoryActive: true })
  open(orb.instanceId)
  expect(
    document.querySelector('[data-observatory-holding]')
  ).toBeInTheDocument()
  expect(document.querySelector('[data-observatory-cost]')).toHaveTextContent(
    /./
  )
})

it('tells an Orchid how many tiles it drew until the round ends', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.getState().flowerSystem.addFlower(Tile.createFlower(FlowerType.Orchid))
  renderRail({ flora: game.getFloraState() })
  const orchid = () =>
    fireEvent.click(document.querySelector('[data-flora-flower="Orchid"]')!, {
      detail: 1,
    })
  orchid()
  expect(document.querySelector('[data-orchid-bloom]')).toBeNull()
  act(() => eventBus.emit('orchidBloom', { count: 2 }))
  expect(document.querySelector('[data-orchid-bloom]')).toHaveTextContent(
    'Orchid drew extra tiles: 2.'
  )
  act(() =>
    eventBus.emit('roundStart', {
      actNumber: 1,
      roundNumber: 2,
      roundType: 'Large',
      target: 1,
    })
  )
  expect(document.querySelector('[data-orchid-bloom]')).toBeNull()
})

it('tells a Plum how many tiles it recovered from the river', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.getState().flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum))
  renderRail({ flora: game.getFloraState() })
  act(() => eventBus.emit('plumRecovery', { count: 1 }))
  fireEvent.click(document.querySelector('[data-flora-flower="Plum"]')!, {
    detail: 1,
  })
  expect(document.querySelector('[data-plum-recovery]')).toHaveTextContent(
    'Plum returned tiles from the river: 1.'
  )
})

it('pictures a Flower as awakened only once its own duplicate awakens it', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const flowers = game.getState().flowerSystem
  for (const type of [
    FlowerType.Plum,
    FlowerType.Orchid,
    FlowerType.Chrysanthemum,
    FlowerType.Bamboo,
    FlowerType.Plum,
  ])
    flowers.addFlower(Tile.createFlower(type))
  renderRail({ flora: game.getFloraState() })
  const art = (type: string) =>
    document
      .querySelector(`[data-flora-flower="${type}"] img`)!
      .getAttribute('src')
  expect(art('Plum')).toBe(illustrationAssets.awakenedFlowers.Plum)
  expect(art('Orchid')).toBe(illustrationAssets.orchidBloom)
  expect(art('Bamboo')).toBe(illustrationAssets.bambooBloom)
})

it('keeps a drawn Flower and Season unseen until their tiles land', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.getState().flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum))
  const autumn: SeasonTile = {
    id: 'season-1',
    type: 'Autumn',
    effect: { type: 'yaku_modifier', value: 1.2, description: '' },
    isCorrupted: false,
  }
  useFloraRevealQueue.setState({
    queue: [
      { kind: 'flower', flower: 'Plum', key: 1 },
      { kind: 'season', season: autumn, key: 2 },
    ],
  })
  renderRail({ flora: { ...game.getFloraState(), seasons: [autumn] } })
  const plum = document.querySelector('[data-flora-flower="Plum"]')
  const season = document.querySelector('[data-flora-season="season-1"]')
  // Each keeps its place for its tile to fly into, and shows once it lands.
  expect(plum).toHaveClass('invisible')
  expect(season).toHaveClass('invisible')
  act(() => useFloraRevealQueue.getState().dismissThrough(1))
  expect(plum).not.toHaveClass('invisible')
  expect(season).toHaveClass('invisible')
  act(() => useFloraRevealQueue.getState().dismissThrough(2))
  expect(season).not.toHaveClass('invisible')
})

it('tells a Flower when a Decree shields it from Drought', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.getState().flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum))
  renderRail({
    flora: { ...game.getFloraState(), flowersProtected: true },
  })
  fireEvent.click(document.querySelector('[data-flora-flower="Plum"]')!, {
    detail: 1,
  })
  expect(screen.getByRole('dialog', { name: 'Plum' })).toHaveTextContent(
    'A Decree protects your Flower bonuses from Drought.'
  )
})

/** A rail with no Flowers or consumables, so only Omens can fill it. */
function omenRail(language: SupportedLanguage) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const flora = game.getFloraState()
  return async (system: OmenTagSystem) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    render(
      <CollectibleRail
        flora={{
          ...flora,
          flowers: { ...flora.flowers, flowers: [] },
          seasons: [],
        }}
        celestialOrbs={[]}
        voidScripts={[]}
        levelOf={() => 1}
        validateUse={() => ({ isValid: true, errors: [] })}
        onUse={vi.fn()}
        onChooseTargets={vi.fn()}
        omenSystem={system}
      />
    )
  }
}

const omenTokens = (selector: string) =>
  document.querySelectorAll<HTMLElement>(`[data-collectible-rail] ${selector}`)

it.each(SUPPORTED_LANGUAGES)(
  'pictures each earned Omen on the rail in %s until it triggers',
  async (language) => {
    const renderOmens = omenRail(language)
    const system = new OmenTagSystem()
    useOmenStore.getState().copyNextTag()
    await renderOmens(system)
    const [double] = omenTokens('[data-omen-id="double_omen"]')
    expect(double).toHaveAccessibleName(i18n.t('omens.items.double_omen.name'))
    expect(double.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/assets/illustrations/omens/double-omen.webp')
    )
    fireEvent.click(double, { detail: 1 })
    expect(
      screen.getByRole('dialog', {
        name: i18n.t('omens.items.double_omen.name'),
      })
    ).toHaveTextContent(i18n.t('omens.items.double_omen.description'))
    // The armed Double Omen becomes a second copy of the next Omen earned.
    act(() => useOmenStore.getState().addTag('omen_of_rivers'))
    expect(omenTokens('[data-omen-id="double_omen"]')).toHaveLength(0)
    const rivers = omenTokens('[data-omen-id="omen_of_rivers"]')
    expect(rivers).toHaveLength(2)
    for (const token of rivers) {
      expect(token).toHaveAccessibleName(
        i18n.t('omens.items.omen_of_rivers.name')
      )
      expect(token.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringContaining('/generated/omens/omen_of_rivers.webp')
      )
    }
    act(() => useOmenStore.getState().consumeBossTags())
    expect(document.querySelector('[data-collectible-rail]')).toBeNull()
  }
)

it.each(SUPPORTED_LANGUAGES)(
  'shows Omen costs and the effects spent Omens leave running in %s',
  async (language) => {
    const renderOmens = omenRail(language)
    const system = new OmenTagSystem()
    const award = (id: string) =>
      system.handleRoundSkip(
        'Large',
        ALL_OMENS.filter((o) => o.id !== id).map((o) => o.id)
      )
    award('double_omen')
    award('decree_omen')
    award('expansion_omen')
    award('austerity_omen')
    award('interest_omen')
    await renderOmens(system)
    const number = (value: number) => value.toLocaleString(language)
    const panel = (token: HTMLElement) => {
      fireEvent.click(token, { detail: 1 })
      return screen.getByRole('dialog', {
        name: token.getAttribute('aria-label')!,
      })
    }
    // Each copied Rare+ guarantee carries its own fee.
    const decrees = omenTokens('[data-omen-id="decree_omen"]')
    expect(decrees).toHaveLength(2)
    expect(panel(decrees[0])).toHaveTextContent(
      i18n.t('omens.effects.shopFee', { amount: number(5) })
    )
    const season = i18n.t('flora.summer')
    const [lock] = omenTokens('[data-omen-effect="season-lock"]')
    expect(lock).toHaveAccessibleName(
      i18n.t('omens.effects.seasonLockLabel', { season })
    )
    expect(lock.querySelector('img')).toHaveAttribute(
      'src',
      illustrationAssets.summerFan
    )
    expect(panel(lock)).toHaveTextContent(
      i18n.t('omens.effects.seasonLock', { season })
    )
    const [blocked] = omenTokens('[data-omen-effect="no-interest"]')
    expect(blocked).toHaveAccessibleName(
      i18n.t('omens.items.austerity_omen.name')
    )
    expect(blocked).toHaveTextContent(number(1))
    expect(panel(blocked)).toHaveTextContent(
      i18n.t('omens.effects.noInterest', { rounds: number(1) })
    )
    const boost = () => omenTokens('[data-omen-effect="interest-boost"]')[0]
    expect(boost()).toHaveAccessibleName(
      i18n.t('omens.items.interest_omen.name')
    )
    expect(boost()).toHaveTextContent(number(3))
    expect(panel(boost())).toHaveTextContent(
      i18n.t('omens.effects.interestBoost', {
        amount: number(2),
        rounds: number(3),
      })
    )
    for (const token of omenTokens('[data-collectible-token]'))
      expect(token.getAttribute('aria-label')).not.toMatch(/omens\.|\{\{/)
    // Spent effects leave the rail; expired history never shows.
    act(() => system.applyLockedSeason())
    expect(omenTokens('[data-omen-effect="season-lock"]')).toHaveLength(0)
    act(() => system.onRoundEnd())
    expect(omenTokens('[data-omen-effect="no-interest"]')).toHaveLength(0)
    expect(boost()).toHaveTextContent(number(2))
    act(() => system.triggerShopOmens(() => false))
    expect(omenTokens('[data-omen-id="decree_omen"]')).toHaveLength(2)
    act(() => system.triggerShopOmens())
    expect(omenTokens('[data-omen-id="decree_omen"]')).toHaveLength(0)
    // The Interest Omen itself is spent, but its boost keeps an icon.
    expect(boost()).toBeInTheDocument()
    act(() => {
      system.onRoundEnd()
      system.onRoundEnd()
    })
    expect(document.querySelector('[data-collectible-rail]')).toBeNull()
  }
)
