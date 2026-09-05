/**
 * How loud a resolution deserves to be.
 *
 * Section 7 of `docs/GAMEPLAY_EXPERIMENTS.md` asks for intensity that escalates
 * with the actual chain rather than with every score update, and for the
 * strongest response to be reserved for a newly discovered interaction or a
 * completed table.
 *
 * Kept apart from the component so a future sound layer can key off the same
 * levels without importing React.
 *
 * @module tableloop/flourish
 */

import type { CausalStage } from './types'

export type FlourishLevel = 'none' | 'milestone' | 'completion'

export function flourishLevel(stages: readonly CausalStage[]): FlourishLevel {
  if (stages.some((stage) => stage.kind === 'completion')) return 'completion'
  if (stages.some((stage) => stage.kind === 'milestone')) return 'milestone'
  return 'none'
}
