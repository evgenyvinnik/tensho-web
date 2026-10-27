import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ResultArtwork } from './ResultArtwork'
import { useSettingsStore } from '../../stores/settingsStore'

beforeEach(() => {
  useSettingsStore.setState({ reducedMotion: false, animationSpeed: 'normal' })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  useSettingsStore.setState({ reducedMotion: false, animationSpeed: 'normal' })
})

it('waits for the victory image before adding only decorative effects', () => {
  const { container } = render(<ResultArtwork kind="victory" />)
  const art = container.querySelector('img')!
  expect(art).toHaveAttribute(
    'src',
    expect.stringContaining('/results/victory.webp')
  )
  expect(art).toHaveAttribute('alt', '')
  expect(art).toHaveAttribute('width', '960')
  expect(art).toHaveAttribute('height', '320')
  expect(container.querySelector('[data-result-celebration]')).toBeNull()
  fireEvent.load(art)
  const effects = container.querySelector('[data-result-celebration]')!
  expect(effects).toHaveAttribute('aria-hidden', 'true')
  expect(effects.querySelectorAll('.result-artwork__petal')).toHaveLength(6)
  expect(effects.querySelectorAll('button, a, [tabindex], video')).toHaveLength(
    0
  )
  fireEvent.error(art)
  expect(container.querySelector('[data-result-celebration]')).toBeNull()
})

it.each(['defeat', 'endlessCompletion'] as const)(
  'keeps %s artwork static',
  (kind) => {
    const { container } = render(<ResultArtwork kind={kind} />)
    fireEvent.load(container.querySelector('img')!)
    expect(container.querySelector('[data-result-celebration]')).toBeNull()
  }
)

it.each(['fast', 'normal', 'slow'] as const)(
  'bounds every effect below five seconds at %s speed',
  (animationSpeed) => {
    useSettingsStore.setState({ animationSpeed })
    const { container } = render(<ResultArtwork kind="victory" />)
    fireEvent.load(container.querySelector('img')!)
    const effects = container.querySelector<HTMLElement>(
      '[data-result-celebration]'
    )!
    const duration = Number.parseFloat(
      effects.style.getPropertyValue('--celebration-duration')
    )
    expect(duration).toBeGreaterThan(0)
    expect(duration).toBeLessThan(5000)
    for (const petal of effects.querySelectorAll<HTMLElement>(
      '.result-artwork__petal'
    )) {
      expect(
        Number.parseFloat(petal.style.animationDelay) +
          Number.parseFloat(petal.style.animationDuration)
      ).toBeCloseTo(duration)
    }
  }
)

it('removes active effects when the in-game reduced-motion setting changes', () => {
  const { container } = render(<ResultArtwork kind="victory" />)
  fireEvent.load(container.querySelector('img')!)
  expect(container.querySelector('[data-result-celebration]')).not.toBeNull()
  act(() => useSettingsStore.setState({ reducedMotion: true }))
  expect(container.querySelector('[data-result-celebration]')).toBeNull()
  expect(container.querySelector('img')).toBeInTheDocument()
})

it('respects the system preference even with the app setting off', () => {
  const media = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...media(query),
    matches: query === '(prefers-reduced-motion: reduce)',
  }))
  const { container } = render(<ResultArtwork kind="victory" />)
  fireEvent.load(container.querySelector('img')!)
  expect(container.querySelector('[data-result-celebration]')).toBeNull()
})
