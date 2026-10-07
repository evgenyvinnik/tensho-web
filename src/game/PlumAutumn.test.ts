import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import { EnhancementType, SealType, EditionType } from '../core/TileModifier'
import { Meld, MeldType } from '../core/Meld'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { ALL_DECREES } from '../systems/DecreeSystem'
import {
  THE_SERPENT,
  THE_HOOK,
  THE_FISH,
  CERULEAN_BELL,
} from '../config/mandateDefinitions'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { planPlumRecursion } from './plumRecursion'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum, 'plum'))
  state.seasonSystem.clear()
  state.seasonSystem.setAct(1)
  state.seasonSystem.forceSetSeason('Autumn')
  state.mandateEffectSystem.deactivateMandate()
  state.handTiles = Array.from(
    { length: 14 },
    (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
  )
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.deadWall = []
  state.summerReserve = []
  state.discards = [
    new Tile(TileSuit.Souzu, 1, 'older'),
    new Tile(TileSuit.Souzu, 3, 'newer').withModifiers({
      enhancement: EnhancementType.Steel,
      seal: SealType.Red,
      edition: EditionType.Foil,
    }),
    new Tile(TileSuit.Manzu, 3, 'wrong-suit'),
    new Tile(TileSuit.Souzu, 9, 'wrong-rank'),
  ]
  state.faceDownTileIds.clear()
  state.selectedTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

const ids = ['hand-0', 'hand-1', 'hand-2']
const play = (game: GameOrchestrator, tileIds = ids) =>
  game.processAction({ type: 'play', tileIds })
const held = (state: Readonly<OrchestratorState>) =>
  state.handTiles.map((t) => t.id)
function physical(state: Readonly<OrchestratorState>) {
  return [
    ...state.handTiles,
    ...state.discards,
    ...state.deadWall,
    ...state.wall.slice(state.drawIndex),
    ...state.summerReserve,
  ]
    .filter((t) => !t.isBonus)
    .map((t) => t.id)
    .sort()
}
function addSeason(
  state: OrchestratorState,
  type: 'Spring' | 'Summer' | 'Autumn' | 'Winter',
  corrupted = false
) {
  const system = new SeasonSystem()
  system.forceSetSeason(type, corrupted)
  const season = { ...system.getActiveSeason()!, id: `extra-${type}` }
  state.seasonSystem = SeasonSystem.fromState({
    ...state.seasonSystem.toState(),
    activeSeason: season,
    seasonStack: [...state.seasonSystem.getSeasonStack(), season],
  })
}

it('recovers the newest matching physical tile after payment and refill, keeping modifiers and preview purity', () => {
  const { game, state } = fixture()
  const identities = physical(state),
    before = game.captureRun()
  const gift = state.discards[1]
  const recover = vi.fn(),
    draws = vi.fn()
  eventBus.on('plumRecovery', recover)
  eventBus.on('tileDrawn', draws)
  const forecast = game.previewScore(ids)!
  expect(game.previewScore(ids)).toEqual(forecast)
  expect(game.canPerformAction({ type: 'play', tileIds: ids })).toBe(true)
  expect(game.captureRun()).toEqual(before)
  expect(recover).not.toHaveBeenCalled()
  expect(play(game).success).toBe(true)
  expect(state.score - before.state.score).toBe(forecast.finalScore)
  expect(state.handsRemaining).toBe(before.state.handsRemaining - 1)
  expect(state.handTiles).toHaveLength(15)
  expect(state.handTiles.find((t) => t.id === 'newer')).toBe(gift)
  expect(held(state)).not.toContain('older')
  expect(physical(state)).toEqual(identities)
  expect(draws).toHaveBeenCalledTimes(3)
  expect(recover).toHaveBeenCalledExactlyOnceWith({ count: 1 })
  expect(game.canPerformAction({ type: 'draw' })).toBe(false)
  expect(state.drawIndex).toBe(3)
})

it('saves exact river/rack identities without replaying rewards and returns to normal capacity on a nonmatching play', () => {
  const { game, state } = fixture()
  expect(play(game).success).toBe(true)
  const snapshot = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  const recovery = vi.fn()
  eventBus.on('plumRecovery', recovery)
  game.restoreRun(snapshot)
  expect(game.captureRun()).toEqual(snapshot)
  expect(recovery).not.toHaveBeenCalled()
  expect(play(game, ['hand-3', 'hand-4', 'hand-5']).success).toBe(true)
  expect(game.getHandTiles()).toHaveLength(14)
  expect(recovery).not.toHaveBeenCalled()
  expect(physical(game.getState())).toEqual(physical(state))
})

it('pays one recovery per sequence in a complete hand without sharing a river identity', () => {
  const { game, state } = fixture()
  state.handTiles = [
    ...[1, 2, 3, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (rank, i) => new Tile(TileSuit.Souzu, rank, `seq-${i}`)
    ),
    new Tile(TileSuit.Wind, 1, 'pair-a'),
    new Tile(TileSuit.Wind, 1, 'pair-b'),
  ]
  state.discards = Array.from(
    { length: 3 },
    (_, i) => new Tile(TileSuit.Souzu, i === 2 ? 5 : 2, `river-${i}`)
  )
  const identities = physical(state),
    all = held(state),
    before = state.score
  const forecast = game.previewScore(all)!
  expect(forecast.structure.kind).toBe('complete')
  expect(play(game, all).success).toBe(true)
  expect(state.score - before).toBe(forecast.finalScore)
  expect(state.handTiles).toHaveLength(17)
  expect(held(state)).toEqual(
    expect.arrayContaining(['river-0', 'river-1', 'river-2'])
  )
  expect(physical(state)).toEqual(identities)
  expect(new Set(physical(state)).size).toBe(identities.length)
})

it.each([
  'no-plum',
  'no-autumn',
  'decay',
  'drought',
  'no-match',
  'no-sequence',
] as const)('does not recover for %s', (reason) => {
  const { game, state } = fixture()
  if (reason === 'no-plum') state.flowerSystem.clear()
  if (reason === 'no-autumn' || reason === 'decay') {
    state.seasonSystem.clear()
    if (reason === 'decay') state.seasonSystem.forceSetSeason('Autumn', true)
  }
  if (reason === 'drought') addSeason(state, 'Summer', true)
  if (reason === 'no-match') state.discards = []
  const recovery = vi.fn()
  eventBus.on('plumRecovery', recovery)
  expect(
    play(game, reason === 'no-sequence' ? ['hand-0', 'hand-9'] : ids).success
  ).toBe(true)
  expect(recovery).not.toHaveBeenCalled()
  expect(state.handTiles).toHaveLength(14)
})

it.each([false, true])(
  'respects Eternal Garden protection with disabled=%s',
  (disabled) => {
    const { game, state } = fixture()
    addSeason(state, 'Summer', true)
    state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Orchid, 'orchid'))
    state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Bamboo, 'bamboo'))
    const decree = state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === 'decree-eternal-garden')!
    )!
    expect(decree).not.toBeNull()
    if (disabled)
      state.mandateEffectSystem = MandateEffectSystem.fromJSON({
        ...state.mandateEffectSystem.toJSON(),
        disabledDecreeIds: [decree.instanceId ?? decree.id],
      })
    expect(play(game).success).toBe(true)
    expect(held(state).includes('newer')).toBe(!disabled)
  }
)

