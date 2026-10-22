import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SUPPORTED_LANGUAGES } from '../src/router/routeManifest'

for (const language of SUPPORTED_LANGUAGES) {
  test(`updated Codex reference is readable in ${language}`, async ({
    page,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({
      width: isMobile ? 320 : 1280,
      height: isMobile ? 568 : 800,
    })
    await page.goto(`${language}/codex`)
    const categories = page.locator(
      isMobile ? '.pavilion-codex-mobile' : '.pavilion-codex-sidebar'
    )
    const content = page.locator('.pavilion-codex-content')
    for (const [category, titleKey] of [
      ['tiles', 'titleTilesOverview'],
      ['tiles', 'titleWinds'],
      ['tiles', 'titleDragons'],
      ['handBuilding', 'titleQuads'],
      ['handBuilding', 'titleWinningHand'],
      ['howToPlay', 'tutorial.select'],
      ['howToPlay', 'tutorial.saving'],
      ['scoring', 'titleYakuIntro'],
      ['progression', 'titleActsRounds'],
      ['decrees', 'titleDecreeRarities'],
      ['flora', 'titleHierarchy'],
      ['strategy', 'titleMoreTips'],
      ['strategy', 'titleBiggerHand'],
    ]) {
      const title = titleKey.startsWith('tutorial.')
        ? copy.tutorial[titleKey.split('.')[1]].title
        : copy.codexReference[titleKey]
      const categoryButton = isMobile
        ? categories.getByRole('button', {
            name: copy.codex[category],
            exact: true,
          })
        : categories.getByRole('button').filter({
            has: page.getByText(copy.codex[category], { exact: true }),
          })
      await categoryButton.click()
      await page
        .locator('.pavilion-codex-steps')
        .getByRole('button', {
          name: title,
          exact: true,
        })
        .click()
      await expect(
        content.getByRole('heading', {
          name: title,
          exact: true,
        })
      ).toBeVisible()
      await expect(content).not.toContainText(/codexReference\.|tutorial\.|{{/)
      if (titleKey === 'tutorial.saving') {
        for (const key of ['saveLeave', 'resume', 'saved', 'retry'])
          await expect(content).toContainText(copy.classicSave[key])
        await expect(content).toContainText(copy.tutorial.saving.li3)
      }
      if (titleKey === 'titleBiggerHand') {
        const racks = content.locator('[data-codex-tile-groups]')
        await expect(racks).toHaveCount(2)
        for (const rack of await racks.all())
          await expect(rack.locator('img')).toHaveCount(14)
      }
      const hero = content.locator('[data-codex-category-hero]')
      await expect(hero.locator('img')).toHaveAttribute(
        'alt',
        `${copy.codex[category]}: ${title}`
      )
      expect(
        await hero.evaluate((element) => {
          const frame = element.getBoundingClientRect()
          const title = element.querySelector('h2')!.getBoundingClientRect()
          return title.top >= frame.top && title.bottom <= frame.bottom
        })
      ).toBe(true)
      expect(
        await content
          .locator('p, th, td, h2, h3')
          .evaluateAll((nodes) =>
            nodes.every((node) => node.scrollWidth <= node.clientWidth + 1)
          ),
        `${language}: ${titleKey}`
      ).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await expect
        .poll(() =>
          content.locator('img').evaluateAll((nodes) =>
            nodes.every((node) => {
              const image = node as HTMLImageElement
              return image.complete && image.naturalWidth > 0
            })
          )
        )
        .toBe(true)
      if (titleKey === 'titleYakuIntro')
        await page.screenshot({
          path: info.outputPath(`reference-${language}.png`),
        })
    }
    expect(errors).toEqual([])
    expect(
      await page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))
    ).toBeNull()
  })
}
