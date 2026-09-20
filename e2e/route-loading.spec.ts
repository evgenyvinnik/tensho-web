import { test, expect, type Page, type TestInfo } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

// These checks inspect emitted chunks and a real installed service worker.
// The ordinary development server cannot establish either production property.
test.skip(
  process.env.TEST_PRODUCTION !== '1',
  'Requires a built production preview'
)

const chunk = (screen: string) => new RegExp(`/${screen}-[^/]+\\.js(?:\\?|$)`)
const saveKey = 'tensho-table-loop-v1'

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

  test('loads only the visited screens and navigates without a document reload', async ({
    page,
  }, testInfo) => {
    const scripts: string[] = []
    let documents = 0
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url())
      if (request.resourceType() === 'document') documents++
    })
    await page.goto('en/')
    await expect(
      page.getByRole('heading', { name: 'TENSHO', exact: true })
    ).toBeVisible()
    expect(scripts.some((url) => chunk('MenuScreen').test(url))).toBe(true)
    await recordScriptBytes(page, testInfo, 'menu-script-bytes')
    for (const name of [
      'GameplayScreen',
      'TableLoopScreen',
      'ShopScreen',
      'GameOverScreen',
      'AchievementsScreen',
      'CodexScreen',
      'CollectionScreen',
      'SettingsScreen',
    ]) {
      expect(
        scripts.some((url) => chunk(name).test(url)),
        name
      ).toBe(false)
    }
    await page.getByRole('button', { name: /Codex/ }).click()
    await expect(
      page.getByRole('heading', { name: /Codex/, level: 1 })
    ).toBeVisible()
    expect(scripts.some((url) => chunk('CodexScreen').test(url))).toBe(true)
    expect(scripts.some((url) => chunk('TableLoopScreen').test(url))).toBe(
      false
    )
    await page.goBack()
    await page
      .getByRole('button', { name: 'Table Loop (experiment)', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: en.tableLoop.start.title })
    ).toBeVisible()
    expect(scripts.some((url) => chunk('TableLoopScreen').test(url))).toBe(true)
    expect(documents).toBe(1)
  })

  test('opens Table Loop without downloading the menu or Classic screens', async ({
    page,
  }, testInfo) => {
    const scripts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url())
    })
    await page.goto('en/table-loop?seed=7')
    await expect(
      page.getByRole('heading', { name: en.tableLoop.start.title })
    ).toBeVisible()
    expect(scripts.some((url) => chunk('TableLoopScreen').test(url))).toBe(true)
    for (const name of [
      'MenuScreen',
      'GameplayScreen',
      'ShopScreen',
      'CodexScreen',
    ]) {
      expect(
        scripts.some((url) => chunk(name).test(url)),
        name
      ).toBe(false)
    }
    await recordScriptBytes(page, testInfo, 'table-loop-script-bytes')
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
    await page.route(chunk('TableLoopScreen'), async (route) => {
      await held
      await route.continue()
    })
    try {
      await page.goto('es/table-loop?seed=7', { waitUntil: 'commit' })
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
      page.getByRole('heading', { name: es.tableLoop.start.title })
    ).toBeVisible()
    await expect(page.getByTestId('route-loading')).toHaveCount(0)
  })

  test('recovers from a failed chunk without deleting the saved run', async ({
    page,
  }) => {
    await page.goto('en/table-loop?seed=7')
    await page.locator('[data-testid^="table-decree-"]').first().click()
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    const saved = await page.evaluate(
      (key) => localStorage.getItem(key),
      saveKey
    )
    expect(JSON.parse(saved!).actions).toHaveLength(1)
    await page.route(chunk('CodexScreen'), (route) => route.abort('failed'))
    await page.goto('en/codex')
    await expect(
      page.getByRole('heading', { name: 'Oops! Something went wrong' })
    ).toBeVisible()
    expect(
      await page.evaluate((key) => localStorage.getItem(key), saveKey)
    ).toBe(saved)
    await page.unroute(chunk('CodexScreen'))
    await page.getByRole('button', { name: 'Try Again', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: /Codex/, level: 1 })
    ).toBeVisible()
    expect(
      await page.evaluate((key) => localStorage.getItem(key), saveKey)
    ).toBe(saved)
    await page.goto('en/table-loop?seed=7')
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    expect(
      await page.evaluate((key) => localStorage.getItem(key), saveKey)
    ).toBe(saved)
  })
})

test('loads previously unvisited screens, scroll art and guides offline after installation', async ({
  page,
  context,
}) => {
  // Installing the complete illustrated/audio offline bundle is intentional;
  // this is not a startup-speed benchmark or a worker-upgrade test.
  test.setTimeout(90_000)
  await page.goto('en/')
  await expect(
    page.getByRole('heading', { name: 'TENSHO', exact: true })
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), {
      timeout: 60_000,
    })
    .toBe(true)
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
    expect(workerAssets.some((url) => chunk('CodexScreen').test(url))).toBe(
      true
    )
    await page.goto('en/table-loop?seed=7')
    await expect(
      page.getByRole('heading', { name: en.tableLoop.start.title })
    ).toBeVisible()
    expect(workerAssets.some((url) => chunk('TableLoopScreen').test(url))).toBe(
      true
    )
    const art = page.locator('img[src*="illustrations/table-loop/"]')
    await expect(art).toHaveCount(3)
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
    expect(
      workerAssets.filter((url) =>
        /illustrations\/table-loop\/.*\.png/.test(url)
      ).length
    ).toBeGreaterThanOrEqual(3)
    await page.locator('[data-testid^="table-decree-"]').first().click()
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    const saved = await page.evaluate(
      (key) => localStorage.getItem(key),
      saveKey
    )
    await page.reload()
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    expect(
      await page.evaluate((key) => localStorage.getItem(key), saveKey)
    ).toBe(saved)
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
