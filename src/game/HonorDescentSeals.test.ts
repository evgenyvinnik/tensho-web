import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EditionType, EnhancementType, SealType } from '../core/TileModifier'
import en from '../i18n/locales/en.json'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { getFateSealIllustration } from '../utils/assets'
import { eventBus } from './EventBus'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'

// The handoff's target table, written out rather than derived from a cycle.
// Dragon ranks run White 1, Green 2, Red 3; Wind ranks East 1 to North 4.
const HONOR_SEALS = [
  ['seal_of_red_dragon', TileSuit.Dragon, 3, 'a Red Dragon'],
  ['seal_of_green_dragon', TileSuit.Dragon, 2, 'a Green Dragon'],
  ['seal_of_white_dragon', TileSuit.Dragon, 1, 'a White Dragon'],
  ['seal_of_east_wind', TileSuit.Wind, 1, 'an East Wind'],
  ['seal_of_south_wind', TileSuit.Wind, 2, 'a South Wind'],
  ['seal_of_west_wind', TileSuit.Wind, 3, 'a West Wind'],
  ['seal_of_north_wind', TileSuit.Wind, 4, 'a North Wind'],
] as const

const NUMBERED = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu] as const
const COLLECTIONS = [
  'handTiles',
  'wallTemplate',
  'wall',
  'deadWall',
  'summerReserve',
  'discards',
] as const

const seal = (id: string) =>
  FateSealSystem.createFateSealInstance(FATE_SEALS[id])
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/**
 * A run in the Tea House, with gold to spend. `place` lays a tile of a chosen
 * face on the wall, in place of a wall tile not yet placed (and not on the
 * rack, unless `onRack`), keeping that tile's id.
 */
function visit() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const placed = new Set<string>()
  const place = (
    suit: TileSuit,
    rank: number,
    options: {
      red?: boolean
      modify?: (tile: Tile) => Tile
      onRack?: boolean
    } = {}
  ): Tile => {
    const rack = new Set(state.handTiles.map((tile) => tile.id))
    const slot = state.wallTemplate.find(
      (tile) =>
        !tile.isBonus &&
        !placed.has(tile.id) &&
        rack.has(tile.id) === (options.onRack ?? false)
    )!
    const tile = (options.modify ?? ((t: Tile) => t))(
      new Tile(suit, rank, slot.id, options.red ?? false)
    )
    for (const key of COLLECTIONS)
      state[key] = state[key].map((t) => (t.id === tile.id ? tile : t))
    placed.add(tile.id)
    return tile
  }
  return { game, state, place }
}

function runTile(state: OrchestratorState, id: string) {
  return state.wallTemplate.find((tile) => tile.id === id)!
}

/** Every wall tile but these, as saved data. */
function others(state: OrchestratorState, ids: readonly string[]) {
  return json(state.wallTemplate.filter((tile) => !ids.includes(tile.id)))
}

/** Use the Seal as a pack pick would, and expect it to work. */
function lay(game: GameOrchestrator, id: string, targets: string[]) {
  const item = seal(id)
  expect(game.validateWallSeal(item, targets)).toBeNull()
  expect(game.applyFateSeal(item, 'pack_open', targets)).toBe(true)
}

/** Expect the Seal to refuse these targets and leave the whole run as it was. */
function refuse(game: GameOrchestrator, id: string, targets: string[]) {
  const state = game.getState() as OrchestratorState
  const before = COLLECTIONS.map((key) => json(state[key]))
  const item = seal(id)
  expect(game.validateWallSeal(item, targets), targets.join()).not.toBeNull()
  expect(game.applyFateSeal(item, 'pack_open', targets)).toBe(false)
  expect(COLLECTIONS.map((key) => json(state[key]))).toEqual(before)
  expect(state.fateSealSystem.getLastUsedConsumable()).toBeNull()
}

