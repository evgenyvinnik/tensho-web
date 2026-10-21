import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { EnhancementType, SealType } from '../core/TileModifier'

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return { game, state: game.getState() as OrchestratorState }
}

/** Make the next random Seals these, in order. */
function nextSeals(...ids: (keyof typeof FATE_SEALS)[]) {
  const spy = vi.spyOn(FateSealSystem, 'getRandomFateSeal')
  for (const id of ids) spy.mockReturnValueOnce(FATE_SEALS[id])
  return spy
}

function sealsUsed() {
  const used: { sealId: string; source?: string }[] = []
  eventBus.on('fateSealUsed', ({ sealId, source }) =>
    used.push({ sealId, source })
  )
  return used
}

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
})

describe('a Seal the run makes is used as it is made', () => {
  it('works at once when it needs no tiles', () => {
    const { game, state } = fixture()
    const used = sealsUsed()
    state.gold = 10
    const purple = state.handTiles[0].withSeal(SealType.Purple)
    state.handTiles[0] = purple
    nextSeals('seal_of_the_hermit')
    expect(
      game.processAction({ type: 'redraw', tileIds: [purple.id] }).success
    ).toBe(true)
    expect(state.fateSeals).toEqual([])
    expect(state.gold).toBe(20)
    expect(used).toEqual([
      { sealId: 'seal_of_the_hermit', source: 'generated' },
    ])
  })

  it('waits only for its wall tiles when it takes them', () => {
    const { game, state } = fixture()
    const purple = state.handTiles[0].withSeal(SealType.Purple)
    state.handTiles[0] = purple
    nextSeals('seal_of_glass')
    game.processAction({ type: 'redraw', tileIds: [purple.id] })
    expect(state.fateSeals.map((seal) => seal.id)).toEqual(['seal_of_glass'])

    const [seal] = state.fateSeals
    const target = state.handTiles[0]
    expect(game.settleHeldFateSeal(seal.instanceId, [])).toMatch(/Select/)
    expect(state.fateSeals).toHaveLength(1)

    const used = sealsUsed()
    expect(game.settleHeldFateSeal(seal.instanceId, [target.id])).toBeNull()
    expect(state.fateSeals).toEqual([])
    const glass = (tile: { id: string; modifiers: { enhancement?: string } }) =>
      tile.id === target.id &&
      tile.modifiers.enhancement === EnhancementType.Glass
    expect(state.handTiles.some(glass)).toBe(true)
    expect(state.wallTemplate.some(glass)).toBe(true)
    expect(used).toEqual([{ sealId: 'seal_of_glass', source: 'generated' }])
  })

  it('is drawn only from Seals that can work now, and never another Emperor', () => {
    const { game, state } = fixture()
    const offered: {
      exclude: string[]
      judgment: boolean
      hermit: boolean
    }[] = []
    vi.spyOn(FateSealSystem, 'getRandomFateSeal').mockImplementation(
      (exclude = [], isUnlocked) => {
        offered.push({
          exclude,
          judgment: isUnlocked!('seal_of_judgment'),
          hermit: isUnlocked!('seal_of_the_hermit'),
        })
        return FATE_SEALS.seal_of_the_hermit
      }
    )
    vi.spyOn(state.decreeSystem, 'getAvailableSlots').mockReturnValue(0)
    state.gold = 5
    const emperor = FateSealSystem.createFateSealInstance(
      FATE_SEALS.seal_of_the_emperor
    )
    expect(game.applyFateSeal(emperor, 'pack_open')).toBe(true)
    // With no room for a Decree, Judgment could not work, so it is not made.
    expect(offered).toEqual([
      {
        exclude: ['seal_of_the_emperor', 'seal_of_the_fool'],
        judgment: false,
        hermit: true,
      },
      {
        exclude: ['seal_of_the_emperor', 'seal_of_the_fool'],
        judgment: false,
        hermit: true,
      },
    ])
    expect(state.gold).toBe(20)
    expect(state.fateSeals).toEqual([])
  })

  it('uses the Fool’s copy at once and never copies a Fool', () => {
    const { game, state } = fixture()
    state.gold = 10
    const hermit = FateSealSystem.createFateSealInstance(
      FATE_SEALS.seal_of_the_hermit
    )
    expect(game.applyFateSeal(hermit, 'pack_open')).toBe(true)
    const fool = () =>
      FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_fool)
    expect(game.applyFateSeal(fool(), 'pack_open')).toBe(true)
    expect(state.gold).toBe(40)
    // The Fool is not history: a second one copies the Hermit again.
    expect(game.applyFateSeal(fool(), 'pack_open')).toBe(true)
    expect(state.gold).toBe(60)
    expect(state.fateSeals).toEqual([])
  })

  it('spends a waiting Seal with nothing left to work on, without effect', () => {
    const { game, state } = fixture()
    const judgment = FateSealSystem.createFateSealInstance(
      FATE_SEALS.seal_of_judgment
    )
    state.fateSeals.push(judgment)
    vi.spyOn(state.decreeSystem, 'getAvailableSlots').mockReturnValue(0)
    const owned = state.decreeSystem.getOwnedDecrees().length
    const used = sealsUsed()
    expect(game.settleHeldFateSeal(judgment.instanceId)).toBeNull()
    expect(state.fateSeals).toEqual([])
    expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(owned)
    expect(used).toEqual([])
  })
})
