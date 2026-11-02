import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chooseClassicConsumableAction,
  type ConsumablePolicyContext,
} from '../../scripts/lib/classic-consumable-policy'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import {
  GameOrchestrator,
  type OrchestratorState,
} from '../game/GameOrchestrator'
import { buildCoachAdvice } from './beginnerCoach'
import { runRandom } from '../game/RunRandom'

const seal = (id: string) =>
  FateSealSystem.createFateSealInstance(FATE_SEALS[id])
const script = (id: string) =>
  VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
const orb = () =>
  CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
function context(
  overrides: Partial<ConsumablePolicyContext> = {}
): ConsumablePolicyContext {
  const visibleTiles = [2, 3, 4, 1, 9].map(
    (rank, i) => new Tile(TileSuit.Souzu, rank, `t${i}`)
  )
  return {
    visibleTiles,
    items: [],
    lockedTileIds: [],
    gold: 4,
    decreeCount: 1,
    scriptDownsideProtected: false,
    lastCopyable: null,
    remainingToTarget: 1000,
    advice: {
      best: {
        tileIds: ['t0', 't1', 't2'],
        score: 80,
        pattern: null,
        structurePoints: 30,
      },
      shape: null,
      keepsPace: false,
      requiredPerHand: 250,
      structureGivenUp: 0,
    },
    canPerform: () => true,
    ...overrides,
  }
}
afterEach(() => vi.restoreAllMocks())

