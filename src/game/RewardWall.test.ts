import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFullTileSet, TileSuit } from '../core/Tile'
import { EnhancementType, SealType } from '../core/TileModifier'
import {
  CRIMSON_WALL,
  OBSIDIAN_WALL,
  TABLE_STYLE_DEFINITIONS,
  getUnlockProgress,
  isUnlockConditionMet,
  type PlayerUnlockStats,
} from '../config/tableStyleDefinitions'
import { TableStyleSystem } from '../systems/TableStyleSystem'
import { TileModifierSystem } from '../systems/TileModifierSystem'
import { useTableStyleStore } from '../stores/tableStyleStore'
import {
  applyTableStartingEnhancements,
  resolveTableRules,
} from './tableStyleRules'

const rewards = [
  {
    id: 'crimson_wall',
    suit: TileSuit.Dragon,
    enhancement: EnhancementType.Mult,
    count: 12,
    chips: 0,
    mult: 4,
  },
  {
    id: 'obsidian_wall',
    suit: TileSuit.Wind,
    enhancement: EnhancementType.Bonus,
    count: 16,
    chips: 30,
    mult: 0,
  },
] as const

const legacyStats: PlayerUnlockStats = {
  highestActCompleted: 8,
  maxFlowersInRun: 4,
  maxDecreesInWin: 5,
  totalDecreesPurchased: 20,
  fewestDecreesInWin: 3,
  maxCorruptedSeasonsSurvived: 3,
  hasScoredYakuman: true,
}

describe('reward Wall catalog and starting enhancements', () => {
  it('adds two selectable rewards without renaming or removing the eight existing tables', () => {
    expect(TABLE_STYLE_DEFINITIONS.map((style) => style.id)).toEqual([
      'green_felt',
      'red_lacquer',
      'bamboo_mat',
      'imperial_gold',
      'night_market',
      'temple_stone',
      'ghost_parlor',
      'dragons_den',
      'crimson_wall',
      'obsidian_wall',
    ])
    expect(new Set(TABLE_STYLE_DEFINITIONS.map((style) => style.id)).size).toBe(
      10
    )
    for (const style of [CRIMSON_WALL, OBSIDIAN_WALL]) {
      expect(style.isDefault).toBe(false)
      expect(style.startingModifiers[0].isBenefit).toBe(true)
      expect(style.startingModifiers[1]).toMatchObject({
        type: 'decree_slot',
        value: -1,
        isBenefit: false,
      })
    }
    expect(CRIMSON_WALL.feltColor).not.toBe(OBSIDIAN_WALL.feltColor)
    expect(CRIMSON_WALL.accentColor).not.toBe(OBSIDIAN_WALL.accentColor)
  })

  it.each(rewards)(
    '$id enhances every starting $suit without changing wall identity or composition',
    ({ id, suit, enhancement, count, chips, mult }) => {
      const original = createFullTileSet()
      const wall = applyTableStartingEnhancements(Object.freeze(original), id)
      expect(wall).toHaveLength(144)
      expect(wall.map((tile) => tile.id)).toEqual(
        original.map((tile) => tile.id)
      )
      expect(new Set(wall.map((tile) => tile.id)).size).toBe(144)
      expect(
        wall.filter((tile) => tile.enhancement === enhancement)
      ).toHaveLength(count)
      for (let index = 0; index < wall.length; index++) {
        const tile = wall[index]
        expect(tile.suit).toBe(original[index].suit)
        expect(tile.rank).toBe(original[index].rank)
        expect(tile.isRed).toBe(original[index].isRed)
        expect(original[index].enhancement).toBe(EnhancementType.None)
        if (tile.suit === suit) {
          expect(tile).not.toBe(original[index])
          expect(tile.enhancement).toBe(enhancement)
          expect(tile.modifierChips).toBe(chips)
          expect(tile.modifierMult).toBe(mult)
        } else {
          expect(tile).toBe(original[index])
        }
      }
    }
  )

  it.each(rewards)(
    '$id uses scored-only existing enhancements and allows Seal replacement',
    ({ id, suit, chips, mult }) => {
      const wall = applyTableStartingEnhancements(createFullTileSet(), id)
      const marked = wall.find((tile) => tile.suit === suit)!
      const modifiers = new TileModifierSystem()
      expect(
        modifiers.scoreTilesWithModifiers([marked], 'played', { preview: true })
      ).toMatchObject({
        totalChips: chips,
        totalMult: mult,
      })
      expect(
        modifiers.scoreTilesWithModifiers([marked], 'held', { preview: true })
      ).toMatchObject({
        totalChips: 0,
        totalMult: 0,
      })
      const sealed = marked.withSeal(SealType.Red)
      expect(sealed.id).toBe(marked.id)
      expect(sealed.enhancement).toBe(EnhancementType.None)
      expect(sealed.seal).toBe(SealType.Red)
      expect(
        modifiers.scoreTilesWithModifiers([sealed], 'played', { preview: true })
      ).toMatchObject({
        totalChips: 0,
        totalMult: 0,
      })
    }
  )

  it.each(rewards)(
    '$id changes only the base Decree allowance among passive modifiers',
    ({ id }) => {
      const rules = resolveTableRules(id)
      expect(rules.id).toBe(id)
      expect(rules.modifiers).toEqual({
        ...resolveTableRules('green_felt').modifiers,
        decreeSlotModifier: -1,
      })
      expect(5 + rules.modifiers.decreeSlotModifier).toBe(4)
      expect(Object.isFrozen(rules.modifiers)).toBe(true)
      const system = new TableStyleSystem(id, ['green_felt', id])
      expect(
        TableStyleSystem.fromState(system.toState()).getCurrentStyleId()
      ).toBe(id)
      expect(system.getActiveModifiers()).toEqual(rules.modifiers)
    }
  )

  it('leaves other tables and unknown legacy IDs unenhanced', () => {
    const tiles = createFullTileSet()
    for (const id of [
      ...TABLE_STYLE_DEFINITIONS.slice(0, 8).map((style) => style.id),
      'legacy-unknown',
    ]) {
      const wall = applyTableStartingEnhancements(tiles, id)
      expect(wall).toEqual(tiles)
      expect(wall.every((tile, index) => tile === tiles[index])).toBe(true)
    }
    expect(resolveTableRules('legacy-unknown').id).toBe('green_felt')
    const system = TableStyleSystem.fromState({
      currentStyleId: 'legacy-unknown',
      unlockedStyles: ['green_felt', 'legacy-unknown'],
    })
    expect(system.getCurrentStyleId()).toBe('green_felt')
    expect(system.toState().unlockedStyles).toContain('legacy-unknown')
  })

  it.each([
    [undefined, false, false],
    [1, false, false],
    [2, true, false],
    [3, true, false],
    [4, true, true],
    [8, true, true],
  ] as const)(
    'unlocks only from actual highestTierWon=%s',
    (highestTierWon, crimson, obsidian) => {
      const stats = { ...legacyStats, highestTierWon }
      expect(isUnlockConditionMet(CRIMSON_WALL, stats)).toBe(crimson)
      expect(isUnlockConditionMet(OBSIDIAN_WALL, stats)).toBe(obsidian)
      const unlocked = new TableStyleSystem().updateUnlocks(stats)
      expect(unlocked.includes('crimson_wall')).toBe(crimson)
      expect(unlocked.includes('obsidian_wall')).toBe(obsidian)
    }
  )

  it('shows tier win progress without treating other achievements as evidence', () => {
    expect(getUnlockProgress(CRIMSON_WALL, legacyStats)).toBe(0)
    expect(
      getUnlockProgress(OBSIDIAN_WALL, { ...legacyStats, highestTierWon: 2 })
    ).toBe(0.5)
    expect(
      getUnlockProgress(OBSIDIAN_WALL, { ...legacyStats, highestTierWon: 8 })
    ).toBe(1)
  })
})

