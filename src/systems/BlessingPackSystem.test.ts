import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile } from '../core/Tile'
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

describe('BlessingPackSystem shop integration', () => {
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
  ] as const)('creates usable %s consumable instances', (packType, contentType) => {
    const system = new BlessingPackSystem()
    const [offering] = system.generateOfferingsForPacks([makePack(packType)])

    expect(offering.contents).toHaveLength(3)
    for (const content of offering.contents) {
      expect(content.type).toBe(contentType)
      expect(content.data).toMatchObject({ instanceId: expect.any(String) })
    }
  })

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
          (content.data as { effect: { targetYaku: string } }).effect.targetYaku ===
            'Tanyao'
      )
    ).toBe(true)
  })

  it('allows Omen Lens to replace Arcana contents with Void Scripts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const system = new BlessingPackSystem()
    const [offering] = system.generateOfferingsForPacks(
      [makePack('Arcana')],
      { voidScriptsInArcana: true }
    )

    expect(offering.contents).toHaveLength(3)
    expect(offering.contents.every((content) => content.type === 'VoidScript')).toBe(
      true
    )
  })
})
