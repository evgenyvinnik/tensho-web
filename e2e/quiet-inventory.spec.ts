import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const bookWords = {
  en: 'book',
  es: 'libro',
  fr: 'livre',
  it: 'libro',
  ru: 'книги',
  ja: '本のアイコン',
  ko: '책 아이콘',
  'zh-Hans': '书本图标',
  'zh-Hant': '書本圖示',
  tr: 'kitap',
  id: 'buku',
  th: 'หนังสือ',
  tl: 'aklat',
}

for (const [language, book] of Object.entries(bookWords)) {
  test(`empty inventory stays quiet and the book guide is discoverable (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const save = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1'))
    const before = await save()
    await expect(page.locator('[data-consumables-bar]')).toHaveCount(0)
    await expect(page.locator('.game-consumable')).toHaveCount(0)
    const hint = page.locator('[data-progressive-hint="guided-first-move-v2"]')
    await expect(hint).toBeVisible()
    await hint.scrollIntoViewIfNeeded()
    await expect(hint.locator('p')).toContainText(book)
    expect(
      await hint
        .locator('p')
        .evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    const guide = page.locator('[data-open-beginner-guide]')
    await expect(guide).toHaveAccessibleName(copy.gameplay.learnPatterns)
    await guide.scrollIntoViewIfNeeded()
    await expect(guide.locator('img')).toBeVisible()
    expect((await guide.boundingBox())!.width).toBeGreaterThanOrEqual(44)
    expect((await guide.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    if (isMobile) await guide.tap()
    else {
      await guide.focus()
      await page.keyboard.press('Enter')
    }
    const dialog = page.getByRole('dialog', {
      name: copy.gameplay.beginnerGuideTitle,
    })
    await expect(dialog).toBeVisible()
    await page.screenshot({ path: info.outputPath('book-guide.png') })
    if (isMobile)
      await dialog
        .getByRole('button', { name: copy.common.close, exact: true })
        .tap()
    else await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(guide).toBeFocused()
    expect(await save()).toBe(before)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}
