import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import type { ClassicRunSnapshot } from './ClassicRunSnapshot'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { resetMetaProgressionRunContext } from './MetaProgressionBridge'
import { useOmenStore } from '../stores/omenStore'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { BOSS_MANDATES, SHOWDOWN_MANDATES } from '../systems/RoundManager'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import {
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'

function json<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
function start(seed = 7, stake = 1, table = 'green_felt') {
  const game = new GameOrchestrator()
  game.startNewRun(seed, stake, table)
  return game
}
function check(game: GameOrchestrator) {
  const saved = json(game.captureRun())
  const parsed = parseClassicRunSnapshot(saved)
  expect(parsed).toEqual(saved)
  game.restoreRun(parsed)
  expect(json(game.captureRun())).toEqual(saved)
  return saved
}
function shop(seed = 7) {
  const game = start(seed)
  const state = game.getState() as OrchestratorState
  // Only lower the target/fund purchases; payment, win, shop and claim paths are real.
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.gold = 100
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    }).success
  ).toBe(true)
  expect(state.phase).toBe('shop')
  expect(game.shop.open()).toBe(true)
  return game
}
afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  resetMetaProgressionRunContext()
  useOmenStore.getState().clearForNewRun()
  vi.restoreAllMocks()
})

it.each(TABLE_STYLE_DEFINITIONS.map((t) => t.id))(
  'accepts real starts and actions at every stake on %s',
  (table) => {
    for (let stake = 1; stake <= 8; stake++) {
      const game = start(stake * 97, stake, table)
      check(game)
      const tileIds = game
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id)
      tileIds.forEach((id) => game.selectTile(id))
      check(game)
      game.processAction({ type: 'play', tileIds })
      check(game)
    }
  }
)

it.each([7, 19, 413, 991, 2026])(
  'accepts shop, paid pack, claim and next-round checkpoints (seed %i)',
  (seed) => {
    const game = shop(seed)
    check(game)
    expect(game.shop.reroll().success).toBe(true)
    check(game)
    const offer = game.shop.state.packOfferings[0]
    expect(game.shop.purchase(offer.id).success).toBe(true)
    check(game)
    const pack = game.shop.pendingPack!
    const result = game.shop.confirmPack(
      Array.from({ length: pack.maxSelections }, (_, i) => i)
    )
    if (!result.success) expect(game.shop.skipPack().success).toBe(true)
    check(game)
    game.exitShop()
    check(game)
  }
)

it('accepts every catalog item with runtime editions, copies, expired stickers and consumable provenance', () => {
  const game = start()
  const saved = json(game.captureRun())
  saved.state.decreeSystem.ownedDecrees = ALL_DECREES.map((d) => ({
    ...d,
    acquiredRound: 1,
    roundsActive: 10,
    edition: 'Polychrome',
    sticker: { type: 'Perishable', roundsRemaining: -4 },
    isDebuffed: true,
    scalingValue: 32,
    sellValue: 0,
  }))
  saved.state.decreeSystem.ownedDecrees.push({
    ...saved.state.decreeSystem.ownedDecrees[0],
  })
  saved.state.fateSeals = Object.values(FATE_SEALS).map((def) => ({
    ...FateSealSystem.createFateSealInstance(def, 'Negative'),
    source: 'pack_open',
  }))
  saved.state.celestialOrbs = Object.values(CELESTIAL_ORBS).map((def) => ({
    ...CelestialOrbSystem.createCelestialOrbInstance(def, 'Foil'),
    source: 'purchase',
  }))
  saved.state.voidScripts = Object.values(VOID_SCRIPTS).map((def) => ({
    ...VoidScriptSystem.createVoidScriptInstance(def, 'Holographic'),
    source: 'generated',
  }))
  saved.state.fateSealSystem.lastUsedConsumable = saved.state.fateSeals[0]
  saved.state.omenSystem.pendingOmens = ALL_OMENS
  for (const mandate of ALL_MANDATES) {
    saved.state.mandateEffectSystem.activeMandate = mandate
    expect(parseClassicRunSnapshot(json(saved))).toEqual(json(saved))
  }
})

