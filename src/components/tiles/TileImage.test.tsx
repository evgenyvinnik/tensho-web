import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

it.each([
  [(t: Tile) => t.withEnhancement(EnhancementType.Bonus), 'tileMarks', 'bonus'],
  [(t: Tile) => t.withSeal(SealType.Purple), 'archiveSeals', 'purple'],
  [(t: Tile) => t.withEdition(EditionType.Foil), 'editions', 'foil'],
] as const)(
  'localizes the tile identity, rules and modifier explanation in Spanish (%#)',
  async (modify, kind, id) => {
    await loadLanguage('es')
    await i18n.changeLanguage('es')
    const tile = modify(new Tile(TileSuit.Souzu, 4, 'marked'))
    render(<TileImage tile={tile} detailsVisible />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/Bambú/)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent(i18n.t(`${kind}.items.${id}.description`))
    expect(tooltip).not.toHaveTextContent('base points')
  }
)

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
  const tile = new Tile(TileSuit.Dragon, 3, 'hidden').withEnhancement(
    EnhancementType.Glass
  )
  render(<TileImage tile={tile} faceDown detailsVisible onClick={() => {}} />)
  expect(screen.getByRole('img')).toHaveAccessibleName('Face-down tile')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  expect(document.querySelector('[data-tile-index]')).toBeNull()
  expect(screen.getByRole('button')).not.toHaveAccessibleName(/Dragon|Glass/)
})

it('draws a face-down tile as its back, never as a blank face', () => {
  const { container } = render(
    <TileImage tile={new Tile(TileSuit.Pinzu, 5, 'hidden')} faceDown />
  )
  expect(container.querySelector('[data-tile-back]')).toHaveAccessibleName(
    'Face-down tile'
  )
  // The art kit's empty template is indistinguishable from a blank tile.
  expect(container.querySelector('img')).toBeNull()
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

it('draws a marked tile whole from its finished artwork', () => {
  const tile = new Tile(TileSuit.Pinzu, 9, 'gold-mark').withEnhancement(
    EnhancementType.Gold
  )
  showRankNumbers()
  const { container, rerender } = render(<TileImage tile={tile} />)
  const face = screen.getByRole('img')
  expect(face).toHaveAccessibleName(/9/)
  expect(face).toHaveAttribute(
    'src',
    expect.stringMatching(/\/assets\/tiles\/gold\/pinzu_09\.webp$/)
  )
  expect(face).toHaveAttribute('data-tile-face', 'finished')
  // No frame is laid over the finished tile.
  expect(container.querySelector('[data-tile-frame-plane]')).toBeNull()
  expect(container.querySelectorAll('[data-tile-art-layer]')).toHaveLength(0)
  expect(container.querySelector('[data-tile-index]')).toHaveClass('z-20')
  rerender(<TileImage tile={tile} faceDown />)
  expect(container.querySelector('img[src*="/tiles/gold/"]')).toBeNull()
  expect(screen.getByRole('img')).toHaveAccessibleName('Face-down tile')
})

it('leaves a plain face whole and sizes a marked tile the same way', () => {
  const plain = new Tile(TileSuit.Pinzu, 2, 'two-dots')
  const { container, rerender } = render(<TileImage tile={plain} />)
  expect(container.querySelector('[data-tile-face]')).toBeNull()
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/Dots \(2\)/)
  )
  expect(screen.getByRole('img')).toHaveClass('w-full', 'h-full')

  rerender(<TileImage tile={plain.withEnhancement(EnhancementType.Bonus)} />)
  const face = screen.getByRole('img')
  expect(face).toHaveAttribute(
    'src',
    expect.stringMatching(/\/assets\/tiles\/bonus\/pinzu_02\.webp$/)
  )
  expect(face).toHaveClass('w-full', 'h-full', 'object-contain')
  expect(face).not.toHaveAttribute('style')
})

it('shows Stone as rankless artwork and never leaks its original face or rank hint', () => {
  const tile = new Tile(TileSuit.Dragon, 3, 'stone', false, {
    enhancement: EnhancementType.Stone,
    seal: SealType.None,
    edition: EditionType.Base,
  })
  const { container } = render(<TileImage tile={tile} detailsVisible />)
  expect(screen.getByRole('img')).toHaveAccessibleName(
    i18n.t('tileDetails.stoneName')
  )
  expect(container.querySelector('[data-tile-face="stone"]')).toHaveAttribute(
    'src',
    expect.stringMatching(/\/assets\/tiles\/stone\.webp$/)
  )
  expect(container.querySelector('[data-tile-base-art]')).toHaveAttribute(
    'src',
    expect.stringMatching(/\/assets\/tiles\/stone\.webp$/)
  )
  expect(container.querySelector('img[src*="Dragons"]')).toBeNull()
  expect(container.querySelector('img[src*="dragon_03"]')).toBeNull()
  expect(container.querySelector('[data-tile-index]')).toBeNull()
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    i18n.t('tileMarks.items.stone.description')
  )
  expect(screen.getByRole('tooltip')).not.toHaveTextContent('Red Dragon')
})

