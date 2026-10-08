import { DragonType, TileSuit } from '../core/Tile'

const PREFIX: Record<TileSuit, string> = {
  [TileSuit.Manzu]: 'Symbol',
  [TileSuit.Pinzu]: 'Dots',
  [TileSuit.Souzu]: 'Bamboo',
  [TileSuit.Wind]: 'Winds',
  [TileSuit.Dragon]: 'Dragons',
  [TileSuit.Flower]: 'Flower',
  [TileSuit.Season]: 'Seasons',
}

/** Shared by browser UI and static guide generation; no Vite/browser globals. */
export function tileFaceAsset(suit: TileSuit, rank: number): string {
  // Source art order is Red / Green / White; saved ranks are White / Green / Red.
  const assetRank =
    suit === TileSuit.Dragon
      ? ((
          {
            [DragonType.White]: 3,
            [DragonType.Green]: 2,
            [DragonType.Red]: 1,
          } as Record<number, number>
        )[rank] ?? rank)
      : rank
  return `Mahjong/file/png/tiles/${PREFIX[suit]} (${assetRank}).png`
}
