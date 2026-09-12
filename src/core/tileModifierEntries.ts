import { Tile, EnhancementType, SealType, EditionType } from './Tile'

/** Canonical modifier identity and rules, shared by rewards and item details. */
export function tileModifierEntries(tile: Tile) {
  const entries: {
    kind: 'tileMarks' | 'archiveSeals' | 'editions'
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
  if (tile.seal !== SealType.None)
    entries.push({ kind: 'archiveSeals', id: tile.seal, ...tile.sealDef })
  if (tile.edition !== EditionType.Base)
    entries.push({ kind: 'editions', id: tile.edition, ...tile.editionDef })
  return entries
}
