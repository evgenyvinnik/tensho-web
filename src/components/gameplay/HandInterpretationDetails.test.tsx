import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { HandInterpretationDetails } from './HandInterpretationDetails'
import { Tile, TileSuit } from '../../core/Tile'
import i18n, { loadLanguage } from '../../i18n'
import { PlayArea } from './PlayArea'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
const interpretation = {
  naturalComplete: false,
  allWild: false,
  usedShantenClemency: false,
  substitutions: [
    {
      physical: new Tile(TileSuit.Manzu, 5, 'wild'),
      effective: new Tile(TileSuit.Pinzu, 2, 'wild'),
    },
  ],
}

it('offers a collapsed, keyboard/touch-native explanation with real tile faces', () => {
  const { container } = render(
    <HandInterpretationDetails interpretation={interpretation} />
  )
  expect(container.querySelector('details')).not.toHaveAttribute('open')
  expect(container.querySelector('summary')).toHaveTextContent(
    'Why this hand works'
  )
  expect(container.querySelectorAll('img')).toHaveLength(2)
  expect(container).toHaveTextContent(
    '5 of Characters counts as 2 of Circles for this play.'
  )
  expect(container).toHaveTextContent('no tile is created')
  expect(container).not.toHaveTextContent('halves')
})

it('explains virtual completion and its already-applied penalty without pretending to draw a tile', () => {
  render(
    <HandInterpretationDetails
      interpretation={{
        ...interpretation,
        usedShantenClemency: true,
        completionTile: new Tile(TileSuit.Wind, 1, 'virtual'),
      }}
    />
  )
  expect(screen.getByText(/Virtual completion:/)).toHaveTextContent('East')
  expect(screen.getByText(/halves the hand score/)).toHaveTextContent(
    'forecast includes this penalty'
  )
})

it('does not create details for natural hands or absent/concealed interpretations', () => {
  const { container, rerender } = render(
    <HandInterpretationDetails interpretation={null} />
  )
  expect(container).toBeEmptyDOMElement()
  rerender(
    <HandInterpretationDetails
      interpretation={{
        ...interpretation,
        naturalComplete: true,
        substitutions: [],
      }}
    />
  )
  expect(container).toBeEmptyDOMElement()
  rerender(
    <HandInterpretationDetails
      interpretation={{ ...interpretation, allWild: true, substitutions: [] }}
    />
  )
  expect(container).toHaveTextContent('Every tile can act as any suit and rank')
})

it('localizes the explanation and tile names together', async () => {
  await loadLanguage('es')
  await i18n.changeLanguage('es')
  const { container } = render(
    <HandInterpretationDetails interpretation={interpretation} />
  )
  expect(container.querySelector('summary')).toHaveTextContent(
    'Por qué funciona esta mano'
  )
  expect(container).not.toHaveTextContent('Characters')
  expect(container).not.toHaveTextContent('counts as')
})

it('suppresses even a supplied interpretation when the forecast is concealed', () => {
  const { container } = render(
    <PlayArea
      selectedTileCount={14}
      stagedTileCount={0}
      handTileCount={14}
      scorePreview={{ points: 1, mult: 1, total: 1, interpretation }}
      scorePreviewHidden
      yakuReveals={[]}
      onYakuComplete={() => {}}
    />
  )
  expect(container.querySelector('[data-hand-interpretation]')).toBeNull()
  expect(container.textContent).not.toContain('5 of Characters')
})
