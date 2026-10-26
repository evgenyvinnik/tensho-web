import { eventBus } from '../game/EventBus'
import { gameOrchestrator } from '../game/GameOrchestrator'

/**
 * The iOS app shows a full-screen ad after every second Boss: Acts 2, 4, 6
 * and on into Endless, whether the Boss was beaten or ended the run. It waits
 * for the next screen (the Tea House or the results), so it never covers the
 * scoring reveal of the hand that decided the fight.
 */
export const BOSSES_PER_AD = 2

export const adFollowsBoss = (act: number): boolean =>
  act > 0 && act % BOSSES_PER_AD === 0

export interface InterstitialAds {
  /** Load an ad ahead of time; a no-op while one is ready. */
  prepare(): Promise<void>
  /** Show the ready ad, if there is one. */
  show(): Promise<void>
}

let atBreak: (() => void) | null = null

/** The player reached a screen between fights. */
export function adBreak(): void {
  atBreak?.()
}

/** Returns a stop function. */
export function scheduleBossAds(
  ads: InterstitialAds,
  state = () => gameOrchestrator.getState()
): () => void {
  let due = false
  const owed = () => {
    due = true
    void ads.prepare()
  }
  const unsubscribe = [
    // Load during the fight, so the ad is ready when it ends.
    eventBus.on('roundStart', ({ actNumber, roundType }) => {
      if (roundType === 'Boss' && adFollowsBoss(actNumber)) void ads.prepare()
    }),
    eventBus.on('actComplete', ({ actNumber }) => {
      if (adFollowsBoss(actNumber)) owed()
    }),
    eventBus.on('roundEnd', ({ won }) => {
      const run = state()
      if (
        !won &&
        run.roundManager.getCurrentRound()?.roundType === 'Boss' &&
        adFollowsBoss(run.currentAct)
      )
        owed()
    }),
  ]
  atBreak = () => {
    if (!due) return
    due = false
    void ads.show()
  }
  return () => {
    unsubscribe.forEach((stop) => stop())
    atBreak = null
  }
}