const MODIFIED: [string, (tile: Tile) => Tile][] = [
  ...Object.values(EnhancementType)
    .filter((e) => e !== EnhancementType.None && e !== EnhancementType.Stone)
    .map((e): [string, (tile: Tile) => Tile] => [
      `${e} Mark`,
      (tile) => tile.withEnhancement(e),
    ]),
  ...Object.values(SealType)
    .filter((s) => s !== SealType.None)
    .map((s): [string, (tile: Tile) => Tile] => [
      `${s} Stamp`,
      (tile) => tile.withSeal(s),
    ]),
  ...Object.values(EditionType)
    .filter((e) => e !== EditionType.Base)
    .map((e): [string, (tile: Tile) => Tile] => [
      `${e} Edition`,
      (tile) => tile.withEdition(e),
    ]),
]

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

describe('honor Seals', () => {
  it.each(HONOR_SEALS)(
    '%s makes exactly its own honor from any numbered tile or other honor',
    (id, suit, rank) => {
      const { game, state, place } = visit()
      const otherHonor =
        suit === TileSuit.Dragon ? (rank % 3) + 1 : (rank % 4) + 1
      const crossHonor =
        suit === TileSuit.Dragon ? TileSuit.Wind : TileSuit.Dragon
      const sources = [
        place(TileSuit.Manzu, 1),
        place(TileSuit.Pinzu, 5, { red: true }),
        place(TileSuit.Souzu, 9),
        place(TileSuit.Manzu, 7),
        place(suit, otherHonor),
        place(crossHonor, 2),
      ]
      const size = state.wallTemplate.length
      for (const source of sources) {
        const untouched = others(state, [source.id])
        lay(game, id, [source.id])
        expect(runTile(state, source.id)).toMatchObject({
          id: source.id,
          suit,
          rank,
          isRed: false,
          modifiers: source.modifiers,
        })
        expect(state.wallTemplate).toHaveLength(size)
        expect(others(state, [source.id])).toEqual(untouched)
      }
    }
  )

  it.each(HONOR_SEALS)(
    '%s refuses its own honor, Flowers, Seasons, Stone tiles and any count but one',
    (id, suit, rank) => {
      const { game, state, place } = visit()
      const same = place(suit, rank)
      const stone = place(TileSuit.Manzu, 2, {
        modify: (tile) => tile.withEnhancement(EnhancementType.Stone),
      })
      const flower = state.wallTemplate.find((t) => t.suit === TileSuit.Flower)!
      const season = state.wallTemplate.find((t) => t.suit === TileSuit.Season)!
      const a = place(TileSuit.Souzu, 3)
      const b = place(TileSuit.Pinzu, 6)
      for (const targets of [
        [same.id],
        [stone.id],
        [flower.id],
        [season.id],
        [],
        [a.id, b.id],
        [a.id, a.id],
        ['missing'],
      ])
        refuse(game, id, targets)
    }
  )

  it.each(MODIFIED)('keeps a tile’s %s and adds nothing', (_, modify) => {
    const { game, state, place } = visit()
    const tile = place(TileSuit.Souzu, 4, { modify })
    lay(game, 'seal_of_north_wind', [tile.id])
    expect(runTile(state, tile.id)).toMatchObject({
      suit: TileSuit.Wind,
      rank: 4,
      modifiers: tile.modifiers,
    })
  })

  it('changes the tile on the rack and in the run wall alike', () => {
    const { game, state, place } = visit()
    state.phase = 'gameplay'
    const tile = place(TileSuit.Pinzu, 5, {
      red: true,
      onRack: true,
      modify: (t) => t.withSeal(SealType.Gold),
    })
    lay(game, 'seal_of_red_dragon', [tile.id])
    const expected = {
      id: tile.id,
      suit: TileSuit.Dragon,
      rank: 3,
      isRed: false,
      modifiers: tile.modifiers,
    }
    expect(state.handTiles.find((t) => t.id === tile.id)).toMatchObject(
      expected
    )
    for (const key of COLLECTIONS)
      for (const copy of state[key].filter((t) => t.id === tile.id))
        expect(copy, key).toMatchObject(expected)
  })

  it('keeps the change through a save and into the next round’s deal', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    // Clear the round for real so leaving the Tea House deals the next one.
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    const play = game
      .getHandTiles()
      .slice(0, 2)
      .map((t) => t.id)
    expect(game.processAction({ type: 'play', tileIds: play }).success).toBe(
      true
    )
    expect(game.getState().phase).toBe('shop')
    expect(game.shop.open()).toBe(true)
    const target = game
      .getSealableWallTiles()
      .find((t) => t.suit === TileSuit.Souzu && t.rank === 6)!
    lay(game, 'seal_of_east_wind', [target.id])
    lay(game, 'seal_of_descent', [
      game
        .getSealableWallTiles()
        .find((t) => t.suit === TileSuit.Manzu && t.rank === 2)!.id,
    ])
    const template = json(game.getState().wallTemplate)

    const restored = new GameOrchestrator()
    restored.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
    expect(json(restored.getState().wallTemplate)).toEqual(template)
    const round = restored.getState().currentRound
    restored.exitShop()
    const next = restored.getState() as OrchestratorState
    expect(next.phase).toBe('gameplay')
    expect(next.currentRound).toBe(round + 1)
    expect(json(next.wallTemplate)).toEqual(template)
    const dealt = [
      ...next.handTiles,
      ...next.wall,
      ...next.deadWall,
      ...next.summerReserve,
    ].filter((t) => t.id === target.id)
    expect(dealt).toHaveLength(1)
    expect(dealt[0]).toMatchObject({
      id: target.id,
      suit: TileSuit.Wind,
      rank: 1,
    })
  })
})

