import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, EnhancementType } from '../core/Tile'
import { runRandom } from '../game/RunRandom'
import { calculateModifierEffects } from '../core/TileModifier'
import type { BlessingPack, PackType } from './types'
import { BlessingPackSystem } from './BlessingPackSystem'

function makePack(type: PackType): BlessingPack {
  return {
    id: `test-${type}`,
    type,
    size: 'Normal',
    cost: 4,
    choiceCount: 3,
    selectCount: 1,
  }
}

afterEach(() => runRandom.reset())

describe('BlessingPackSystem shop integration', () => {
  it.each([EnhancementType.Bonus, EnhancementType.Gold])(
    'describes the actual %s enhancement instead of an independent pack rule',
    (enhancement) => {
      runRandom.start(713)
      const system = new BlessingPackSystem()
      const contents = system
        .generateOfferingsForPacks(
          Array.from({ length: 40 }, (_, index) => ({
            ...makePack('Tile'),
            id: `tile-text-${index}`,
          }))
        )
        .flatMap((offer) => offer.contents)
      const content = contents.find(
        (entry) => (entry.data as Tile).modifiers.enhancement === enhancement
      )!
      expect(content).toBeDefined()
      const tile = content.data as Tile
      expect(content.description).toBe(tile.enhancementDef.description)
      const played = calculateModifierEffects(tile.modifiers, 'played', {
        deterministic: true,
      })
      const held = calculateModifierEffects(tile.modifiers, 'held', {
        deterministic: true,
      })
      if (enhancement === EnhancementType.Bonus) {
        expect(played.chipBonus).toBe(30)
      } else {
        expect(played.goldBonus).toBe(0)
        expect(held.goldBonus).toBe(3)
      }
    }
  )
  it('settles rewards once and preserves terminal state through serialization', () => {
    const system = new BlessingPackSystem()
    const pack = makePack('Arcana')
    system.generateOfferingsForPacks([pack])
    expect(system.confirmSelection(pack.id)).toEqual([])
    system.openPack(pack.id)
    expect(system.confirmSelection(pack.id)).toEqual([])
    expect(system.selectContent(pack.id, 0)).toBe(true)
    expect(system.confirmSelection(pack.id)).toHaveLength(1)
    expect(system.confirmSelection(pack.id)).toEqual([])
    expect(system.selectContent(pack.id, 1)).toBe(false)
    expect(system.deselectContent(pack.id, 0)).toBe(false)
    system.skipPack(pack.id)
    expect(system.getSkipCount()).toBe(0)
    const restored = BlessingPackSystem.fromState(system.toState())
    expect(restored.confirmSelection(pack.id)).toEqual([])
    expect(restored.openPack(pack.id)).toBeNull()
  })

  it('counts a skipped pack once and never grants its partial selection', () => {
    const system = new BlessingPackSystem()
    const pack = makePack('Arcana')
    system.generateOfferingsForPacks([pack])
    system.openPack(pack.id)
    system.selectContent(pack.id, 0)
    system.skipPack(pack.id)
    system.skipPack(pack.id)
    expect(system.getSkipCount()).toBe(1)
    expect(system.confirmSelection(pack.id)).toEqual([])
    expect(system.selectContent(pack.id, 1)).toBe(false)
  })

  it.each([NaN, Infinity, -1, 0.5, 99])(
    'rejects invalid index %s without changing selection',
    (index) => {
      const system = new BlessingPackSystem()
      const pack = makePack('Arcana')
      system.generateOfferingsForPacks([pack])
      system.openPack(pack.id)
      expect(system.selectContent(pack.id, index)).toBe(false)
      expect(system.getCurrentOfferings()[0].selectedIndices).toEqual([])
    }
  )

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds contents for the exact Tea House pack ids', () => {
    const system = new BlessingPackSystem()
    const packs = [makePack('Arcana'), makePack('Celestial')]

    const offerings = system.generateOfferingsForPacks(packs)

    expect(offerings.map((offering) => offering.pack.id)).toEqual(
      packs.map((pack) => pack.id)
    )
    expect(system.openPack(packs[0].id)?.contents).toHaveLength(3)
  })

  it.each([
    ['Arcana', 'FateSeal'],
    ['Celestial', 'CelestialOrb'],
    ['Void', 'VoidScript'],
  ] as const)(
    'creates usable %s consumable instances',
    (packType, contentType) => {
      const system = new BlessingPackSystem()
      const [offering] = system.generateOfferingsForPacks([makePack(packType)])

      expect(offering.contents).toHaveLength(3)
      for (const content of offering.contents) {
        expect(content.type).toBe(contentType)
        expect(content.data).toMatchObject({ instanceId: expect.any(String) })
      }
    }
  )

  it('creates real modified Tile instances for Tile packs', () => {
    const system = new BlessingPackSystem()
    const [offering] = system.generateOfferingsForPacks([makePack('Tile')])

    expect(offering.contents).toHaveLength(3)
    for (const content of offering.contents) {
      expect(content.type).toBe('Tile')
      expect(content.data).toBeInstanceOf(Tile)
      expect((content.data as Tile).hasModifiers).toBe(true)
    }
  })

  it('places the favored-yaku Orb in Celestial Packs for Star Chart', () => {
    const system = new BlessingPackSystem()
    const [offering] = system.generateOfferingsForPacks(
      [makePack('Celestial')],
      { preferredYaku: 'Tanyao' }
    )

    expect(
      offering.contents.some(
        (content) =>
          content.type === 'CelestialOrb' &&
          (content.data as { effect: { targetYaku: string } }).effect
            .targetYaku === 'Tanyao'
      )
    ).toBe(true)
  })

  it('allows Omen Lens to replace Arcana contents with Void Scripts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const system = new BlessingPackSystem()
    const [offering] = system.generateOfferingsForPacks([makePack('Arcana')], {
      voidScriptsInArcana: true,
    })

    expect(offering.contents).toHaveLength(3)
    expect(
      offering.contents.every((content) => content.type === 'VoidScript')
    ).toBe(true)
  })
})
