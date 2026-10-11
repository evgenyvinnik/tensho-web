/**
 * Whether the score bar's forecast strip has something to say, shared by the
 * strip and by the screen that decides whether the last play's equation
 * steps aside for it. Kept out of the component file for fast refresh.
 */

import type { CoachAdvice } from './beginnerCoach'

export interface PlayAreaContent {
  selectedTileCount: number
  stagedTileCount: number
  scorePreview: unknown | null
  scorePreviewHidden?: boolean
  coachAdvice?: CoachAdvice | null
}

/**
 * True when the strip has something to say. Callers use it to decide whether
 * the score bar shows this strip or the settled last play in the same place.
 */
export function playAreaHasContent({
  selectedTileCount,
  stagedTileCount,
  scorePreview,
  scorePreviewHidden = false,
  coachAdvice = null,
}: PlayAreaContent): boolean {
  return Boolean(
    scorePreviewHidden ||
    scorePreview ||
    stagedTileCount ||
    selectedTileCount ||
    coachAdvice
  )
}