it('does not multiply recoveries for duplicate Autumns or Plum', () => {
  const { game, state } = fixture()
  addSeason(state, 'Autumn')
  state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum, 'duplicate'))
  expect(play(game).success).toBe(true)
  expect(state.handTiles).toHaveLength(15)
  expect(held(state)).not.toContain('older')
})

it.each(['win', 'loss'] as const)(
  'does not recover after final %s or affect held-Gold settlement',
  (ending) => {
    const { game, state } = fixture()
    state.discards[1] = state.discards[1].withEnhancement(EnhancementType.Gold)
    if (ending === 'win') {
      state.targetScore = 1
      state.roundManager.getCurrentRound()!.scoreTarget = 1
    } else state.handsRemaining = 1
    const recovery = vi.fn()
    eventBus.on('plumRecovery', recovery)
    expect(play(game).success).toBe(true)
    expect(state.phase).not.toBe('gameplay')
    expect(recovery).not.toHaveBeenCalled()
    expect(held(state)).not.toContain('newer')
    expect(state.drawIndex).toBe(0)
  }
)

it('allows scored physical Winter gaps, but not virtual or transmuted sequence members', () => {
  const { game, state } = fixture()
  addSeason(state, 'Winter')
  state.handTiles[2] = new Tile(TileSuit.Souzu, 4, 'hand-2')
  state.discards = [new Tile(TileSuit.Souzu, 4, 'gapped')]
  expect(game.previewScore(ids)!.structurePoints).toBe(30)
  expect(play(game).success).toBe(true)
  expect(held(state)).toContain('gapped')
  const real = [
    new Tile(TileSuit.Souzu, 1, 'a'),
    new Tile(TileSuit.Souzu, 2, 'b'),
  ]
  const third = new Tile(TileSuit.Souzu, 3, 'virtual')
  const group = new Meld(MeldType.Sequence, [...real, third])
  const river = [new Tile(TileSuit.Souzu, 1, 'recover')]
  expect(planPlumRecursion([group], real, river)).toEqual([])
  expect(
    planPlumRecursion(
      [group],
      [...real, new Tile(TileSuit.Wind, 3, 'virtual')],
      river
    )
  ).toEqual([])
  expect(
    planPlumRecursion(
      [group],
      [
        ...real,
        new Tile(TileSuit.Souzu, 9, 'virtual').withEnhancement(
          EnhancementType.Wild
        ),
      ],
      river
    )
  ).toEqual([])
})

