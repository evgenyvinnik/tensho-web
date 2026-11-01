import { describe, expect, it } from 'vitest'
import { FlowerType, Tile, TileSuit, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import {
  canSealTile,
  firstSealTargets,
  previewWallSeal,
  sealableWallTiles,
  wallAfterSeal,
  wallSealTargetError,
} from './wallSeals'

const seal = (id: string) =>
  FateSealSystem.createFateSealInstance(FATE_SEALS[id])
const characters = new Tile(TileSuit.Manzu, 3, 'm3')
const circles = new Tile(TileSuit.Pinzu, 9, 'p9')
const bamboo = new Tile(TileSuit.Souzu, 5, 's5', true)
const east = Tile.createWind(WindType.East, 'east')
const plum = Tile.createFlower(FlowerType.Plum, 'plum')
const wall = [characters, circles, bamboo, east, plum]

describe('which wall tiles a Seal can take', () => {
  it('never offers Flowers or Seasons', () => {
    expect(sealableWallTiles(wall).map((tile) => tile.id)).toEqual([
      'm3',
      'p9',
      's5',
      'east',
    ])
    expect(canSealTile(seal('seal_of_the_alchemist'), plum)).toBe(false)
  })

  it('takes only tiles a conversion would change', () => {
    const toCharacters = seal('seal_of_manzu')
    expect(canSealTile(toCharacters, characters)).toBe(false)
    expect(canSealTile(toCharacters, circles)).toBe(true)
    expect(canSealTile(toCharacters, east)).toBe(false)
    const strength = seal('seal_of_strength')
    expect(canSealTile(strength, circles)).toBe(false)
    expect(canSealTile(strength, characters)).toBe(true)
    expect(canSealTile(seal('seal_of_glass'), east)).toBe(true)
  })

  it('lets an honor Seal take any tile but its own honor, a Stone or a bonus tile', () => {
    const toEast = seal('seal_of_east_wind')
    const stone = characters.withEnhancement(EnhancementType.Stone)
    expect(canSealTile(toEast, characters)).toBe(true)
    expect(canSealTile(toEast, Tile.createWind(WindType.South, 's'))).toBe(true)
    expect(canSealTile(toEast, east)).toBe(false)
    expect(canSealTile(toEast, stone)).toBe(false)
    expect(canSealTile(toEast, plum)).toBe(false)
    const descent = seal('seal_of_descent')
    expect(canSealTile(descent, characters)).toBe(true)
    expect(canSealTile(descent, new Tile(TileSuit.Manzu, 1, 'm1'))).toBe(false)
    expect(canSealTile(descent, east)).toBe(false)
    expect(canSealTile(descent, stone)).toBe(false)
    expect(canSealTile(seal('seal_of_strength'), stone)).toBe(false)
  })
})

describe('what a Seal makes of the chosen tiles', () => {
  it('converts, marks and destroys exactly as the engine settles', () => {
    expect(
      previewWallSeal(seal('seal_of_manzu'), wall, ['p9', 's5']).map(
        ({ before, after }) => [before.id, after?.suit, after?.rank, after?.id]
      )
    ).toEqual([
      ['p9', TileSuit.Manzu, 9, 'p9'],
      ['s5', TileSuit.Manzu, 5, 's5'],
    ])
    const [marked] = previewWallSeal(seal('seal_of_glass'), wall, ['east'])
    expect(marked.after?.enhancement).toBe(EnhancementType.Glass)
    expect(
      previewWallSeal(seal('seal_of_release'), wall, ['m3'])[0].after
    ).toBeNull()
  })

  it('turns the first tile into a copy of the second and leaves the second', () => {
    const [copy] = previewWallSeal(seal('seal_of_transmutation'), wall, [
      'm3',
      's5',
    ])
    expect(copy.before.id).toBe('m3')
    expect(copy.after).toMatchObject({
      id: 'm3',
      suit: TileSuit.Souzu,
      rank: 5,
      isRed: true,
    })
    expect(
      previewWallSeal(seal('seal_of_transmutation'), wall, ['m3'])
    ).toEqual([])
  })

  it('shows an honor Seal’s exact honor and Descent’s lower number', () => {
    expect(
      previewWallSeal(seal('seal_of_green_dragon'), wall, ['s5']).map(
        ({ after }) => [after?.id, after?.suit, after?.rank, after?.isRed]
      )
    ).toEqual([['s5', TileSuit.Dragon, 2, false]])
    expect(
      previewWallSeal(seal('seal_of_descent'), wall, ['m3', 's5']).map(
        ({ after }) => [after?.id, after?.rank, after?.isRed]
      )
    ).toEqual([
      ['m3', 2, false],
      ['s5', 4, false],
    ])
    expect(wallSealTargetError(seal('seal_of_east_wind'), wall, ['east'])).toBe(
      'Choose a tile that is not already this honor or a Stone tile'
    )
  })

  it('leaves the wall a following Seal finds', () => {
    const after = wallAfterSeal(seal('seal_of_release'), wall, ['m3'])
    expect(after.map((tile) => tile.id)).toEqual(['p9', 's5', 'east', 'plum'])
    const converted = wallAfterSeal(seal('seal_of_manzu'), after, ['p9'])
    expect(converted[0]).toMatchObject({ id: 'p9', suit: TileSuit.Manzu })
  })
})

describe('checking chosen targets', () => {
  it('asks only for something to work on until tiles are chosen', () => {
    expect(wallSealTargetError(seal('seal_of_manzu'), wall)).toBeNull()
    expect(
      wallSealTargetError(seal('seal_of_manzu'), [characters, east, plum])
    ).toBe('Choose a suited tile of a different suit')
    expect(wallSealTargetError(seal('seal_of_the_hermit'), [])).toBeNull()
  })

  it('refuses repeated, missing and unchangeable tiles', () => {
    const toCharacters = seal('seal_of_manzu')
    expect(wallSealTargetError(toCharacters, wall, ['p9', 'p9'])).toBe(
      'Choose each tile once'
    )
    expect(wallSealTargetError(toCharacters, wall, ['m3'])).toBe(
      'Choose a suited tile of a different suit'
    )
    expect(wallSealTargetError(toCharacters, wall, ['plum'])).toBe(
      'Choose a suited tile of a different suit'
    )
    expect(wallSealTargetError(seal('seal_of_glass'), wall, ['missing'])).toBe(
      'Choose tiles from your wall'
    )
    expect(wallSealTargetError(toCharacters, wall, ['p9', 's5'])).toBeNull()
  })

  it('gives scripted play the first tiles a Seal would change', () => {
    expect(firstSealTargets(seal('seal_of_manzu'), wall)).toEqual(['p9', 's5'])
    expect(firstSealTargets(seal('seal_of_the_hermit'), wall)).toEqual([])
  })
})
