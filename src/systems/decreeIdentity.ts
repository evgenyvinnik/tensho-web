import type { OwnedDecree } from './types'

/** Catalog IDs remain for text/art; inventory actions address physical copies. */
export function decreeKey(decree: OwnedDecree): string {
  return decree.instanceId ?? decree.id
}

/** Legacy saves recorded catalog-wide suppression; retain it until it expires. */
export function isDecreeExcluded(
  decree: OwnedDecree,
  excluded?: ReadonlySet<string>
): boolean {
  return Boolean(excluded?.has(decreeKey(decree)) || excluded?.has(decree.id))
}
