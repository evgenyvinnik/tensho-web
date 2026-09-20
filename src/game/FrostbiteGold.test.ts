import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType, SealType } from '../core/TileModifier'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { THE_TOOTH } from '../config/mandateDefinitions'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function setup(frostbites = 0) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.handTiles = [
    ...[4, 5, 6].map((rank) => new Tile(TileSuit.Souzu, rank, `play-${rank}`)),
    ...Array.from(
      { length: 11 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `hand-${i}`)
    ),
  ]
  state.wall = Array.from(
    { length: 50 },
    (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.gold = 10
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  if (frostbites) {
    state.seasonSystem.forceSetSeason('Winter', true)
    const saved = state.seasonSystem.toState()
    state.seasonSystem = SeasonSystem.fromState({
      ...saved,
      seasonStack: Array.from({ length: frostbites }, (_, i) => ({
        ...saved.seasonStack[0],
        id: `frostbite-${i}`,
      })),
    })
  }
  const add = (id: string) => {
    const owned = state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === id)!
    )
    expect(owned).not.toBeNull()
    return owned!
  }
  return { game, state, add, ids: ['play-4', 'play-5', 'play-6'] }
}

it.each([
  [0, 6],
  [1, 4],
  [2, 3],
])('settles scored-tile gold and preview with %i Frostbites', (count, paid) => {
  const { game, state, add, ids } = setup(count)
  add('decree-philosophers-stone')
  state.handTiles[0] = state.handTiles[0].withSeal(SealType.Gold)
  expect(game.previewScore(ids)!.goldEarned).toBe(paid)
  expect(game.previewScore(ids)!.goldEarned).toBe(paid)
  expect(state.gold).toBe(10)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.gold).toBe(10 + paid)
})

it('does not cut ordinary tile or Fate Seal rewards without a Decree multiplier', () => {
  const { game, state, ids } = setup(2)
  state.handTiles[0] = state.handTiles[0].withSeal(SealType.Gold)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.gold).toBe(13)
  const seal = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_hermit
  )
  game.addFateSeal(seal)
  expect(
    game.processAction({ type: 'useSeal', sealId: seal.instanceId }).success
  ).toBe(true)
  expect(state.gold).toBe(26)
})

it.each([
  [0, 6, 22],
  [1, 3, 12],
])(
  'pays copied Wealth Engine scaling through actual round settlement (%i Frostbites)',
  (frostbites, decreeGold, net) => {
    const { game, state, add, ids } = setup(frostbites)
    add('decree-blueprint')
    add('decree-wealth-engine')
    add('decree-philosophers-stone')
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.lastRoundSummary).toMatchObject({
      decreeGold,
      netGoldChange: net,
      goldBefore: 10,
      goldAfter: 10 + net,
    })
    expect(state.gold).toBe(10 + net)
  }
)

it.each([
  [0, 6],
  [1, 4],
])(
  'settles complete-hand tile gold exactly once with %i Frostbites',
  (count, paid) => {
    const { game, state, add } = setup(count)
    add('decree-philosophers-stone')
    state.handTiles = [
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (n, i) => new Tile(TileSuit.Souzu, n, `full-${i}`)
      ),
      ...[6, 6, 6].map((n, i) => new Tile(TileSuit.Manzu, n, `triplet-${i}`)),
      ...[5, 5].map((n, i) => new Tile(TileSuit.Pinzu, n, `pair-${i}`)),
    ]
    state.handTiles[0] = state.handTiles[0].withSeal(SealType.Gold)
    const ids = state.handTiles.map((tile) => tile.id)
    expect(game.previewScore(ids)!.goldEarned).toBe(paid)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.gold).toBe(10 + paid)
  }
)

it('never weakens or multiplies the Tooth gold penalty', () => {
  const { game, state, add, ids } = setup(2)
  add('decree-philosophers-stone')
  state.mandateEffectSystem.activateMandate(
    THE_TOOTH,
    state.handTiles,
    state.decreeSystem.getOwnedDecrees()
  )
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.gold).toBe(7)
})

it('weakens only the Decree multiplier on a Fate Seal reward', () => {
  const { game, state, add } = setup(1)
  add('decree-philosophers-stone')
  const seal = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_hermit
  )
  game.addFateSeal(seal)
  expect(
    game.processAction({ type: 'useSeal', sealId: seal.instanceId }).success
  ).toBe(true)
  expect(state.gold).toBe(25) // Hermit's +10 stays intact; Stone adds half its +10.
})

it.each([
  [0, 2],
  [1, 0],
  [2, 0],
])('settles River Tax and Stone once with %i Frostbites', (count, paid) => {
  const { game, state, add } = setup(count)
  add('river_tax')
  add('decree-philosophers-stone')
  const discardsBefore = state.discardsRemaining
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.gold).toBe(10 + paid)
  expect(state.discardsRemaining).toBe(discardsBefore - 1)
})

it('aggregates fractional Decree rewards before whole-gold settlement', () => {
  const { game, state, add } = setup(1)
  add('river_tax')
  add('river_tax')
  add('decree-philosophers-stone')
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.gold).toBe(11) // floor((1 + 1) × .5 × 1.5), not two separately floored rewards.
})

it.each([
  [0, 4, 21],
  [1, 2, 12],
  [2, 1, 8],
  [3, 0.5, 6],
])(
  'pays ordinary round rewards in full and settles Decree bonuses at %i Frostbites',
  (count, decreeGold, net) => {
    const { game, state, add, ids } = setup(count)
    add('decree-tax-collector')
    const stone = add('decree-philosophers-stone')
    stone.sticker = { type: 'Rental', goldPerRound: 3 }
    state.handTiles[state.handTiles.length - 1] = state.handTiles
      .at(-1)!
      .withEnhancement(EnhancementType.Gold)
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.lastRoundSummary).toMatchObject({
      baseReward: 3,
      interest: 2,
      decreeGold,
      heldGoldMarkReward: 3,
      rentalCost: 3,
      netGoldChange: net,
      goldBefore: 10,
      goldAfter: 10 + net,
    })
    expect(state.gold).toBe(10 + net)
    expect(state.seasonSystem.getSeasonStack()).toHaveLength(0)
  }
)

it('does not pay disabled Decrees or apply a disabled gold multiplier', () => {
  const { game, state, add, ids } = setup(1)
  add('river_tax')
  add('decree-tax-collector')
  add('decree-philosophers-stone')
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [
      'river_tax',
      'decree-tax-collector',
      'decree-philosophers-stone',
    ],
  })
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.gold).toBe(10)
  state.handTiles[0] = state.handTiles[0].withSeal(SealType.Gold)
  // Locate the actually modified tile after the discard's sort/refill.
  const tileId = state.handTiles[0].id
  const selection = [tileId, ids.find((id) => id !== tileId)!]
  expect(game.previewScore(selection)!.goldEarned).toBe(3)
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(game.processAction({ type: 'play', tileIds: selection }).success).toBe(
    true
  )
  expect(state.lastRoundSummary).toMatchObject({
    baseReward: 3,
    interest: 2,
    decreeGold: 0,
    netGoldChange: 5,
  })
})

it('rounds a fractional round reward once without a gold multiplier', () => {
  const { game, state, add, ids } = setup(1)
  add('decree-coin-collector')
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.lastRoundSummary).toMatchObject({
    baseReward: 3,
    interest: 2,
    decreeGold: 0.5,
    netGoldChange: 5,
    goldBefore: 10,
    goldAfter: 15,
  })
})
