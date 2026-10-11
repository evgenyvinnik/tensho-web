import { expect, test, type Locator } from '@playwright/test'

// Public UI only: this runs unchanged on development, Pages-path preview and
// the deployed build. No engine imports or inventory grants are required.
for (const language of ['en', 'es']) {
  test(`Table Loop keeps the rack still and reveals the selected pair slot (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const activate = (target: Locator) =>
      isMobile ? target.tap() : target.click()
    await page.goto(new URL(`${language}/table-loop?seed=7`, baseURL).href)
    await activate(page.getByTestId('table-decree-echoing_bamboo'))
    const actions = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-table-loop-v1') ?? 'null')
            ?.actions
      )
    await expect
      .poll(actions)
      .toEqual([{ type: 'chooseStarter', decree: 'echoing_bamboo' }])
    const initialActions = await actions()
    const tiles = page.locator('[data-testid^="rack-tile-"]')
    await expect(tiles).toHaveCount(12)
    await page.evaluate(() => document.fonts.ready)
    const rack = page.getByTestId('table-loop-rack')
    const finish = page.getByTestId('table-loop-finish')
    await expect(rack).toBeInViewport({ ratio: 1 })
    await expect(finish).toBeInViewport({ ratio: 1 })
    const identities = await tiles.evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.getAttribute('data-testid')!,
        face: node.querySelector('img')!.getAttribute('src')!,
      }))
    )
    const first = identities.find((tile, i) =>
      identities.some((other, j) => j > i && other.face === tile.face)
    )
    expect(first, 'seed 7 contains a natural pair').toBeDefined()
    const pair = identities
      .filter((tile) => tile.face === first!.face)
      .slice(0, 2)
    const positions = () =>
      tiles.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect()
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }
        })
      )
    const initial = await positions()
    for (const tile of pair) {
      await activate(page.getByTestId(tile.id))
      await expect(page.getByTestId(tile.id)).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(await positions()).toEqual(initial)
      expect(await actions()).toEqual(initialActions)
    }
    const slot = page.getByTestId('table-slot-4')
    await expect(slot).toBeEnabled()
    // Do not scroll the slot from the test: the game must reveal it itself.
    await expect(slot).toBeInViewport({ ratio: 1 })
    await expect(rack).toBeInViewport({ ratio: 1 })
    await expect(finish).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: info.outputPath('pair-ready.png') })
    await activate(slot)
    await expect(slot.locator('img')).toHaveCount(2)
    await expect(page.getByTestId('causal-chain')).toBeVisible()
    await expect(tiles).toHaveCount(12)
    await expect
      .poll(actions)
      .toEqual([
        ...initialActions,
        {
          type: 'place',
          slot: 4,
          tiles: [expect.any(Number), expect.any(Number)],
        },
      ])
    const placedActions = await actions()
    await page.reload()
    await expect(slot.locator('img')).toHaveCount(2)
    await expect(tiles).toHaveCount(12)
    expect(await actions()).toEqual(placedActions)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
