import {
  MAX_TACTICAL_PLAY_TILES,
  MIN_TACTICAL_PLAY_TILES,
} from '../game/playRules'

/** A deliberately unscored fallback for a concealed rack. Only physical IDs,
 * visible ordering, and legal-action checks are available: no ranks or suits.
 * Keep this separate from coach advice, which must not imply knowledge of a
 * face-down tile. It is a simulator policy, not an automatic player action.
 */
export function chooseBlindSelection(
  tileIds: readonly string[],
  requiredIds: readonly string[],
  isAllowed: (selection: string[]) => boolean
): string[] | null {
  const required = [...new Set(requiredIds)]
  if (required.some((id) => !tileIds.includes(id))) return null
  const ordered = [
    ...required,
    ...new Set(tileIds.filter((id) => !required.includes(id))),
  ]
  for (
    let count = Math.min(MAX_TACTICAL_PLAY_TILES, ordered.length);
    count >= Math.max(MIN_TACTICAL_PLAY_TILES, required.length);
    count--
  ) {
    const selection = ordered.slice(0, count)
    if (isAllowed(selection)) return selection
  }
  return null
}
