import { fireEvent, render, screen } from '@testing-library/react'
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
