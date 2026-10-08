import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { HandBuilder } from './HandBuilder'
import { Tile, TileSuit } from '../../core/Tile'
import type { HandBuildingAdvice } from '../../gameplay/handBuildingAdvice'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import en from '../../i18n/locales/en.json'

const advice: HandBuildingAdvice = {
  kind: 'redraw',
  keep: [new Tile(TileSuit.Pinzu, 1, 'keep')],
  exchange: [new Tile(TileSuit.Dragon, 3, 'spare')],
  improving: [new Tile(TileSuit.Pinzu, 2, 'example')],
  needed: 1,
  form: 'standard',
  redrawsRemaining: 2,
}
afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it('does not run actions on opening or closing; only passes selected IDs on explicit selection', () => {
  const onStage = vi.fn(),
    onClose = vi.fn()
  render(<HandBuilder advice={advice} onStage={onStage} onClose={onClose} />)
  expect(screen.getByText(/Costs 1 of your 2 redraws/)).toBeInTheDocument()
  expect(screen.getByText(/Selection is free/)).toBeInTheDocument()
  expect(screen.getByText(/not predicted draws/)).toBeInTheDocument()
  expect(onStage).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalledOnce()
  expect(onStage).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Select this exchange' }))
  expect(onStage).toHaveBeenCalledExactlyOnceWith(['spare'])
})

it.each(['hidden', 'unsupported', 'complete', 'clear', 'unavailable'] as const)(
  'shows safe %s explanation without candidates',
  (kind) => {
    render(
      <HandBuilder advice={{ kind }} onStage={vi.fn()} onClose={vi.fn()} />
    )
    expect(
      document.querySelector(`[data-plan-status="${kind}"]`)
    ).toHaveTextContent(en.handBuilder[kind])
    expect(document.querySelector('[data-plan-exchange]')).toBeNull()
    expect(document.querySelector('[data-plan-stage]')).toBeNull()
  }
)

it.each(SUPPORTED_LANGUAGES)(
  'has complete localized copy and interpolation for %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const [key, value] of Object.entries(en.handBuilder)) {
      const translated = i18n.getResource(
        language,
        'translation',
        `handBuilder.${key}`
      ) as string
      expect(translated).toBeTruthy()
      expect(translated.match(/{{\w+}}/g)?.sort()).toEqual(
        value.match(/{{\w+}}/g)?.sort()
      )
      if (language !== 'en') expect(translated).not.toBe(value)
    }
    render(<HandBuilder advice={advice} onStage={vi.fn()} onClose={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: i18n.t('handBuilder.title') })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: i18n.t('handBuilder.stage') })
    ).toBeInTheDocument()
    expect(document.querySelector('[data-plan-cost]')).toHaveTextContent(
      i18n.t('handBuilder.cost', { remaining: 2, tiles: 1 })
    )
  }
)