describe('read-only conservative consumable policy', () => {
  it('takes a known clear without even probing item legality', () => {
    const canPerform = vi.fn(() => true)
    const result = chooseClassicConsumableAction(
      context({ items: [orb()], remainingToTarget: 50, canPerform })
    )
    expect(result.choice).toBeNull()
    expect(result.held[0].reason).toBe('take-known-clear')
    expect(canPerform).not.toHaveBeenCalled()
  })

  it('prioritizes permanent upgrades, then Seals, then Scripts without mutating inventory order', () => {
    const items = [script('script_of_aura'), seal('seal_of_the_hermit'), orb()]
    const order = items.map((i) => i.instanceId)
    const result = chooseClassicConsumableAction(context({ items }))
    expect(result.choice?.action.type).toBe('useOrb')
    expect(result.held).toHaveLength(2)
    expect(items.map((i) => i.instanceId)).toEqual(order)
  })

  it('continues past an illegal capped Orb to another valid item', () => {
    const result = chooseClassicConsumableAction(
      context({
        items: [orb(), seal('seal_of_balance')],
        canPerform: (a) => a.type !== 'useOrb',
      })
    )
    expect(result.choice?.itemId).toBe('seal_of_balance')
    expect(result.held[0].reason).toBe('currently-illegal')
  })

  it('puts scoring marks on unmodified tiles in the actual scoring selection', () => {
    const result = chooseClassicConsumableAction(
      context({ items: [seal('seal_of_the_empress')] })
    )
    expect(result.choice?.action).toMatchObject({
      type: 'useSeal',
      targets: ['t0', 't1'],
    })
  })

  it('does not overwrite an existing enhancement to meet an exact target count', () => {
    const c = context({ items: [seal('seal_of_the_empress')] })
    c.visibleTiles = c.visibleTiles.map((t, i) =>
      i < 2 ? t.withEnhancement(EnhancementType.Mult) : t
    )
    const result = chooseClassicConsumableAction(c)
    expect(result.choice).toBeNull()
    expect(result.held[0].reason).toBe('no-suitable-visible-targets')
  })

  it.each(['seal_of_fortitude', 'seal_of_wealth'])(
    'puts %s in the scoring selection: its Edition pays when played',
    (id) => {
      const result = chooseClassicConsumableAction(
        context({ items: [seal(id)] })
      )
      expect(result.choice?.action).toMatchObject({ targets: ['t0'] })
    }
  )

  it('never targets a locked tile', () => {
    const result = chooseClassicConsumableAction(
      context({ items: [seal('seal_of_the_empress')], lockedTileIds: ['t1'] })
    )
    expect(result.choice?.action).toMatchObject({ targets: ['t0', 't2'] })
  })

  it('uses the least-connected spare for Stone rather than replacing a useful shape', () => {
    expect(
      chooseClassicConsumableAction(context({ items: [seal('seal_of_stone')] }))
        .choice?.action
    ).toMatchObject({ targets: ['t4'] })
  })

  it.each([
    ['script_of_the_gold_seal', ['t0', 't1', 't2']],
    ['script_of_the_trance', ['t0', 't1']],
    ['script_of_the_medium', ['t0', 't1']],
  ] as const)(
    'puts %s Editions on the scoring selection without replacing an Edition',
    (id, targets) => {
      // Its penalty is not priced: only a protected Script is used.
      expect(
        chooseClassicConsumableAction(context({ items: [script(id)] })).held[0]
          .reason
      ).toBe('script-penalty-not-priced')
      const c = context({ items: [script(id)], scriptDownsideProtected: true })
      expect(chooseClassicConsumableAction(c).choice?.action).toMatchObject({
        type: 'useScript',
        targets,
      })
      c.visibleTiles = c.visibleTiles.map((t) =>
        t.withEnhancement(EnhancementType.Bonus)
      )
      expect(chooseClassicConsumableAction(c).choice).toBeNull()
    }
  )

  it('gilds with an empty purse, since Gilding only costs the Gold held', () => {
    const result = chooseClassicConsumableAction(
      context({ items: [script('script_of_the_gold_seal')], gold: 0 })
    )
    expect(result.choice?.action).toMatchObject({
      type: 'useScript',
      targets: ['t0', 't1', 't2'],
    })
  })

  it('copies only a visible, non-Stone Edition with Deja Vu', () => {
    const c = context({
      items: [script('script_of_deja_vu')],
      scriptDownsideProtected: true,
    })
    const plain = chooseClassicConsumableAction(c)
    expect(plain.choice).toBeNull()
    expect(plain.held[0].reason).toBe('no-suitable-visible-targets')
    c.visibleTiles = c.visibleTiles.map((t, i) =>
      i === 1
        ? t.withEnhancement(EnhancementType.Mult)
        : i === 4
          ? t.withEnhancement(EnhancementType.Stone)
          : t
    )
    expect(chooseClassicConsumableAction(c).choice?.action).toMatchObject({
      type: 'useScript',
      targets: ['t1'],
    })
  })

  it('does not reroll existing tile Editions with Aura', () => {
    const c = context({ items: [script('script_of_aura')] })
    expect(chooseClassicConsumableAction(c).choice?.action).toMatchObject({
      type: 'useScript',
      targets: ['t0', 't1', 't2'],
    })
    c.visibleTiles = c.visibleTiles.map((t) =>
      t.withEnhancement(EnhancementType.Lucky)
    )
    expect(chooseClassicConsumableAction(c).choice).toBeNull()
  })

  it('uses a single eligible rank target for an up-to-two effect without breaking the current group', () => {
    const result = chooseClassicConsumableAction(
      context({ items: [seal('seal_of_strength')] })
    )
    expect(result.choice?.action).toMatchObject({ targets: ['t3'] })
    expect(result.choice?.reason).toBe('visible-connections')
  })

  it('converts a spare suit only for a positive visible connection gain', () => {
    const c = context({ items: [seal('seal_of_souzu')] })
    c.visibleTiles = c.visibleTiles.map((t) =>
      t.id === 't3' ? new Tile(TileSuit.Manzu, 2, t.id) : t
    )
    expect(chooseClassicConsumableAction(c).choice?.action).toMatchObject({
      targets: ['t3'],
    })
  })

  it('uses the actual Unity Wind mapping when evaluating a high-rank spare', () => {
    const c = context({ items: [seal('seal_of_unity')] })
    c.visibleTiles = [
      ...c.visibleTiles.slice(0, 3),
      new Tile(TileSuit.Wind, 1, 'wind'),
      new Tile(TileSuit.Manzu, 9, 'nine'),
    ]
    expect(chooseClassicConsumableAction(c).choice?.action).toMatchObject({
      targets: ['nine'],
    })
  })

  it('holds structural edits with no useful visible target', () => {
    const c = context({
      items: [seal('seal_of_strength')],
      lockedTileIds: ['t3'],
    })
    const result = chooseClassicConsumableAction(c)
    expect(result.choice).toBeNull()
    expect(result.held[0].reason).toBe('no-visible-structural-gain')
  })

  it('puts the tile to replace first in a copy action', () => {
    const result = chooseClassicConsumableAction(
      context({ items: [seal('seal_of_transmutation')] })
    )
    const action = result.choice?.action
    if (action?.type !== 'useSeal') throw Error('Expected copy Seal')
    expect(['t3', 't4']).toContain(action.targets![0])
    expect(action.targets![1]).not.toBe(action.targets![0])
    expect(['t0', 't1', 't2']).toContain(action.targets![1])
  })

  it('can use an untargeted Orb when no tile identities are visible, but cannot manufacture mark targets', () => {
    const c = context({
      visibleTiles: [],
      advice: null,
      items: [orb(), seal('seal_of_the_empress')],
    })
    const result = chooseClassicConsumableAction(c)
    expect(result.choice?.action.type).toBe('useOrb')
    expect(result.held[0].reason).toBe('no-suitable-visible-targets')
  })

  it('does not spend an allowance on self-copy', () => {
    const item = seal('seal_of_the_fool')
    const result = chooseClassicConsumableAction(
      context({ items: [item], lastCopyable: item })
    )
    expect(result.choice).toBeNull()
    expect(result.held[0].reason).toBe('self-copy-no-benefit')
    expect(
      chooseClassicConsumableAction(
        context({ items: [item], lastCopyable: orb() })
      ).choice?.itemId
    ).toBe(item.id)
  })

  it('requires protection before a tile-copy Script with an unpriced penalty', () => {
    const c = context({ items: [script('script_of_the_cryptid')] })
    expect(chooseClassicConsumableAction(c).held[0].reason).toBe(
      'script-penalty-not-priced'
    )
    expect(
      chooseClassicConsumableAction({ ...c, scriptDownsideProtected: true })
        .choice?.action
    ).toMatchObject({ type: 'useScript', targets: ['t0'] })
  })

  it.each([
    'script_of_immolation',
    'script_of_the_sigil',
    'script_of_the_ouija',
  ])(
    'protection does not pretend the primary global/destructive effect is free: %s',
    (id) => {
      const result = chooseClassicConsumableAction(
        context({ items: [script(id)], scriptDownsideProtected: true })
      )
      expect(result.choice).toBeNull()
      expect(result.held[0].reason).toBe(
        'global-or-destructive-effect-not-priced'
      )
    }
  )

  it('accepts a Wraith gold cost only when zero or protected', () => {
    const c = context({ items: [script('script_of_the_wraith')] })
    expect(chooseClassicConsumableAction(c).choice).toBeNull()
    expect(
      chooseClassicConsumableAction({ ...c, gold: 0 }).choice?.itemId
    ).toBe('script_of_the_wraith')
  })

  it('does not destroy a multi-Decree build for a random copy', () => {
    const c = context({ items: [script('script_of_the_ankh')], decreeCount: 2 })
    expect(chooseClassicConsumableAction(c).choice).toBeNull()
    expect(
      chooseClassicConsumableAction({ ...c, decreeCount: 1 }).choice?.itemId
    ).toBe('script_of_the_ankh')
  })

  it('does not mutate inputs, call effects, or consume randomness on repeated decisions', () => {
    const c = context({
      items: [seal('seal_of_strength'), script('script_of_aura')],
    })
    const before = JSON.stringify(c)
    const random = vi.spyOn(runRandom, 'next')
    const first = chooseClassicConsumableAction(c)
    for (let i = 0; i < 5; i++)
      expect(chooseClassicConsumableAction(c)).toEqual(first)
    expect(JSON.stringify(c)).toBe(before)
    expect(random).not.toHaveBeenCalled()
  })

  it('every chosen action across the actual item catalog is accepted by the real engine', () => {
    const definitions = [
      ...Object.values(FATE_SEALS),
      ...Object.values(CELESTIAL_ORBS),
      ...Object.values(VOID_SCRIPTS),
    ]
    const usedFamilies = new Set<string>()
    for (const definition of definitions) {
      const game = new GameOrchestrator()
      game.startNewRun(7)
      const state = game.getState() as OrchestratorState
      state.targetScore = 1000000
      state.gold = 0
      const item =
        definition.type === 'FateSeal'
          ? FateSealSystem.createFateSealInstance(definition)
          : definition.type === 'CelestialOrb'
            ? CelestialOrbSystem.createCelestialOrbInstance(definition)
            : VoidScriptSystem.createVoidScriptInstance(definition)
      if (item.type === 'FateSeal') game.addFateSeal(item)
      else if (item.type === 'CelestialOrb') game.addCelestialOrb(item)
      else game.addVoidScript(item)
      const advice = buildCoachAdvice({
        tiles: state.handTiles,
        scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
        handsRemaining: state.handsRemaining,
        remainingToTarget: state.targetScore,
      })
      const decision = chooseClassicConsumableAction(
        context({
          visibleTiles: state.handTiles,
          items: [item],
          advice,
          gold: 0,
          decreeCount: state.decreeSystem.getOwnedDecrees().length,
          canPerform: (a) => game.canPerformAction(a),
        })
      )
      if (decision.choice) {
        expect(
          game.processAction(decision.choice.action).success,
          definition.id
        ).toBe(true)
        usedFamilies.add(item.type)
      } else expect(decision.held[0].reason, definition.id).toBeTruthy()
    }
    expect([...usedFamilies].sort()).toEqual([
      'CelestialOrb',
      'FateSeal',
      'VoidScript',
    ])
  })
})
