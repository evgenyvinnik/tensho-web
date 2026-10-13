import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { settleScoreEquation } from '../../rules/ScoreEquation'
import { ExactScoreDetails } from './ExactScoreDetails'
import { PlayArea } from './PlayArea'
import { ScorePanel } from './ScorePanel'

afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})

// The play check that found the mismatch: Summer ×1.3 with Winter ×0.75 is a
// true multiplier of 0.9750000000000001 in floating point, paying floor(48.75).
const summerWinter = settleScoreEquation(50, 1.3 * 0.75, 48)

function renderBoth(equation = summerWinter) {
  useSettingsStore.setState({ reducedMotion: true })
  const forecast = render(
    <PlayArea
      selectedTileCount={3}
      stagedTileCount={3}
      handTileCount={14}
      scorePreview={{
        points: equation.points,
        mult: equation.multiplier,
        adjustment: equation.adjustment,
        total: equation.total,
      }}
      remainingToTarget={1000}
    />
  )
  const settled = render(
    <ScorePanel
      targetScore={1000}
      currentScore={equation.total}
      lastPlay={equation}
      isScoreAnimating={false}
      scorePopups={[]}
      onPopupComplete={() => {}}
      t={i18n.t}
    />
  )
  return { forecast: forecast.container, settled: settled.container }
}

it('shows the forecast and the settled play as the same equation that adds up', () => {
  expect(summerWinter.adjustment).toBe(0)
  const { forecast, settled } = renderBoth()

  // Settled: 50 × 0.975 → 48, with the rounding named rather than hidden.
  expect(settled.querySelector('[data-score-points]')).toHaveTextContent(/^50$/)
  expect(settled.querySelector('[data-score-mult]')).toHaveTextContent(
    /^0\.975$/
  )
  expect(settled.querySelector('[data-score-operator]')).toHaveTextContent('→')
  expect(settled.querySelector('[data-score-result]')).toHaveTextContent(/^48$/)
  expect(settled.querySelector('[data-score-rounding]')).toHaveTextContent(
    '48.75 rounded down to 48'
  )
  expect(settled.querySelector('[data-score-adjustment]')).toBeNull()

  // Forecast: the same multiplier and rounding, not total ÷ points (0.96).
  expect(
    forecast.querySelector('[data-score-preview-points]')
  ).toHaveTextContent(/^50$/)
  expect(forecast.querySelector('[data-score-preview-mult]')).toHaveTextContent(
    /^0\.975$/
  )
  expect(
    forecast.querySelector('[data-score-preview-operator]')
  ).toHaveTextContent('→')
  expect(
    forecast.querySelector('[data-testid="score-preview-total"]')
  ).toHaveTextContent(/^\+48$/)
  expect(
    forecast.querySelector('[data-score-preview-rounding]')
  ).toHaveTextContent('48.75 rounded down to 48')
  expect(forecast.textContent).not.toContain('0.96')
  expect(settled.textContent).not.toContain('0.98')
})

it('prints exact values to three trimmed decimals, never raw floats', () => {
  const values = (root: Element) =>
    Array.from(root.querySelectorAll('details dd'), (el) => el.textContent)
  const { settled } = renderBoth()
  expect(values(settled)).toEqual([
    '1,000',
    '48',
    '50',
    '0.975',
    '48.75',
    '0',
    '48',
  ])
  cleanup()
  // The forecast offers exact values once its numbers are abbreviated.
  const large = settleScoreEquation(50_000_001, 1.3 * 0.75, 48_750_000)
  const { forecast } = renderBoth(large)
  expect(values(forecast)).toEqual([
    '50,000,001',
    '0.975',
    '48,750,000.975',
    '48,750,000',
  ])
  for (const root of [forecast, settled]) {
    expect(root.textContent).not.toContain('0.9750000000000001')
    for (const value of values(root)) expect(value).not.toMatch(/\.\d{4,}/)
  }
})

it('keeps a whole product on an equals sign and shows after-score effects in both', () => {
  const omen = settleScoreEquation(45, 1, 217)
  const { forecast, settled } = renderBoth(omen)
  expect(settled.querySelector('[data-score-operator]')).toHaveTextContent('=')
  expect(settled.querySelector('[data-score-rounding]')).toBeNull()
  expect(settled.querySelector('[data-score-adjustment]')).toHaveTextContent(
    '+172'
  )
  expect(
    forecast.querySelector('[data-score-preview-operator]')
  ).toHaveTextContent('=')
  expect(forecast.querySelector('[data-score-preview-rounding]')).toBeNull()
  expect(
    forecast.querySelector('[data-score-preview-adjustment]')
  ).toHaveTextContent(/^\+172$/)
  expect(
    forecast.querySelector('[data-testid="score-preview-total"]')
  ).toHaveTextContent(/^\+217$/)
})

it('localizes the rounding note with locale decimals', async () => {
  await loadLanguage('fr')
  await act(async () => {
    await i18n.changeLanguage('fr')
  })
  const { settled } = renderBoth()
  expect(settled.querySelector('[data-score-mult]')).toHaveTextContent(
    /^0,975$/
  )
  expect(settled.querySelector('[data-score-rounding]')).toHaveTextContent(
    i18n.t('scoring.roundedDown', { product: '48,75', rounded: '48' })
  )
})

it.each([true, false])(
  'closes the exact values on Escape and returns focus to its toggle (compact=%s)',
  (compact) => {
    const { container } = render(
      <ExactScoreDetails
        always
        compact={compact}
        entries={[{ label: 'Total Multiplier', value: 0.975 }]}
      />
    )
    const details = container.querySelector('details')!
    const summary = details.querySelector('summary')!
    summary.focus()
    fireEvent.click(summary)
    expect(details.open).toBe(true)
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    })
    expect(details.open).toBe(false)
    expect(summary).toHaveFocus()
  }
)

it('closes the compact exact values when the player presses elsewhere, not inside', () => {
  const { container, getByRole } = render(
    <>
      <ExactScoreDetails
        always
        compact
        entries={[{ label: 'Total Multiplier', value: 0.975 }]}
      />
      <button type="button">Flowers</button>
    </>
  )
  const details = container.querySelector('details')!
  fireEvent.click(details.querySelector('summary')!)
  expect(details.open).toBe(true)
  fireEvent.pointerDown(details.querySelector('dd')!)
  expect(details.open).toBe(true)
  fireEvent.pointerDown(getByRole('button', { name: 'Flowers' }))
  expect(details.open).toBe(false)
  // Closed details leave no listeners behind: Escape is not swallowed.
  const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
  let reached = false
  const listener = () => (reached = true)
  window.addEventListener('keydown', listener)
  document.body.dispatchEvent(escape)
  window.removeEventListener('keydown', listener)
  expect(reached).toBe(true)
})
