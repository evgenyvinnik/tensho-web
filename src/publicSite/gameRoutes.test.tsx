import { readFileSync } from 'node:fs'
import { afterEach, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { gameShellEntries, gameRouteRobots } from './gameRoutes'
import { SUPPORTED_LANGUAGES, ROUTES } from '../router/routeManifest'
import { useGameRouteIndexing } from '../router/useGameRouteIndexing'

afterEach(() => {
  document.head
    .querySelectorAll('meta[name="robots"]')
    .forEach((el) => el.remove())
})

it('emits every known language/screen from one route manifest, not unknown routes', () => {
  const shell = readFileSync('index.html', 'utf8')
  const entries = gameShellEntries(shell)
  expect(entries.size).toBe(130)
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const route of Object.values(ROUTES)) {
      const path = [lang, route].filter(Boolean).join('/')
      const html = entries.get(`${path}/index.html`)!
      const doc = new DOMParser().parseFromString(html, 'text/html')
      expect(doc.querySelectorAll('meta[name="robots"]')).toHaveLength(1)
      expect(
        doc.querySelector('meta[name="robots"]')?.getAttribute('content')
      ).toBe(route ? 'noindex, follow' : 'index, follow')
      expect(
        doc.querySelector('script[type="module"]')?.getAttribute('src')
      ).toBe('/src/main.tsx')
      expect(doc.querySelector('#root')).not.toBeNull()
      // Locale entry shells are not invented translated editorial landing pages.
      expect(
        doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
      ).toBe('https://evgenyvinnik.github.io/tensho-web/')
    }
  }
  expect(entries.has('missing/index.html')).toBe(false)
  expect(entries.has('en/missing/index.html')).toBe(false)
  expect(entries.has('about/index.html')).toBe(false)
})

it('preserves built entry chunks, base paths, preload and PWA references byte-for-byte', () => {
  const shell =
    '<html><head><meta name="robots" content="index, follow"><link rel="manifest" href="/game/manifest.webmanifest"><link rel="modulepreload" href="/game/assets/dependency.js"></head><body><div id="root"></div><script type="module" src="/game/assets/entry.js"></script></body></html>'
  const entries = gameShellEntries(shell)
  expect(entries.get('en/index.html')).toBe(shell)
  expect(entries.get('es/play/index.html')).toBe(
    shell.replace('index, follow', 'noindex, follow')
  )
})

it('refuses a missing or ambiguous robots tag instead of silently publishing wrong metadata', () => {
  expect(() => gameShellEntries('<html></html>')).toThrow(/robots/i)
  expect(() =>
    gameShellEntries(
      '<meta name="robots" content="index"><meta name="robots" content="noindex">'
    )
  ).toThrow(/robots/i)
})

it.each(['/', '/en', '/en/', '/zh-Hant/', '/ru'])(
  'allows menu indexing at %s',
  (path) => {
    expect(gameRouteRobots(path)).toBe('index, follow')
  }
)

it.each([
  '/en/play',
  '/en/play/',
  '/es/shop',
  '/ru/game-over',
  '/ja/table-loop',
  '/en/settings',
  '/en/collection',
  '/en/codex',
  '/en/achievements',
  '/en/tutorial',
  '/unknown',
  '/en/unknown',
])('excludes state/reference and unknown route %s', (path) => {
  expect(gameRouteRobots(path)).toBe('noindex, follow')
})

it('updates one robots tag on menu → play → menu navigation without touching other metadata', () => {
  const title = document.title
  const { rerender } = renderHook(({ path }) => useGameRouteIndexing(path), {
    initialProps: { path: '/en' },
  })
  const robots = () =>
    document.head.querySelectorAll<HTMLMetaElement>('meta[name="robots"]')
  expect(robots()).toHaveLength(1)
  expect(robots()[0].content).toBe('index, follow')
  rerender({ path: '/en/play' })
  expect(robots()).toHaveLength(1)
  expect(robots()[0].content).toBe('noindex, follow')
  rerender({ path: '/ru/' })
  expect(robots()[0].content).toBe('index, follow')
  expect(document.title).toBe(title)
})
