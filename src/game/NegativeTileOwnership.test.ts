import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { Tile, TileSuit } from '../core/Tile'
import { EditionType, EnhancementType } from '../core/TileModifier'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  vi.restoreAllMocks()
})
const ordinary = ALL_DECREES.find((d) => d.id === 'decree-wide-grip')!

it('does not turn bonus Flowers or Seasons into Negative capacity', () => {
  const decrees = new DecreeSystem()
  decrees.syncWallSlots([
    new Tile(TileSuit.Flower, 1, 'flower').withEdition(EditionType.Negative),
    new Tile(TileSuit.Season, 1, 'season').withEdition(EditionType.Negative),
  ])
  expect(decrees.getMaxSlots()).toBe(5)
})

it('keeps ownership capacity under Frostbite and scoring suppression', () => {
  const { game, state, negative } = fixture()
  state.seasonSystem.forceSetSeason('Winter', true)
  state.debuffSystem.debuffTile(negative.id, {
    type: 'mandate',
    mandateId: 'test',
  })
  game.restoreRun(game.captureRun())
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(6)
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  const negative = new Tile(TileSuit.Manzu, 4, 'owned-negative').withEdition(
    EditionType.Negative
  )
  expect(game.addTileToWall(negative)).toBe(true)
  return { game, state, negative }
}

function useSeal(game: GameOrchestrator, id: string, targets: string[]) {
  const seal = FateSealSystem.createFateSealInstance(FATE_SEALS[id])
  expect(game.addFateSeal(seal)).toBe(true)
  expect(
    game.processAction({ type: 'useSeal', sealId: seal.instanceId, targets })
      .success
  ).toBe(true)
}

it('grants a slot from wall ownership, not a draw or scoring trigger', () => {
  const { game, state, negative } = fixture()
  expect(state.decreeSystem.getMaxSlots()).toBe(6)
  expect(state.handTiles.some((t) => t.id === negative.id)).toBe(false)
  for (let i = 0; i < 6; i++) expect(game.addDecree(ordinary)).toBe(true)
  expect(game.addDecree(ordinary)).toBe(false)
  state.handTiles[0] = negative
  expect(
    game.processAction({ type: 'discard', tileId: negative.id }).success
  ).toBe(true)
  expect(state.decreeSystem.getMaxSlots()).toBe(6)
})

it('restores derived capacity without baking it into base slots or accumulating on reload', () => {
  const { game, state } = fixture()
  expect(state.decreeSystem.toState().maxSlots).toBe(5)
  const saved = game.captureRun()
  const parsed = parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved)))
  expect(parsed.version).toBe(2)
  for (let i = 0; i < 3; i++) {
    game.restoreRun(JSON.parse(JSON.stringify(saved)))
    expect(game.getState().decreeSystem.getMaxSlots()).toBe(6)
    expect(game.captureRun()).toEqual(saved)
  }
})

it('reconciles old saves whose Negative tiles never granted their slot', () => {
  const { game } = fixture()
  const old = game.captureRun()
  old.state.decreeSystem.maxSlots = 5
  game.restoreRun(old)
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(6)
  game.startNewRun(7)
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(5)
})

it('counts physical ownership once even if a malformed legacy wall repeats an ID', () => {
  const { game, negative } = fixture()
  const saved = game.captureRun()
  saved.state.wallTemplate.push(
    saved.state.wallTemplate.find((t) => t.id === negative.id)!
  )
  game.restoreRun(saved)
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(6)
})

it('copies Negative permanently with Transmutation, then preserves both slots across a reshuffle', () => {
  const { game, state, negative } = fixture()
  const target = state.handTiles[0]
  state.handTiles[1] = negative
  useSeal(game, 'seal_of_transmutation', [target.id, negative.id])
  expect(state.wallTemplate.find((t) => t.id === target.id)?.edition).toBe(
    EditionType.Negative
  )
  expect(state.decreeSystem.getMaxSlots()).toBe(7)
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  expect(game.shop.open()).toBe(true)
  game.exitShop()
  expect(state.phase).toBe('gameplay')
  // A newly drawn Flower may also add capacity; the two tile slots stay separate.
  expect(
    state.decreeSystem.getMaxSlots() - state.decreeSystem.toState().maxSlots
  ).toBe(2)
  expect(state.wall.find((t) => t.id === target.id)?.edition).toBe(
    EditionType.Negative
  )
})

it('removes the capacity of an overwritten Negative tile without deleting an owned Decree', () => {
  const { game, state, negative } = fixture()
  for (let i = 0; i < 6; i++) expect(game.addDecree(ordinary)).toBe(true)
  state.handTiles[0] = negative
  useSeal(game, 'seal_of_transmutation', [negative.id, state.handTiles[1].id])
  expect(state.decreeSystem.getMaxSlots()).toBe(5)
  expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(6)
  expect(state.decreeSystem.getAvailableSlots()).toBe(0)
  expect(game.addDecree(ordinary)).toBe(false)
  // A Negative Decree offsets itself, but cannot erase an existing slot deficit.
  expect(game.addDecree({ ...ordinary, edition: 'Negative' })).toBe(false)
})

