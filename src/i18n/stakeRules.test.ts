import { expect, it } from 'vitest'
import i18n, { changeLanguage } from './index'
import { getStakeRules } from './stakeRules'
import { RoundManager } from '../systems/RoundManager'
import {
  getActScoreScaling,
  STAKE_SCALING_FULL_ACT,
} from '../config/stakeDefinitions'

it.each([1, 2, 3, 4, 5, 6, 7, 8])(
  'describes the actual cumulative tier %s modifiers',
  (tier) => {
    const t = i18n.getFixedT('en')
    const rules = getStakeRules(t, 'en', tier)
    const round = new RoundManager(tier, 7)
    const modifiers = round.getStakeModifiers()
    const text = rules.join(' ')
    if (modifiers.scoreScaling === 1) expect(text).not.toContain('×')
    else {
      expect(text).toContain(
        `×${new Intl.NumberFormat('en').format(modifiers.scoreScaling)}`
      )
      expect(text).toContain('same as White in Act 1')
      expect(text).toContain(`from Act ${STAKE_SCALING_FULL_ACT} on`)
    }
    expect(text.includes('Small Rounds')).toBe(modifiers.noSmallRoundReward)
    expect(text.includes('Emergency Turns from Act 2')).toBe(tier >= 2)
    if (tier >= 2) expect(text).toContain('10G in Act 2, 15G in Act 3')
    expect(text.includes('Turns each round')).toBe(modifiers.redrawPenalty > 0)
    expect(text.includes('Eternal')).toBe(modifiers.eternalChance > 0)
    expect(text.includes('Perishable')).toBe(modifiers.perishableChance > 0)
    expect(text.includes('Non-Eternal shop Decrees')).toBe(modifiers.perishableChance > 0)
    expect(text.includes('Rental')).toBe(modifiers.rentalChance > 0)
    for (const act of [1, 3, STAKE_SCALING_FULL_ACT, 9]) {
      const base = new RoundManager(1, 7).startAct(act)
      const scaling = getActScoreScaling(modifiers.scoreScaling, act)
      expect(
        new RoundManager(tier, 7).startAct(act).rounds.map((r) => r.scoreTarget)
      ).toEqual(base.rounds.map((r) => Math.floor(r.scoreTarget * scaling)))
    }
    expect(getActScoreScaling(modifiers.scoreScaling, 1)).toBe(1)
    expect(
      getActScoreScaling(modifiers.scoreScaling, STAKE_SCALING_FULL_ACT)
    ).toBe(modifiers.scoreScaling)
  }
)

it('formats combined targets and percentages in the selected language', async () => {
  await changeLanguage('es')
  const rules = getStakeRules(i18n.getFixedT('es'), 'es', 8).join(' ')
  expect(rules).toContain('×1,95')
  expect(rules).toContain(
    new Intl.NumberFormat('es', { style: 'percent' }).format(0.3)
  )
  expect(rules).not.toContain('Shop Decrees')
  await changeLanguage('en')
})
