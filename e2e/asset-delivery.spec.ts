import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

test('serves every delivery image byte-for-byte and retains legacy source URLs', async ({
  request,
  baseURL,
}) => {
  const sources: string[] = JSON.parse(
    readFileSync('scripts/illustration-sources.json', 'utf8')
  )
  // Bounded batches avoid saturating a hosted origin. No user browser/save state.
  for (let index = 0; index < sources.length; index += 4) {
    await Promise.all(
      sources.slice(index, index + 4).map(async (name) => {
        const source = `assets/illustrations/${name}`
        const legacy = await request.head(new URL(source, baseURL).href)
        expect(legacy.status(), source).toBe(200)
        expect(legacy.headers()['content-type'], source).toContain('image/png')
        const copies = name.startsWith('site/')
          ? [768, 1536].map((size) => source.replace('.png', `-${size}.webp`))
          : [source.replace('.png', '.webp')]
        for (const path of copies) {
          const response = await request.get(new URL(path, baseURL).href)
          expect(response.status(), path).toBe(200)
          expect(response.headers()['content-type'], path).toContain(
            'image/webp'
          )
          const hash = (body: Buffer) =>
            createHash('sha256').update(body).digest('hex')
          expect(hash(await response.body()), path).toBe(
            hash(readFileSync(`public/${path}`))
          )
        }
      })
    )
  }
})

for (const [width, dpr, expectedSize] of [
  [320, 1, 768],
  [320, 2, 768],
  [1440, 2, 1536],
] as const) {
  test(`public hero chooses a compact image at ${width}px/${dpr}x`, async ({
    browser,
    baseURL,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: dpr,
      javaScriptEnabled: false,
      serviceWorkers: 'block',
    })
    try {
      const page = await context.newPage()
      const images: string[] = []
      page.on('request', (request) => {
        if (request.resourceType() === 'image') images.push(request.url())
      })
      await page.goto(new URL('about/', baseURL).href)
      const hero = page.locator('.hero figure img')
      await expect
        .poll(() =>
          hero.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
          )
        )
        .toBe(true)
      const src = await hero.evaluate((img: HTMLImageElement) => img.currentSrc)
      expect(src).toContain(`tensho-table-story-${expectedSize}.webp`)
      expect(
        images.filter((url) => url.includes('tensho-table-story'))
      ).toEqual([src])
      const response = await context.request.get(src)
      expect(response.headers()['content-type']).toContain('image/webp')
      expect((await response.body()).length).toBeLessThan(350_000)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      await hero.screenshot({ path: testInfo.outputPath('hero.png') })
    } finally {
      await context.close()
    }
  })
}
