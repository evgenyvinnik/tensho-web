import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const fixture of [
  { language: 'en', width: 1280, height: 800, font: 16 },
  { language: 'es', width: 320, height: 568, font: 16 },
  { language: 'ru', width: 390, height: 844, font: 20 },
  { language: 'ja', width: 320, height: 568, font: 20 },
  { language: 'fr', width: 568, height: 320, font: 16 },
]) {
  test(`illustrated guide teaches current bonuses without clipping (${fixture.language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${fixture.language}.json`, 'utf8')
    )
    await page.setViewportSize(fixture)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${fixture.language}/play`)
    await page.evaluate((font) => {
      document.documentElement.style.fontSize = `${font}px`
    }, fixture.font)
    const open = page.locator('[data-open-beginner-guide]')
    await expect(open).toHaveAccessibleName(copy.gameplay.learnPatterns)
    expect((await open.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    if (isMobile) await open.tap()
    else await open.click()
    const dialog = page.getByRole('dialog', {
      name: copy.gameplay.beginnerGuideTitle,
    })
    await expect(dialog).toBeVisible()
    const guide = dialog.locator('[data-beginner-guide]')
    const scroll = dialog.locator('[data-popup-scroll]')
    await expect(guide.locator('img')).toHaveCount(18)
    await expect
      .poll(() =>
        guide
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0
            )
          )
      )
      .toBe(true)
    await expect(guide).toContainText(copy.gameplay.beginnerBonusHelp)
    await expect(guide.locator('[data-guide-bonus]')).toHaveText(
      [15, 30, 40, 65].map((points) =>
        copy.gameplay.beginnerShapeBonus.replace('{{points}}', String(points))
      )
    )
    // One scrolling surface: all teaching content, including the final action,
    // is reachable without a nested scroll box or horizontally clipped labels.
    expect(
      await guide.evaluate((node) => getComputedStyle(node).overflowY)
    ).toBe('visible')
    expect(
      await scroll.evaluate((node) => {
        const r = node.getBoundingClientRect()
        return (
          r.left >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight &&
          node.scrollWidth <= node.clientWidth + 1
        )
      })
    ).toBe(true)
    expect(
      await guide.evaluate((node) => {
        const r = node.getBoundingClientRect()
        return Array.from(
          node.querySelectorAll<HTMLElement>('h3,h4,p,span,button,img')
        ).every((el) => {
          const b = el.getBoundingClientRect()
          return (
            el.scrollWidth <= el.clientWidth + 1 &&
            b.left >= r.left - 1 &&
            b.right <= r.right + 1
          )
        })
      })
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('guide-intro.png') })
    for (const shape of await guide.locator('[data-guide-pattern]').all()) {
      await shape.scrollIntoViewIfNeeded()
      await expect(shape).toBeInViewport()
    }
    await page.screenshot({ path: testInfo.outputPath('guide-shapes.png') })
    const close = guide.getByRole('button', {
      name: copy.gameplay.showGuidedMove,
    })
    await close.scrollIntoViewIfNeeded()
    if (isMobile) await close.tap()
    else {
      await close.focus()
      await page.keyboard.press('Enter')
    }
    await expect(dialog).toHaveCount(0)
    await expect(open).toBeFocused()
    await expect(page.locator('[data-game-action="play"]')).toBeAttached()
  })
}
