import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const languages = [
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
]

for (const { language, width } of [
  ...languages.map(language => ({ language, width: 320 })),
  { language: 'en', width: 1280 },
]) {
  test(`victory markers fit and explain earned tiers at ${width}px in ${language}`, async ({
    page,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize({ width, height: width === 320 ? 568 : 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'tensho-archive',
        JSON.stringify({
          version: 1,
          state: {
            entries: {
              'decrees:river_tax': {
                key: 'decrees:river_tax',
                itemId: 'river_tax',
                category: 'decrees',
                isUnlocked: true,
                discoveredAt: 0,
                timesUsed: 8,
                timesWonWith: 8,
                wonStakeTiers: [1, 2, 3, 4, 5, 6, 7, 8],
              },
            },
            discoveryHistory: [],
          },
        })
      )
    })
    await page.goto(`/${language}/collection`)
    const card = page.locator('[data-archive-card="river_tax"]')
    await expect(card).toBeVisible()
    await expect(card.locator('[data-stake-victory="8"]')).toBeVisible()
    if (width > 320) {
      await card.focus()
      await card.press('Enter')
    } else await card.click()
    const markers = page.locator('[data-archive-victories]')
    await expect(markers).toBeVisible()
    await expect(markers.locator('[data-stake-victory]')).toHaveCount(8)
    const gold = copy.collection.stakeVictory.replace(
      '{{stake}}',
      copy.stakes.gold
    )
    await expect(
      markers.locator('[data-stake-victory="8"]')
    ).toHaveAccessibleName(gold)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(
      await markers
        .locator('[data-stake-victory]')
        .evaluateAll((nodes) =>
          nodes.every((el) => el.scrollWidth <= el.clientWidth + 1)
        )
    ).toBe(true)
    await markers.locator('[data-stake-victory="8"]').scrollIntoViewIfNeeded()
    await page.screenshot({
      path: info.outputPath(`stake-markers-${language}-${width}.png`),
    })
    await page.keyboard.press('Escape')
    await expect(markers).toBeHidden()
    await page.goto(`/${language}/achievements`)
    await page
      .locator('.pavilion-tab')
      .filter({ hasText: copy.achievements.categories.mastery })
      .click()
    const mastery = page.locator(
      '[data-achievement-card="archive_complete_plus_plus"]'
    )
    await expect(mastery.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '1'
    )
    expect(
      await mastery.getByRole('progressbar').getAttribute('aria-valuemax')
    ).not.toBe('0')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}
