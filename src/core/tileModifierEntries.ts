import { Tile, EnhancementType } from './Tile'

/** Canonical Edition identity and rules, shared by rewards and item details. */
export function tileModifierEntries(tile: Tile) {
  const entries: {
    kind: 'tileMarks'
    id: string
    name: string
    description: string
  }[] = []
  if (tile.enhancement !== EnhancementType.None)
    entries.push({
      kind: 'tileMarks',
      id: tile.enhancement,
      ...tile.enhancementDef,
    })
  return entries
}
