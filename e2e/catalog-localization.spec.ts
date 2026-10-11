import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

const examples = [
  ['decrees', 'decrees', 'decree-celestial-throne'],
  ['charters', 'charters', 'final_cut'],
  ['consumables', 'seals', 'seal_of_transmutation'],
  ['consumables', 'orbs', 'neptune_orb'],
  ['consumables', 'scripts', 'script_of_the_sigil'],
  ['omens', 'omens', 'interest_omen'],
  ['mandates', 'mandates', 'the_psychic'],
  ['packs', 'packs', 'arcana_mega'],
] as const

for (const language of ['id', 'it', 'ru', 'th', 'tl', 'tr']) {
  test(`catalog names and full rules remain readable without English fallback (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    test.setTimeout(60_000)
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((examples) => {
      // Discovery-only presentation fixture; this does not prove item earning.
      const entries = Object.fromEntries(
        examples.map(([category, , itemId]) => {
          const key = `${category}:${itemId}`
          return [
            key,
            {
              key,
              category,
              itemId,
              discoveredAt: Date.UTC(2026, 9, 11),
              timesUsed: 1,
              timesWonWith: 0,
              isUnlocked: true,
            },
          ]
        })
      )
      localStorage.setItem(
        'tensho-archive',
        JSON.stringify({ state: { entries, discoveryHistory: [] }, version: 1 })
      )
    }, examples)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const activate = (locator: Locator) =>
      isMobile ? locator.tap() : locator.click()
    await page.goto(new URL(`${language}/collection/`, baseURL).href)
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(
      page.getByRole('heading', {
        name: copy.decrees.items['decree-celestial-throne'].name,
        exact: true,
      })
    ).toBeVisible()
    const before = await page.evaluate(() =>
      localStorage.getItem('tensho-archive')
    )
    for (const [category, kind, id] of examples) {
      const item = copy[kind]?.items?.[id]
      expect(item?.name, `${language}:${kind}.${id}`).toBeTruthy()
      expect(item?.description, `${language}:${kind}.${id}`).toBeTruthy()
      const categoryName = copy.archiveCategories.items[category].name as string
      const escaped = categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      await activate(page.getByRole('button', { name: new RegExp(escaped) }))
      const card = page.getByRole('button').filter({
        has: page.getByRole('heading', { name: item.name, exact: true }),
      })
      await activate(card)
      const dialog = page.getByRole('dialog', { name: item.name, exact: true })
      await expect(dialog).toBeVisible()
      await expect(dialog).toContainText(item.description)
      expect(
        await dialog.evaluate((node) =>
          [node, ...node.querySelectorAll('h2, p')].every(
            (element) => element.scrollWidth <= element.clientWidth + 1
          )
        )
      ).toBe(true)
      const close = dialog.getByRole('button', {
        name: copy.common.close,
        exact: true,
      })
      await expect(close).toBeInViewport()
      if (id === 'decree-celestial-throne' || id === 'final_cut') {
        await dialog.screenshot({ path: info.outputPath(`${id}.png`) })
      }
      await activate(close)
      await expect(dialog).toHaveCount(0)
    }
    expect(
      await page.evaluate(() => localStorage.getItem('tensho-archive'))
    ).toBe(before)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
