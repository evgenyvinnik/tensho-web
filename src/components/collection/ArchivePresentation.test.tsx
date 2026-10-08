import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { getAllVoidScripts } from '../../systems/VoidScriptSystem'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { ItemDetailModal } from './ItemDetailModal'
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
    <ItemDetailModal
      isOpen
      onClose={() => {}}
      entry={{ ...entry, itemId: script.id, category: 'consumables' }}
      categoryInfo={null}
      displayInfo={{ ...script, category: 'consumables' }}
    />
  )
  const dialog = screen.getByRole('dialog')
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
      <ItemDetailModal
        isOpen
        onClose={() => {}}
        entry={entry}
        categoryInfo={null}
        displayInfo={displayInfo}
      />
    )
    const dialog = screen.getByRole('dialog')
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
      <ItemDetailModal
        isOpen
        onClose={() => {}}
        entry={{ ...entry, discoveredAt: 0 }}
        categoryInfo={null}
        displayInfo={displayInfo}
      />
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
    expect(screen.getByRole('dialog')).toHaveTextContent(
      i18n.t('collection.starterItem')
    )
    cleanup()

    render(
      <ItemCard
        entry={{ ...entry, isUnlocked: false }}
        displayInfo={displayInfo}
      />
    )
    const card = screen.getByRole('button')
    const lock = card.querySelector('[data-archive-card-lock]')
    expect(lock).toHaveTextContent(i18n.t('collection.locked'))
    expect(lock).not.toHaveClass('absolute')
    expect(card.textContent).toContain(
      `${i18n.t('collection.timesUsed')}: ${(12345).toLocaleString(language)}`
    )
    expect(card.textContent).toContain(
      `${i18n.t('collection.runsWon')}: ${(1234).toLocaleString(language)}`
    )
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
    <ItemDetailModal
      isOpen
      onClose={() => {}}
      entry={entry}
      categoryInfo={null}
      displayInfo={{ ...displayInfo, rarity }}
    />
  )
  expect(
    screen.getByRole('dialog').querySelector('[data-archive-rarity]')
  ).toHaveAttribute('data-archive-rarity', expected)
})

it('does not invent a Standard rarity for a category without one', () => {
  render(
    <ItemDetailModal
      isOpen
      onClose={() => {}}
      entry={entry}
      categoryInfo={null}
      displayInfo={{ ...displayInfo, rarity: undefined }}
    />
  )
  expect(
    screen.getByRole('dialog').querySelector('[data-archive-rarity]')
  ).toBeNull()
})
