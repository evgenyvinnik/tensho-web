import { act, fireEvent, render, screen } from '@testing-library/react'
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
import { RIVER_TAX } from '../../systems/DecreeSystem'

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

it('retains every stacked modifier and handles plain and Honor reward tiles', () => {
  const tile = Tile.createNumbered(TileSuit.Souzu, 4)
    .withEnhancement(EnhancementType.Bonus)
    .withSeal(SealType.Gold)
    .withEdition(EditionType.Foil)
  const text = tileRewardText(tile, i18n.t.bind(i18n))
  expect(text.name).toBe('4 of Bamboo · Bonus Mark · Gold Seal · Foil')
  for (const rule of ['+30', '+3', '+50'])
    expect(text.description).toContain(rule)
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
