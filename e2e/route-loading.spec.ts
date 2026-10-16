import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { readFileSync } from 'node:fs'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import { settleReveals } from './helpers/table'

// These checks inspect emitted chunks and a real installed service worker.
// The ordinary development server cannot establish either production property.
test.skip(
  process.env.TEST_PRODUCTION !== '1',
  'Requires a built production preview'
)

// Every routed screen ships in this one lazily loaded chunk: opening a screen
// streams one script, never a burst (see routedScreens.ts).
const chunk = /\/routedScreens-[^/]+\.js(?:\?|$)/
const saveKey = 'tensho-classic-run-v1'
const replay = readFileSync('e2e/fixtures/interactions/quad.json', 'utf8')
const file = (url: string) => new URL(url).pathname.split('/').at(-1)

/** A Classic run in progress, restored from a captured replay. */
async function seedRun(page: Page) {
  await page.addInitScript(
    ({ key, replay }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, replay)
    },
    { key: saveKey, replay }
  )
}

async function recordScriptBytes(page: Page, testInfo: TestInfo, name: string) {
  const resources = await page.evaluate(() =>
    (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((entry) => /\/assets\/.*\.js(?:\?|$)/.test(entry.name))
      .map((entry) => ({
        file: new URL(entry.name).pathname.split('/').at(-1),
        bytes: entry.decodedBodySize,
      }))
  )
  const totalBytes = resources.reduce((sum, entry) => sum + entry.bytes, 0)
  expect(totalBytes).toBeGreaterThan(0)
  await testInfo.attach(name, {
    body: JSON.stringify({ totalBytes, resources }, null, 2),
    contentType: 'application/json',
  })
}

test.describe('on-demand route code', () => {
  // Do not confuse the worker's intentional offline precache downloads with
  // scripts requested/evaluated by the current page.
  test.use({ serviceWorkers: 'block' })

  test('runs the entry without screen code, then serves every screen from one download', async ({
    page,
  }, testInfo) => {
    const scripts: string[] = []
    let documents = 0
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url())
      if (request.resourceType() === 'document') documents++
    })
    const html = await (await page.request.get('en/')).text()
    expect(html).not.toMatch(/routedScreens/)
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route(chunk, async (route) => {
      await held
      await route.continue()
    })
    try {
      await page.goto('en/', { waitUntil: 'commit' })
      // The entry runs and renders on its own; the screens follow on demand.
      await expect(page.getByTestId('route-loading')).toBeVisible()
      expect(scripts.map(file)).toEqual([
        expect.stringMatching(/^index-[\w-]+\.js$/),
        expect.stringMatching(/^routedScreens-[\w-]+\.js$/),
      ])
    } finally {
      release()
    }
    const menu = page.getByRole('heading', { name: 'TENSHO', exact: true })
    await expect(menu).toBeVisible()
    await recordScriptBytes(page, testInfo, 'menu-script-bytes')
    for (const [button, heading] of [
      ['Codex', /Codex/],
      ['Collection', /Collection|Archive of Hands/],
      ['Achievements', /Accolades/],
      ['Settings', /Settings/],
    ] as const) {
      await page.getByRole('button', { name: button, exact: true }).click()
      await expect(
        page.getByRole('heading', { name: heading, level: 1 })
      ).toBeVisible()
      await page.goBack()
      await expect(menu).toBeVisible()
    }
    await page.getByRole('button', { name: 'New Run', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/play$/)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    await settleReveals(page, 2_000)
    // Five screens and a new run: still the entry and that one download.
    expect(scripts).toHaveLength(2)
    expect(documents).toBe(1)
  })

  test("opens a run's table by deep link from the same single download", async ({
    page,
  }, testInfo) => {
    await seedRun(page)
    const scripts: string[] = []
    let documents = 0
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url())
      if (request.resourceType() === 'document') documents++
    })
    await page.goto('en/play')
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    expect(scripts.filter((url) => chunk.test(url))).toHaveLength(1)
    await recordScriptBytes(page, testInfo, 'table-script-bytes')
    await page.getByRole('button', { name: 'Exit', exact: true }).click()
    await page
      .getByRole('button', { name: 'Save and leave', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'TENSHO', exact: true })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Codex', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: /Codex/, level: 1 })
    ).toBeVisible()
    expect(scripts).toHaveLength(2)
    expect(documents).toBe(1)
  })

  test('shows localized, motion-safe feedback while a direct route is loading', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route(chunk, async (route) => {
      await held
      await route.continue()
    })
    try {
      await page.goto('es/codex', { waitUntil: 'commit' })
      const status = page.getByTestId('route-loading')
      await expect(status).toBeVisible()
      await expect(status).toHaveText(es.common.loading)
      expect(await status.locator('.animate-spin').count()).toBe(0)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath('route-loading-es.png'),
      })
    } finally {
      release()
    }
    await expect(
      page.getByRole('heading', { name: es.codex.title, level: 1 })
    ).toBeVisible()
    await expect(page.getByTestId('route-loading')).toHaveCount(0)
  })
})

