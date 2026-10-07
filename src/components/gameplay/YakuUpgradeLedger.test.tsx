import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { YakuUpgradeLedger } from './YakuUpgradeLedger'
import i18n, { changeLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { illustrationAssets } from '../../utils/assets'

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
    useSettingsStore.setState({ reducedMotion: false })
  })
})

it('is optional, illustrates the empty state, and restores focus without mutating data', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const { rerender } = render(<YakuUpgradeLedger upgrades={[]} />)
  const trigger = screen.getByTestId('yaku-upgrades-trigger')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger.querySelector('img')).toHaveAttribute(
    'src',
    illustrationAssets.yakuLedger
  )
  trigger.focus()
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Yaku upgrades' })
  expect(dialog).toHaveTextContent('No Yaku upgrades yet.')
  expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument()
  const upgrades = [
    {
      yaku: 'SevenPairs' as const,
      level: 2,
      chips: 35,
      mult: 3,
      timesScored: 0,
    },
  ]
  const before = JSON.stringify(upgrades)
  rerender(<YakuUpgradeLedger upgrades={upgrades} />)
  expect(dialog).toHaveTextContent('Seven Pairs')
  expect(dialog).toHaveTextContent('Level 2 / 10')
  expect(dialog).toHaveTextContent('+35 base points · +3 Mult')
  expect(dialog).toHaveTextContent('Times scored: 0')
  expect(JSON.stringify(upgrades)).toBe(before)
  fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

it.each(SUPPORTED_LANGUAGES)(
  'uses actual localized numbers and Yaku names in %s',
  async (language) => {
    await changeLanguage(language)
    useSettingsStore.setState({ reducedMotion: true })
    render(
      <YakuUpgradeLedger
        upgrades={[
          {
            yaku: 'SevenPairs',
            level: 10,
            chips: 315,
            mult: 27,
            timesScored: 12345,
          },
        ]}
      />
    )
    fireEvent.click(screen.getByTestId('yaku-upgrades-trigger'))
    const dialog = screen.getByRole('dialog', {
      name: i18n.t('yakuUpgrades.title'),
    })
    expect(dialog).toHaveTextContent(
      i18n.getResource(language, 'translation', 'yaku.chiitoitsu')
    )
    expect(dialog.textContent).toContain(
      i18n.t('yakuUpgrades.triggers', {
        total: (12345).toLocaleString(language),
      })
    )
    expect(dialog).toHaveTextContent(i18n.t('yakuUpgrades.note'))
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(1)
    expect(dialog.textContent).not.toContain('yakuUpgrades.')
  }
)