it('Release permanently destroys a Negative tile and its slot, without restoring it on reload', () => {
  const { game, state, negative } = fixture()
  state.handTiles[0] = negative
  useSeal(game, 'seal_of_release', [negative.id])
  expect(state.wallTemplate.some((t) => t.id === negative.id)).toBe(false)
  expect(state.decreeSystem.getMaxSlots()).toBe(5)
  game.restoreRun(game.captureRun())
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(5)
})

it('stacks with Negative Decrees and separately removable Flower capacity', () => {
  const { game, state } = fixture()
  expect(game.addDecree({ ...ordinary, edition: 'Negative' })).toBe(true)
  state.decreeSystem.addSlot()
  expect(state.decreeSystem.getMaxSlots()).toBe(8)
  state.decreeSystem.removeSlots()
  expect(state.decreeSystem.getMaxSlots()).toBe(7)
})

it('shop preflight recognizes an owned Negative tile at an otherwise full rack', () => {
  const { game, state } = fixture()
  for (let i = 0; i < 5; i++) expect(game.addDecree(ordinary)).toBe(true)
  state.phase = 'shop'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  offer.itemType = 'Decree'
  offer.item = ordinary
  offer.finalCost = 4
  expect(game.shop.validatePurchase(offer.id).success).toBe(true)
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(state.gold).toBe(96)
  expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(6)
})

it('grants an actual Tile Pack reward once, and enables the next Decree purchase', () => {
  const { game, state } = fixture()
  for (let i = 0; i < 6; i++) expect(game.addDecree(ordinary)).toBe(true)
  state.phase = 'shop'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.packOfferings[0]
  const pack = game.shop.packOfferings.find((p) => p.pack.id === offer.item.id)!
  const tile = new Tile(TileSuit.Pinzu, 3, 'pack-negative').withEdition(
    EditionType.Negative
  )
  pack.contents = [
    {
      id: tile.id,
      type: 'Tile',
      name: 'Negative tile',
      description: '',
      rarity: 'rare',
      data: tile,
    },
  ]
  pack.maxSelections = 1
  expect(game.shop.purchase(offer.id).success).toBe(true)
  const paid = state.gold
  game.restoreRun(
    parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
  )
  expect(game.shop.confirmPack([0]).success).toBe(true)
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(7)
  expect(game.getState().gold).toBe(paid)
  expect(game.shop.confirmPack([0]).success).toBe(false)
  expect(game.addDecree(ordinary)).toBe(true)
})

it('Script of Aura removes a tile slot when replacing its Negative edition', () => {
  const { game, state, negative } = fixture()
  state.handTiles[0] = negative
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_aura
  )
  expect(game.addVoidScript(script)).toBe(true)
  expect(
    game.processAction({
      type: 'useScript',
      scriptId: script.instanceId,
      targets: [negative.id],
    }).success
  ).toBe(true)
  expect(state.decreeSystem.getMaxSlots()).toBe(5)
  expect(
    state.wallTemplate.find((t) => t.id === negative.id)?.edition
  ).not.toBe(EditionType.Negative)
})

it('Glass destruction removes its physical Negative tile and capacity after paying the play', () => {
  const { game, state, negative } = fixture()
  const glass = negative.withEnhancement(EnhancementType.Glass)
  state.handTiles = [glass, new Tile(TileSuit.Manzu, 4, 'glass-pair')]
  state.wallTemplate = [
    glass,
    state.handTiles[1],
    ...state.wallTemplate.filter((t) => t.id !== negative.id),
  ]
  state.targetScore = 100000
  state.roundManager.getCurrentRound()!.scoreTarget = 100000
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((t) => t.id),
    }).success
  ).toBe(true)
  expect(state.score).toBeGreaterThan(0)
  expect(state.wallTemplate.some((t) => t.id === negative.id)).toBe(false)
  expect(state.decreeSystem.getMaxSlots()).toBe(
    state.decreeSystem.toState().maxSlots
  )
})

it.each([
  'seal_of_the_sage',
  'seal_of_the_empress',
  'seal_of_strength',
  'seal_of_unity',
])(
  '%s changes owned tiles for later rounds and survives a validated save',
  (id) => {
    const { game, state } = fixture()
    const tiles = [
      new Tile(TileSuit.Souzu, 3, 'permanent-a'),
      new Tile(TileSuit.Pinzu, 4, 'permanent-b'),
    ]
    state.handTiles = tiles
    state.wallTemplate = [...tiles, ...state.wallTemplate]
    useSeal(
      game,
      id,
      tiles.map((t) => t.id)
    )
    const changed = state.wallTemplate.filter((t) =>
      t.id.startsWith('permanent-')
    )
    expect(changed).not.toEqual(tiles)
    game.restoreRun(
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
    )
    const restored = game.getState() as OrchestratorState
    expect(
      restored.wallTemplate.filter((t) => t.id.startsWith('permanent-'))
    ).toEqual(changed)
    restored.phase = 'shop'
    restored.lastCompletedRoundType = 'Small'
    expect(game.shop.open()).toBe(true)
    game.exitShop()
    expect(
      restored.wall
        .filter((t) => t.id.startsWith('permanent-'))
        .sort(Tile.compare)
    ).toEqual([...changed].sort(Tile.compare))
    game.startNewRun(7)
    expect(
      game.getState().wallTemplate.some((t) => t.id.startsWith('permanent-'))
    ).toBe(false)
  }
)