test('opens unvisited screens, tile art, a saved run and guides offline after installation', async ({
  page,
  context,
}) => {
  // Installing the complete illustrated/audio offline bundle is intentional;
  // this is not a startup-speed benchmark or a worker-upgrade test.
  test.setTimeout(90_000)
  await seedRun(page)
  await page.goto('en/')
  await expect(
    page.getByRole('heading', { name: 'TENSHO', exact: true })
  ).toBeVisible()
  await expect
    .poll(
      () =>
        page.evaluate(
          async () =>
            (await navigator.serviceWorker.getRegistration())?.active?.state
        ),
      { timeout: 60_000 }
    )
    .toBe('activated')
  // Prompt-mode installation does not claim an already-open document. Match
  // the real update harness: the next navigation acquires the installed worker.
  await page.reload()
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(
    true
  )
  await context.setOffline(true)
  const workerAssets: string[] = []
  page.on('response', (response) => {
    if (response.fromServiceWorker()) workerAssets.push(response.url())
  })
  try {
    await page.goto('en/codex')
    await expect(
      page.getByRole('heading', { name: /Codex/, level: 1 })
    ).toBeVisible()
    expect(workerAssets.some((url) => chunk.test(url))).toBe(true)
    await page.goto('en/play')
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const art = page.locator('[data-play-zone="hand"] img')
    await expect(art.first()).toBeVisible()
    await expect
      .poll(() =>
        art.evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0
          )
        )
      )
      .toBe(true)
    expect(workerAssets.some((url) => /\/tiles\/[^/]+\.png$/.test(url))).toBe(
      true
    )
    // Play offline: a one-tile REDRAW sends it to the river for one Turn.
    const tile = page.locator('[data-play-zone="hand"] [data-play-tile]').last()
    const id = (await tile.getAttribute('data-play-tile'))!
    const redrawn = () =>
      page.evaluate(
        ({ key, id }) => {
          type Tile = { id: string }
          const { state } = JSON.parse(localStorage.getItem(key)!).snapshot
          return {
            inHand: state.handTiles.some((tile: Tile) => tile.id === id),
            inRiver: state.discards.some((tile: Tile) => tile.id === id),
            turns: state.handsRemaining as number,
          }
        },
        { key: saveKey, id }
      )
    const { turns } = await redrawn()
    await tile.click()
    await page.locator('[data-game-action="redraw"]').click()
    const played = { inHand: false, inRiver: true, turns: turns - 1 }
    await expect.poll(redrawn).toEqual(played)
    await page.reload()
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    expect(await redrawn()).toEqual(played)
    await page.goto('about/')
    await expect(
      page.getByRole('heading', { name: 'About Tensho: a Mahjong roguelike' })
    ).toBeVisible()
    await page
      .getByRole('link', { name: 'How to play', exact: true })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { name: 'How to play Tensho' })
    ).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
