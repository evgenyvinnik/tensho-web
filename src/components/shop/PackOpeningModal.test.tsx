import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n from 'i18next'
import {
  Tile,
  TileSuit,
  EnhancementType,
  EditionType,
  SealType,
} from '../../core/Tile'
import { changeLanguage } from '../../i18n'
import es from '../../i18n/locales/es.json'
import { tileRewardText } from '../../i18n/tileRewardText'
import { useSettingsStore } from '../../stores/settingsStore'
import { PackOpeningModal } from './PackOpeningModal'
import {
  ALL_DECREES,
  DecreeSystem,
  RIVER_TAX,
} from '../../systems/DecreeSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../../systems/CelestialOrbSystem'

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

it('uses a Decree catalog identity for illustrated rewards, not the pack choice key', () => {
  useSettingsStore.setState({ reducedMotion: true })
  render(
    <PackOpeningModal
      isOpen
      onConfirm={vi.fn()}
      onSkip={vi.fn()}
      packOffering={{
        pack: {
          id: 'pack-1',
          type: 'Decree',
          size: 'Normal',
          cost: 4,
          choiceCount: 3,
          selectCount: 1,
        },
        contents: [
          {
            id: 'pack-1:choice:0',
            type: 'Decree',
            name: RIVER_TAX.name,
            description: RIVER_TAX.description,
            rarity: 'common',
            data: RIVER_TAX,
          },
        ],
        isOpened: true,
        isResolved: false,
        selectedIndices: [],
        maxSelections: 1,
      }}
    />
  )
  expect(document.querySelector('img[src$="river-tax.webp"]')).not.toBeNull()
  expect(screen.getByRole('button', { name: 'River Tax' })).toBeVisible()
})

it('explains an actual Flower requirement instead of incorrectly blaming inventory capacity', () => {
  useSettingsStore.setState({ reducedMotion: true })
  render(
    <PackOpeningModal
      isOpen
      onConfirm={vi.fn()}
      onSkip={vi.fn()}
      canConfirmSelection={() => false}
      selectionError={() => 'More Flowers are required for this Decree.'}
      packOffering={{
        pack: {
          id: 'gated-pack',
          type: 'Decree',
          size: 'Normal',
          cost: 4,
          choiceCount: 3,
          selectCount: 1,
        },
        contents: [
          {
            id: 'gated',
            type: 'Decree',
            name: RIVER_TAX.name,
            description: RIVER_TAX.description,
            rarity: 'common',
            data: RIVER_TAX,
          },
        ],
        isOpened: true,
        isResolved: false,
        selectedIndices: [],
        maxSelections: 1,
      }}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'River Tax' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'More Flowers are required for this Decree.'
  )
  expect(screen.queryByText(i18n.t('shop.packInventoryFull'))).toBeNull()
})

it.each([EnhancementType.Bonus, EnhancementType.Gold] as const)(
  'shows the localized %s tile rule instead of stale pack prose and selects its real index',
  async (enhancement) => {
    await changeLanguage('es')
    useSettingsStore.setState({ reducedMotion: true })
    const tile = Tile.createNumbered(TileSuit.Souzu, 4).withEnhancement(
      enhancement
    )
    const onConfirm = vi.fn()
    render(
      <PackOpeningModal
        isOpen
        packOffering={{
          pack: {
            id: 'tile-pack',
            type: 'Tile',
            size: 'Normal',
            cost: 4,
            choiceCount: 3,
            selectCount: 1,
          },
          contents: [
            {
              id: 'tile-content',
              type: 'Tile',
              name: 'Stale reward',
              description: 'Incorrect +10 or +2 when scored',
              rarity: 'common',
              data: tile,
            },
          ],
          isOpened: true,
          isResolved: false,
          selectedIndices: [],
          maxSelections: 1,
        }}
        onConfirm={onConfirm}
        onSkip={vi.fn()}
      />
    )
    const text = es.tileMarks.items[enhancement]
    const choice = screen.getByRole('button', {
      name: `4 de ${es.tiles.souzu} · ${text.name}`,
    })
    // Reduced motion must render the reward immediately, without an animation frame.
    expect(choice).toBeVisible()
    expect(choice).toHaveAccessibleDescription(text.description)
    expect(screen.getByText('Común')).toBeVisible()
    expect(screen.queryByText('Edicto Local')).not.toBeInTheDocument()
    expect(screen.getByText(text.description)).not.toHaveClass('line-clamp-3')
    expect(screen.queryByText(/Incorrect|Stale reward/)).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.keyDown(choice, { key: 'Enter' })
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    act(() => useSettingsStore.setState({ reducedMotion: false }))
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    act(() => useSettingsStore.setState({ reducedMotion: true }))
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(
      screen.getByRole('button', { name: es.shop.confirmSelection })
    )
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith([0])
  }
)

