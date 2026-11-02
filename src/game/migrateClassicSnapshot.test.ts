import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import {
  CURRENT_SNAPSHOT_VERSION,
  upgradeClassicRunSnapshot,
} from './migrateClassicSnapshot'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { TURNS_PER_ROUND } from './playRules'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { PACK_SIZE_DEFINITIONS } from '../config/packDefinitions'
import { UPGRADE_FAMILY_IDS } from '../systems/CelestialOrbSystem'

afterEach(() => {
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
  vi.restoreAllMocks()
})

type Snapshot = ReturnType<GameOrchestrator['captureRun']>

function current(): Snapshot {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return JSON.parse(JSON.stringify(game.captureRun()))
}

/** A version 2 run: four hands, three single discards and three redraws. */
function versionTwo(
  resources = { hands: 3, allowance: 4, discards: 2, redraws: 1 }
) {
  // An older save is plain JSON in a shape the current types no longer allow.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saved = current() as unknown as Record<string, any>
  saved.version = 2
  Object.assign(saved.config, {
    handsPerRound: 4,
    discardsPerRound: 3,
    redrawsPerRound: 3,
  })
  Object.assign(saved.state, {
    handsRemaining: resources.hands,
    handsAllowance: resources.allowance,
    discardsRemaining: resources.discards,
    redrawsRemaining: resources.redraws,
    riichiStatus: 'active',
  })
  delete saved.state.playsThisRound
  delete saved.state.tilesRedrawnThisRound
  return saved
}

