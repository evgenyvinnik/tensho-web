import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n, { loadLanguage } from '../../i18n'
import { getStakeRules } from '../../i18n/stakeRules'
import { CharterSystem } from '../../systems/CharterSystem'
import { GameplayTopBar } from './GameplayTopBar'

afterEach(async () => {
  cleanup()
  await act(async () => {
    await i18n.changeLanguage('en')
  })
})

const languages = [
  'en',
  'es',
  'fr',
  'it',
  'ru',
  'ja',
  'ko',
  'zh-Hans',
  'zh-Hant',
  'tr',
  'id',
  'th',
  'tl',
] as const

it.each(languages)(
  'localizes header controls, costs and cumulative Stake rules in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const key of [
      'common.exit',
      'gameplay.actProgress',
      'gameplay.rerollMandate',
    ]) {
      expect(i18n.getResource(language, 'translation', key), key).toEqual(
        expect.any(String)
      )
      expect(
        i18n.getResource(language, 'translation', key).length,
        key
      ).toBeGreaterThan(0)
    }
    const number = new Intl.NumberFormat(language, {
      maximumFractionDigits: 20,
    })
    const onExit = vi.fn()
    const onSettings = vi.fn()
    const onRerollMandate = vi.fn()
    const { container } = render(
      <GameplayTopBar
        gold={1234.5625}
        stake={8}
        currentAct={3}
        hasEnteredEndless={false}
        roundType="Large"
        upcomingMandateName="★"
        canRerollMandate
        onRerollMandate={onRerollMandate}
        onExit={onExit}
        onSettings={onSettings}
        t={i18n.t}
      />
    )
    expect(container.querySelector('[data-tutorial="gold"]')).toHaveAttribute(
      'aria-label',
      i18n.t('shop.ui.goldBalance', { amount: number.format(1234.5625) })
    )
    const progress = i18n.t('gameplay.actProgress', {
      current: number.format(3),
      total: number.format(8),
    })
    expect(screen.getByRole('img', { name: progress })).toHaveAttribute(
      'title',
      progress
    )
    const rules = getStakeRules(i18n.t, language, 8).join('\n')
    for (const selector of [
      '[data-gameplay-top-bar-stake]',
      '[data-gameplay-top-bar-compact-progress]',
    ]) {
      expect(container.querySelector(selector)).toHaveAttribute('title', rules)
    }
    const reroll = screen.getByRole('button', {
      name: i18n.t('gameplay.rerollMandate', {
        name: '★',
        cost: number.format(new CharterSystem().getMandateRerollCost()),
      }),
    })
    expect(reroll).toHaveAttribute('title', reroll.getAttribute('aria-label'))
    fireEvent.click(reroll)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.exit') }))
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('menu.settings') })
    )
    expect(onRerollMandate).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onSettings).toHaveBeenCalledTimes(1)
    expect(container.textContent).not.toMatch(/\{\{|gameplay\.|common\./)
  }
)

it('keeps unavailable rerolls disabled and hides finite Act progress in Endless', () => {
  const onRerollMandate = vi.fn()
  render(
    <GameplayTopBar
      gold={0}
      stake={1}
      currentAct={9}
      hasEnteredEndless
      roundType="Small"
      upcomingMandateName="★"
      canRerollMandate={false}
      onRerollMandate={onRerollMandate}
      onExit={vi.fn()}
      onSettings={vi.fn()}
      t={i18n.t}
    />
  )
  const reroll = screen.getByRole('button', { name: /Reroll/ })
  expect(reroll).toBeDisabled()
  fireEvent.click(reroll)
  expect(onRerollMandate).not.toHaveBeenCalled()
  expect(
    screen.queryByRole('img', { name: /Act .* of 8/ })
  ).not.toBeInTheDocument()
  expect(screen.getByText('Endless')).toBeInTheDocument()
})