describe('Seal of Descent', () => {
  it.each(NUMBERED)(
    'lowers every rank from 2 to 9 of %s by exactly one and keeps the suit',
    (suit) => {
      const { game, state, place } = visit()
      for (let rank = 2; rank <= 9; rank++) {
        const tile = place(suit, rank)
        lay(game, 'seal_of_descent', [tile.id])
        expect(runTile(state, tile.id)).toMatchObject({
          id: tile.id,
          suit,
          rank: rank - 1,
          isRed: false,
        })
      }
    }
  )

  it('lowers one tile or two different tiles in one use', () => {
    const { game, state, place } = visit()
    const one = place(TileSuit.Manzu, 3)
    lay(game, 'seal_of_descent', [one.id])
    expect(runTile(state, one.id).rank).toBe(2)
    const a = place(TileSuit.Pinzu, 9)
    const b = place(TileSuit.Souzu, 2)
    const size = state.wallTemplate.length
    lay(game, 'seal_of_descent', [a.id, b.id])
    expect([runTile(state, a.id).rank, runTile(state, b.id).rank]).toEqual([
      8, 1,
    ])
    expect(state.wallTemplate).toHaveLength(size)
  })

  it('refuses a 1, honors, bonus tiles, Stone tiles, repeats and a third tile, changing nothing', () => {
    const { game, state, place } = visit()
    const one = place(TileSuit.Manzu, 1)
    const wind = place(TileSuit.Wind, 2)
    const dragon = place(TileSuit.Dragon, 3)
    const stone = place(TileSuit.Souzu, 6, {
      modify: (tile) => tile.withEnhancement(EnhancementType.Stone),
    })
    const flower = state.wallTemplate.find((t) => t.suit === TileSuit.Flower)!
    const season = state.wallTemplate.find((t) => t.suit === TileSuit.Season)!
    const [a, b, c] = [4, 5, 6].map((rank) => place(TileSuit.Pinzu, rank))
    for (const targets of [
      [one.id],
      [wind.id],
      [dragon.id],
      [stone.id],
      [flower.id],
      [season.id],
      // A valid tile beside an invalid one must not change on its own.
      [a.id, one.id],
      [a.id, stone.id],
      [a.id, a.id],
      [a.id, b.id, c.id],
      [],
    ])
      refuse(game, 'seal_of_descent', targets)
  })

  it('turns a red five into an ordinary four and a six into an ordinary five', () => {
    const { game, state, place } = visit()
    const red = place(TileSuit.Souzu, 5, { red: true })
    const six = place(TileSuit.Manzu, 6)
    lay(game, 'seal_of_descent', [red.id, six.id])
    expect(runTile(state, red.id)).toMatchObject({ rank: 4, isRed: false })
    expect(runTile(state, six.id)).toMatchObject({ rank: 5, isRed: false })
  })

  it.each(MODIFIED)('keeps a tile’s %s and adds nothing', (_, modify) => {
    const { game, state, place } = visit()
    const tile = place(TileSuit.Pinzu, 7, { modify })
    lay(game, 'seal_of_descent', [tile.id])
    expect(runTile(state, tile.id)).toMatchObject({
      rank: 6,
      modifiers: tile.modifiers,
    })
  })
})

