import { expect, test } from '@playwright/test'
import { clearReveals, openTable } from './helpers/table'
import scripts from '../docs/script-alpha-repair-manifest.json' with { type: 'json' }

test('editions stay recognizable in the shop build, offers and details', async ({
  page,
  isMobile,
}, info) => {
  await page.setViewportSize(
    isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openTable(page, '/en/play')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const orbPath = '/src/systems/CelestialOrbSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { RIVER_TAX } = await import(decreePath)
    const { CelestialOrbSystem, getCelestialOrbByYaku } = await import(orbPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    for (const d of state.decreeSystem.getOwnedDecrees())
      state.decreeSystem.removeDecree(d.instanceId)
    for (const edition of [
      undefined,
      'Foil',
      'Holographic',
      'Polychrome',
      'Negative',
    ]) {
      if (!state.decreeSystem.acquireDecree({ ...RIVER_TAX, edition }))
        throw new Error('Fixture capacity')
    }
    state.celestialOrbSystem.useOrb(
      CelestialOrbSystem.createCelestialOrbInstance(
        getCelestialOrbByYaku('Pairs')
      )
    )
    Object.assign(state, {
      phase: 'shop',
      lastCompletedRoundType: 'Small',
      gold: 100,
    })
    game.shop.open()
    const offers = game.shop.state.itemOfferings
    const offer = offers.find(
      (entry: { itemType: string }) => entry.itemType === 'Decree'
    )
    if (!offer) throw new Error('Missing shop fixture offer')
    offer.item = { ...RIVER_TAX }
    offer.edition = 'Holographic'
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await clearReveals(page)
  const build = page.locator('[data-shop-build]')
  await expect(build).toBeVisible()
  await expect(build.locator('[data-decree-edition-portrait]')).toHaveCount(4)
  await expect(page.locator('[data-decree-edition-frame]')).toHaveCount(0)
  await expect(page.locator('.decree-portrait__finish')).toHaveCount(0)
  for (const edition of ['Foil', 'Holographic', 'Polychrome', 'Negative']) {
    const portrait = build.locator(
      `[data-decree-edition-portrait="${edition}"]`
    )
    await expect(portrait).toBeVisible()
    await expect(portrait).toHaveAttribute(
      'src',
      `/assets/illustrations/decree-editions/river_tax/${edition.toLowerCase()}.webp`
    )
    expect(
      await portrait.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(256)
  }
  const pair = build.locator('[data-yaku-upgrade="Pairs"] img')
  await expect(pair).toHaveAttribute('src', /upgrades\/pairs.webp$/)
  expect(
    await pair.evaluate(async (img: HTMLImageElement) => {
      await img.decode()
      return img.naturalWidth > 0
    })
  ).toBe(true)
  await expect(
    page.locator(
      '[data-shop-offer] [data-decree-edition-portrait="Holographic"]'
    )
  ).toBeVisible()
  const foil = build
    .locator('button')
    .filter({ has: page.locator('[data-decree-edition-portrait="Foil"]') })
  await foil.click()
  const details = page.getByRole('dialog')
  await expect(details).toContainText('Foil')
  await expect(
    details.locator('[data-decree-edition-portrait="Foil"]')
  ).toBeVisible()
  expect(
    await details.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
  ).toBe(true)
  await page.keyboard.press('Escape')
  await page.getByText('Your build', { exact: true }).click()
  await page.mouse.move(1, 1)
  await build.screenshot({ path: info.outputPath('decree-editions-build.png') })
})

test('repaired Scripts and edition portraits retain real transparent backgrounds', async ({
  page,
}) => {
  await page.goto('/en/')
  const assets = [
    ...scripts.assets.map((asset) => ({
      path: asset.path.replace('public', ''),
    })),
    ...['foil', 'holographic', 'polychrome', 'negative'].map((id) => ({
      path: `/assets/illustrations/decree-editions/river_tax/${id}.webp`,
    })),
    // These previously retained alpha=1 in the top-left corner. Require exact
    // transparency after conversion, not just the presence of an alpha channel.
    ...['moonlit_seal', 'decree-toitoi-titan'].map((id) => ({
      path: `/assets/illustrations/decree-editions/${id}/holographic.webp`,
    })),
  ]
  for (const asset of assets) {
    const result = await page.evaluate(async ({ path }) => {
      const image = new Image()
      image.src = path
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(image, 0, 0)
      const alphaAt = (x: number, y: number) =>
        context.getImageData(x, y, 1, 1).data[3]
      const edge = canvas.width - 1
      return {
        corners: [
          alphaAt(0, 0),
          alphaAt(edge, 0),
          alphaAt(0, edge),
          alphaAt(edge, edge),
        ],
      }
    }, asset)
    expect(result.corners, asset.path).toEqual([0, 0, 0, 0])
  }
})