it.each([
  EditionType.Foil,
  EditionType.Holographic,
  EditionType.Polychrome,
  EditionType.Negative,
])(
  'registers %s to the clipped front face rather than the tile silhouette',
  (edition) => {
    const { container } = render(
      <TileImage
        tile={new Tile(TileSuit.Pinzu, 5, 'edition').withEdition(edition)}
      />
    )
    const plane = container.querySelector('[data-tile-frame-plane]')!
    expect(plane).toHaveAttribute('viewBox', '0 0 569 711')
    expect(plane).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet')
    expect(plane.querySelector('[data-tile-front-face]')).toHaveAttribute(
      'width',
      '526'
    )
    expect(plane.querySelector('[data-tile-front-face]')).toHaveAttribute(
      'height',
      '661'
    )
    expect(plane.querySelector('clipPath rect')).toHaveAttribute('rx', '60')
    expect(
      plane.querySelector('[data-tile-art-layer="edition"]')
    ).not.toHaveClass('-inset-0.5')
  }
)

it('keeps marked tile art full sized with selection and index around it', () => {
  const tile = new Tile(TileSuit.Pinzu, 5, 'layers', false, {
    enhancement: EnhancementType.Gold,
    edition: EditionType.Base,
    seal: SealType.None,
  })
  const { container } = render(<TileImage tile={tile} selected showIndex />)
  const art = container.querySelector('[data-tile-base-art]')!
  expect(art).not.toHaveAttribute('style')
  expect(art).toHaveClass('w-full', 'h-full', 'object-contain')
  expect(container.querySelector('[data-tile-index]')).not.toBeNull()
  expect(container.firstChild).toHaveClass('ring-2')
})

it('does not clip the seal to the front face', () => {
  const { container } = render(
    <TileImage
      tile={new Tile(TileSuit.Pinzu, 5, 'seal').withSeal(SealType.Red)}
    />
  )
  expect(container.querySelector('[data-tile-art-layer="seal"]')).not.toBeNull()
  expect(container.querySelector('[data-tile-frame-plane]')).toBeNull()
})

describe('touch long press', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  /** A tile inside a selecting button, as the rack and felt render it. */
  const renderInButton = (tile: Tile, props = {}) => {
    const onSelect = vi.fn()
    render(
      <button type="button" onClick={onSelect}>
        <TileImage tile={tile} {...props} />
      </button>
    )
    return { onSelect, face: screen.getByRole('img') }
  }

  const press = (
    target: Element,
    ms: number,
    pointerType = 'touch',
    drift = 0
  ) => {
    fireEvent.pointerDown(target, { pointerType, clientX: 10, clientY: 10 })
    if (drift)
      fireEvent.pointerMove(target, {
        pointerType,
        clientX: 10 + drift,
        clientY: 10,
      })
    act(() => vi.advanceTimersByTime(ms))
    fireEvent.pointerUp(target, { pointerType })
    fireEvent.click(target, { detail: 1 })
  }

  it('shows the name and modifiers without selecting, until the next touch', () => {
    const tile = new Tile(TileSuit.Pinzu, 3, 'held').withSeal(SealType.Purple)
    const { onSelect, face } = renderInButton(tile)
    press(face, 450)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent(face.getAttribute('alt')!)
    expect(tooltip).toHaveTextContent(i18n.t('archiveSeals.items.purple.name'))
    expect(tooltip).toHaveTextContent(
      i18n.t('archiveSeals.items.purple.description')
    )
    // The touch that showed the details does not also select.
    expect(onSelect).not.toHaveBeenCalled()
    // A new touch anywhere puts the details away and does what it touched.
    fireEvent.pointerDown(document.body, { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    press(face, 50)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('keeps the browser menu off a held tile', () => {
    const { face } = renderInButton(new Tile(TileSuit.Wind, 2, 'south'))
    fireEvent.pointerDown(face, { pointerType: 'touch' })
    expect(fireEvent.contextMenu(face)).toBe(false)
    fireEvent.pointerUp(face, { pointerType: 'touch' })
    fireEvent.pointerDown(face, { pointerType: 'mouse' })
    expect(fireEvent.contextMenu(face)).toBe(true)
  })

  it.each([
    ['a short tap', {}, 449, 'touch', 0],
    ['a scroll that drifts', {}, 450, 'touch', 11],
    ['a mouse held still', {}, 450, 'mouse', 0],
    ['a tile without details', { showTooltip: false }, 450, 'touch', 0],
    ['a face-down tile', { faceDown: true }, 450, 'touch', 0],
  ] as const)(
    'leaves %s as a plain tap',
    (_, props, ms, pointerType, drift) => {
      const { onSelect } = renderInButton(
        new Tile(TileSuit.Souzu, 5, 'tap'),
        props
      )
      const target = document.querySelector('button > div')!
      press(target, ms, pointerType, drift)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      expect(onSelect).toHaveBeenCalledOnce()
    }
  )
})