it('accepts every live boss activation, including hidden/locked tiles and Decree suppression', () => {
  for (const boss of [...BOSS_MANDATES, ...SHOWDOWN_MANDATES]) {
    const game = shop(19)
    const state = game.getState() as OrchestratorState
    state.roundManager.startAct(boss.minAct)
    state.roundManager.skipRound()
    state.roundManager.skipRound()
    state.roundManager.getCurrentRound()!.bossMandate = structuredClone(boss)
    state.lastCompletedRoundType = 'Large'
    game.exitShop()
    expect(state.phase).toBe('gameplay')
    check(game)
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    })
    check(game)
  }
})

it('accepts every owned Charter and its shop adapter without relying on current profile unlocks', () => {
  const saved = JSON.parse(
    JSON.stringify(start().captureRun())
  ) as ClassicRunSnapshot
  saved.state.charterSystem.ownedCharters = ALL_CHARTERS.map((charter) => ({
    ...charter,
    acquiredAct: 8,
    acquiredRound: 3,
  }))
  saved.state.charterSystem.purchasedIds = ALL_CHARTERS.map(
    (charter) => charter.id
  )
  for (const charter of [
    ...TEA_HOUSE_BASE_CHARTERS,
    ...TEA_HOUSE_UPGRADED_CHARTERS,
  ]) {
    saved.shop.teaHouse.charterOffering = {
      id: `offer-${charter.id}`,
      slotIndex: 0,
      itemType: 'ImperialCharter',
      item: charter,
      baseCost: charter.cost,
      editionCost: 0,
      finalCost: charter.cost,
      sellValue: 0,
      isPurchased: false,
      isLocked: false,
    }
    expect(() => parseClassicRunSnapshot(saved)).not.toThrow()
  }
})

it('accepts terminal defeat and secured victory followed by once-only Endless continuation', () => {
  const lost = start(19)
  const losingState = lost.getState() as OrchestratorState
  losingState.targetScore = 1e12
  losingState.roundManager.getCurrentRound()!.scoreTarget = 1e12
  for (let i = 0; i < 10 && lost.getState().phase === 'gameplay'; i++) {
    lost.processAction({
      type: 'play',
      tileIds: lost
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    })
    check(lost)
  }
  expect(lost.getState().phase).toBe('gameOver')
  expect(lost.getState().hasWonRun).toBe(false)

  const won = shop(7)
  const state = won.getState() as OrchestratorState
  state.roundManager.startAct(8)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.lastCompletedRoundType = 'Large'
  won.exitShop()
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    won.processAction({
      type: 'play',
      tileIds: won
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    }).success
  ).toBe(true)
  expect(won.getState().hasWonRun).toBe(true)
  check(won)
  expect(won.continueEndless()).toBe(true)
  check(won)
  expect(won.continueEndless()).toBe(false)
})

