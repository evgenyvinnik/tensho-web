import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CharterCard } from './CharterCard'
import { TEA_HOUSE_BASE_CHARTERS } from '../../systems/TeaHouseSystem'
import { changeLanguage } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { illustrationAssets } from '../../utils/assets'

const charter = TEA_HOUSE_BASE_CHARTERS.find(
  (item) => item.id === 'ancient_script'
)!

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

it('renders localized Charter art, identity, rules and tier without escape text', async () => {
  await changeLanguage('es')
  render(
    <CharterCard
      charter={charter}
      finalCost={10}
      canAfford
      onPurchase={vi.fn()}
    />
  )
  expect(screen.getByRole('img', { name: 'Carta imperial' })).toHaveAttribute(
    'src',
    illustrationAssets.imperialCharter
  )
  expect(
    screen.getByRole('heading', { name: 'Escritura antigua' })
  ).not.toHaveClass('truncate')
  expect(screen.getByText('Edición básica')).toBeVisible()
  expect(screen.getByRole('button')).toHaveAccessibleName(
    'Escritura antigua 10G'
  )
  expect(screen.getByRole('button')).toHaveAccessibleDescription(
    '-1 Acto, -1 mano por ronda'
  )
  expect(screen.getByRole('article').textContent).not.toMatch(/\\u[0-9a-f]{4}/i)
})

it('invokes purchase once from its explicit button and rejects unaffordable card clicks', () => {
  const purchase = vi.fn()
  const view = render(
    <CharterCard
      charter={charter}
      finalCost={10}
      canAfford
      onPurchase={purchase}
    />
  )
  fireEvent.click(screen.getByRole('button'))
  expect(purchase).toHaveBeenCalledTimes(1)
  view.rerender(
    <CharterCard
      charter={charter}
      finalCost={10}
      canAfford={false}
      onPurchase={purchase}
    />
  )
  expect(screen.getByRole('button')).toBeDisabled()
  fireEvent.click(screen.getByRole('article'))
  expect(purchase).toHaveBeenCalledTimes(1)
})

it('keeps a long upgraded title and rules intact and suppresses hover scaling with reduced motion', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const long = {
    ...charter,
    id: 'layout-fixture',
    isUpgraded: true,
    name: 'A very long illustrated imperial charter with a full readable title',
    description:
      'A complete description with a cost, a benefit, and a condition that must not be truncated.',
  }
  render(
    <CharterCard
      charter={long}
      finalCost={1234567}
      canAfford
      onPurchase={vi.fn()}
    />
  )
  expect(screen.getByRole('heading')).toHaveTextContent(long.name)
  expect(screen.getByText(long.description)).toBeVisible()
  expect(screen.getByText('Upgraded')).toBeVisible()
  expect(screen.queryByText('Base edition')).not.toBeInTheDocument()
  fireEvent.mouseEnter(screen.getByRole('article'))
  expect(screen.getByRole('article')).toHaveStyle({ transform: 'scale(1)' })
  expect(screen.getByRole('button')).toHaveAccessibleName(
    `${long.name} 1,234,567G`
  )
})
