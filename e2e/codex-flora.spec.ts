import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of [
  'en',
  'es',
  'fr',
  'it',
  'ru',
  'ja',
  'ko',
  'zh-Hans',
  'zh-Hant',
  'id',
  'th',
  'tl',
  'tr',
]) {
  test(`current Flora rules are illustrated, localized and readable in ${language}`, async ({
    page,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width: 320, height: 568 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${language}/codex`)
    await page
      .locator('.pavilion-codex-mobile')
      .getByRole('button', { name: copy.codex.flora, exact: true })
      .click()
    const steps = page.locator('.pavilion-codex-steps')
    for (const [section, title, key, count] of [
      ['flowers', copy.flora.flowers, 'empowerment', 4],
      // The rebloom illustration, then the four awakened portraits.
      ['awakening', copy.flora.mutations.awakened, 'awakeningLifecycle', 5],
      ['seasons', copy.flora.seasons, 'distinction', 4],
      ['corruption', copy.flora.details.corruptedName, 'corruption', 4],
      [
        'interactions',
        copy.codexFlora.interactionsTitle,
        'interactionsIntro',
        8,
      ],
      ['catalysts', copy.codexFlora.catalystsTitle, 'catalystsCost', 4],
    ] as const) {
      await steps.getByRole('button', { name: title, exact: true }).click()
      const content = page.locator(`[data-codex-flora="${section}"]`)
      await expect(content).toBeVisible()
      await expect(content.locator('../..')).toHaveCSS('opacity', '1')
      await expect(content).toContainText(copy.codexFlora[key])
      if (section === 'interactions') {
        const recipes = content.locator('details')
        await expect(recipes).toHaveCount(4)
        for (const recipe of await recipes.all()) {
          await expect(recipe).not.toHaveAttribute('open')
          await recipe.locator('summary').focus()
          await page.keyboard.press('Enter')
          await expect(recipe).toHaveAttribute('open', '')
        }
      }
      await expect(content.locator('img')).toHaveCount(count)
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
          .locator('p, h3, summary')
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
        path: info.outputPath(`${section}-${language}-320.png`),
      })
    }
    await page.setViewportSize({ width: 1280, height: 800 })
    await steps
      .getByRole('button', { name: copy.flora.mutations.awakened, exact: true })
      .click()
    await expect(page.locator('[data-codex-flora="awakening"]')).toBeVisible()
    await expect(
      page.locator('[data-codex-flora="awakening"]').locator('../..')
    ).toHaveCSS('opacity', '1')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: info.outputPath(`awakening-${language}-1280.png`),
    })
    expect(
      await page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))
    ).toBeNull()
    expect(errors).toEqual([])
  })
}
