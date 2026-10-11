import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { WallDisplay } from './WallDisplay'
import { Tile, TileSuit } from '../../core/Tile'
import i18n, { changeLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { tileName } from '../../i18n/tileText'
import { useSettingsStore } from '../../stores/settingsStore'

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
    useSettingsStore.setState({ reducedMotion: false })
  })
})

const examples = [
  new Tile(TileSuit.Manzu, 5, 'm1'),
  new Tile(TileSuit.Manzu, 5, 'm2'),
  new Tile(TileSuit.Manzu, 5, 'red', true),
  new Tile(TileSuit.Pinzu, 2, 'p'),
  new Tile(TileSuit.Souzu, 3, 's'),
  new Tile(TileSuit.Wind, 1, 'w'),
  new Tile(TileSuit.Dragon, 2, 'd'),
  new Tile(TileSuit.Flower, 1, 'f'),
  new Tile(TileSuit.Season, 4, 'season'),
]

it.each(SUPPORTED_LANGUAGES)(
  'renders full localized names and exact counts in %s',
  async (language) => {
    await changeLanguage(language)
    useSettingsStore.setState({ reducedMotion: true })
    const before = JSON.stringify(examples)
    render(<WallDisplay wallTiles={examples} />)
    const trigger = screen.getByRole('button')
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', {
      name: i18n.t('gameplay.tilesInWall'),
    })
    expect(dialog.querySelectorAll('[data-wall-suit]')).toHaveLength(7)
    for (const key of [
      'tiles.manzu',
      'tiles.pinzu',
      'tiles.souzu',
      'tiles.winds',
      'tiles.dragons',
      'flora.flowers',
      'flora.seasons',
    ]) {
      expect(
        within(dialog).getByRole('heading', {
          name: (name) => name.startsWith(`${i18n.t(key)}: `),
        })
      ).toBeInTheDocument()
      expect(i18n.exists(key, { lng: language, fallbackLng: false })).toBe(true)
    }
    expect(dialog.querySelectorAll('[data-wall-tile]')).toHaveLength(8)
    expect(
      dialog.querySelector('[data-wall-tile="manzu-5-false"] [data-wall-count]')
    ).toHaveAttribute('data-wall-count', '2')
    expect(
      dialog.querySelector('[data-wall-tile="manzu-5-true"] [data-wall-count]')
    ).toHaveAttribute('data-wall-count', '1')
    for (const tile of examples) {
      expect(
        within(dialog).getByRole('img', { name: tileName(tile, i18n.t) })
      ).toBeInTheDocument()
      expect(
        within(dialog).getByText(tileName(tile, i18n.t))
      ).toBeInTheDocument()
    }
    expect(dialog).toHaveTextContent(
      i18n.t('collection.remaining', { count: 9 })
    )
    expect(JSON.stringify(examples)).toBe(before)
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  }
)

it('updates an open wall after a draw and explains zero without phantom tile groups', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const { rerender } = render(<WallDisplay wallTiles={examples} />)
  fireEvent.click(screen.getByRole('button'))
  rerender(<WallDisplay wallTiles={[examples[0]]} />)
  const dialog = screen.getByRole('dialog')
  expect(dialog.querySelectorAll('[data-wall-tile]')).toHaveLength(1)
  expect(dialog.querySelector('[data-wall-count]')).toHaveAttribute(
    'data-wall-count',
    '1'
  )
  rerender(<WallDisplay wallTiles={[]} />)
  expect(dialog).toHaveTextContent('0 remaining')
  expect(dialog.querySelectorAll('[data-wall-suit]')).toHaveLength(0)
  expect(within(dialog).queryByRole('img')).not.toBeInTheDocument()
})
