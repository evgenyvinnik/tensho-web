import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  test(`edition frames follow the front face and Marks use finished art at ${width}px`, async ({
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
    for (const size of ['small', 'medium', 'xlarge']) {
      const row = page.locator(`[data-frame-size="${size}"]`)
      for (const name of ['foil', 'holographic', 'polychrome', 'negative']) {
        const tile = row.locator(`[data-frame-case="${name}"]`)
        const geometry = await tile.evaluate(async (el) => {
          const image = el.querySelector<HTMLImageElement>(
            '[data-tile-base-art]'
          )!
          await image.decode()
          const rect = image.getBoundingClientRect()
          const scale = Math.min(rect.width / 569, rect.height / 711)
          // Chromium's SVG bounding box ignores the clip, so it would include
          // frame art that bleeds past the face; read the viewport transform.
          const face = el
            .querySelector<SVGSVGElement>('[data-tile-front-face]')!
            .getScreenCTM()!
          return {
            left: face.e - (rect.left + (rect.width - 569 * scale) / 2),
            top: face.f - (rect.top + (rect.height - 711 * scale) / 2),
            width: (526 * face.a) / scale,
            height: (661 * face.d) / scale,
            padding: getComputedStyle(image).padding,
            clipRadius: el.querySelector('clipPath rect')!.getAttribute('rx'),
          }
        })
        expect(Math.abs(geometry.left)).toBeLessThan(0.1)
        expect(Math.abs(geometry.top)).toBeLessThan(0.1)
        expect(geometry.width).toBeCloseTo(526, 1)
        expect(geometry.height).toBeCloseTo(661, 1)
        expect(geometry.padding).toBe('0px')
        expect(geometry.clipRadius).toBe('60')
      }
      // A Mark is its finished tile artwork, with no frame laid over it.
      for (const name of [
        'bonus',
        'mult',
        'wild',
        'glass',
        'steel',
        'stone',
        'gold',
        'lucky',
      ]) {
        const tile = row.locator(`[data-frame-case="${name}"]`)
        const art = await tile.evaluate(async (el) => {
          const image = el.querySelector<HTMLImageElement>(
            '[data-tile-base-art]'
          )!
          await image.decode()
          return {
            src: new URL(image.src).pathname,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
          }
        })
        expect(art.src).toBe(
          name === 'stone'
            ? '/assets/tiles/stone.webp'
            : `/assets/tiles/${name}/pinzu_05.webp`
        )
        expect(art).toMatchObject({ naturalWidth: 320, naturalHeight: 400 })
        await expect(tile.locator('[data-tile-frame-plane]')).toHaveCount(0)
      }
      // A seal is intentionally outside the clipped face; base tiles have no frame.
      await expect(
        row.locator('[data-frame-case="base"] [data-tile-frame-plane]')
      ).toHaveCount(0)
      await expect(
        row.locator('[data-frame-case="seal"] [data-tile-art-layer="seal"]')
      ).toBeVisible()
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
