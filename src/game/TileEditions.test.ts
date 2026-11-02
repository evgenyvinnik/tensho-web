import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  EnhancementType,
  LUCKY_FLOOR,
  LUCKY_MULTIPLIERS,
  LUCKY_POINTS,
  calculateModifierEffects,
} from '../core/TileModifier'
import { tileModifierSystem } from '../systems/TileModifierSystem'
import { DecreeSystem } from '../systems/DecreeSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { upgradeClassicRunSnapshot } from './migrateClassicSnapshot'

const tile = (enhancement: EnhancementType, id: string = enhancement) =>
  new Tile(TileSuit.Pinzu, 5, id).withEnhancement(enhancement)
/** A play needs two tiles: this one pairs with any 5 of Circles. */
const partner = () => new Tile(TileSuit.Pinzu, 5, 'partner')

function fixture(tiles: Tile[]) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  Object.assign(state, {
    handTiles: tiles,
    wallTemplate: [...state.wallTemplate, ...tiles],
    targetScore: 1e9,
    selectedTileIds: new Set(),
    faceDownTileIds: new Set(),
  })
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

afterEach(() => {
  vi.restoreAllMocks()
  runRandom.reset()
})

describe('Edition effects', () => {
  it('pays a Bonus Edition 30 Points per Act', () => {
    const bonus = tile(EnhancementType.Bonus)
    expect(bonus.modifierChips).toBe(30)
    for (const act of [1, 3, 8])
      expect(
        calculateModifierEffects(bonus.modifiers, bonus.id, { act }).chipBonus
      ).toBe(30 * act)
  })

  it('pays a Gold Edition 3 Gold each time it scores, repeats included', () => {
    const gold = tile(EnhancementType.Gold)
    expect(
      tileModifierSystem.scoreTilesWithModifiers([gold], { preview: true })
        .totalGold
    ).toBe(3)
    expect(
      tileModifierSystem.scoreTilesWithModifiers([gold], {
        preview: true,
        extraRetriggers: new Map([[gold.id, 2]]),
      }).totalGold
    ).toBe(9)
  })

  it('pays a Lucky Edition its round roll, or the floor without one', () => {
    const lucky = tile(EnhancementType.Lucky)
    const roll = { multiplier: 1.75, points: 80 }
    expect(
      calculateModifierEffects(lucky.modifiers, lucky.id, {
        luckyRolls: { [lucky.id]: roll },
      })
    ).toMatchObject({ chipBonus: 80, multMultiplier: 1.75 })
    expect(calculateModifierEffects(lucky.modifiers, lucky.id)).toMatchObject({
      chipBonus: LUCKY_FLOOR.points,
      multMultiplier: LUCKY_FLOOR.multiplier,
    })
  })

  it('makes a Fate Seal from Glass and an Orb from Steel, once per play', () => {
    const glass = tile(EnhancementType.Glass)
    const steel = tile(EnhancementType.Steel)
    const scored = tileModifierSystem.scoreTilesWithModifiers([glass, steel], {
      preview: true,
      extraRetriggers: new Map([[glass.id, 3]]),
    })
    expect(scored.consumables).toEqual([
      { type: 'seal', tileId: glass.id },
      { type: 'orb', tileId: steel.id },
    ])
    // They give up their old ×Mult: nothing multiplies the play.
    expect(scored.totalMultiplier).toBe(1)
  })

  it('breaks Glass and Steel on a 1 in 4 roll, never in a preview', () => {
    const glass = tile(EnhancementType.Glass)
    const steel = tile(EnhancementType.Steel)
    vi.spyOn(runRandom, 'next').mockReturnValue(0.24)
    expect(
      tileModifierSystem.scoreTilesWithModifiers([glass, steel], {
        preview: true,
      }).brokenTiles
    ).toEqual([])
    expect(
      tileModifierSystem.scoreTilesWithModifiers([glass, steel]).brokenTiles
    ).toEqual([
      { tileId: glass.id, breaks: 'shattered' },
      { tileId: steel.id, breaks: 'rusted' },
    ])
    vi.spyOn(runRandom, 'next').mockReturnValue(0.25)
    expect(
      tileModifierSystem.scoreTilesWithModifiers([glass, steel]).brokenTiles
    ).toEqual([])
  })
})

