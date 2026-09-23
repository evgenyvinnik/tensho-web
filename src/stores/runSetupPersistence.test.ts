import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useTableStyleStore } from './tableStyleStore'
import { useStakeStore } from './stakeStore'
import { useProgressionStore } from './progressionStore'
import { GameOrchestrator } from '../game/GameOrchestrator'

beforeEach(() => {
  const data = new Map<string, string>()
  vi.spyOn(localStorage, 'getItem').mockImplementation(
    (key) => data.get(key) ?? null
  )
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    data.set(key, value)
  })
  vi.spyOn(localStorage, 'removeItem').mockImplementation((key) => {
    data.delete(key)
  })
  useProgressionStore.getState().resetProgression()
  useTableStyleStore.getState().resetAllProgress()
  useStakeStore.getState().resetAllProgress()
})
afterEach(() => {
  vi.restoreAllMocks()
})

it('does not mutate a running game when the saved setup preference changes', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7, 8, 'dragons_den')
  useTableStyleStore.getState().selectStyle('green_felt')
  useStakeStore.getState().selectStake('green_felt', 1)
  expect(game.getState().tableStyleId).toBe('dragons_den')
  expect(game.getState().stake).toBe(8)
  expect(game.getState().targetScore).toBe(731)
})

async function reload() {
  // Preserve the real JSON values while simulating default in-memory setup.
  const table = localStorage.getItem('tensho-table-style-progress')!
  const stake = localStorage.getItem('tensho-stake-progress')!
  useTableStyleStore.getState().resetRunState()
  useStakeStore.getState().resetRunState()
  localStorage.setItem('tensho-table-style-progress', table)
  localStorage.setItem('tensho-stake-progress', stake)
  await useTableStyleStore.persist.rehydrate()
  await useStakeStore.persist.rehydrate()
}

it('retains confirmed Full Unlock setup and reconstructs modifiers after JSON reload', async () => {
  useProgressionStore.getState().enableFullUnlock()
  useTableStyleStore.getState().unlockStyle('dragons_den')
  useTableStyleStore.getState().selectStyle('dragons_den')
  useStakeStore.getState().selectStake('dragons_den', 8)
  await reload()
  expect(useTableStyleStore.getState().currentStyleId).toBe('dragons_den')
  expect(
    useTableStyleStore.getState().activeModifiers.scoreTargetMultiplier
  ).toBe(1.25)
  expect(useStakeStore.getState().currentWallId).toBe('dragons_den')
  expect(useStakeStore.getState().currentStakeTier).toBe(8)
  expect(useStakeStore.getState().activeModifiers.scoreScaling).toBeCloseTo(
    1.95
  )
  expect(useStakeStore.getState().globalHighestCompleted).toBe(0)
})

it('retains an earned tier without needing Full Unlock', async () => {
  useStakeStore.getState().recordVictory(1000, 8, 'green_felt', 2)
  expect(useStakeStore.getState().selectStake('green_felt', 3)).toBe(true)
  await reload()
  expect(useStakeStore.getState().currentStakeTier).toBe(3)
  expect(useStakeStore.getState().activeModifiers.scoreScaling).toBe(1.3)
})

it.each(['missing_table', 'dragons_den'])(
  'rejects unknown or locked saved table %s and forged modifiers',
  async (id) => {
    const raw = JSON.parse(localStorage.getItem('tensho-table-style-progress')!)
    raw.state.currentStyleId = id
    raw.state.activeModifiers = { scoreTargetMultiplier: 0.001 }
    localStorage.setItem('tensho-table-style-progress', JSON.stringify(raw))
    await useTableStyleStore.persist.rehydrate()
    expect(useTableStyleStore.getState().currentStyleId).toBe('green_felt')
    expect(
      useTableStyleStore.getState().activeModifiers.scoreTargetMultiplier
    ).toBe(1)
  }
)

it.each([8, -1, 2.5])(
  'rejects locked or invalid saved difficulty %s',
  async (tier) => {
    const raw = JSON.parse(localStorage.getItem('tensho-stake-progress')!)
    raw.state.currentWallId = 'green_felt'
    raw.state.currentStakeTier = tier
    raw.state.activeModifiers = { scoreScaling: 0.001 }
    localStorage.setItem('tensho-stake-progress', JSON.stringify(raw))
    await useStakeStore.persist.rehydrate()
    expect(useStakeStore.getState().currentStakeTier).toBe(1)
    expect(useStakeStore.getState().activeModifiers.scoreScaling).toBe(1)
  }
)

it('keeps legacy profiles on defaults and resets saved setup with earned progress', async () => {
  for (const key of ['tensho-table-style-progress', 'tensho-stake-progress']) {
    const raw = JSON.parse(localStorage.getItem(key)!)
    delete raw.state.currentStyleId
    delete raw.state.currentWallId
    delete raw.state.currentStakeTier
    localStorage.setItem(key, JSON.stringify(raw))
  }
  await reload()
  expect(useTableStyleStore.getState().currentStyleId).toBe('green_felt')
  expect(useStakeStore.getState().currentStakeTier).toBe(1)
  useProgressionStore.getState().enableFullUnlock()
  useTableStyleStore.getState().unlockStyle('dragons_den')
  useTableStyleStore.getState().selectStyle('dragons_den')
  useStakeStore.getState().selectStake('dragons_den', 8)
  useTableStyleStore.getState().resetAllProgress()
  useStakeStore.getState().resetAllProgress()
  await reload()
  expect(useTableStyleStore.getState().currentStyleId).toBe('green_felt')
  expect(useStakeStore.getState().currentStakeTier).toBe(1)
})
