import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { ACHIEVEMENT_REWARD_DECREES } from '../config/achievementRewardDecrees'
import { ALL_DECREES as AUTHORED } from '../config/decreeDefinitions'
import { DECREE_UNLOCKS } from '../config/unlockDefinitions'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { Tile, TileSuit, FlowerType, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function definition(id: string) {
  const decree = ALL_DECREES.find((d) => d.id === id)
  if (!decree) throw Error(`Missing reward ${id}`)
  return decree
}

const tile = (rank: number, id: string, suit = TileSuit.Souzu) =>
  new Tile(suit, rank, id)

function fixture(
  ids: string[] = [],
  tiles = [tile(4, 'a'), tile(5, 'b'), tile(6, 'c')]
) {
  const game = new GameOrchestrator()
  game.setDecreeUnlockResolver(() => true)
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem(10)
  ids.forEach((id) =>
    expect(state.decreeSystem.acquireDecree(definition(id))).not.toBeNull()
  )
  state.handTiles = [...tiles, ...state.handTiles.slice(tiles.length)]
  state.wallTemplate = [
    ...new Map(
      [...state.wall, ...state.handTiles].map((t) => [t.id, t])
    ).values(),
  ]
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const tileIds = tiles.map((t) => t.id)
  const suppress = (...disabledDecreeIds: string[]) => {
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds,
    })
  }
  const pay = () => {
    const snapshot = game.captureRun()
    const preview = game.previewScore(tileIds)!
    expect(preview).not.toBeNull()
    expect(game.previewScore(tileIds)).toEqual(preview)
    expect(game.captureRun()).toEqual(snapshot)
    const before = state.score
    expect(game.processAction({ type: 'play', tileIds }).success).toBe(true)
    expect(state.score - before).toBe(preview.finalScore)
    return preview
  }
  const factor = (id: string) => {
    const owned = state.decreeSystem.getOwnedDecree(id)!
    const boosted = game.previewScore(tileIds)!.equation.multiplier
    owned.isDebuffed = true
    const base = game.previewScore(tileIds)!.equation.multiplier
    owned.isDebuffed = false
    return boosted / base
  }
  return { game, state, tileIds, suppress, pay, factor }
}

describe('achievement reward catalog', () => {
  it('registers exactly nine legacy IDs with milestone gates and authored rarities', () => {
    expect(ACHIEVEMENT_REWARD_DECREES).toHaveLength(9)
    for (const authored of ACHIEVEMENT_REWARD_DECREES) {
      expect(AUTHORED.filter((d) => d.id === authored.id)).toHaveLength(1)
      expect(ALL_DECREES.filter((d) => d.id === authored.id)).toHaveLength(1)
      expect(
        DECREE_UNLOCKS.find((u) => u.unlocksId === authored.id)?.conditions[0]
          .description
      ).toBe(authored.unlockCondition)
      expect(DecreeSystem.getShopCandidates([], undefined, 4)).not.toContain(
        definition(authored.id)
      )
      expect(
        DecreeSystem.getShopCandidates(
          [],
          undefined,
          4,
          (id) => id === authored.id
        )
      ).toContain(definition(authored.id))
      const uncommon = ['stage_master', 'swift_andy', 'lucky_sixes'].includes(
        authored.id
      )
      expect(authored.rarity).toBe(uncommon ? 'uncommon' : 'rare')
      expect(definition(authored.id).cost).toBe(uncommon ? 6 : 8)
    }
  })
})

