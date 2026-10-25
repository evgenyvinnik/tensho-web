import { describe, expect, it } from 'vitest'
import {
  RoundManager,
  BASE_SCORE_TARGETS,
  ENDLESS_BASE_SCORE_TARGET,
} from './RoundManager'
import {
  calculateCombinedModifiers,
  getActScoreScaling,
  STAKE_SCALING_FULL_ACT,
} from '../config/stakeDefinitions'
import { NORMAL_RUN_ACTS, isShowdownAct } from '../config/runProgression'
import {
  getMandatesForAct,
  SHOWDOWN_MANDATE_DEFINITIONS,
} from '../config/mandateDefinitions'

const SEED = 7

describe('Approachable six-Act campaign and optional Endless', () => {
  it('pins the early game and the gentler late-game targets on White and Red', () => {
    expect(Object.values(BASE_SCORE_TARGETS)).toEqual([
      300, 800, 2000, 5000, 10000, 18000, 30000, 45000,
    ])
    for (let act = 1; act <= 8; act++) {
      expect(targets(2, act)).toEqual(targets(1, act))
      expect(targets(1, act).slice(0, 2)).toEqual([
        BASE_SCORE_TARGETS[act],
        BASE_SCORE_TARGETS[act] * 1.5,
      ])
    }
    expect(new RoundManager(1).getStakeModifiers().noSmallRoundReward).toBe(
      false
    )
    expect(new RoundManager(2).getStakeModifiers().noSmallRoundReward).toBe(
      true
    )
  })

  it.each([NORMAL_RUN_ACTS, 8])(
    'applies the Act %i base to every showdown including Violet Vessel and rerolls',
    (act) => {
      const seen = new Set<string>()
      for (let seed = 1; seed <= 100; seed++) {
        const manager = new RoundManager(1, seed)
        manager.startAct(act)
        for (let reroll = 0; reroll < 3; reroll++) {
          const round = manager.getCurrentAct()!.rounds[2]
          const effect = round.bossMandate!.effect
          seen.add(round.bossMandate!.id)
          expect(round.scoreTarget).toBe(
            BASE_SCORE_TARGETS[act] *
              (effect.type === 'score_multiplier'
                ? (effect.value as number)
                : 2)
          )
          manager.rerollBossMandate()
        }
      }
      expect(seen.size).toBe(5)
    }
  )

  it('does not silently rebalance optional Endless', () => {
    expect(targets(1, 7).slice(0, 2)).toEqual([30000, 45000])
    expect(targets(1, 8).slice(0, 2)).toEqual([45000, 67500])
    expect(ENDLESS_BASE_SCORE_TARGET).toBe(90000)
    expect(targets(1, 9)[0]).toBe(Math.floor(90000 * Math.pow(2.35, 1.2)))
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 24])(
    'keeps the catalog and RoundManager Showdown schedule aligned at Act %i',
    (act) => {
      const showdown = [6, 8, 16, 24].includes(act)
      expect(isShowdownAct(act)).toBe(showdown)
      const mandates = getMandatesForAct(act)
      expect(mandates.every((m) => m.category === 'Showdown')).toBe(showdown)
      for (let seed = 1; seed <= 20; seed++) {
        const manager = new RoundManager(1, seed)
        const boss = manager.startAct(act).rounds[2].bossMandate!
        expect(mandates.map((m) => m.id)).toContain(boss.id)
        expect(boss.minAct).toBeLessThanOrEqual(act)
      }
      expect(
        SHOWDOWN_MANDATE_DEFINITIONS.every((m) => m.minAct === NORMAL_RUN_ACTS)
      ).toBe(true)
    }
  )

  it.each([5, 6, 7, 8])('wins only after clearing the Act %i boss', (act) => {
    const manager = new RoundManager(1, SEED)
    manager.startAct(act)
    expect(manager.isGameWon()).toBe(false)
    for (let round = 1; round <= 3; round++) {
      manager.submitScore(manager.getCurrentRound()!.scoreTarget)
      expect(manager.isGameWon()).toBe(act >= NORMAL_RUN_ACTS && round === 3)
    }
    expect(manager.isGameWon(8)).toBe(act >= 8)
  })
})

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
    // Higher Stakes inherit the gentler campaign, without a new tier-3 cliff.
    expect([1, 2, 3, 4, 5].map((act) => targets(6, act)[0])).toEqual([
      300, 999, 3121, 9750, 19500,
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
