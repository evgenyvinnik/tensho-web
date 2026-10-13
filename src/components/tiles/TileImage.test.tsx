import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n, { loadLanguage } from '../../i18n'
import {
  Tile,
  TileSuit,
  EnhancementType,
  SealType,
  EditionType,
} from '../../core/Tile'
import { TileImage } from './TileImage'
import { useSettingsStore } from '../../stores/settingsStore'

afterEach(async () => {
  await act(async () => {
    useSettingsStore.getState().setShowRankNumbers(false)
    await i18n.changeLanguage('en')
  })
})

/** Corner rank numbers are an opt-in setting. */
const showRankNumbers = () =>
  act(() => useSettingsStore.getState().setShowRankNumbers(true))

it('localizes the tile identity, rules and modifier explanations in Spanish', async () => {
  await loadLanguage('es')
  await i18n.changeLanguage('es')
  const tile = new Tile(TileSuit.Souzu, 4, 'marked', false, {
    enhancement: EnhancementType.Bonus,
    seal: SealType.Purple,
    edition: EditionType.Foil,
  })
  render(<TileImage tile={tile} detailsVisible />)
  expect(screen.getByRole('img')).toHaveAccessibleName(/Bambú/)
  const tooltip = screen.getByRole('tooltip')
  expect(tooltip).toHaveTextContent(i18n.t('tileMarks.items.bonus.description'))
  expect(tooltip).toHaveTextContent(i18n.t('editions.items.foil.description'))
  expect(tooltip).not.toHaveTextContent('base points')
})

it('describes the implemented Summer effect instead of an invented gold reward', () => {
  render(
    <TileImage tile={new Tile(TileSuit.Season, 2, 'summer')} detailsVisible />
  )
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    i18n.t('flora.details.summer')
  )
  expect(screen.getByRole('tooltip')).not.toHaveTextContent('Increases gold')
})

it('describes the implemented Spring rack expansion', () => {
  render(
    <TileImage tile={new Tile(TileSuit.Season, 1, 'spring')} detailsVisible />
  )
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    i18n.t('flora.details.spring')
  )
})

it('conceals all identity and modifiers and never opens hidden details', () => {
  const tile = new Tile(TileSuit.Dragon, 3, 'hidden', false, {
    enhancement: EnhancementType.Glass,
    seal: SealType.Red,
    edition: EditionType.Polychrome,
  })
  render(<TileImage tile={tile} faceDown detailsVisible onClick={() => {}} />)
  expect(screen.getByRole('img')).toHaveAccessibleName('Face-down tile')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  expect(document.querySelector('[data-tile-index]')).toBeNull()
  expect(screen.getByRole('button')).not.toHaveAccessibleName(
    /Dragon|Glass|Polychrome/
  )
})

it.each([
  [1, 'white', 'W', 'White Dragon'],
  [2, 'green', 'G', 'Green Dragon'],
  [3, 'red', 'R', 'Red Dragon'],
] as const)(
  'adds a distinct, non-interactive hint for Dragon rank %s',
  (rank, tone, label, name) => {
    showRankNumbers()
    const { container } = render(
      <TileImage tile={new Tile(TileSuit.Dragon, rank, `dragon-${rank}`)} />
    )
    const badge = container.querySelector('[data-tile-index]')
    expect(badge).toHaveAttribute('data-tile-index', label)
    expect(badge).toHaveAttribute('data-tile-index-tone', tone)
    expect(badge).toHaveAttribute('aria-hidden', 'true')
    expect(badge).not.toHaveAttribute('tabindex')
    expect(screen.getByRole('img')).toHaveAccessibleName(name)
    expect(container.querySelector('.ring-golden-yellow')).toBeNull()
  }
)

it('shows rank numbers only when asked and never reveals a hidden Dragon', () => {
  const tile = new Tile(TileSuit.Dragon, 2, 'green')
  const { container, rerender } = render(<TileImage tile={tile} />)
  expect(container.querySelector('[data-tile-index]')).toBeNull()
  showRankNumbers()
  expect(container.querySelector('[data-tile-index]')).not.toBeNull()
  act(() => useSettingsStore.getState().setShowRankNumbers(false))
  expect(container.querySelector('[data-tile-index]')).toBeNull()
  // A teaching surface can show them regardless of the setting.
  rerender(<TileImage tile={tile} showIndex />)
  expect(container.querySelector('[data-tile-index]')).not.toBeNull()
  showRankNumbers()
  rerender(<TileImage tile={tile} faceDown />)
  expect(container.querySelector('[data-tile-index]')).toBeNull()
  expect(screen.getByRole('img')).toHaveAccessibleName('Face-down tile')
})

it('updates Dragon hints with the locale without changing their full accessible names', async () => {
  showRankNumbers()
  const { container } = render(
    <TileImage tile={new Tile(TileSuit.Dragon, 1, 'white')} />
  )
  expect(container.querySelector('[data-tile-index]')).toHaveAttribute(
    'data-tile-index',
    'W'
  )
  await act(async () => {
    await loadLanguage('es')
    await i18n.changeLanguage('es')
  })
  expect(container.querySelector('[data-tile-index]')).toHaveAttribute(
    'data-tile-index',
    'B'
  )
  expect(screen.getByRole('img')).toHaveAccessibleName(i18n.t('tiles.white'))
})

it('keeps keyboard details and selection independent, including after a locale change', async () => {
  const onClick = vi.fn()
  const tile = new Tile(TileSuit.Wind, 1, 'east')
  render(<TileImage tile={tile} onClick={onClick} />)
  const button = screen.getByRole('button')
  act(() => button.focus())
  expect(screen.getByRole('tooltip')).toBeInTheDocument()
  await act(async () => {
    await loadLanguage('es')
    await i18n.changeLanguage('es')
  })
  expect(screen.getByRole('img')).toHaveAccessibleName(/Este/)
  fireEvent.keyDown(button, { key: 'Escape' })
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  fireEvent.keyDown(button, { key: 'Enter' })
  expect(onClick).toHaveBeenCalledExactlyOnceWith(tile)
})
