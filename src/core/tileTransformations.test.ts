import { describe, expect, it } from 'vitest'
import { DragonType, Tile, TileSuit, WindType } from './Tile'
import {
  canBecomeHonor,
  convertSuitedTile,
  convertSuitedTileRank,
  convertTileToHonor,
  suitConversionRank,
  UNITY_WIND_CONVERSIONS,
} from './tileTransformations'
import { EditionType, EnhancementType, SealType } from './TileModifier'

describe('physical suit transformations', () => {
  it('keeps rank conversions valid without creating red fives or losing modifiers', () => {
    for (const suit of [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu])
      for (let sourceRank = 1; sourceRank <= 9; sourceRank++)
        for (let rank = 1; rank <= 9; rank++) {
          const tile = new Tile(
            suit,
            sourceRank,
            'physical-rank',
            sourceRank === 5
          ).withSeal(SealType.Red)
          const result = convertSuitedTileRank(tile, rank)
          expect(result).toMatchObject({
            rank,
            suit,
            id: tile.id,
            isRed: sourceRank === 5 && rank === 5,
            modifiers: tile.modifiers,
          })
          expect(tile.rank).toBe(sourceRank)
          if (sourceRank === rank) expect(result).toBe(tile)
        }
  })

  it('leaves Honors and bonus tiles unchanged during rank conversion', () => {
    for (const suit of [
      TileSuit.Wind,
      TileSuit.Dragon,
      TileSuit.Flower,
      TileSuit.Season,
    ]) {
      const tile = new Tile(suit, 1, 'non-numbered')
      expect(convertSuitedTileRank(tile, 9)).toBe(tile)
    }
  })

  it('rejects invalid target ranks for a physical numbered tile', () => {
    const tile = Tile.createNumbered(TileSuit.Manzu, 5)
    for (const rank of [0, 10, 1.5, NaN, Infinity])
      expect(() => convertSuitedTileRank(tile, rank)).toThrow()
  })

  it('keeps all source/target rank combinations valid and preserves identity and modifiers', () => {
    for (const sourceSuit of [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu])
      for (const targetSuit of [
        TileSuit.Manzu,
        TileSuit.Pinzu,
        TileSuit.Souzu,
        TileSuit.Wind,
        TileSuit.Dragon,
      ])
        for (let rank = 1; rank <= 9; rank++) {
          const source = new Tile(
            sourceSuit,
            rank,
            'physical-tile',
            rank === 5
          ).withEdition(EditionType.Foil)
          const before = JSON.stringify(source)
          const result = convertSuitedTile(source, targetSuit)
          const maxRank =
            targetSuit === TileSuit.Wind
              ? 4
              : targetSuit === TileSuit.Dragon
                ? 3
                : 9
          expect(result.rank).toBe(((rank - 1) % maxRank) + 1)
          expect(result.suit).toBe(targetSuit)
          expect(result.id).toBe(source.id)
          expect(result.modifiers).toEqual(source.modifiers)
          expect(result.isRed).toBe(maxRank === 9 && rank === 5)
          expect(JSON.stringify(source)).toBe(before)
        }
  })

  it('does not convert existing Honors or bonus tiles', () => {
    for (const suit of [
      TileSuit.Wind,
      TileSuit.Dragon,
      TileSuit.Flower,
      TileSuit.Season,
    ]) {
      const tile = new Tile(suit, 1, 'unchanged')
      expect(convertSuitedTile(tile, TileSuit.Manzu)).toBe(tile)
    }
  })

  it('derives the public Unity mapping from all nine supported ranks exactly once', () => {
    expect(UNITY_WIND_CONVERSIONS.map((entry) => entry.ranks)).toEqual([
      [1, 5, 9],
      [2, 6],
      [3, 7],
      [4, 8],
    ])
    expect(
      UNITY_WIND_CONVERSIONS.flatMap((entry) => entry.ranks).sort(
        (a, b) => a - b
      )
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('does not silently accept nonexistent source ranks or create bonus tiles', () => {
    for (const rank of [0, 10, 1.5, NaN])
      expect(() => suitConversionRank(rank, TileSuit.Wind)).toThrow()
    for (const suit of [TileSuit.Flower, TileSuit.Season])
      expect(() => suitConversionRank(5, suit)).toThrow()
  })
})

describe('honor transformations', () => {
  it('makes the named honor from every numbered rank, never a cycled one', () => {
    for (const suit of [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu])
      for (let rank = 1; rank <= 9; rank++) {
        const tile = new Tile(suit, rank, 'to-honor', rank === 5).withEdition(
          EditionType.Foil
        )
        expect(
          convertTileToHonor(tile, TileSuit.Dragon, DragonType.Red)
        ).toMatchObject({
          suit: TileSuit.Dragon,
          rank: 3,
          id: tile.id,
          isRed: false,
          modifiers: tile.modifiers,
        })
        expect(
          convertTileToHonor(tile, TileSuit.Wind, WindType.North)
        ).toMatchObject({ suit: TileSuit.Wind, rank: 4, id: tile.id })
      }
  })

  it('turns one honor into another but leaves its own honor, Stones and bonus tiles', () => {
    const east = Tile.createWind(WindType.East, 'east')
    expect(
      convertTileToHonor(east, TileSuit.Dragon, DragonType.White)
    ).toMatchObject({ suit: TileSuit.Dragon, rank: 1, id: 'east' })
    expect(convertTileToHonor(east, TileSuit.Wind, WindType.East)).toBe(east)
    const stone = new Tile(TileSuit.Manzu, 2, 'stone').withEnhancement(
      EnhancementType.Stone
    )
    const flower = new Tile(TileSuit.Flower, 1, 'flower')
    for (const tile of [stone, flower]) {
      expect(canBecomeHonor(tile, TileSuit.Wind, WindType.East)).toBe(false)
      expect(convertTileToHonor(tile, TileSuit.Wind, WindType.East)).toBe(tile)
    }
  })

  it('rejects honors that do not exist', () => {
    const tile = new Tile(TileSuit.Pinzu, 4, 'bad-honor')
    expect(() => convertTileToHonor(tile, TileSuit.Dragon, 4)).toThrow()
    expect(() => convertTileToHonor(tile, TileSuit.Wind, 0)).toThrow()
    expect(() => convertTileToHonor(tile, TileSuit.Manzu, 1)).toThrow()
  })
})
