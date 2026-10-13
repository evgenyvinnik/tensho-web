import { describe, expect, it } from 'vitest'
import { RoundManager } from './RoundManager'
import {
  calculateCombinedModifiers,
  getActScoreScaling,
  STAKE_SCALING_FULL_ACT,
} from '../config/stakeDefinitions'

const SEED = 7

function targets(stake: number, act: number, table = 1): number[] {
  return new RoundManager(stake, SEED, table)
    .startAct(act)
    .rounds.map((round) => round.scoreTarget)
}

/** White targets scaled the way RoundManager scales them for a Stake. */
function scaled(act: number, multiplier: number): number[] {
  return targets(1, act).map((target) => Math.floor(target * multiplier))
}

describe('Stake score ramp', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'Stake %s uses White targets in Act 1',
    (stake) => {
      expect(targets(stake, 1)).toEqual([300, 450, 600])
    }
  )

  it('grows by an equal ratio each Act until the full cumulative multiplier', () => {
    const steps = STAKE_SCALING_FULL_ACT - 1
    for (let act = 1; act <= STAKE_SCALING_FULL_ACT; act++)
      expect(getActScoreScaling(1.95, act)).toBeCloseTo(
        1.95 ** ((act - 1) / steps)
      )
    expect(getActScoreScaling(1.95, STAKE_SCALING_FULL_ACT)).toBe(1.95)
    expect(getActScoreScaling(1, 3)).toBe(1)
  })

  it('pins the Purple Small targets players see', () => {
    expect([1, 2, 3, 4, 5].map((act) => targets(6, act)[0])).toEqual([
      300, 999, 3121, 9750, 21450,
    ])
  })

  it.each([2, 3, 4, 5, 6, 7, 8])(
    'Stake %s rises monotonically and holds the full multiplier through Endless',
    (stake) => {
      const { scoreScaling } = calculateCombinedModifiers(stake)
      let previous = 1
      for (let act = 1; act <= 10; act++) {
        const multiplier = getActScoreScaling(scoreScaling, act)
        expect(multiplier).toBeGreaterThanOrEqual(previous)
        previous = multiplier
        if (act >= STAKE_SCALING_FULL_ACT) expect(multiplier).toBe(scoreScaling)
        expect(targets(stake, act)).toEqual(scaled(act, multiplier))
      }
    }
  )

  it('recalculates a rerolled Boss target with the same Act scaling', () => {
    for (const act of [1, 2, 3, 5, 9]) {
      const white = new RoundManager(1, SEED)
      const gold = new RoundManager(8, SEED)
      white.startAct(act)
      gold.startAct(act)
      const multiplier = getActScoreScaling(
        gold.getStakeModifiers().scoreScaling,
        act
      )
      for (let reroll = 0; reroll < 4; reroll++) {
        const whiteMandate = white.rerollBossMandate()
        const goldMandate = gold.rerollBossMandate()
        expect(goldMandate?.id).toBe(whiteMandate?.id)
        expect(gold.getCurrentAct()!.rounds[2].scoreTarget).toBe(
          Math.floor(white.getCurrentAct()!.rounds[2].scoreTarget * multiplier)
        )
      }
    }
  })

  it('keeps the table target multiplier flat from Act 1', () => {
    expect(targets(8, 1, 1.25)).toEqual([375, 562, 750])
    const full = calculateCombinedModifiers(8).scoreScaling * 1.25
    expect(targets(8, STAKE_SCALING_FULL_ACT, 1.25)).toEqual(
      scaled(STAKE_SCALING_FULL_ACT, full)
    )
  })
})
