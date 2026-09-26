import type { HTMLAttributes } from 'react'
import { createElement } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MenuScreen } from './MenuScreen'
import { preloadMenuAssets, preloadTileImages } from '../../utils/assets'
import { useUpdateStore } from '../../pwa/updateStore'

const { navigateTo, refresh } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('../../router', () => ({
  useAppNavigation: () => ({ navigateTo }),
  ROUTES: { SETTINGS: '/settings' },
}))
vi.mock('../../game/useClassicPersistence', () => ({
  useClassicPersistence: () => ({
    service: { refresh, hasLocalRun: false },
    disk: { kind: 'empty' },
  }),
}))
vi.mock('../../game/classicPersistenceApp', () => ({
  startConfiguredClassicRun: vi.fn(),
  classicDestination: vi.fn(),
}))
vi.mock('../../hooks/useAudio', () => ({ useAudio: () => ({}) }))
vi.mock('../ui/LanguageSelector', () => ({ LanguageSelector: () => null }))
vi.mock('../ui/SongNotification', () => ({ SongNotification: () => null }))
vi.mock('../menu/TableStyleButton', () => ({ TableStyleButton: () => null }))
vi.mock('../menu/ClassicResumeCard', () => ({ ClassicResumeCard: () => null }))
vi.mock('../ui/Tutorial', () => ({
  Tutorial: () => null,
  useTutorial: () => ({}),
}))
vi.mock('../../utils/assets', async (original) => ({
  ...(await original<typeof import('../../utils/assets')>()),
  preloadMenuAssets: vi.fn(),
  preloadTileImages: vi.fn(),
}))
// Test navigation/loading behavior; native browser checks cover animations.
vi.mock('@react-spring/web', () => {
  const spring = (options: {
    from?: Record<string, number>
    [key: string]: unknown
  }) =>
    Object.fromEntries(
      Object.entries(options.from ?? options).map(([key, value]) => [
        key,
        { get: () => value, to: (fn: (v: unknown) => string) => fn(value) },
      ])
    )
  return {
    animated: (tag: string) => (props: HTMLAttributes<HTMLElement>) =>
      createElement(tag, { ...props, style: undefined }),
    useSpring: spring,
    useSprings: (_count: number, options: Parameters<typeof spring>[0][]) =>
      options.map(spring),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  useUpdateStore.setState({ available: false, busy: false, error: null })
  vi.mocked(preloadMenuAssets).mockReturnValue(new Promise(() => {}))
  vi.mocked(preloadTileImages).mockReturnValue(new Promise(() => {}))
})
afterEach(() => vi.restoreAllMocks())

it('keeps navigation and update controls available while artwork is pending', () => {
  useUpdateStore.getState().announce(vi.fn())
  render(<MenuScreen />)
  expect(preloadMenuAssets).toHaveBeenCalled()
  expect(preloadTileImages).toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Update available' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  expect(navigateTo).toHaveBeenCalledWith('/settings')
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
})

it('keeps the menu usable when background artwork fails', async () => {
  const error = new Error('Artwork unavailable')
  const report = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(preloadTileImages).mockRejectedValue(error)
  await act(async () => render(<MenuScreen />))
  expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  expect(navigateTo).toHaveBeenCalledWith('/settings')
  expect(report).toHaveBeenCalledWith('Failed to load assets:', error)
})
