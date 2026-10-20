import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '../../i18n'
import { Tile, TileSuit, WindType } from '../../core/Tile'
import { FATE_SEALS, FateSealSystem } from '../../systems/FateSealSystem'
import { SealWallDialog } from './SealWallDialog'

const seal = (id: string) =>
  FateSealSystem.createFateSealInstance(FATE_SEALS[id])
const wall = [
  new Tile(TileSuit.Manzu, 1, 'm1a'),
  new Tile(TileSuit.Manzu, 1, 'm1b'),
  new Tile(TileSuit.Pinzu, 2, 'p2'),
  new Tile(TileSuit.Souzu, 7, 's7'),
  Tile.createWind(WindType.North, 'north'),
]

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
  })
})

it('shows the whole wall by suit, dimming tiles the Seal cannot change', () => {
  render(
    <SealWallDialog
      seal={seal('seal_of_manzu')}
      wall={wall}
      confirmLabel="Buy · 4 Gold"
      onConfirm={vi.fn()}
      onClose={vi.fn()}
    />
  )
  const dialog = screen.getByRole('dialog', { name: 'Seal of Characters' })
  expect(dialog).toHaveTextContent('Converts up to 3 tiles to Characters')
  const characters = within(dialog).getByRole('region', { name: 'Characters' })
  expect(characters).toHaveTextContent('Characters · 2')
  for (const tile of within(characters).getAllByRole('button'))
    expect(tile).toBeDisabled()
  expect(
    within(dialog).getByRole('button', { name: '2 of Circles' })
  ).toBeEnabled()
  expect(
    within(dialog).getByRole('button', { name: 'North Wind' })
  ).toBeDisabled()
  // Two copies of one rank stack in one column.
  const [first, second] = within(characters).getAllByRole('button')
  expect(first.style.gridColumn).toBe(second.style.gridColumn)
  expect([first.style.gridRow, second.style.gridRow]).toEqual(['1', '2'])
})

it('shows what each chosen tile becomes and confirms them in order', () => {
  const onConfirm = vi.fn()
  render(
    <SealWallDialog
      seal={seal('seal_of_manzu')}
      wall={wall}
      confirmLabel="Buy · 4 Gold"
      onConfirm={onConfirm}
      onClose={vi.fn()}
    />
  )
  const confirm = screen.getByRole('button', { name: 'Buy · 4 Gold' })
  expect(confirm).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '7 of Bamboo' }))
  fireEvent.click(screen.getByRole('button', { name: '2 of Circles' }))
  expect(screen.getByRole('status')).toHaveTextContent('Targets: 2 / 1–3')
  const result = screen.getByRole('list', { name: 'Result' })
  expect(
    within(result)
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('aria-label'))
  ).toEqual([
    '7 of Bamboo becomes 7 of Characters',
    '2 of Circles becomes 2 of Characters',
  ])
  fireEvent.click(confirm)
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith(['s7', 'p2'])
})

it('moves a one-tile Seal’s choice and leaves the wall alone on cancel', () => {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  render(
    <SealWallDialog
      seal={seal('seal_of_glass')}
      wall={wall}
      step={{ index: 1, count: 2 }}
      confirmLabel="Use item"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
    'Seal of Glass2 of 2'
  )
  fireEvent.click(screen.getByRole('button', { name: 'North Wind' }))
  fireEvent.click(screen.getByRole('button', { name: '2 of Circles' }))
  expect(screen.getByRole('button', { name: 'North Wind' })).toHaveAttribute(
    'aria-pressed',
    'false'
  )
  expect(screen.getByRole('button', { name: '2 of Circles' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onClose).toHaveBeenCalledOnce()
  expect(onConfirm).not.toHaveBeenCalled()
})

it('names suits the way the tiles do in another language', async () => {
  await act(async () => {
    await changeLanguage('es')
  })
  render(
    <SealWallDialog
      seal={seal('seal_of_souzu')}
      wall={wall}
      confirmLabel="Comprar"
      onConfirm={vi.fn()}
      onClose={vi.fn()}
    />
  )
  const dialog = screen.getByRole('dialog', { name: 'Sello de Bambúes' })
  expect(dialog).toHaveTextContent(
    'Convierte hasta 3 fichas al palo de Bambúes'
  )
  expect(
    within(dialog).getByRole('region', { name: 'Bambúes' })
  ).toBeInTheDocument()
  expect(dialog).toHaveTextContent('Elige fichas de tu muro')
})
