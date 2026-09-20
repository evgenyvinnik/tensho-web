import { act, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { createInstance } from 'i18next'
import { afterEach, expect, it, vi } from 'vitest'
import en from '../../i18n/locales/en.json'
import es from '../../i18n/locales/es.json'
import { useSettingsStore } from '../../stores/settingsStore'
import { RouteLoading } from './RouteLoading'

afterEach(() => {
  act(() => useSettingsStore.setState({ reducedMotion: false }))
  vi.restoreAllMocks()
})

it.each(['en', 'es'])(
  'announces localized loading in %s without suspending, and responds to app motion settings',
  async (lng) => {
    const i18n = createInstance()
    await i18n.init({
      lng,
      resources: { en: { translation: en }, es: { translation: es } },
    })
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <RouteLoading />
      </I18nextProvider>
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      lng === 'en' ? en.common.loading : es.common.loading
    )
    expect(container.querySelectorAll('.animate-spin')).toHaveLength(2)
    act(() => useSettingsStore.setState({ reducedMotion: true }))
    expect(container.querySelectorAll('.animate-spin')).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  }
)

it('honors system reduced motion on its first render', () => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  const { container } = render(<RouteLoading />)
  expect(screen.getByRole('status')).toBeVisible()
  expect(container.querySelectorAll('.animate-spin')).toHaveLength(0)
})
