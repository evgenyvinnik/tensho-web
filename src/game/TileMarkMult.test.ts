import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
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

/** Draws from the run's Edition stream while `run` executes. */
function editionDraws(run: () => void): number {
  const next = vi.spyOn(runRandom, 'next')
  run()
  const draws = next.mock.calls.filter(([stream]) => stream === 'modifiers')
  next.mockRestore()
  return draws.length
}

it("adds a Mult Edition's +4 to the play's Mult, not to its Points", () => {
  const t = table()
  t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(
    EnhancementType.Mult
  )
  const paid = t.pay()
  expect(paid.modifierMult).toBe(4)
  expect(paid.additiveBonus).toBe(0)
  expect(paid.finalScore).toBe(PLAIN * (1 + 4))
})

it.each([1, 2, 3])(
  "adds a Bonus Edition's +30 per Act to the Points in Act %i, not to the Mult",
  (act) => {
    const t = table()
    t.state.currentAct = act
    t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(
      EnhancementType.Bonus
    )
    const paid = t.pay()
    expect(paid.modifierChips).toBe(30 * act)
    expect(paid.modifierMult).toBe(0)
    expect(paid.finalScore).toBe(PLAIN + 30 * act)
  }
)

it("pays a Lucky Edition's round roll as +Points and ×Mult, without drawing during the play", () => {
  const t = table()
  t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(
    EnhancementType.Lucky
  )
  t.state.luckyRolls = { 'play-4': { multiplier: 1.75, points: 60 } }
  // The table, the preview and the paid score read the same saved roll.
  const preview = t.game.previewScore(t.ids)!
  expect(preview.modifierChips).toBe(60)
  expect(preview.finalScore).toBe(Math.floor((PLAIN + 60) * 1.75))
  expect(editionDraws(() => expect(t.pay()).toEqual(preview))).toBe(0)
  expect(t.state.score).toBe(preview.finalScore)
})

it('pays the floor ×1.25 and +20 for a Lucky tile with no roll this round', () => {
  const t = table()
  t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(
    EnhancementType.Lucky
  )
  t.state.luckyRolls = {}
  expect(t.pay().finalScore).toBe(Math.floor((PLAIN + 20) * 1.25))
})

it('pays nothing for a Steel tile held in the rack', () => {
  expect(table([steel('held-1')]).pay().finalScore).toBe(PLAIN)
  expect(table([steel('held-1'), steel('held-2')]).pay().finalScore).toBe(PLAIN)
})

it.each([
  [EnhancementType.Steel, 'celestialOrbs', 'rusted'],
  [EnhancementType.Glass, 'fateSeals', 'shattered'],
] as const)(
  'scores nothing extra for a played %s tile but makes one consumable, then may break it',
  (edition, inventory, breaks) => {
    for (const [roll, broken] of [
      [0.9, false],
      [0.1, true],
    ] as const) {
      const t = table()
      t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(edition)
      const real = runRandom.next.bind(runRandom)
      vi.spyOn(runRandom, 'next').mockImplementation((stream) =>
        stream === 'modifiers' ? roll : real(stream)
      )
      const broke = vi.fn()
      eventBus.on('tilesBroken', broke)
      const preview = t.game.previewScore(t.ids)!
      expect(preview.finalScore).toBe(PLAIN)
      // A preview never breaks a tile.
      expect(preview.brokenTiles).toEqual([])
      const before = t.state[inventory].length
      const madeSeal = vi.spyOn(t.game, 'applyFateSeal')
      expect(t.play().score).toBe(PLAIN)
      // A made Seal is used at once, or waits for its wall tiles if it takes
      // some; either way exactly one was made.
      const made =
        t.state[inventory].length - before + madeSeal.mock.calls.length
      expect(made).toBe(1)
      if (broken) {
        expect(broke).toHaveBeenCalledTimes(1)
        expect(broke.mock.calls[0][0].tiles).toEqual([
          expect.objectContaining({
            tile: expect.objectContaining({ id: 'play-4' }),
            breaks,
          }),
        ])
      } else expect(broke).not.toHaveBeenCalled()
      // A broken tile leaves the run; a whole one goes to the river.
      expect(t.state.discards.some((tile) => tile.id === 'play-4')).toBe(
        !broken
      )
      vi.restoreAllMocks()
      eventBus.clear()
    }
  }
)

it('makes nothing for a played Steel or Glass tile that a Mandate has debuffed', () => {
  for (const edition of [EnhancementType.Steel, EnhancementType.Glass]) {
    const t = table()
    t.state.handTiles[0] = t.state.handTiles[0].withEnhancement(edition)
    t.state.debuffSystem.debuffTile('play-4', {
      type: 'mandate',
      mandateId: 'test',
    })
    const orbs = t.state.celestialOrbs.length
    const seals = t.state.fateSeals.length
    const madeSeal = vi.spyOn(t.game, 'applyFateSeal')
    const paid = t.pay()
    expect(paid.madeConsumables).toEqual([])
    expect(paid.brokenTiles).toEqual([])
    expect(t.state.celestialOrbs).toHaveLength(orbs)
    expect(t.state.fateSeals).toHaveLength(seals)
    expect(madeSeal).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  }
})

it('pays a Gold Edition +3 Gold each time it scores, and nothing while held', () => {
  const held = table([
    new Tile(TileSuit.Pinzu, 2, 'held-gold').withEnhancement(
      EnhancementType.Gold
    ),
  ])
  expect(held.play()).toEqual({ score: PLAIN, gold: 0 })

  const played = table()
  played.state.handTiles[0] = played.state.handTiles[0].withEnhancement(
    EnhancementType.Gold
  )
  expect(played.game.previewScore(played.ids)!.goldEarned).toBe(3)
  expect(played.play()).toEqual({ score: PLAIN, gold: 3 })

  // A Decree retrigger scores the tile again, and it pays again.
  const echoed = table()
  echoed.state.handTiles[0] = echoed.state.handTiles[0].withEnhancement(
    EnhancementType.Gold
  )
  expect(
    echoed.state.decreeSystem.acquireDecree(
      ALL_DECREES.find((decree) => decree.id === 'decree-echo-stone')!
    )
  ).not.toBeNull()
  const preview = echoed.game.previewScore(echoed.ids)!
  expect(preview.retriggeredTiles).toEqual(['play-4'])
  expect(preview.goldEarned).toBe(6)
  expect(echoed.play().gold).toBe(6)
})
