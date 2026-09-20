import { describe, expect, it } from 'vitest'
import { ALL_DECREES, DecreeSystem } from './DecreeSystem'

function setup(...ids: string[]) {
  const system = new DecreeSystem(10)
  for (const id of ids) {
    const definition = ALL_DECREES.find((d) => d.id === id)
    if (!definition) throw Error(`Missing catalog Decree: ${id}`)
    expect(system.acquireDecree(definition)).not.toBeNull()
  }
  return system
}

describe('catalog gold effects', () => {
  it('resolves duplicate Blueprint instances by their own physical position', () => {
    const system = setup(
      'decree-blueprint',
      'decree-blueprint',
      'decree-wealth-engine'
    )
    expect(system.calculateRoundEndGold()).toBe(6)
  })
  it('Wealth Engine counts all owned Decrees, including itself and suppressed inventory', () => {
    const system = setup(
      'decree-wealth-engine',
      'decree-blueprint',
      'decree-dragon-echo'
    )
    system.getOwnedDecrees()[2].isDebuffed = true
    expect(system.calculateRoundEndGold(new Set(['decree-blueprint']))).toBe(3)
    system.removeDecree('decree-dragon-echo')
    expect(system.calculateRoundEndGold(new Set(['decree-blueprint']))).toBe(2)
    expect(
      system.calculateRoundEndGold(new Set(['decree-wealth-engine']))
    ).toBe(0)
  })

  it('Blueprint copies Wealth Engine scaling, not a flat reward', () => {
    const system = setup(
      'decree-blueprint',
      'decree-wealth-engine',
      'decree-dragon-echo'
    )
    expect(system.calculateRoundEndGold()).toBe(6)
    expect(system.calculateRoundEndGold()).toBe(6)
  })

  it('copies discard rewards and multiplicative gold powers', () => {
    const river = setup('decree-blueprint', 'river_tax')
    expect(river.calculateDiscardGold()).toBe(2)
    const stone = setup('decree-philosophers-stone', 'decree-brainstorm')
    expect(stone.getGoldMultiplier()).toBe(4)
  })

  it('Clone Army copies mixed gold effects once without recursively copying copiers', () => {
    const system = setup(
      'decree-coin-collector',
      'decree-philosophers-stone',
      'decree-clone-army',
      'decree-brainstorm'
    )
    expect(system.calculateRoundEndGold()).toBe(3)
    expect(system.getGoldMultiplier()).toBe(4)
  })

  it.each(['debuffed', 'mandate'] as const)(
    'does not skip a %s right-hand neighbor to copy a different Decree',
    (suppression) => {
      const system = setup(
        'decree-blueprint',
        'decree-coin-collector',
        'decree-tax-collector'
      )
      const excluded = new Set<string>()
      if (suppression === 'debuffed')
        system.getOwnedDecrees()[1].isDebuffed = true
      else excluded.add('decree-coin-collector')
      expect(system.calculateRoundEndGold(excluded)).toBe(4)
    }
  )

  it('suppresses copied gold multipliers and discard rewards with their source', () => {
    const system = setup('decree-blueprint', 'decree-philosophers-stone')
    expect(
      system.getGoldMultiplier(new Set(['decree-philosophers-stone']))
    ).toBe(1)
    expect(system.getGoldMultiplier(new Set(['decree-blueprint']))).toBe(2)
    const river = setup('decree-blueprint', 'river_tax')
    expect(river.calculateDiscardGold(1, new Set(['river_tax']))).toBe(0)
  })

  it('copy cycles and empty inventories produce no phantom gold', () => {
    const system = setup('decree-blueprint', 'decree-brainstorm')
    expect(system.calculateRoundEndGold()).toBe(0)
    expect(system.calculateDiscardGold()).toBe(0)
    expect(system.getGoldMultiplier()).toBe(1)
    expect(setup().calculateRoundEndGold()).toBe(0)
  })
})
