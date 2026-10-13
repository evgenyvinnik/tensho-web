import { describe, expect, it } from 'vitest'
import { ALL_DECREES as DEFINITIONS } from './decreeDefinitions'
import { LIBRARY_DECREES } from './decreeLibrary'
import type { DecreeRarity as LibraryRarity } from '../stores/decreeStore'
import { DecreeSystem } from '../systems/DecreeSystem'
import type { DecreeRarity } from '../systems/types'

function authoredIds(rarity: LibraryRarity): string[] {
  return DEFINITIONS.filter((definition) => definition.rarity === rarity).map(
    (definition) => definition.id
  )
}

function engineIds(rarity: DecreeRarity): Set<string> {
  return new Set(
    DecreeSystem.getDecreesByRarity(rarity).map((decree) => decree.id)
  )
}

describe('library rarity tiers', () => {
  it.each([
    ['common', 'LocalEdict'],
    ['uncommon', 'RegionalMandate'],
    ['rare', 'ImperialDecree'],
    ['legendary', 'HeavenlyOrdinance'],
    ['mythic', 'HeavenlyOrdinance'],
  ] as const)('maps authored %s Decrees to %s', (authored, engine) => {
    const ids = authoredIds(authored)
    expect(ids.length).toBeGreaterThan(0)
    const converted = LIBRARY_DECREES.filter((decree) =>
      ids.includes(decree.id)
    )
    expect(converted).toHaveLength(ids.length)
    expect(new Set(converted.map((decree) => decree.rarity))).toEqual(
      new Set([engine])
    )
  })

  it('keeps authored legendaries out of the Rare shop tier', () => {
    const rare = engineIds('ImperialDecree')
    const leaked = authoredIds('legendary').filter((id) => rare.has(id))
    expect(leaked).toEqual([])
    expect(rare.has('decree-midas-touch')).toBe(false)
  })

  it('leaves authored legendaries reachable from the special-sources tier', () => {
    const special = engineIds('HeavenlyOrdinance')
    for (const id of authoredIds('legendary'))
      expect(special.has(id)).toBe(true)
  })
})

describe('Midas Touch', () => {
  it('pays +10 Gold at end of round, one step above Golden Age', () => {
    const decree = (id: string) => LIBRARY_DECREES.find((d) => d.id === id)!

    const midas = new DecreeSystem(5)
    midas.acquireDecree(decree('decree-midas-touch'))
    const goldenAge = new DecreeSystem(5)
    goldenAge.acquireDecree(decree('decree-golden-age'))

    expect(midas.calculateRoundEndGold()).toBe(10)
    expect(goldenAge.calculateRoundEndGold()).toBe(8)
  })
})
