import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CollectibleRail, type CollectibleRailProps } from './CollectibleRail'
import { GameOrchestrator } from '../../game/GameOrchestrator'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../../systems/CelestialOrbSystem'
import { FATE_SEALS, FateSealSystem } from '../../systems/FateSealSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../../systems/VoidScriptSystem'
import { eventBus } from '../../game/EventBus'
import { runRandom } from '../../game/RunRandom'
import { FlowerType, Tile } from '../../core/Tile'
import { illustrationAssets } from '../../utils/assets'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

function renderRail(overrides: Partial<CollectibleRailProps> = {}) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  const seal = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_alchemist
  )
  const props: CollectibleRailProps = {
    flora: game.getFloraState(),
    fateSeals: [seal],
    celestialOrbs: [orb],
    voidScripts: [],
    upgrades: game.getYakuUpgradeState(),
    levelOf: () => 1,
    validateUse: () => ({ isValid: true, errors: [] }),
    onUse: vi.fn(() => ({ success: true, effects: [] })),
    onChooseTargets: vi.fn(),
    ...overrides,
  }
  render(<CollectibleRail {...props} />)
  return { props, orb, seal }
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

it('sends a Seal that needs tiles to target selection instead of using it', () => {
  const { props, seal } = renderRail()
  open(seal.instanceId)
  fireEvent.click(screen.getByRole('button', { name: 'Choose tiles' }))
  expect(props.onChooseTargets).toHaveBeenCalledWith(seal)
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

it('previews what the Fool would create', () => {
  const fool = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_fool
  )
  renderRail({
    fateSeals: [fool],
    lastCopyableConsumable: CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    ),
  })
  open(fool.instanceId)
  expect(
    document.querySelector('[data-consumable-copy-result]')
  ).toHaveTextContent('Creates: Pluto Orb')
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