it.each([THE_SERPENT, THE_HOOK, THE_FISH, CERULEAN_BELL])(
  'keeps $name to one draw reaction and river recovery public',
  (mandate) => {
    const { game, state } = fixture()
    state.mandateEffectSystem.activateMandate(mandate, state.handTiles, [])
    const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
    expect(play(game).success).toBe(true)
    expect(onDraw).toHaveBeenCalledTimes(1)
    expect(onDraw.mock.calls[0][1].id).toBe('wall-2')
    expect(state.drawIndex).toBe(3)
    expect(state.faceDownTileIds.has('newer')).toBe(false)
    if (mandate === THE_FISH)
      expect(state.faceDownTileIds.has('wall-2')).toBe(true)
    if (mandate === CERULEAN_BELL)
      expect(state.mandateEffectSystem.getLockedTileIds()).toHaveLength(1)
    expect(state.handTiles).toHaveLength(mandate === THE_HOOK ? 13 : 15)
  }
)

it('recovers from an exhausted wall without a new draw reaction', () => {
  const { game, state } = fixture()
  state.wall = []
  const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
  expect(play(game).success).toBe(true)
  expect(held(state)).toContain('newer')
  expect(state.handTiles).toHaveLength(12)
  expect(onDraw).not.toHaveBeenCalled()
})

it('matches physical suits even for Wild river tiles and rejects transmuted Wild faces', () => {
  const real = [1, 2, 3].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `s-${rank}`)
  )
  const group = new Meld(MeldType.Sequence, real)
  const wrongSuit = new Tile(TileSuit.Pinzu, 2, 'wild-river').withEnhancement(
    EnhancementType.Wild
  )
  expect(planPlumRecursion([group], real, [wrongSuit])).toEqual([])
  const changed = new Meld(MeldType.Sequence, [
    real[0],
    new Tile(TileSuit.Pinzu, 2, real[1].id),
    real[2],
  ])
  expect(
    planPlumRecursion(
      [changed],
      real.map((t) => t.withEnhancement(EnhancementType.Wild)),
      [real[0]]
    )
  ).toEqual([])
})

it('does not reclaim newly played tiles or carry unmatched credits to the next action', () => {
  const { game, state } = fixture()
  state.discards = []
  const recovery = vi.fn()
  eventBus.on('plumRecovery', recovery)
  expect(play(game).success).toBe(true)
  expect(recovery).not.toHaveBeenCalled()
  expect(held(state).some((id) => ids.includes(id))).toBe(false)
  state.discards.push(new Tile(TileSuit.Souzu, 1, 'late'))
  expect(play(game, ['hand-3', 'hand-4', 'hand-5']).success).toBe(true)
  expect(held(state)).not.toContain('late')
  expect(recovery).not.toHaveBeenCalled()
})

it('does not treat river recovery as an Orchid draw or alter its existing bonus', () => {
  const { game, state } = fixture()
  state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Orchid, 'orchid'))
  addSeason(state, 'Spring')
  state.wall.unshift(new Tile(TileSuit.Wind, 1, 'wind'))
  state.deadWall = [new Tile(TileSuit.Souzu, 9, 'orchid-extra')]
  const orchid = vi.fn(),
    plum = vi.fn()
  eventBus.on('orchidBloom', orchid)
  eventBus.on('plumRecovery', plum)
  expect(play(game).success).toBe(true)
  expect(state.handTiles).toHaveLength(18)
  expect(orchid).toHaveBeenCalledExactlyOnceWith({ count: 1 })
  expect(plum).toHaveBeenCalledExactlyOnceWith({ count: 1 })
})

it.each(['plum', 'autumn', 'drought'] as const)(
  'does not retroactively change earning when refill draws %s',
  (bonus) => {
    const { game, state } = fixture()
    if (bonus === 'plum') state.flowerSystem.clear()
    if (bonus === 'autumn') state.seasonSystem.clear()
    // Act 1 normally prevents corruption; inject the explicit corrupted season
    // into the bonus handler's actual draw-time season application for Drought.
    if (bonus === 'drought') {
      const add = state.seasonSystem.addSeason.bind(state.seasonSystem)
      vi.spyOn(state.seasonSystem, 'addSeason').mockImplementation(
        (tile, ...args) => {
          const result = add(tile, ...args)
          addSeason(state, 'Summer', true)
          return result
        }
      )
    }
    state.wall.unshift(
      bonus === 'plum'
        ? Tile.createFlower(FlowerType.Plum, 'drawn-plum')
        : Tile.createSeason(
            bonus === 'autumn' ? SeasonType.Autumn : SeasonType.Summer,
            'drawn-season'
          )
    )
    expect(play(game).success).toBe(true)
    expect(held(state).includes('newer')).toBe(bonus === 'drought')
  }
)
