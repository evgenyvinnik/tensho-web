import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { scoreNumber } from '../../utils/scoreNumber'
import { PointsMultDisplay } from './PointsMultDisplay'
import { ScorePanel } from './ScorePanel'
import { PlayArea } from './PlayArea'

afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'formats the remaining score and progress accessibly in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    useSettingsStore.setState({ reducedMotion: true })
    const remaining = 45_000_000_000
    const { container, getByRole } = render(
      <ScorePanel
        targetScore={remaining + 585}
        currentScore={585}
        lastPlay={{ points: 225, multiplier: 2.6, adjustment: 0, total: 585 }}
        isScoreAnimating={false}
        scorePopups={[]}
        onPopupComplete={() => {}}
        t={i18n.t}
      />
    )
    const hint = container.querySelector('.game-score-remaining')!
    expect(hint).toHaveTextContent(scoreNumber(remaining, language).display)
    expect(hint).toHaveAttribute(
      'title',
      i18n.t('gameplay.pointsToClear', {
        count: remaining,
        formattedCount: scoreNumber(remaining, language).exact,
      })
    )
    const progress = getByRole('progressbar', {
      name: i18n.t('gameplay.score'),
    })
    expect(progress).toHaveAttribute('aria-valuenow', '585')
    expect(progress).toHaveAttribute('aria-valuemax', String(remaining + 585))
    expect(progress.getAttribute('aria-valuetext')).toContain(
      scoreNumber(remaining + 585, language).exact
    )
    expect(progress.getAttribute('aria-valuetext')).not.toContain(' of ')
  }
)

it.each([true, false])(
  'localizes forecast and settled multipliers without losing zeros (reduced motion=%s)',
  async (reducedMotion) => {
    await loadLanguage('es')
    await i18n.changeLanguage('es')
    useSettingsStore.setState({ reducedMotion })
    const { container } = render(
      <>
        <PlayArea
          selectedTileCount={3}
          stagedTileCount={3}
          handTileCount={14}
          scorePreview={{ points: 225, mult: 2.6, total: 585 }}
          remainingToTarget={1000}
          yakuReveals={[]}
          onYakuComplete={() => {}}
        />
        <PointsMultDisplay points={225} mult={2.6} total={585} />
      </>
    )
    await waitFor(
      () =>
        expect(container.querySelector('[data-score-mult]')).toHaveTextContent(
          /^2,60$/
        ),
      { timeout: 3000 }
    )
    expect(
      container.querySelectorAll('.game-play-area strong')[1]
    ).toHaveTextContent(/^2,60$/)
    expect(container.querySelector('[data-score-mult]')).toHaveAttribute(
      'title',
      '2,6'
    )
    await act(async () => {
      await i18n.changeLanguage('en')
    })
    expect(container.querySelector('[data-score-mult]')).toHaveTextContent(
      /^2\.60$/
    )
    expect(
      container.querySelectorAll('.game-play-area strong')[1]
    ).toHaveTextContent(/^2\.60$/)
    expect(container.querySelector('[data-score-result]')).toHaveTextContent(
      /^585$/
    )
  }
)

it('keeps large multipliers compact while exposing their exact value', async () => {
  await loadLanguage('es')
  await i18n.changeLanguage('es')
  useSettingsStore.setState({ reducedMotion: true })
  const { container } = render(
    <PointsMultDisplay points={45} mult={1_234_567.125} total={55_555_520} />
  )
  const mult = container.querySelector('[data-score-mult]')!
  expect(mult).toHaveTextContent(scoreNumber(1_234_567.125, 'es').display)
  expect(mult).toHaveAttribute(
    'aria-label',
    scoreNumber(1_234_567.125, 'es').exact
  )
})

it('announces a cleared target without putting an over-target score outside the progress range', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const { container, getByRole } = render(
    <ScorePanel
      targetScore={100}
      currentScore={120}
      lastPlay={{ points: 120, multiplier: 1, adjustment: 0, total: 120 }}
      isScoreAnimating={false}
      scorePopups={[]}
      onPopupComplete={() => {}}
      t={i18n.t}
    />
  )
  expect(getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  expect(getByRole('progressbar')).toHaveAttribute(
    'aria-valuetext',
    'Score: 120; Target: 100'
  )
  expect(container.querySelector('.game-score-remaining')).toHaveTextContent(
    i18n.t('gameplay.targetCleared')
  )
})
