import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { settleReveals } from './helpers/table'

// A new run seeds itself from the clock. This one's opening deal draws no
// Flower or Season, so the run starts owning nothing at all.
const EMPTY_DEAL = new Date(1791731728055)

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
  'tr',
  'id',
  'th',
  'tl',
]) {
  test(`an empty inventory stays quiet and the ? guide is one tap away (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.clock.setFixedTime(EMPTY_DEAL)
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    await settleReveals(page, 2_000)
    const save = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1')!)
    const before = await save()
    const { state, omens } = JSON.parse(before).snapshot
    expect(
      {
        flowers: state.flowerSystem.flowers.length,
        seasons: state.seasonSystem.seasonStack.length,
        orbs: state.celestialOrbs.length,
        scripts: state.voidScripts.length,
        omens: omens.activeTags.length,
      },
      'EMPTY_DEAL must deal a run that owns nothing; pick another time'
    ).toEqual({ flowers: 0, seasons: 0, orbs: 0, scripts: 0, omens: 0 })
    // Nothing owned: no rail, no empty slots, no placeholder copy.
    await expect(page.locator('[data-collectible-rail]')).toHaveCount(0)
    await expect(page.locator('[data-collectible-token]')).toHaveCount(0)
    // The guide is the ? beside Exit and Settings.
    const guide = page.getByTestId('gameplay-help')
    await expect(guide).toHaveAccessibleName(copy.gameplay.help)
    await expect(guide).toBeInViewport()
    expect((await guide.boundingBox())!.width).toBeGreaterThanOrEqual(44)
    expect((await guide.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    if (isMobile) await guide.tap()
    else {
      await guide.focus()
      await page.keyboard.press('Enter')
    }
    const dialog = page.getByRole('dialog', { name: copy.guide.title })
    await expect(dialog).toBeVisible()
    await page.screenshot({ path: info.outputPath('guide.png') })
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
