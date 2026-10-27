import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'ru', 'ja']) {
  test(`teaching illustrations decode and captions fit in ${language}`, async ({
    page,
    isMobile,
  }, info) => {
    test.setTimeout(90_000)
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 900 }
    )
    await page.goto(`${language}/codex`)

    for (const [category, kind] of [
      ['decrees', 'synergy'],
      ['flora', 'awakening'],
      ['progression', 'journey'],
    ]) {
      await page
        .locator('.pavilion-tab:visible')
        .filter({ hasText: copy.codex[category] })
        .click()
      if (kind === 'awakening') {
        await page
          .locator('.pavilion-codex-steps')
          .getByRole('button', {
            name: copy.flora.mutations.awakened,
            exact: true,
          })
          .click()
      }
      if (kind === 'synergy') {
        const guide = page.locator('[data-decree-build-guide]')
        await expect(guide).not.toHaveAttribute('open')
        await guide.locator('summary').click()
      }
      const figure = page.locator(`[data-teaching-art="${kind}"]`)
      await figure.scrollIntoViewIfNeeded()
      await expect(figure).toBeVisible()
      await expect
        .poll(
          () =>
            figure
              .locator('img')
              .evaluate((img: HTMLImageElement) => img.naturalWidth),
          { timeout: 30000 }
        )
        .toBe(960)
      await expect(figure.locator('img')).toHaveAttribute('alt', '')
      expect(
        await figure.evaluate((node) => {
          const bounds = node.getBoundingClientRect()
          return (
            bounds.left >= 0 &&
            bounds.right <= window.innerWidth + 1 &&
            [...node.querySelectorAll('figcaption, figcaption span')].every(
              (label) => label.scrollWidth <= label.clientWidth + 1
            )
          )
        })
      ).toBe(true)
      await figure.screenshot({ path: info.outputPath(`${kind}.png`) })
      if (language === 'en')
        await page.screenshot({ path: info.outputPath(`${kind}-context.png`) })
    }
  })
}