const mutations: [string, (s: ClassicRunSnapshot) => void][] = [
  [
    'unsupported version',
    (s) => {
      Object.assign(s, { version: 2 })
    },
  ],
  [
    'unknown root field',
    (s) => {
      Object.assign(s, { unknown: true })
    },
  ],
  [
    'unknown engine field',
    (s) => {
      Object.assign(s.state, { unknown: true })
    },
  ],
  [
    'Omen action overwrite',
    (s) => {
      Object.assign(s.omens, { clearForNewRun: 'not a function' })
    },
  ],
  [
    'unknown nested rule',
    (s) => {
      Object.assign(s.state.decreeSystem.ownedDecrees[0].effect, {
        injected: true,
      })
    },
  ],
  [
    'changed rule',
    (s) => {
      s.state.decreeSystem.ownedDecrees[0].cost++
    },
  ],
  [
    'unknown decree',
    (s) => {
      s.state.decreeSystem.ownedDecrees[0].id = 'unrecognized'
    },
  ],
  [
    'negative hand count',
    (s) => {
      s.state.handsRemaining = -1
    },
  ],
  [
    'nonfinite score',
    (s) => {
      s.state.score = Infinity
    },
  ],
  [
    'numeric string',
    (s) => {
      Object.assign(s.state, { gold: '100' })
    },
  ],
  [
    'null tiles',
    (s) => {
      Object.assign(s.state, { wall: null })
    },
  ],
  [
    'tile rank',
    (s) => {
      s.state.handTiles[0].rank = 99
    },
  ],
  [
    'tile modifier',
    (s) => {
      Object.assign(s.state.handTiles[0].modifiers, { enhancement: 'unknown' })
    },
  ],
  [
    'duplicate tile',
    (s) => {
      s.state.handTiles.push(s.state.handTiles[0])
    },
  ],
  [
    'missing selected tile',
    (s) => {
      s.state.selectedTileIds.push('missing')
    },
  ],
  [
    'duplicate map entry',
    (s) => {
      s.state.yakuPlayCounts = [
        ['tanyao', 1],
        ['tanyao', 2],
      ]
    },
  ],
  [
    'draw index',
    (s) => {
      s.state.drawIndex = s.state.wall.length + 1
    },
  ],
  [
    'unknown table',
    (s) => {
      s.state.tableStyleId = 'unrecognized'
    },
  ],
  [
    'changed table rule',
    (s) => {
      Object.assign(s.state.tableModifiers, { baseScoreMultiplier: 99 })
    },
  ],
  [
    'stake mismatch',
    (s) => {
      s.state.stake = 8
    },
  ],
  [
    'seed mismatch',
    (s) => {
      s.random.seed!++
    },
  ],
  [
    'negative private cursor',
    (s) => {
      s.state.omenSystem.randomCursor = -1
    },
  ],
  [
    'overflowed private cursor',
    (s) => {
      s.state.mandateEffectSystem.randomCursor = 0x100000000
    },
  ],
  [
    'unknown stream',
    (s) => {
      Object.assign(s.random.streams, { unknown: 1 })
    },
  ],
  [
    'missing act round',
    (s) => {
      s.state.roundManager.currentAct!.rounds.pop()
    },
  ],
  [
    'round ledger disagreement',
    (s) => {
      s.state.roundManager.currentRound!.currentScore++
    },
  ],
  [
    'inactive gameplay',
    (s) => {
      s.state.isRunActive = false
    },
  ],
  [
    'Endless without win',
    (s) => {
      s.state.hasEnteredEndless = true
    },
  ],
  [
    'open shop during gameplay',
    (s) => {
      s.shop.opened = true
    },
  ],
  [
    'unpaid pending pack',
    (s) => {
      s.shop.pendingPackId = 'not-purchased'
    },
  ],
]
describe('untrusted save boundary', () => {
  it.each(mutations)(
    'rejects %s before changing live state or notifying stores',
    (_name, mutate) => {
      const game = start()
      const before = json(game.captureRun())
      const bad = json(before)
      mutate(bad)
      const notify = vi.fn()
      const stop = useOmenStore.subscribe(notify)
      expect(() => parseClassicRunSnapshot(bad)).toThrow()
      expect(json(game.captureRun())).toEqual(before)
      expect(notify).not.toHaveBeenCalled()
      stop()
    }
  )

  it('requires every top-level and engine field instead of defaulting away progress', () => {
    const saved = json(start().captureRun())
    for (const key of Object.keys(saved)) {
      const damaged = { ...saved } as Record<string, unknown>
      delete damaged[key]
      expect(() => parseClassicRunSnapshot(damaged), key).toThrow()
    }
    for (const key of Object.keys(saved.state)) {
      const damaged = {
        ...saved,
        state: { ...saved.state } as Record<string, unknown>,
      }
      delete damaged.state[key]
      expect(() => parseClassicRunSnapshot(damaged), key).toThrow()
    }
  })

  it('detaches parsed data and allows wording-only catalog updates', () => {
    const saved = json(start().captureRun())
    saved.state.decreeSystem.ownedDecrees[0].description =
      'Older translated wording'
    const parsed = parseClassicRunSnapshot(saved)
    parsed.state.handTiles[0].rank = 9
    expect(parsed.state.handTiles[0]).not.toBe(saved.state.handTiles[0])
    expect(parsed.state.decreeSystem.ownedDecrees[0].description).toBe(
      'Older translated wording'
    )
  })

  it('rejects inconsistent paid-pack selection/payment state', () => {
    const game = shop()
    expect(
      game.shop.purchase(game.shop.state.packOfferings[0].id).success
    ).toBe(true)
    const saved = check(game)
    const variants = [json(saved), json(saved), json(saved), json(saved)]
    variants[0].shop.teaHouse.packOfferings[0].isPurchased = false
    variants[1].shop.packs.currentOfferings[0].selectedIndices = [999]
    variants[2].shop.packs.currentOfferings[0].isResolved = true
    variants[3].shop.packs.currentOfferings[0].contents[0].data = {
      id: 'unknown',
    }
    for (const bad of variants)
      expect(() => parseClassicRunSnapshot(bad)).toThrow()
  })
})
