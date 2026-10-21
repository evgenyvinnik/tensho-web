import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { STAKE_NAME_KEYS } from '../../i18n/stakeRules'
import { ItemCard, type ItemDisplayInfo } from './ItemCard'

const entry: ArchiveEntry = {
  key: 'decrees:river_tax',
  category: 'decrees',
  itemId: 'river_tax',
  discoveredAt: 0,
  isUnlocked: true,
  timesUsed: 3,
  timesWonWith: 2,
  wonStakeTiers: [2, 8, 8],
}
const info: ItemDisplayInfo = {
  id: 'river_tax',
  category: 'decrees',
  name: 'River Tax',
  description: '+2 Gold per REDRAW',
}
afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'shows the best sticker and explains all earned tiers in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const { container } = render(<ItemCard entry={entry} displayInfo={info} />)
    expect(
      i18n.getResource(language, 'translation', 'collection.stakeVictory')
    ).toContain('{{stake}}')
    const label = (tier: number) =>
      i18n.t('collection.stakeVictory', {
        stake: i18n.t(`stakes.${STAKE_NAME_KEYS[tier - 1]}`),
      })
    const card = screen.getByRole('button', { name: 'River Tax' })
    expect(container.querySelectorAll('[data-stake-victory]')).toHaveLength(1)
    expect(
      container.querySelector('[data-stake-victory="8"]')
    ).toHaveAccessibleName(label(8))
    fireEvent.click(card)
    const popup = document.querySelector('[data-archive-victories]')!
    expect(popup.querySelectorAll('[data-stake-victory]')).toHaveLength(2)
    expect(popup).toHaveTextContent(label(2))
    expect(popup).toHaveTextContent(label(8))
    expect(popup.querySelectorAll('img')).toHaveLength(2)
  }
)

it('shows no victory markers for legacy generic wins or hidden items', () => {
  const { container, rerender } = render(
    <ItemCard
      entry={{ ...entry, wonStakeTiers: undefined, timesWonWith: 999 }}
      displayInfo={info}
    />
  )
  expect(container.querySelector('[data-stake-victory]')).toBeNull()
  rerender(
    <ItemCard entry={{ ...entry, discoveredAt: null }} displayInfo={info} />
  )
  expect(container.querySelector('[data-stake-victory]')).toBeNull()
})
