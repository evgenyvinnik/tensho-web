import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, EnhancementType } from '../core/Tile'
import { runRandom } from '../game/RunRandom'
import { calculateModifierEffects } from '../core/TileModifier'
import type { BlessingPack, PackType } from './types'
import { BlessingPackSystem } from './BlessingPackSystem'
import { getFateSealsByRarity } from './FateSealSystem'
import { getCelestialOrbsByRarity } from './CelestialOrbSystem'
import { getVoidScriptsByRarity } from './VoidScriptSystem'

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
  it.each(['Arcana', 'Celestial', 'Void', 'Decree', 'Tile'] as const)(
    'keeps %s choice keys distinct across two packs and reloads',
    (type) => {
      vi.spyOn(Date, 'now').mockReturnValue(1000)
      for (let seed = 1; seed <= 50; seed++) {
        runRandom.start(seed)
        const system = new BlessingPackSystem()
        const packs = [0, 1].map((index) => ({
          ...makePack(type),
          id: `fixed-${index}`,
          size: 'Mega' as const,
          choiceCount: 5,
          selectCount: 2,
        }))
        const offers = system.generateOfferingsForPacks(packs)
        const ids = offers.flatMap((offer) => offer.contents.map((c) => c.id))
        expect(new Set(ids).size).toBe(10)
        system.openPack(packs[0].id)
        system.selectContent(packs[0].id, 1)
        system.selectContent(packs[0].id, 4)
        const restored = BlessingPackSystem.fromState(
          JSON.parse(JSON.stringify(system.toState()))
        )
        expect(restored.getCurrentOfferings()[0].selectedIndices).toEqual([
          1, 4,
        ])
        expect(restored.confirmSelection(packs[0].id).map((c) => c.id)).toEqual(
          [ids[1], ids[4]]
        )
        expect(restored.confirmSelection(packs[0].id)).toEqual([])
      }
    }
  )

  it.each(['Arcana', 'Celestial', 'Void'] as const)(
    'labels actual fallback rarity for %s',
    (type) => {
      vi.spyOn(runRandom, 'next').mockReturnValue(0.999)
      const [offer] = new BlessingPackSystem().generateOfferingsForPacks([
        makePack(type),
      ])
      for (const content of offer.contents)
        expect(content.rarity).toBe(
          (content.data as { rarity: string }).rarity.toLowerCase()
        )
    }
  )
  it.each(['Arcana', 'Celestial', 'Void'] as const)(
    'offers different %s catalog items when the rarity pool has alternatives',
    (type) => {
      vi.spyOn(runRandom, 'next').mockReturnValue(0)
      vi.spyOn(Date, 'now').mockReturnValue(1000)
      const [offer] = new BlessingPackSystem().generateOfferingsForPacks([
        { ...makePack(type), size: 'Mega', choiceCount: 5, selectCount: 2 },
      ])
      const pool =
        type === 'Arcana'
          ? getFateSealsByRarity('Common')
          : type === 'Celestial'
            ? getCelestialOrbsByRarity('Common')
            : getVoidScriptsByRarity('Common')
      const catalogIds = offer.contents.map(
        (c) => (c.data as { id: string }).id
      )
      expect(catalogIds.slice(0, Math.min(pool.length, 5))).toEqual(
        pool.slice(0, 5).map((item) => item.id)
      )
      expect(new Set(catalogIds).size).toBe(Math.min(pool.length, 5))
      expect(new Set(offer.contents.map((c) => c.id)).size).toBe(5)
    }
  )

  it('keeps choice identities distinct even when repeated tile recipes are valid', () => {
    vi.spyOn(runRandom, 'next').mockReturnValue(0)
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const [offer] = new BlessingPackSystem().generateOfferingsForPacks([
      { ...makePack('Tile'), size: 'Mega', choiceCount: 5, selectCount: 2 },
    ])
    expect(new Set(offer.contents.map((c) => c.id)).size).toBe(5)
  })

  it('keeps Star Chart preference based on catalog identity, not the choice key', () => {
    vi.spyOn(runRandom, 'next').mockReturnValue(0)
    const [offer] = new BlessingPackSystem().generateOfferingsForPacks(
      [
        {
          ...makePack('Celestial'),
          size: 'Mega',
          choiceCount: 5,
          selectCount: 2,
        },
      ],
      { preferredYaku: 'Tanyao' }
    )
    expect(
      offer.contents.filter(
        (c) =>
          (c.data as { effect: { targetYaku: string } }).effect.targetYaku ===
          'Tanyao'
      )
    ).toHaveLength(1)
    expect(
      new Set(offer.contents.map((c) => (c.data as { id: string }).id)).size
    ).toBe(getCelestialOrbsByRarity('Common').length)
  })
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