describe('Editions at the table', () => {
  it('a played Glass tile makes a Fate Seal, then shatters out of the run', () => {
    const glass = tile(EnhancementType.Glass, 'glass-a')
    const { game, state } = fixture([glass, partner()])
    const seals = state.fateSeals.length
    const broken = vi.fn()
    const off = eventBus.on('tilesBroken', broken)
    vi.spyOn(runRandom, 'next').mockReturnValue(0)
    try {
      expect(
        game.processAction({ type: 'play', tileIds: ['glass-a', 'partner'] })
          .success
      ).toBe(true)
    } finally {
      off()
    }
    // A made Seal is used at once; one that takes tiles waits for its picks.
    const usedOrHeld =
      state.fateSeals.length > seals ||
      game.getState().fateSealSystem.getLastUsedConsumable() !== null
    expect(usedOrHeld).toBe(true)
    expect(broken).toHaveBeenCalledWith({
      tiles: [{ tile: glass, breaks: 'shattered' }],
    })
    expect(state.wallTemplate.some((t) => t.id === 'glass-a')).toBe(false)
  })

  it('a played Steel tile makes a Celestial Orb and stays on a lucky roll', () => {
    const steel = tile(EnhancementType.Steel, 'steel-a')
    const { game, state } = fixture([steel, partner()])
    const orbs = state.celestialOrbs.length
    vi.spyOn(runRandom, 'next').mockReturnValue(0.9)
    expect(
      game.processAction({ type: 'play', tileIds: ['steel-a', 'partner'] })
        .success
    ).toBe(true)
    expect(state.celestialOrbs.length).toBe(orbs + 1)
    expect(state.wallTemplate.some((t) => t.id === 'steel-a')).toBe(true)
  })

  it('pays a Gold tile while it scores and nothing for one left on the rack', () => {
    const played = tile(EnhancementType.Gold, 'gold-played')
    const held = tile(EnhancementType.Gold, 'gold-held')
    const { game, state } = fixture([played, partner(), held])
    const before = state.gold
    expect(
      game.processAction({ type: 'play', tileIds: ['gold-played', 'partner'] })
        .success
    ).toBe(true)
    expect(state.gold - before).toBe(3)
  })

  it('rolls every Lucky tile when the round starts and keeps the rolls on save', () => {
    const game = new GameOrchestrator()
    game.startNewRun(11)
    const state = game.getState() as OrchestratorState
    state.handTiles = state.handTiles.map((t, index) =>
      index < 2 ? t.withEnhancement(EnhancementType.Lucky) : t
    )
    const lucky = state.handTiles.slice(0, 2)
    // A tile made Lucky mid-round rolls right after the action that made it;
    // a play is such an action.
    const others = state.handTiles.filter((t) => !t.isLucky).slice(0, 2)
    expect(
      game.processAction({ type: 'play', tileIds: others.map((t) => t.id) })
        .success
    ).toBe(true)
    const rolls = state.luckyRolls!
    for (const t of lucky) {
      expect(LUCKY_MULTIPLIERS).toContain(rolls[t.id].multiplier)
      expect(LUCKY_POINTS).toContain(rolls[t.id].points)
    }
    const preview = game.previewScore(lucky.map((t) => t.id))
    expect(preview).not.toBeNull()
    expect(state.luckyRolls).toBe(rolls)
    const restored = new GameOrchestrator()
    restored.restoreRun(structuredClone(game.captureRun()))
    expect(restored.getState().luckyRolls).toEqual(rolls)
  })

  it('replays the same Lucky rolls from the same seed', () => {
    const rollsFor = () => {
      const game = new GameOrchestrator()
      game.startNewRun(23)
      const state = game.getState() as OrchestratorState
      state.wallTemplate = state.wallTemplate.map((t) =>
        t.withEnhancement(EnhancementType.Lucky)
      )
      const played = state.handTiles.slice(0, 2).map((t) => t.id)
      expect(
        game.processAction({ type: 'play', tileIds: played }).success
      ).toBe(true)
      return Object.values(state.luckyRolls!)
    }
    const first = rollsFor()
    runRandom.reset()
    expect(first.length).toBeGreaterThan(0)
    expect(rollsFor()).toEqual(first)
  })
})