describe('buying the new Seals in the Tea House', () => {
  function offer(game: GameOrchestrator, id: string) {
    const item = seal(id)
    const offering = game.shop.state.itemOfferings[0]
    Object.assign(offering, {
      itemType: 'FateSeal',
      item,
      finalCost: item.cost,
    })
    return offering
  }

  it.each([
    ['seal_of_white_dragon', TileSuit.Manzu, 8],
    ['seal_of_descent', TileSuit.Souzu, 8],
  ] as const)(
    '%s is paid for and used once, only on a valid choice',
    (id, suit, rank) => {
      const { game, state, place } = visit()
      const tile = place(suit, rank)
      const offering = offer(game, id)
      const wall = json(state.wallTemplate)
      // Leaving the picker buys nothing; a bad choice is refused unpaid.
      expect(game.shop.purchase(offering.id)).toMatchObject({ success: false })
      expect(
        game.shop.purchase(offering.id, { type: 'gold' }, [
          state.wallTemplate.find((t) => t.isBonus)!.id,
        ])
      ).toMatchObject({ success: false, reason: 'sealUnusable' })
      expect(state.gold).toBe(100)
      expect(offering.isPurchased).toBeFalsy()
      expect(json(state.wallTemplate)).toEqual(wall)

      expect(
        game.shop.purchase(offering.id, { type: 'gold' }, [tile.id]).success
      ).toBe(true)
      const changed = json(runTile(state, tile.id))
      expect(state.gold).toBe(100 - FATE_SEALS[id].cost)
      expect(offering.isPurchased).toBe(true)
      expect(state.fateSeals).toHaveLength(0)
      // A repeated confirm cannot pay again or change the tile twice.
      expect(
        game.shop.purchase(offering.id, { type: 'gold' }, [tile.id]).success
      ).toBe(false)
      expect(state.gold).toBe(100 - FATE_SEALS[id].cost)
      expect(json(runTile(state, tile.id))).toEqual(changed)
    }
  )
})

describe('presentation', () => {
  it.each([
    ...HONOR_SEALS.map(
      ([id, , , honor]) =>
        [
          id,
          'Rare',
          5,
          `Turns 1 tile you choose into ${honor} for the rest of this run`,
        ] as const
    ),
    [
      'seal_of_descent',
      'Common',
      3,
      'Lowers the number on 1 or 2 tiles you choose by 1 for the rest of this run. Cannot lower a 1.',
    ] as const,
  ])('%s is %s at %i Gold with its own art', (id, rarity, cost, text) => {
    const definition = FATE_SEALS[id]
    expect(definition).toMatchObject({ id, rarity, cost, description: text })
    const copy = (en.seals.items as Record<string, { description: string }>)[id]
    expect(copy.description).toBe(text)
    const art = getFateSealIllustration(id)
    expect(art).toMatch(new RegExp(`/fateSeals/${id}\\.webp$`))
    const bytes = readFileSync(`public${art}`)
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
  })

  it('names each honor Seal after the honor it makes', () => {
    for (const [id, suit, rank] of HONOR_SEALS) {
      const name = FATE_SEALS[id].name
      const honor =
        suit === TileSuit.Dragon
          ? ['White Dragon', 'Green Dragon', 'Red Dragon'][rank - 1]
          : ['East Wind', 'South Wind', 'West Wind', 'North Wind'][rank - 1]
      expect(name).toBe(`Seal of the ${honor}`)
    }
  })
})

// Keep the modifier fixture honest: every listed tile carries exactly one.
it('lists each non-Stone Mark, Stamp and Edition once', () => {
  const kinds = MODIFIED.map(([, modify]) => {
    const { enhancement, seal, edition } = modify(
      new Tile(TileSuit.Manzu, 5, 'probe')
    ).modifiers
    return `${enhancement}/${seal}/${edition}`
  })
  expect(new Set(kinds).size).toBe(MODIFIED.length)
  expect(MODIFIED).toHaveLength(7 + 4 + 4)
})
