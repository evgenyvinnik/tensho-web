import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CollectibleRail, type CollectibleRailProps } from './CollectibleRail'
import { GameOrchestrator } from '../../game/GameOrchestrator'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../../systems/CelestialOrbSystem'
import { FATE_SEALS, FateSealSystem } from '../../systems/FateSealSystem'
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