it('names the one modifier and handles plain and Honor reward tiles', () => {
  const four = () => Tile.createNumbered(TileSuit.Souzu, 4)
  for (const [tile, name, rule] of [
    [four().withEnhancement(EnhancementType.Bonus), 'Bonus Mark', '+30'],
    [four().withSeal(SealType.Gold), 'Gold Seal', '+3'],
    [four().withEdition(EditionType.Foil), 'Foil', '+50'],
  ] as const) {
    const text = tileRewardText(tile, i18n.t.bind(i18n))
    expect(text.name).toBe(`4 of Bamboo · ${name}`)
    expect(text.description).toContain(rule)
  }
  expect(
    tileRewardText(Tile.createNumbered(TileSuit.Souzu, 4), i18n.t.bind(i18n))
  ).toEqual({ name: '4 of Bamboo', description: '' })
  expect(
    tileRewardText(new Tile(TileSuit.Wind, 4, 'north'), i18n.t.bind(i18n)).name
  ).toBe('North Wind')
  expect(
    tileRewardText(new Tile(TileSuit.Dragon, 2, 'green'), i18n.t.bind(i18n))
      .name
  ).toBe('Green Dragon')
})

it('draws a reward big in its rarity glow and shows its details card on hover or hold', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  const name = i18n.t('orbs.items.pluto_orb.name')
  const description = i18n.t('orbs.items.pluto_orb.description')
  render(
    <PackOpeningModal
      isOpen
      onConfirm={vi.fn()}
      onSkip={vi.fn()}
      packOffering={{
        pack: {
          id: 'orb-pack',
          type: 'Celestial',
          size: 'Normal',
          cost: 4,
          choiceCount: 3,
          selectCount: 1,
        },
        contents: [
          {
            id: 'orb-choice',
            type: 'CelestialOrb',
            name: orb.name,
            description: orb.description,
            rarity: 'rare',
            data: orb,
          },
        ],
        isOpened: true,
        isResolved: false,
        selectedIndices: [],
        maxSelections: 1,
      }}
    />
  )
  const choice = screen.getByRole('button', { name })
  expect(choice.querySelector('[data-rarity="rare"]')).not.toBeNull()
  expect(choice).toHaveAccessibleDescription(description)
  const details = () => document.querySelector('[data-pack-choice-details]')
  expect(details()).toBeNull()

  fireEvent.pointerEnter(choice, { pointerType: 'mouse' })
  expect(details()).toHaveTextContent(description)
  // The kind line names the family the Orb raises.
  expect(details()).toHaveTextContent(
    i18n.t('shop.kinds.orbFamily', { family: 'Pairs' })
  )
  // The card only shows; the reward stays the thing to press.
  expect(details()).toHaveClass('pointer-events-none')
  fireEvent.pointerLeave(choice, { pointerType: 'mouse' })
  expect(details()).toBeNull()

  // A touch has no hover: a tap only chooses, leaving the rewards clear.
  fireEvent.pointerDown(choice, { pointerType: 'touch' })
  fireEvent.pointerUp(choice, { pointerType: 'touch' })
  fireEvent.click(choice, { detail: 1 })
  expect(choice).toHaveAttribute('aria-pressed', 'true')
  expect(details()).toBeNull()

  // Resting a touch on it shows the card, and lifting it does not unchoose.
  vi.useFakeTimers()
  try {
    fireEvent.pointerDown(choice, { pointerType: 'touch' })
    act(() => vi.advanceTimersByTime(450))
    fireEvent.pointerUp(choice, { pointerType: 'touch' })
    fireEvent.click(choice, { detail: 1 })
  } finally {
    vi.useRealTimers()
  }
  expect(details()).toHaveTextContent(description)
  expect(choice).toHaveAttribute('aria-pressed', 'true')
  fireEvent.pointerDown(screen.getByRole('dialog'), { pointerType: 'touch' })
  expect(details()).toBeNull()
})