describe('reward Wall saved selection and legacy profile compatibility', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.spyOn(localStorage, 'getItem').mockImplementation(
      (key) => data.get(key) ?? null
    )
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      data.set(key, value)
    })
    useTableStyleStore.getState().resetAllProgress()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(rewards)(
    'selects and restores legacy-earned $id without replaying its achievement',
    async ({ id }) => {
      const history = [
        { styleId: id, unlockedAt: 123 },
        { styleId: 'legacy-unknown', unlockedAt: 456 },
      ]
      localStorage.setItem(
        'tensho-table-style-progress',
        JSON.stringify({
          state: {
            currentStyleId: id,
            unlockedStyles: ['green_felt', id, 'legacy-unknown'],
            unlockHistory: history,
            stats: legacyStats,
            activeModifiers: { decreeSlotModifier: 999 },
          },
          version: 0,
        })
      )
      await useTableStyleStore.persist.rehydrate()
      const state = useTableStyleStore.getState()
      expect(state.currentStyleId).toBe(id)
      expect(state.selectStyle(id)).toBe(true)
      expect(state.getAllStyles()).toHaveLength(10)
      expect(state.activeModifiers).toEqual(resolveTableRules(id).modifiers)
      expect(state.unlockedStyles).toContain('legacy-unknown')
      expect(state.unlockHistory).toEqual(history)
      expect(state.stats.highestTierWon).toBe(0)
    }
  )

  it('falls back from an unknown selection without erasing legacy unlock records', async () => {
    localStorage.setItem(
      'tensho-table-style-progress',
      JSON.stringify({
        state: {
          currentStyleId: 'legacy-unknown',
          unlockedStyles: ['legacy-unknown', 'crimson_wall'],
          unlockHistory: [{ styleId: 'legacy-unknown', unlockedAt: 123 }],
        },
        version: 0,
      })
    )
    await useTableStyleStore.persist.rehydrate()
    const state = useTableStyleStore.getState()
    expect(state.currentStyleId).toBe('green_felt')
    expect(state.unlockedStyles).toEqual([
      'green_felt',
      'legacy-unknown',
      'crimson_wall',
    ])
    expect(state.unlockHistory).toEqual([
      { styleId: 'legacy-unknown', unlockedAt: 123 },
    ])
    expect(state.activeModifiers).toEqual(
      resolveTableRules('green_felt').modifiers
    )
  })

  it('keeps wins monotonic and unlocks each reward exactly once', () => {
    const state = useTableStyleStore.getState()
    expect(state.selectStyle('crimson_wall')).toBe(false)
    state.updateStats(legacyStats)
    expect(state.processUnlocks()).not.toContain('crimson_wall')
    state.updateStats({ highestTierWon: 2 })
    expect(state.processUnlocks()).toEqual(['crimson_wall'])
    state.updateStats({ highestTierWon: 1 })
    expect(useTableStyleStore.getState().stats.highestTierWon).toBe(2)
    expect(state.processUnlocks()).toEqual([])
    state.updateStats({ highestTierWon: 4 })
    expect(state.processUnlocks()).toEqual(['obsidian_wall'])
    expect(state.processUnlocks()).toEqual([])
    expect(
      useTableStyleStore
        .getState()
        .unlockHistory.filter((entry) =>
          rewards.some(({ id }) => id === entry.styleId)
        )
    ).toHaveLength(2)
  })
})
