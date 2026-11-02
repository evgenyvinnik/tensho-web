import { expect, test } from '@playwright/test'

const EDITIONS = [
  'bonus',
  'mult',
  'wild',
  'glass',
  'steel',
  'stone',
  'gold',
  'lucky',
] as const

for (const width of [390, 1280]) {
  test(`Editions use finished tile art, and a Lucky tile shows its round's roll at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/en')
    await page.addScriptTag({
      type: 'module',
      content: `
      import { mountTileFrames } from '/e2e/fixtures/tile-frames.tsx';
      mountTileFrames();
    `,
    })
    await expect(page.locator('[data-frame-size]')).toHaveCount(3, {
      timeout: 20_000,
    })
    const art = (selector: string) =>
      page.locator(selector).evaluate(async (el) => {
        const images = el.querySelectorAll<HTMLImageElement>('img')
        const image = el.querySelector<HTMLImageElement>(
          '[data-tile-base-art]'
        )!
        await image.decode()
        return {
          images: images.length,
          src: new URL(image.src).pathname,
          face: image.getAttribute('data-tile-face'),
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        }
      })
    for (const size of ['small', 'medium', 'xlarge']) {
      const row = `[data-frame-size="${size}"]`
      // A plain tile is its ordinary face sprite.
      expect(await art(`${row} [data-frame-case="base"]`)).toMatchObject({
        images: 1,
        src: '/assets/Mahjong/file/png/tiles/Dots%20(5).png',
        face: null,
      })
      // An Edition is the whole tile painted in its material: one finished
      // artwork, with nothing laid over it outside a round.
      for (const name of EDITIONS) {
        const tile = `${row} [data-frame-case="${name}"]`
        expect(await art(tile)).toEqual({
          images: 1,
          src:
            name === 'stone'
              ? '/assets/tiles/stone.webp'
              : `/assets/tiles/${name}/pinzu_05.webp`,
          face: name === 'stone' ? 'stone' : 'finished',
          naturalWidth: 320,
          naturalHeight: 400,
        })
        await expect(page.locator(`${tile} [data-lucky-roll]`)).toHaveCount(0)
      }
      // In a round, a Lucky tile adds this round's roll on its lower face,
      // inside the tile. The smallest tiles have no room; details show it.
      const lucky = page.locator(`${row} [data-frame-case="lucky-round"]`)
      expect(await art(`${row} [data-frame-case="lucky-round"]`)).toMatchObject(
        { images: 1, src: '/assets/tiles/lucky/pinzu_05.webp' }
      )
      const roll = lucky.locator('[data-lucky-roll]')
      if (size === 'small') {
        await expect(roll).toHaveCount(0)
        continue
      }
      await expect(roll).toHaveAttribute('data-lucky-roll', '1.75:60')
      await expect(roll).toHaveText('×1.75+60')
      const bounds = await lucky.evaluate((el) => {
        const rect = (node: Element) => {
          const { left, right, top, bottom } = node.getBoundingClientRect()
          return { left, right, top, bottom }
        }
        const badge = el.querySelector('[data-lucky-roll]')!
        return {
          // The tile's own box, which the badge is placed in.
          tile: rect(el.querySelector('[data-tile-base-art]')!.parentElement!),
          badge: rect(badge),
          clipped: badge.scrollWidth > badge.clientWidth + 1,
        }
      })
      const { tile, badge } = bounds
      expect(
        badge.left >= tile.left - 0.5 &&
          badge.right <= tile.right + 0.5 &&
          badge.top >= tile.top - 0.5 &&
          badge.bottom <= tile.bottom + 0.5,
        `${size} roll badge ${JSON.stringify(bounds)} stays on its tile`
      ).toBe(true)
      expect(bounds.clipped).toBe(false)
    }
    await expect(
      page.locator('[data-frame-case="selected"] [role="button"]')
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.locator('[data-frame-case="selected"] [data-tile-index]')
    ).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath('tile-frames.png'),
      fullPage: true,
    })
  })
}
