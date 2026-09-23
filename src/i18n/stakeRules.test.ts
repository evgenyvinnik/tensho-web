import { expect, it } from 'vitest'
import i18n, { changeLanguage } from './index'
import { getStakeRules } from './stakeRules'
import { RoundManager } from '../systems/RoundManager'

it.each([1, 2, 3, 4, 5, 6, 7, 8])(
  'describes the actual cumulative tier %s modifiers',
  (tier) => {
    const t = i18n.getFixedT('en')
    const rules = getStakeRules(t, 'en', tier)
    const round = new RoundManager(tier, 7)
    const modifiers = round.getStakeModifiers()
    const text = rules.join(' ')
    if (modifiers.scoreScaling === 1) expect(text).not.toContain('×')
    else
      expect(text).toContain(
        `×${new Intl.NumberFormat('en').format(modifiers.scoreScaling)}`
      )
    expect(text.includes('Small Rounds')).toBe(modifiers.noSmallRoundReward)
    expect(text.includes('Redraws')).toBe(modifiers.redrawPenalty > 0)
    expect(text.includes('Eternal')).toBe(modifiers.eternalChance > 0)
    expect(text.includes('Perishable')).toBe(modifiers.perishableChance > 0)
    expect(text.includes('Non-Eternal shop Decrees')).toBe(modifiers.perishableChance > 0)
    expect(text.includes('Rental')).toBe(modifiers.rentalChance > 0)
    const base = new RoundManager(1, 7).startAct(3)
    expect(round.startAct(3).rounds.map((r) => r.scoreTarget)).toEqual(
      base.rounds.map((r) => Math.floor(r.scoreTarget * modifiers.scoreScaling))
    )
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
