import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SUPPORTED_LANGUAGES } from '../src/router/routeManifest'

for (const language of SUPPORTED_LANGUAGES) {
  test(`current shop and payout rules fit the illustrated Codex in ${language}`, async ({
    page,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(`${language}/codex`)
    await page
      .locator('.pavilion-codex-mobile')
      .getByRole('button', { name: copy.codex.economy, exact: true })
      .click()
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 800 })
      for (const [section, title, key, images] of [
        ['shop', copy.shop.title, 'prices', 4],
        ['payout', copy.shop.payoutBreakdown, 'payout', 0],
        ['interest', copy.shop.payout.interest, 'interest', 1],
      ] as const) {
        await page
          .locator('.pavilion-codex-steps')
          .getByRole('button', { name: title, exact: true })
          .click()
        const content = page.locator(`[data-codex-economy="${section}"]`)
        await expect(content).toBeVisible()
        await expect(content).toContainText(copy.codexEconomy[key])
        await expect(content.locator('../..')).toHaveCSS('opacity', '1')
        await expect(content.locator('img')).toHaveCount(images)
        await expect
          .poll(() =>
            content.locator('img').evaluateAll((nodes) =>
              nodes.every((node) => {
                const img = node as HTMLImageElement
                return img.complete && img.naturalWidth > 0
              })
            )
          )
          .toBe(true)
        expect(
          await content
            .locator('p, h3')
            .evaluateAll((nodes) =>
              nodes.every((node) => node.scrollWidth <= node.clientWidth + 1)
            )
        ).toBe(true)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
        await content.scrollIntoViewIfNeeded()
        await page.screenshot({
          path: info.outputPath(`${section}-${language}-${width}.png`),
        })
      }
    }
    expect(
      await page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))
    ).toBeNull()
    expect(errors).toEqual([])
  })
}
