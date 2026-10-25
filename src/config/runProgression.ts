/** Six Acts of three rounds; subsequent Acts require opting into Endless. */
export const NORMAL_RUN_ACTS = 6

/** Keep the established Act 8, 16, 24, … Showdowns in optional Endless. */
export const ENDLESS_SHOWDOWN_INTERVAL = 8

export function isShowdownAct(actNumber: number): boolean {
  return (
    actNumber === NORMAL_RUN_ACTS ||
    (actNumber > NORMAL_RUN_ACTS && actNumber % ENDLESS_SHOWDOWN_INTERVAL === 0)
  )
}
