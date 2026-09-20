import type { TFunction } from 'i18next'

/** Selection state takes precedence over an idle coach prompt. */
export function forecastHeading(
  t: TFunction,
  {
    activeTileCount,
    previewTileCount,
    stagedTileCount,
    isCompleteHand,
    matchedPatternLabel,
    coachPrompt,
  }: {
    activeTileCount: number
    previewTileCount: number
    stagedTileCount: number
    isCompleteHand: boolean
    matchedPatternLabel: string | null
    coachPrompt: string | null
  }
): string {
  if (isCompleteHand)
    return t(
      stagedTileCount > 0
        ? 'gameplay.forecast.stagedDeclaration'
        : 'gameplay.forecast.completeDeclaration',
      { count: previewTileCount }
    )
  if (activeTileCount > 0)
    return (
      matchedPatternLabel ??
      t('gameplay.forecast.selectionCount', { count: activeTileCount })
    )
  return coachPrompt ?? t('gameplay.chooseTacticalGroup')
}
