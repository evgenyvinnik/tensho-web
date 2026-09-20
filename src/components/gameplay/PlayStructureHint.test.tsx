import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { PlayArea, type PlayAreaProps } from './PlayArea'

afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})

function props(
  kind: 'tactical' | 'complete',
  groupedTiles: number,
  looseTiles: number
): PlayAreaProps {
  return {
    selectedTileCount: groupedTiles + looseTiles,
    stagedTileCount: groupedTiles + looseTiles,
    handTileCount: 14,
    yakuReveals: [],
    onYakuComplete: () => {},
    scorePreview: {
      points: 45,
      mult: 1,
      total: 45,
      yaku: [],
      structure: { kind, groupedTiles, looseTiles },
      structurePoints: groupedTiles > 0 ? 30 : 0,
    },
  }
}

it.each(SUPPORTED_LANGUAGES)(
  'explains grouped, mixed, loose and complete selections in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    useSettingsStore.setState({ reducedMotion: true })
    const { rerender, getByTestId } = render(
      <PlayArea {...props('tactical', 3, 0)} />
    )
    const hint = getByTestId('forecast-structure-hint')
    expect(hint).toHaveTextContent(
      i18n.t('gameplay.forecast.grouped', { points: '30' })
    )
    expect(hint).not.toHaveTextContent(i18n.t('gameplay.forecast.looseTiles'))
    rerender(<PlayArea {...props('tactical', 3, 1)} />)
    expect(hint).toHaveTextContent(
      i18n.t('gameplay.forecast.mixed', { points: '30', count: 1 })
    )
    rerender(<PlayArea {...props('tactical', 0, 3)} />)
    expect(hint).toHaveTextContent(i18n.t('gameplay.forecast.looseTiles'))
    // A suppressed Yaku does not turn a complete hand into a loose-tile play.
    rerender(<PlayArea {...props('complete', 14, 0)} />)
    expect(hint).toHaveTextContent(i18n.t('gameplay.forecast.complete'))
    expect(hint.textContent).not.toMatch(/gameplay\.|\{\{/)
  }
)

it('does not leak grouping or bonuses when the selected tiles are concealed', () => {
  const { queryByTestId, getByLabelText } = render(
    <PlayArea {...props('tactical', 3, 0)} scorePreviewHidden />
  )
  expect(queryByTestId('forecast-structure-hint')).toBeNull()
  expect(
    getByLabelText(i18n.t('gameplay.previewConcealed'))
  ).toBeInTheDocument()
})

it('does not infer loose tiles from a legacy preview without structural metadata', () => {
  const preview = props('tactical', 3, 0)
  delete preview.scorePreview!.structure
  const { getByTestId } = render(<PlayArea {...preview} />)
  expect(getByTestId('forecast-structure-hint')).toHaveTextContent(
    i18n.t('gameplay.forecast.groupToScore')
  )
})
