import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { getAllVoidScripts } from '../../systems/VoidScriptSystem'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { ItemDetails } from './ItemDetails'
import { ItemCard, type ItemDisplayInfo } from './ItemCard'
import { CategoryTabs } from './CategoryTabs'
import {
  ARCHIVE_CATEGORIES,
  type ArchiveCategory,
} from '../../config/archiveDefinitions'

const entry: ArchiveEntry = {
  key: 'charters:plentiful_stock',
  itemId: 'plentiful_stock',
  category: 'charters',
  discoveredAt: Date.UTC(2026, 8, 20, 12),
  timesUsed: 12345,
  timesWonWith: 1234,
  isUnlocked: true,
}
const displayInfo: ItemDisplayInfo = {
  id: 'plentiful_stock',
  name: 'Plentiful Stock',
  description: '+1 shop slot',
  category: 'charters',
  rarity: 'Rare',
}

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it.each(
  SUPPORTED_LANGUAGES.flatMap((language) =>
    getAllVoidScripts().map((script) => ({ language, id: script.id, script }))
  )
)('shows $id rarity and cost in $language', async ({ language, script }) => {
  await loadLanguage(language)
  await i18n.changeLanguage(language)
  render(
    <ItemDetails entry={{ ...entry, itemId: script.id, category: 'consumables' }} displayInfo={{ ...script, category: 'consumables' }} />
  )
  const dialog = document.body
  expect(dialog.querySelector('[data-archive-rarity]')).toHaveTextContent(
    i18n.t(`shop.ui.rarity_${script.rarity.toLowerCase()}`)
  )
  const penaltyKey = `consumableUse.penalty_${script.penalty.type}`
  expect(i18n.getResource(language, 'translation', penaltyKey)).toBeTruthy()
  expect(dialog.querySelector('[data-archive-script-cost]')).toHaveTextContent(
    i18n.t(penaltyKey, { count: script.penalty.value || 1 })
  )
})

it.each(SUPPORTED_LANGUAGES)(
  'uses %s for Charter rarity, dates and statistics',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)

    render(
      <ItemDetails entry={entry} displayInfo={displayInfo} />
    )
    const dialog = document.body
    expect(dialog.querySelector('[data-archive-rarity]')).toHaveTextContent(
      i18n.t('shop.ui.rarity_rare')
    )
    expect(dialog).toHaveTextContent(i18n.t('collection.discovered'))
    expect(
      dialog.querySelector('[data-archive-discovery-date]')
    ).toHaveTextContent(
      new Date(entry.discoveredAt!).toLocaleDateString(language)
    )
    // Compare raw text: jest-dom normalizes French/Russian nonbreaking group
    // separators into spaces, obscuring the exact Intl output under test.
    expect(dialog.textContent).toContain((12345).toLocaleString(language))
    cleanup()

    render(
      <ItemDetails entry={{ ...entry, discoveredAt: 0 }} displayInfo={displayInfo} />
    )
    for (const key of ['discovered', 'starterItem']) {
      const translated = i18n.getResource(
        language,
        'translation',
        `collection.${key}`
      )
      expect(translated).toBeTruthy()
      if (language !== 'en')
        expect(translated).not.toBe(
          i18n.getResource('en', 'translation', `collection.${key}`)
        )
    }
    expect(document.body).toHaveTextContent(
      i18n.t('collection.starterItem')
    )
    cleanup()

    render(
      <ItemCard
        entry={{ ...entry, isUnlocked: false }}
        displayInfo={displayInfo}
      />
    )
    // The card is the picture; its statistics and lock live in its popup.
    const card = screen.getByRole('button')
    expect(card.querySelector('[data-archive-card-lock]')).not.toBeNull()
    fireEvent.click(card, { detail: 1 })
    const popup = screen.getByRole('dialog')
    expect(popup.querySelector('[data-archive-unlock]')).toHaveTextContent(
      i18n.t('collection.locked')
    )
    const values = popup.querySelectorAll('[data-archive-stat-value]')
    expect(values[0].textContent).toBe((12345).toLocaleString(language))
    expect(values[1].textContent).toBe((1234).toLocaleString(language))
    cleanup()
    const categories = Object.values(ARCHIVE_CATEGORIES)
    const categoryCounts = Object.fromEntries(
      categories.map((category) => [category.id, { discovered: 0, total: 0 }])
    ) as Record<ArchiveCategory, { discovered: number; total: number }>
    render(
      <CategoryTabs
        categories={categories}
        activeCategory="decrees"
        categoryCounts={categoryCounts}
        onCategoryChange={() => {}}
      />
    )
    for (const category of categories) {
      const text = i18n.getResource(
        language,
        'translation',
        `archiveCategories.items.${category.id}.name`
      )
      expect(text).toBeTruthy()
      const label = screen.getByText(text)
      expect(label).not.toHaveClass('hidden')
      expect(label.closest('button')).toHaveAttribute(
        'aria-pressed',
        String(category.id === 'decrees')
      )
    }
  }
)

it.each([
  ['LocalEdict', 'common'],
  ['Common', 'common'],
  ['common', 'common'],
  ['RegionalMandate', 'uncommon'],
  ['Uncommon', 'uncommon'],
  ['uncommon', 'uncommon'],
  ['ImperialDecree', 'rare'],
  ['Rare', 'rare'],
  ['rare', 'rare'],
  ['HeavenlyOrdinance', 'legendary'],
  ['Legendary', 'legendary'],
  ['legendary', 'legendary'],
])('maps the actual %s rarity to %s', (rarity, expected) => {
  render(
    <ItemDetails entry={entry} displayInfo={{ ...displayInfo, rarity }} />
  )
  expect(
    document.body.querySelector('[data-archive-rarity]')
  ).toHaveAttribute('data-archive-rarity', expected)
})

it('does not invent a Standard rarity for a category without one', () => {
  render(
    <ItemDetails entry={entry} displayInfo={{ ...displayInfo, rarity: undefined }} />
  )
  expect(
    document.body.querySelector('[data-archive-rarity]')
  ).toBeNull()
})
