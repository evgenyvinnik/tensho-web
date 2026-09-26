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

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en')
  })
})

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

it('does not advertise the unconnected Spring draw power', () => {
  render(
    <TileImage tile={new Tile(TileSuit.Season, 1, 'spring')} detailsVisible />
  )
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    i18n.t('flora.details.unwired')
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
  expect(screen.getByRole('button')).not.toHaveAccessibleName(
    /Dragon|Glass|Polychrome/
  )
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