it('moves a one-reward choice on tap, while a full pack waits for one to be undone', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const ids = ['pluto_orb', 'mercury_orb', 'venus_orb'] as const
  const contents = ids.map((id) => {
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS[id]
    )
    return {
      id: `orb-pack:choice:${id}`,
      type: 'CelestialOrb' as const,
      name: orb.name,
      description: orb.description,
      rarity: 'common' as const,
      data: orb,
    }
  })
  const offering = (maxSelections: number) => ({
    pack: {
      id: 'orb-pack',
      type: 'Celestial' as const,
      size: 'Normal' as const,
      cost: 4,
      choiceCount: 3,
      selectCount: maxSelections,
    },
    contents,
    isOpened: true,
    isResolved: false,
    selectedIndices: [],
    maxSelections,
  })
  const onConfirm = vi.fn()
  const { rerender } = render(
    <PackOpeningModal
      isOpen
      onConfirm={onConfirm}
      onSkip={vi.fn()}
      packOffering={offering(1)}
    />
  )
  const choices = () =>
    screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'))
  const tap = (index: number) => {
    fireEvent.pointerDown(choices()[index], { pointerType: 'touch' })
    fireEvent.pointerUp(choices()[index], { pointerType: 'touch' })
    fireEvent.click(choices()[index], { detail: 1 })
  }
  const pressed = () =>
    choices().map((c) => c.getAttribute('aria-pressed') === 'true')

  tap(0)
  tap(2)
  expect(pressed()).toEqual([false, false, true])
  expect(choices()[0]).toHaveAttribute('aria-disabled', 'false')
  fireEvent.click(
    screen.getByRole('button', { name: i18n.t('shop.confirmSelection') })
  )
  expect(onConfirm).toHaveBeenCalledWith([2])

  rerender(
    <PackOpeningModal
      isOpen
      onConfirm={onConfirm}
      onSkip={vi.fn()}
      packOffering={offering(2)}
    />
  )
  tap(0)
  tap(1)
  tap(2)
  expect(pressed()).toEqual([true, true, false])
  expect(choices()[2]).toHaveAttribute('aria-disabled', 'true')
})

it('shows the owned Decrees under a Decree pack, where one can be sold for room', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const system = new DecreeSystem()
  const stone = ALL_DECREES.find((d) => d.id === 'decree-polished-stone')!
  const owned = system.acquireDecree(stone)!
  const onSell = vi.fn(() => ({ success: true }))
  const pack = (type: 'Decree' | 'Tile') => ({
    pack: {
      id: `${type}-pack`,
      type,
      size: 'Mega' as const,
      cost: 8,
      choiceCount: 5,
      selectCount: 2,
    },
    contents: [
      type === 'Decree'
        ? {
            id: 'decree-choice',
            type,
            name: RIVER_TAX.name,
            description: RIVER_TAX.description,
            rarity: 'common' as const,
            data: RIVER_TAX,
          }
        : {
            id: 'tile-choice',
            type,
            name: '4 of Bamboo',
            description: '',
            rarity: 'common' as const,
            data: Tile.createNumbered(TileSuit.Souzu, 4),
          },
    ],
    isOpened: true,
    isResolved: false,
    selectedIndices: [],
    maxSelections: 2,
  })
  const view = render(
    <PackOpeningModal
      isOpen
      onConfirm={vi.fn()}
      onSkip={vi.fn()}
      packOffering={pack('Decree')}
      build={{ decrees: system.getOwnedDecrees(), maxSlots: 1, onSell }}
    />
  )
  const build = document.querySelector<HTMLElement>('[data-pack-build]')!
  expect(within(build).getByRole('heading')).toHaveTextContent(
    '1 / 1 Decree slots'
  )
  fireEvent.click(within(build).getByRole('button', { name: 'Polished Stone' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sell Polished Stone' }))
  expect(onSell).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  expect(onSell).toHaveBeenCalledExactlyOnceWith(owned.instanceId)
  expect(within(build).getByRole('status')).toHaveTextContent(
    'Sold Polished Stone.'
  )
  // The pack stays open for its choice.
  expect(screen.getByRole('button', { name: 'River Tax' })).toBeVisible()

  // Nothing in a Tile pack takes a Decree slot.
  view.rerender(
    <PackOpeningModal
      isOpen
      onConfirm={vi.fn()}
      onSkip={vi.fn()}
      packOffering={pack('Tile')}
      build={{ decrees: system.getOwnedDecrees(), maxSlots: 1, onSell }}
    />
  )
  expect(document.querySelector('[data-pack-build]')).toBeNull()
})