describe('upgradeClassicRunSnapshot', () => {
  it('turns a version 2 run’s hands and redraws into Turns, and its discards into free redraws', () => {
    const upgraded = upgradeClassicRunSnapshot(versionTwo()) as Snapshot
    expect(upgraded.version).toBe(CURRENT_SNAPSHOT_VERSION)
    expect(upgraded.state).toMatchObject({
      handsRemaining: 3 + 1,
      handsAllowance: 4 + 3,
      redrawsRemaining: 2,
      discardsRemaining: 0,
      playsThisRound: 1,
      tilesRedrawnThisRound: 0,
    })
    expect(upgraded.state).not.toHaveProperty('riichiStatus')
    expect(upgraded.config).toMatchObject({
      handsPerRound: TURNS_PER_ROUND,
      discardsPerRound: 0,
      redrawsPerRound: 0,
    })
    expect(() => parseClassicRunSnapshot(upgraded)).not.toThrow()
  })

  it('caps converted free redraws at three', () => {
    const upgraded = upgradeClassicRunSnapshot(
      versionTwo({ hands: 4, allowance: 4, discards: 5, redraws: 3 })
    ) as Snapshot
    expect(upgraded.state.redrawsRemaining).toBe(3)
    expect(upgraded.state.handsRemaining).toBe(7)
  })

  it('never rewrites an earned score or gold', () => {
    const saved = versionTwo()
    saved.state.score = 1234
    saved.state.runScore = 5678
    saved.state.gold = 42
    const upgraded = upgradeClassicRunSnapshot(saved) as Snapshot
    expect(upgraded.state).toMatchObject({
      score: 1234,
      runScore: 5678,
      gold: 42,
    })
  })

  it('renames the retired Riichi Orb family to Pairs, keeping its level', () => {
    const saved = versionTwo()
    saved.state.celestialOrbSystem.orbLevels = [['Riichi', 3]]
    saved.state.celestialOrbSystem.yakuTriggerCounts = [['Riichi', 2]]
    const upgraded = upgradeClassicRunSnapshot(saved) as Snapshot
    expect(upgraded.state.celestialOrbSystem.orbLevels).toEqual([['Pairs', 3]])
    expect(upgraded.state.celestialOrbSystem.yakuTriggerCounts).toEqual([
      ['Pairs', 2],
    ])
  })

  it('moves every retired Yaku family to the family its Orb raises now', () => {
    const saved = current() as unknown as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    saved.state.celestialOrbSystem.orbLevels = [
      ['Pairs', 1],
      ['Tanyao', 2],
      ['Yakuhai', 3],
      ['Pinfu', 4],
      ['Ittsu', 1],
      ['Honitsu', 1],
      ['Toitoi', 1],
      ['Chinitsu', 1],
      ['Sanshoku', 1],
      ['SevenPairs', 5],
      ['Chanta', 1],
      ['Kokushi', 2],
    ]
    saved.state.celestialOrbSystem.yakuTriggerCounts = [
      ['Pinfu', 7],
      ['Riichi', 1],
    ]
    const upgraded = upgradeClassicRunSnapshot(saved) as Snapshot
    const levels = new Map(upgraded.state.celestialOrbSystem.orbLevels)
    expect(levels.get('TwoSequences')).toBe(2)
    expect(levels.get('Dragons')).toBe(3)
    expect(levels.get('Sequence')).toBe(4)
    expect(levels.get('ThreePairs')).toBe(5)
    expect(levels.get('Winds')).toBe(2)
    expect(upgraded.state.celestialOrbSystem.yakuTriggerCounts).toEqual([
      ['Sequence', 7],
      ['Pairs', 1],
    ])
    // The run loads, and the one family the old save never had starts fresh.
    const game = new GameOrchestrator()
    game.restoreRun(parseClassicRunSnapshot(upgraded))
    const orbs = game.getState().celestialOrbSystem
    expect(orbs.getYakuLevel('ThreePairs')).toBe(5)
    expect(orbs.getYakuLevel('SequencePair')).toBe(1)
    expect([...orbs.getAllYakuLevels().keys()].sort()).toEqual(
      [...UPGRADE_FAMILY_IDS].sort()
    )
  })

  it('leaves an unknown family for the validator to reject', () => {
    const saved = current() as unknown as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    saved.state.celestialOrbSystem.orbLevels = [['NotAFamily', 2]]
    const upgraded = upgradeClassicRunSnapshot(saved)
    expect(() => parseClassicRunSnapshot(upgraded)).toThrow()
  })

  it.each(['complete', 'echo', 'mutations', 'quad'])(
    'loads the recorded %s replay saved before the family rework',
    (name) => {
      const record = JSON.parse(
        readFileSync(`e2e/fixtures/interactions/${name}.json`, 'utf8')
      )
      const upgraded = parseClassicRunSnapshot(
        upgradeClassicRunSnapshot(record.snapshot)
      )
      for (const [family] of upgraded.state.celestialOrbSystem.orbLevels)
        expect(UPGRADE_FAMILY_IDS as readonly string[]).toContain(family)
    }
  )

  it('drops the retired Seal and Script round limits from any saved run', () => {
    const retired = {
      sealsUsedThisRound: 1,
      maxSealsPerRound: 1,
      scriptsUsedThisRound: 1,
      maxScriptsPerRound: 1,
    }
    for (const saved of [current(), versionTwo()]) {
      Object.assign(saved.state.consumableSystem, retired)
      const upgraded = upgradeClassicRunSnapshot(saved) as Snapshot
      for (const key of Object.keys(retired))
        expect(upgraded.state.consumableSystem).not.toHaveProperty(key)
      expect(() => parseClassicRunSnapshot(upgraded)).not.toThrow()
    }
  })

  it('is pure: the input is never changed', () => {
    const saved = versionTwo()
    const before = JSON.stringify(saved)
    upgradeClassicRunSnapshot(saved)
    expect(JSON.stringify(saved)).toBe(before)
  })

  it('leaves a current save unchanged and an upgraded one stable', () => {
    const saved = current()
    expect(upgradeClassicRunSnapshot(saved)).toEqual(saved)
    const upgraded = upgradeClassicRunSnapshot(versionTwo())
    expect(upgradeClassicRunSnapshot(upgraded)).toEqual(upgraded)
  })

  it('keeps a Crystal Lens Arcana choice when a shop visit is saved and loaded', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState()
    state.charterSystem.purchaseCharter('crystal_lens')
    Object.assign(state, { phase: 'shop', lastCompletedRoundType: 'Small' })
    const next = runRandom.next.bind(runRandom)
    // A 0.5 shop roll stocks every pack as Arcana.
    vi.spyOn(runRandom, 'next').mockImplementation((stream) =>
      stream === 'shop' ? 0.5 : next(stream)
    )
    expect(game.shop.open()).toBe(true)
    vi.restoreAllMocks()
    const { pack, contents } = game.shop.packOfferings[0]
    expect(pack.type).toBe('Arcana')
    expect(contents).toHaveLength(
      PACK_SIZE_DEFINITIONS[pack.size].choiceCount + 1
    )
    const saved = JSON.parse(JSON.stringify(game.captureRun()))
    expect(upgradeClassicRunSnapshot(saved)).toEqual(saved)
    expect(() => parseClassicRunSnapshot(saved)).not.toThrow()
  })

  it('turns an old Amber Acorn shuffle into a hidden, disabled first half', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved = current() as unknown as Record<string, any>
    const system = saved.state.mandateEffectSystem
    delete system.hiddenDecreeIds
    Object.assign(system, {
      activeMandate: { id: 'amber_acorn' },
      decreesShuffled: true,
      shuffledDecreeIds: ['c', 'a', 'b'],
    })
    const upgraded = upgradeClassicRunSnapshot(saved) as Snapshot
    expect(upgraded.state.mandateEffectSystem.hiddenDecreeIds).toEqual([
      'c',
      'a',
    ])
    expect(upgraded.state.mandateEffectSystem.activeMandate?.effect.type).toBe(
      'hide_half_decrees'
    )
    expect(upgraded.state.mandateEffectSystem).not.toHaveProperty(
      'decreesShuffled'
    )
    expect(upgraded.state.mandateEffectSystem).not.toHaveProperty(
      'shuffledDecreeIds'
    )

    Object.assign(system, { decreesShuffled: false, activeMandate: null })
    const idle = upgradeClassicRunSnapshot(saved) as Snapshot
    expect(idle.state.mandateEffectSystem.hiddenDecreeIds).toEqual([])
    expect(() => parseClassicRunSnapshot(idle)).not.toThrow()
  })

  it('returns unknown versions and non-objects unchanged for validation to reject', () => {
    const future = { ...current(), version: 99 }
    expect(upgradeClassicRunSnapshot(future)).toBe(future)
    expect(upgradeClassicRunSnapshot(null)).toBeNull()
    expect(upgradeClassicRunSnapshot('save')).toBe('save')
    expect(() => parseClassicRunSnapshot(future)).toThrow()
  })
})
