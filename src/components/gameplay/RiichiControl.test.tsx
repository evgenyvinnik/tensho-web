import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RiichiControl } from './RiichiControl'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import en from '../../i18n/locales/en.json'
import { useSettingsStore } from '../../stores/settingsStore'

beforeEach(() => useSettingsStore.setState({ reducedMotion: true }))

afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})

it('inspects only on request and never declares just by opening or closing', () => {
  const inspect = vi.fn(() => ({
      status: 'available' as const,
      reason: null,
      cost: 1 as const,
    })),
    onAction = vi.fn(() => ({ success: true, effects: [] }))
  render(
    <RiichiControl status="available" inspect={inspect} onAction={onAction} />
  )
  expect(inspect).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.riichiPledge.title }))
  expect(inspect).toHaveBeenCalled()
  expect(onAction).not.toHaveBeenCalled()
  expect(screen.getByText(en.riichiPledge.abandonNote)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onAction).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.riichiPledge.title }))
  fireEvent.click(screen.getByRole('button', { name: en.riichiPledge.declare }))
  expect(onAction).toHaveBeenCalledExactlyOnceWith('declareRiichi')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it.each([
  'gold',
  'hidden',
  'open',
  'boss',
  'complete',
  'inactive',
  'spent',
] as const)('explains %s and prevents a declaration', (reason) => {
  const status = reason === 'spent' ? 'spent' : 'available',
    onAction = vi.fn()
  render(
    <RiichiControl
      status={status}
      inspect={() => ({ status, reason, cost: 1 })}
      onAction={onAction}
    />
  )
  fireEvent.click(screen.getByRole('button'))
  expect(
    document.querySelector(`[data-riichi-reason="${reason}"]`)
  ).toHaveTextContent(en.riichiPledge[reason])
  const confirm = screen.queryByRole('button', {
    name: en.riichiPledge.declare,
  })
  if (reason === 'spent') expect(confirm).not.toBeInTheDocument()
  else expect(confirm).toBeDisabled()
  expect(onAction).not.toHaveBeenCalled()
})

it('offers explicit abandonment and keeps a stale failed action visible', () => {
  const onAction = vi.fn(() => ({ success: false, effects: [] }))
  render(
    <RiichiControl
      status="active"
      inspect={() => ({ status: 'active', reason: null, cost: 1 })}
      onAction={onAction}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: en.riichiPledge.active }))
  fireEvent.click(screen.getByRole('button', { name: en.riichiPledge.abandon }))
  expect(onAction).toHaveBeenCalledExactlyOnceWith('abandonRiichi')
  expect(screen.getByRole('alert')).toHaveTextContent(en.riichiPledge.failed)
})

it.each(SUPPORTED_LANGUAGES)(
  'provides every pledge explanation in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const [key, value] of Object.entries(en.riichiPledge)) {
      const translated = i18n.getResource(
        language,
        'translation',
        `riichiPledge.${key}`
      )
      expect(translated).toBeTruthy()
      if (language !== 'en') expect(translated).not.toBe(value)
    }
    render(
      <RiichiControl
        status="available"
        inspect={() => ({ status: 'available', reason: null, cost: 1 })}
        onAction={vi.fn()}
      />
    )
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('riichiPledge.title') })
    )
    expect(
      screen.getByRole('heading', { name: i18n.t('riichiPledge.title') })
    ).toBeVisible()
    expect(screen.getByText(i18n.t('riichiPledge.risk'))).toBeVisible()
    expect(
      screen.getByRole('button', { name: i18n.t('riichiPledge.declare') })
    ).toBeEnabled()
  }
)
