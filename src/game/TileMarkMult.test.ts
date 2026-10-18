import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { EditionType, EnhancementType } from '../core/TileModifier'
import { DecreeSystem } from '../systems/DecreeSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
})

/** A 4-5-6 Bamboo sequence: 15 tile points + 30 structure = 45 at Mult 1. */
const PLAIN = 45

function table(held: Tile[] = []) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem()
  state.mandateEffectSystem.deactivateMandate()
  state.handTiles = [
    ...[4, 5, 6].map((rank) => new Tile(TileSuit.Souzu, rank, `play-${rank}`)),
    ...held,
  ]
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const ids = ['play-4', 'play-5', 'play-6']
  const play = () => {
    const score = state.score,
      gold = state.gold
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    return { score: state.score - score, gold: state.gold - gold }
  }
  /** Preview, then play, and insist the forecast is what the play paid. */
  const pay = () => {
    const preview = game.previewScore(ids)!
    expect(play().score).toBe(preview.finalScore)
    return preview
  }
  return { game, state, ids, play, pay }
}

const steel = (id: string) =>
  new Tile(TileSuit.Pinzu, 9, id).withEnhancement(EnhancementType.Steel)

it.each([
  ['Mult Mark', (tile: Tile) => tile.withEnhancement(EnhancementType.Mult), 4],
  [
    'Holographic',
    (tile: Tile) => tile.withEdition(EditionType.Holographic),
    10,
  ],
])("adds a %s's +Mult to the play's Mult, not to its Points", (_, mark, n) => {
  const t = table()
  t.state.handTiles[0] = mark(t.state.handTiles[0])
  const paid = t.pay()
  expect(paid.modifierMult).toBe(n)
  expect(paid.additiveBonus).toBe(0)
  expect(paid.finalScore).toBe(PLAIN * (1 + n))
})

it("adds a Lucky Mark's +20 to the Mult when the roll hits", () => {
  const t = table()
  t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(
    EnhancementType.Lucky
  )
  // The preview is the floor: chance effects never promise their roll.
  expect(t.game.previewScore(t.ids)!.finalScore).toBe(PLAIN)
  vi.spyOn(runRandom, 'next').mockReturnValue(0.1) // the +20 Mult branch
  expect(t.play()).toEqual({ score: PLAIN * 21, gold: 0 })
})

it('multiplies the play by ×1.5 for each Steel Mark held in the rack', () => {
  expect(table([steel('held-1')]).pay().finalScore).toBe(
    Math.floor(PLAIN * 1.5)
  )
  expect(table([steel('held-1'), steel('held-2')]).pay().finalScore).toBe(
    Math.floor(PLAIN * 1.5 * 1.5)
  )
})

it('pays nothing for a Steel Mark that is played instead of held', () => {
  const t = table()
  t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(
    EnhancementType.Steel
  )
  expect(t.pay().finalScore).toBe(PLAIN)
})

it('ignores a held Steel Mark that a Mandate has debuffed', () => {
  const t = table([steel('held-1')])
  t.state.debuffSystem.debuffTile('held-1', {
    type: 'mandate',
    mandateId: 'test',
  })
  expect(t.pay().finalScore).toBe(PLAIN)
})

it('leaves a held Gold Mark to pay at round end, not on every play', () => {
  const t = table([
    new Tile(TileSuit.Pinzu, 2, 'held-gold').withEnhancement(
      EnhancementType.Gold
    ),
  ])
  expect(t.play()).toEqual({ score: PLAIN, gold: 0 })
})
