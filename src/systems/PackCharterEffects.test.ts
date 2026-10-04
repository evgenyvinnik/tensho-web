import { afterEach, expect, it, vi } from 'vitest'
import { BlessingPackSystem } from './BlessingPackSystem'
import { runRandom } from '../game/RunRandom'
import type { PackType } from './types'

afterEach(() => {
  vi.restoreAllMocks()
  runRandom.reset()
})

it.each(['star_chart', 'omen_lens'] as const)(
  '%s changes only unopened packs of its own family',
  (id) => {
    runRandom.start(7)
    const system = new BlessingPackSystem()
    const types: PackType[] = ['Arcana', 'Celestial', 'Tile', 'Decree', 'Void']
    system.generateOfferingsForPacks(
      types.map((type) => ({
        id: `pack-${type}`,
        type,
        size: 'Normal',
        cost: 4,
        choiceCount: 3,
        selectCount: 1,
      }))
    )
    const before = system.toState()
    vi.spyOn(runRandom, 'next').mockReturnValue(0.1)
    system.applyPurchasedCharter(id, 'Tanyao')
    const after = system.toState()
    for (const [i, pack] of after.currentOfferings.entries()) {
      if (pack.pack.type !== (id === 'star_chart' ? 'Celestial' : 'Arcana'))
        expect(pack).toEqual(before.currentOfferings[i])
      else {
        expect(pack.contents.map((c) => c.id)).toEqual(
          before.currentOfferings[i].contents.map((c) => c.id)
        )
        expect(pack.pack).toEqual(before.currentOfferings[i].pack)
      }
    }
    expect(after.totalPacksOpened).toBe(0)
  }
)

it('does not replace an existing favored Orb or touch revealed choices', () => {
  runRandom.start(7)
  const system = new BlessingPackSystem()
  system.generateOfferingsForPacks(
    [0, 1].map((i) => ({
      id: `celestial-${i}`,
      type: 'Celestial',
      size: 'Normal',
      cost: 4,
      choiceCount: 3,
      selectCount: 1,
    })),
    { preferredYaku: 'Tanyao' }
  )
  system.openPack('celestial-1')
  system.selectContent('celestial-1', 1)
  const before = system.toState(),
    random = runRandom.toState()
  system.applyPurchasedCharter('star_chart', 'Tanyao')
  expect(system.toState()).toEqual(before)
  expect(runRandom.toState()).toEqual(random)
  // A different favored Yaku may change the unopened pack, not its revealed neighbor.
  system.applyPurchasedCharter('star_chart', 'Toitoi')
  expect(system.toState().currentOfferings[1]).toEqual(
    before.currentOfferings[1]
  )
})
