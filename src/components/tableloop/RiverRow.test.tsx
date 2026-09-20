import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { changeLanguage } from '../../i18n'
import en from '../../i18n/locales/en.json'
import es from '../../i18n/locales/es.json'
import { RiverRow } from './RiverRow'

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
  })
})

it.each([
  ['en', en],
  ['es', es],
] as const)(
  'guides a chosen-tile swap without enabling an empty selection (%s)',
  async (language, copy) => {
    await changeLanguage(language)
    const tiles = [new Tile(TileSuit.Souzu, 3, 'take')]
    const given = new Tile(TileSuit.Pinzu, 7, 'give')
    const onSwap = vi.fn(() => true)
    const props = {
      tiles,
      selectedTile: null,
      merchantOwned: true,
      swapsRemaining: 1,
      onSwap,
    }
    const { rerender } = render(<RiverRow {...props} />)
    const button = screen.getByTestId('river-tile-take')
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      copy.tableLoop.river.choose
    )
    fireEvent.click(button)
    expect(onSwap).not.toHaveBeenCalled()
    rerender(<RiverRow {...props} selectedTile={given} />)
    expect(button).toBeEnabled()
    expect(button).toHaveAccessibleName(
      copy.tableLoop.river.swapLabel
        .replace('{{give}}', `7 ${copy.tiles.pinzu}`)
        .replace('{{take}}', `3 ${copy.tiles.souzu}`)
    )
    fireEvent.click(button)
    expect(onSwap).toHaveBeenCalledExactlyOnceWith('take')
    expect(screen.getByRole('status')).toHaveFocus()
    rerender(<RiverRow {...props} swapsRemaining={0} />)
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      copy.tableLoop.river.used
    )
  }
)

it('never offers a trade without Merchant and does not steal focus after rejection', () => {
  const tile = new Tile(TileSuit.Souzu, 3, 'take')
  const props = {
    tiles: [tile],
    selectedTile: new Tile(TileSuit.Pinzu, 7, 'give'),
    merchantOwned: false,
    swapsRemaining: 1,
    onSwap: vi.fn(() => false),
  }
  const { rerender } = render(<RiverRow {...props} />)
  expect(screen.getByTestId('river-tile-take')).toBeDisabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  rerender(<RiverRow {...props} merchantOwned />)
  fireEvent.click(screen.getByTestId('river-tile-take'))
  expect(screen.getByRole('status')).not.toHaveFocus()
})
