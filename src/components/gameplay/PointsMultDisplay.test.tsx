import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PointsMultDisplay } from './PointsMultDisplay'
import { useSettingsStore } from '../../stores/settingsStore'
import { ScorePopup } from '../effects/ScorePopup'
import { ScorePanel } from './ScorePanel'
import i18n from '../../i18n'

afterEach(() => {
  cleanup()
  act(() => useSettingsStore.setState({ reducedMotion: false }))
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('shows a zero-paid play separately from cumulative score and exposes exact adjustments', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const { container, getByText } = render(
    <ScorePanel
      targetScore={1000}
      currentScore={585}
      lastPlay={{ points: 45, multiplier: 1, adjustment: -45, total: 0 }}
      isScoreAnimating={false}
      scorePopups={[]}
      onPopupComplete={() => {}}
      t={i18n.t}
    />
  )
  expect(
    container.querySelector('[data-tutorial="current-score"]')
  ).toHaveTextContent('585')
  expect(container.querySelector('[data-score-result]')).toHaveTextContent(
    /^0$/
  )
  expect(container.querySelector('[data-score-adjustment]')).toHaveTextContent(
    '−45'
  )
  expect(getByText(i18n.t('scoring.exactValues'))).toBeInTheDocument()
  expect(
    Array.from(container.querySelectorAll('details dd'), (el) => el.textContent)
  ).toEqual(['1,000', '585', '45', '1', '-45', '0'])
})

it('uses the explicit paid total for post-multiplication bonuses', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const { container } = render(
    <PointsMultDisplay points={45} mult={1} adjustment={172} total={217} />
  )
  expect(container.querySelector('[data-score-result]')).toHaveTextContent(
    /^217$/
  )
  expect(container.querySelector('[data-score-adjustment]')).toHaveTextContent(
    '+172'
  )
})

it.each([true, false])(
  'preserves a settled fractional subtotal (reduced motion=%s)',
  async (reducedMotion) => {
    useSettingsStore.setState({ reducedMotion })
    const { container } = render(
      <PointsMultDisplay points={61.5} mult={2.1} total={129} />
    )
    await waitFor(
      () => {
        expect(
          container.querySelector('[data-score-points]')
        ).toHaveTextContent(/^61\.5$/)
        expect(
          container.querySelector('[data-score-result]')
        ).toHaveTextContent(/^129$/)
      },
      { timeout: 3000 }
    )
  }
)

it('retains decimal formatting after repeated normal animated payments settle', async () => {
  const { container, rerender } = render(
    <PointsMultDisplay points={225} mult={2.6} total={585} />
  )
  await waitFor(
    () =>
      expect(container.querySelector('[data-score-result]')).toHaveTextContent(
        /^585$/
      ),
    { timeout: 3000 }
  )
  rerender(<PointsMultDisplay points={45} mult={1} total={45} />)
  await waitFor(
    () => {
      expect(container.querySelector('[data-score-result]')).toHaveTextContent(
        /^45$/
      )
      expect(container.querySelector('[data-score-mult]')).toHaveTextContent(
        /^1\.00$/
      )
    },
    { timeout: 3000 }
  )
  rerender(
    <PointsMultDisplay points={45} mult={1} adjustment={172} total={217} />
  )
  await waitFor(
    () =>
      expect(container.querySelector('[data-score-result]')).toHaveTextContent(
        /^217$/
      ),
    { timeout: 3000 }
  )
  expect(container.querySelector('[data-score-mult]')).toHaveTextContent(
    /^1\.00$/
  )
})

it('keeps the score popup static for system reduced motion and completes once', async () => {
  vi.useFakeTimers()
  const original = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...original(query),
    matches: query === '(prefers-reduced-motion: reduce)',
  }))
  const done = vi.fn()
  const { container } = render(
    <ScorePopup
      points={45_000_000_000}
      displayDuration={1000}
      onComplete={done}
    />
  )
  const popup = container.querySelector('[data-score-popup]')!
  expect(popup).toHaveTextContent('+45B')
  expect(popup).toHaveAttribute('aria-label', '+45,000,000,000')
  expect(popup).toHaveStyle({ transform: 'translate(-50%, 0px) scale(1)' })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(900)
  })
  expect(done).not.toHaveBeenCalled()
  expect(popup).toHaveStyle({ transform: 'translate(-50%, 0px) scale(1)' })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300)
  })
  expect(done).toHaveBeenCalledOnce()
  expect(container.querySelector('[data-score-popup]')).toBeNull()
})

it.each(['app', 'system'])(
  'shows exact counters immediately with %s reduced motion',
  (preference) => {
    if (preference === 'app') {
      useSettingsStore.setState({ reducedMotion: true })
    } else {
      const original = window.matchMedia
      vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        ...original(query),
        matches: query === '(prefers-reduced-motion: reduce)',
      }))
    }
    const { container, rerender } = render(
      <PointsMultDisplay points={14_000_000_000} mult={1.25} isAnimating />
    )
    expect(container.querySelector('[data-score-points]')).toHaveTextContent(
      '14B'
    )
    expect(container.querySelector('[data-score-mult]')).toHaveTextContent(
      '1.25'
    )
    expect(container.querySelector('[data-score-result]')).toHaveTextContent(
      '17.5B'
    )
    rerender(
      <PointsMultDisplay points={27_000_000_000} mult={3.5} isAnimating />
    )
    expect(container.querySelector('[data-score-points]')).toHaveTextContent(
      '27B'
    )
    expect(container.querySelector('[data-score-mult]')).toHaveTextContent(
      '3.50'
    )
    expect(container.querySelector('[data-score-result]')).toHaveTextContent(
      '94.5B'
    )
  }
)
