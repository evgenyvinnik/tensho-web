import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { MeldType } from '../../core/Meld'
import { SelectionStrip } from './SelectionStrip'

let counter = 0
const t = (suit: TileSuit, rank: number) => new Tile(suit, rank, `s${counter++}`)

const gappedRun = () => [
  t(TileSuit.Manzu, 3),
  t(TileSuit.Manzu, 4),
  t(TileSuit.Manzu, 6),
]

describe('SelectionStrip', () => {
  it('names an ordinary group without mentioning the bridge', () => {
    render(
      <SelectionStrip
        tiles={[t(TileSuit.Souzu, 3), t(TileSuit.Souzu, 4), t(TileSuit.Souzu, 5)]}
        groupType={MeldType.Sequence}
        bestForecast={55}
        onClear={vi.fn()}
      />
    )

    expect(screen.getByTestId('selection-strip')).toHaveTextContent('Sequence')
    expect(screen.getByTestId('selection-strip')).not.toHaveTextContent('bridged')
  })

  it('says when only Gap Bridge made the selection legal', () => {
    render(
      <SelectionStrip
        tiles={gappedRun()}
        groupType={MeldType.Sequence}
        bestForecast={55}
        usedGap
        onClear={vi.fn()}
      />
    )

    expect(screen.getByTestId('selection-strip')).toHaveTextContent('bridged')
  })

  it('warns before a placement that would break a pattern', () => {
    render(
      <SelectionStrip
        tiles={gappedRun()}
        groupType={MeldType.Sequence}
        bestForecast={120}
        multCost={0.5}
        onClear={vi.fn()}
      />
    )

    const strip = screen.getByTestId('selection-strip')
    expect(strip).toHaveTextContent('breaks a pattern')
    expect(strip).toHaveTextContent('0.5')
  })

  it('renders nothing when nothing is selected', () => {
    const { container } = render(
      <SelectionStrip tiles={[]} groupType={null} bestForecast={null} onClear={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
