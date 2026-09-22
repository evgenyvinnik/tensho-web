import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PendingOmens } from './PendingOmens'
import { useOmenStore } from '../../stores/omenStore'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { OmenTagSystem } from '../../systems/OmenTagSystem'
import { ALL_OMENS } from '../../config/omenDefinitions'

afterEach(async () => {
  cleanup()
  useOmenStore.getState().clearForNewRun()
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'shows the localized pending copy in %s without auto-opening',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const system = new OmenTagSystem()
    useOmenStore.getState().copyNextTag()
    render(<PendingOmens system={system} />)
    const details = screen.getByTestId('pending-omens')
    expect(details).not.toHaveAttribute('open')
    expect(details.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/assets/illustrations/omens/double-omen.png')
    )
    fireEvent.click(details.querySelector('summary')!)
    expect(
      screen.getByText(i18n.t('omens.items.double_omen.name'))
    ).toBeVisible()
    expect(
      screen.getByText(i18n.t('omens.items.double_omen.description'))
    ).toBeVisible()
    act(() => useOmenStore.getState().addTag('omen_of_rivers'))
    expect(
      details.querySelectorAll('[data-omen-id="omen_of_rivers"]')
    ).toHaveLength(2)
    expect(details.querySelector('img')).toBeNull()
    act(() => useOmenStore.getState().consumeBossTags())
    expect(screen.queryByTestId('pending-omens')).toBeNull()
  }
)

it.each(SUPPORTED_LANGUAGES)(
  'shows costs and live restrictions in %s, not expired tag history',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const system = new OmenTagSystem()
    const award = (id: string) =>
      system.handleRoundSkip(
        'Large',
        ALL_OMENS.filter((o) => o.id !== id).map((o) => o.id)
      )
    award('double_omen')
    award('decree_omen')
    award('expansion_omen')
    award('austerity_omen')
    award('interest_omen')
    render(<PendingOmens system={system} />)
    const details = screen.getByTestId('pending-omens')
    fireEvent.click(details.querySelector('summary')!)
    const number = (value: number) =>
      new Intl.NumberFormat(language).format(value)
    expect(
      screen.getAllByText(
        i18n.t('omens.effects.shopFee', { amount: number(5) })
      )
    ).toHaveLength(2)
    expect(
      screen.getByText(
        i18n.t('omens.effects.seasonLock', { season: i18n.t('flora.summer') })
      )
    ).toBeVisible()
    expect(
      screen.getByText(
        i18n.t('omens.effects.noInterest', { rounds: number(1) })
      )
    ).toBeVisible()
    expect(
      screen.getByText(
        i18n.t('omens.effects.interestBoost', {
          amount: number(2),
          rounds: number(3),
        })
      )
    ).toBeVisible()
    expect(details.textContent).not.toMatch(/omens\.effects|\{\{/)
    act(() => system.applyLockedSeason())
    expect(details.querySelector('[data-omen-effect="season-lock"]')).toBeNull()
    act(() => system.onRoundEnd())
    expect(details.querySelector('[data-omen-effect="no-interest"]')).toBeNull()
    expect(
      screen.getByText(
        i18n.t('omens.effects.interestBoost', {
          amount: number(2),
          rounds: number(2),
        })
      )
    ).toBeVisible()
    act(() => system.triggerShopOmens(() => false))
    expect(details.querySelectorAll('[data-omen-cost]')).toHaveLength(2)
    act(() => system.triggerShopOmens())
    expect(details.querySelectorAll('[data-omen-cost]')).toHaveLength(0)
    // The consumed Interest tag is gone, but the effect remains visible.
    expect(screen.getByTestId('pending-omens')).toBeVisible()
    act(() => {
      system.onRoundEnd()
      system.onRoundEnd()
    })
    expect(screen.queryByTestId('pending-omens')).toBeNull()
  }
)