describe('Void Scripts that lay Editions', () => {
  function runScript(id: string, tiles: Tile[], targets: string[]) {
    const { game, state } = fixture(tiles)
    const script = VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
    expect(game.addVoidScript(script)).toBe(true)
    const result = game.processAction({
      type: 'useScript',
      scriptId: script.instanceId,
      targets,
    })
    const find = (tileId: string) =>
      state.wallTemplate.find((t) => t.id === tileId)!
    return { result, state, find }
  }
  const plain = (id: string, rank = 5) => new Tile(TileSuit.Pinzu, rank, id)

  it('Script of Gilding gilds up to three tiles and empties the purse', () => {
    const { result, state, find } = runScript(
      'script_of_the_gold_seal',
      [plain('a'), plain('b', 6), plain('c', 7)],
      ['a', 'b']
    )
    expect(result.success).toBe(true)
    expect(find('a').enhancement).toBe(EnhancementType.Gold)
    expect(find('b').enhancement).toBe(EnhancementType.Gold)
    expect(find('c').enhancement).toBe(EnhancementType.None)
    expect(state.gold).toBe(0)
  })

  it('Steel from the Trance and Glass from the Medium go on two tiles', () => {
    for (const [id, edition] of [
      ['script_of_the_trance', EnhancementType.Steel],
      ['script_of_the_medium', EnhancementType.Glass],
    ] as const) {
      const { result, find } = runScript(
        id,
        [plain('a'), plain('b', 6), plain('c', 7)],
        ['a', 'b']
      )
      expect(result.success).toBe(true)
      expect([find('a'), find('b')].map((t) => t.enhancement)).toEqual([
        edition,
        edition,
      ])
    }
  })

  it('Script of Aura gives each chosen tile a random Edition, never Stone', () => {
    const { result, find } = runScript(
      'script_of_aura',
      [plain('a'), plain('b', 6), plain('c', 7)],
      ['a', 'b', 'c']
    )
    expect(result.success).toBe(true)
    for (const id of ['a', 'b', 'c']) {
      expect(find(id).enhancement).not.toBe(EnhancementType.None)
      expect(find(id).enhancement).not.toBe(EnhancementType.Stone)
    }
  })

  it('Script of Deja Vu copies an Edition onto every copy of the tile', () => {
    const source = plain('source').withEnhancement(EnhancementType.Lucky)
    const { result, state } = runScript(
      'script_of_deja_vu',
      [source, plain('other', 6)],
      ['source']
    )
    expect(result.success).toBe(true)
    const fives = state.wallTemplate.filter(
      (t) => t.suit === TileSuit.Pinzu && t.rank === 5
    )
    expect(fives.length).toBeGreaterThan(1)
    expect(fives.every((t) => t.enhancement === EnhancementType.Lucky)).toBe(
      true
    )
    expect(state.wallTemplate.find((t) => t.id === 'other')!.enhancement).toBe(
      EnhancementType.None
    )
  })

  it('Script of Deja Vu refuses a tile with no Edition', () => {
    const { result } = runScript(
      'script_of_deja_vu',
      [plain('a'), plain('b', 6)],
      ['a']
    )
    expect(result.success).toBe(false)
  })
})

describe('saves from before Editions', () => {
  it('folds Stamps and tile Editions into one Edition and keeps the old Scripts', () => {
    const tileData = (id: string, modifiers: Record<string, string>) => ({
      suit: 'pinzu',
      rank: 5,
      id,
      isRed: false,
      modifiers: {
        enhancement: 'none',
        seal: 'none',
        edition: 'base',
        ...modifiers,
      },
    })
    const upgraded = upgradeClassicRunSnapshot({
      version: 3,
      state: {
        handTiles: [
          tileData('a', { seal: 'gold' }),
          tileData('b', { seal: 'blue' }),
          tileData('c', { seal: 'purple' }),
          tileData('d', { seal: 'red' }),
          tileData('e', { edition: 'negative' }),
          tileData('f', { enhancement: 'lucky', seal: 'gold' }),
        ],
        voidScripts: [
          { id: 'script_of_aura', type: 'VoidScript', instanceId: 'x' },
        ],
        lastRoundSummary: { heldGoldMarkReward: 3, baseReward: 4 },
      },
      shop: {},
    }) as {
      version: number
      state: {
        handTiles: { modifiers: Record<string, string> }[]
        voidScripts: unknown[]
        lastRoundSummary: Record<string, unknown>
      }
    }
    expect(upgraded.version).toBe(4)
    expect(upgraded.state.handTiles.map((t) => t.modifiers)).toEqual([
      { enhancement: 'gold' },
      { enhancement: 'steel' },
      { enhancement: 'glass' },
      { enhancement: 'none' },
      { enhancement: 'none' },
      { enhancement: 'lucky' },
    ])
    expect(upgraded.state.voidScripts).toMatchObject([
      {
        id: 'script_of_aura',
        instanceId: 'x',
        effect: { type: 'apply_tile_edition' },
      },
    ])
    expect(upgraded.state.lastRoundSummary).toEqual({ baseReward: 4 })
  })
})