describe('reward scoring through the live forecast and commit path', () => {
  it.each([1, 4, 8])(
    'Stage Master pays both bonuses for completed Acts (Act %s)',
    (act) => {
      const f = fixture()
      f.state.currentAct = act
      const base = f.game.previewScore(f.tileIds)!
      f.state.decreeSystem.acquireDecree(definition('stage_master'))
      const paid = f.pay()
      expect(paid.additiveBonus - base.additiveBonus).toBe(25 * (act - 1))
      expect(paid.equation.multiplier / base.equation.multiplier).toBe(act)
    }
  )

  it('Flower Pot requires all four owned variants, not four physical duplicates or past ownership', () => {
    const f = fixture(['flower_pot'])
    for (const variant of [
      FlowerType.Plum,
      FlowerType.Orchid,
      FlowerType.Chrysanthemum,
    ])
      f.state.flowerSystem.addFlower(
        Tile.createFlower(variant, `flower-${variant}`)
      )
    const saved = f.state.flowerSystem.toState()
    f.state.flowerSystem = FlowerSystem.fromState({
      ...saved,
      flowers: [
        ...saved.flowers,
        { ...saved.flowers[0], id: 'duplicate-plum' },
      ],
    })
    expect(f.factor('flower_pot')).toBe(1)
    f.state.flowerSystem = FlowerSystem.fromState(saved)
    f.state.flowerSystem.addFlower(
      Tile.createFlower(FlowerType.Bamboo, 'bamboo')
    )
    expect(f.factor('flower_pot')).toBeCloseTo(3)
    f.state.flowerSystem.consumeFlower('bamboo')
    expect(f.factor('flower_pot')).toBe(1)
    f.state.flowerSystem.addFlower(
      Tile.createFlower(FlowerType.Bamboo, 'bamboo-again')
    )
    expect(f.factor('flower_pot')).toBeCloseTo(3)
    f.pay()
  })

  it('Lucky Sixes counts natural suited sixes once each, including a Wild six but not a Stone six', () => {
    const f = fixture(
      ['lucky_sixes'],
      [
        tile(6, 'six'),
        tile(6, 'wild-six', TileSuit.Manzu).withEnhancement(
          EnhancementType.Wild
        ),
        tile(6, 'stone-six').withEnhancement(EnhancementType.Stone),
        tile(5, 'wild-five').withEnhancement(EnhancementType.Wild),
        Tile.createWind(WindType.East, 'honor'),
      ]
    )
    expect(f.factor('lucky_sixes')).toBe(13)
    f.pay()
  })

  it.each([
    ['pair', [tile(6, 'a'), tile(6, 'b')], 3],
    ['triplet', [tile(6, 'a'), tile(6, 'b'), tile(6, 'c')], 3],
    [
      'matching Wild',
      [tile(6, 'a'), tile(6, 'b').withEnhancement(EnhancementType.Wild)],
      3,
    ],
    [
      'different Wild suit',
      [
        tile(6, 'a'),
        tile(6, 'b', TileSuit.Manzu).withEnhancement(EnhancementType.Wild),
      ],
      1,
    ],
    [
      'different Wild rank',
      [tile(6, 'a'), tile(5, 'b').withEnhancement(EnhancementType.Wild)],
      1,
    ],
    [
      'Stone',
      [
        tile(6, 'a'),
        tile(6, 'b'),
        tile(6, 'c').withEnhancement(EnhancementType.Stone),
      ],
      1,
    ],
    [
      'honor pair',
      [
        Tile.createWind(WindType.East, 'a'),
        Tile.createWind(WindType.East, 'b'),
      ],
      3,
    ],
  ] as const)('The Idol checks natural faces: %s', (_name, tiles, expected) => {
    const f = fixture(['the_idol'], [...tiles])
    expect(f.factor('the_idol')).toBe(expected)
    f.pay()
  })

  it('Stuntman contributes its full points bonus in a real play', () => {
    const f = fixture()
    const base = f.game.previewScore(f.tileIds)!
    f.state.decreeSystem.acquireDecree(definition('stuntman'))
    expect(f.pay().additiveBonus - base.additiveBonus).toBe(250)
  })

  it.each([
    'stage_master',
    'flower_pot',
    'lucky_sixes',
    'the_idol',
    'stuntman',
  ])(
    'copies %s and suppresses both source and copy without changing physical neighbors',
    (id) => {
      const f = fixture(['decree-blueprint', id], [tile(6, 'a'), tile(6, 'b')])
      f.state.currentAct = 4
      if (id === 'flower_pot') {
        for (const variant of [
          FlowerType.Plum,
          FlowerType.Orchid,
          FlowerType.Chrysanthemum,
          FlowerType.Bamboo,
        ])
          f.state.flowerSystem.addFlower(Tile.createFlower(variant))
      }
      const copied = f.game.previewScore(f.tileIds)!
      f.suppress('decree-blueprint')
      const single = f.game.previewScore(f.tileIds)!
      f.suppress(id)
      const none = f.game.previewScore(f.tileIds)!
      expect(copied.finalScore).toBeGreaterThan(single.finalScore)
      expect(single.finalScore).toBeGreaterThan(none.finalScore)
      f.suppress()
      f.state.decreeSystem.getOwnedDecree(id)!.isDebuffed = true
      expect(f.pay().finalScore).toBe(none.finalScore)
    }
  )

  it('survives strict JSON restore without changing forecast or spending RNG', () => {
    const f = fixture(['stage_master', 'lucky_sixes', 'stuntman'])
    const before = JSON.parse(JSON.stringify(f.game.captureRun()))
    const forecast = f.game.previewScore(f.tileIds)
    expect(JSON.parse(JSON.stringify(f.game.captureRun()))).toEqual(before)
    f.game.restoreRun(parseClassicRunSnapshot(before))
    expect(f.game.previewScore(f.tileIds)).toEqual(forecast)
    expect(
      f.game.processAction({ type: 'play', tileIds: f.tileIds }).success
    ).toBe(true)
    expect(f.game.getState().score).toBe(forecast!.finalScore)
  })
})

describe('reward round resources', () => {
  it.each([
    ['swift_andy', 2, -2],
    ['stuntman', 0, -3],
  ] as const)(
    '%s changes actual round resources and copies both parts',
    (id, redraws, rack) => {
      const f = fixture(['decree-blueprint', id])
      const baseRedraws = f.state.redrawsRemaining
      const baseRack = f.state.handTiles.length
      expect(f.state.decreeSystem.getAdditionalDiscards()).toBe(redraws * 2)
      expect(f.state.decreeSystem.getHandSizeBonus()).toBe(rack * 2)
      // Enter a new round through the actual shop exit path.
      f.state.phase = 'shop'
      f.state.lastCompletedRoundType = 'Small'
      f.game.exitShop()
      expect(f.state.redrawsRemaining).toBe(baseRedraws + redraws * 2)
      expect(f.state.handTiles).toHaveLength(baseRack + rack * 2)
      f.state.decreeSystem.getOwnedDecree(id)!.isDebuffed = true
      expect(f.state.decreeSystem.getAdditionalDiscards()).toBe(0)
      expect(f.state.decreeSystem.getHandSizeBonus()).toBe(0)
    }
  )

  it('Swift Andy REDRAW spends the free budget before paid Turns', () => {
    const f = fixture(['swift_andy'])
    f.state.phase = 'shop'
    f.state.lastCompletedRoundType = 'Small'
    f.game.exitShop()
    const before = f.state.handsRemaining
    const free = f.state.redrawsRemaining
    expect(
      f.game.processAction({
        type: 'redraw',
        tileIds: [f.state.handTiles[0].id],
      }).success
    ).toBe(true)
    expect(f.state.redrawsRemaining).toBe(free - 1)
    expect(f.state.handsRemaining).toBe(before)
  })
})
