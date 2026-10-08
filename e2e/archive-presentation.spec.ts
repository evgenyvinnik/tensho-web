import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['es', 'ru']) {
  test(`Archive portraits, rarity and costs remain localized and read-only (${language})`, async ({
    page,
    isMobile,
    baseURL,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // Exercise the cold-load fallback: a slow/blocked theme font must not
    // spread Cyrillic text or change the layout underneath an interaction.
    if (language === 'ru') {
      await page.route('**/assets/*.ttf', (route) => route.abort())
    }
    await page.addInitScript(() => {
      if (localStorage.getItem('tensho-archive')) return
      // Presentation-only discovery fixture, not proof of earning these items.
      const entries = Object.fromEntries(
        [
          ['decrees', 'decree-blueprint'],
          ['charters', 'plentiful_stock'],
          ['consumables', 'script_of_ectoplasm'],
        ].map(([category, itemId]) => {
          const key = `${category}:${itemId}`
          return [
            key,
            {
              key,
              category,
              itemId,
              discoveredAt: Date.UTC(2026, 8, 20, 12),
              timesUsed: 12345,
              timesWonWith: 1234,
              isUnlocked: true,
            },
          ]
        })
      )
      localStorage.setItem(
        'tensho-archive',
        JSON.stringify({ state: { entries, discoveryHistory: [] }, version: 1 })
      )
    })
    const activate = (node: Locator) => (isMobile ? node.tap() : node.click())
    const card = (name: string) =>
      page
        .getByRole('button')
        .filter({ has: page.getByRole('heading', { name, exact: true }) })
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/collection`)
    const blueprint = card(copy.decrees.items['decree-blueprint'].name)
    await expect(blueprint).toBeVisible()
    const expectCardFits = async (node: Locator) => {
      expect(
        await node.evaluate(
          (element) => element.scrollWidth <= element.clientWidth
        )
      ).toBe(true)
      await expect(node.locator('[data-archive-card-stats]')).toBeVisible()
      const lock = node.locator('[data-archive-card-lock]')
      if (await lock.count()) {
        const notice = await lock.boundingBox()
        const stats = await node
          .locator('[data-archive-card-stats]')
          .boundingBox()
        expect(notice!.y).toBeGreaterThanOrEqual(stats!.y + stats!.height)
      }
    }
    await expectCardFits(blueprint)
    await blueprint.screenshot({ path: info.outputPath('blueprint-card.png') })
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    if (language === 'ru') {
      expect(
        await page
          .locator('body')
          .evaluate((node) => getComputedStyle(node).fontFamily)
      ).toMatch(/^system-ui/)
    }
    const before = await page.evaluate(() =>
      localStorage.getItem('tensho-archive')
    )
    await activate(blueprint)
    let dialog = page.getByRole('dialog')
    const image = dialog.locator('img[src$="/blueprint.webp"]')
    await expect(image).toBeVisible()
    expect(
      await image.evaluate(async (node: HTMLImageElement) => {
        await node.decode()
        return node.naturalWidth
      })
    ).toBe(512)
    await expect(dialog.locator('[data-archive-rarity]')).toHaveText(
      copy.shop.ui.rarity_rare
    )
    await expect(dialog).toHaveAccessibleName(
      copy.decrees.items['decree-blueprint'].name
    )
    for (const value of await dialog
      .locator('[data-archive-stat-value]')
      .all()) {
      const size = await value.evaluate((node) => {
        const text = document.createRange()
        text.selectNodeContents(node)
        return {
          lines: text.getClientRects().length,
          textWidth: text.getBoundingClientRect().width,
          available: node.clientWidth,
        }
      })
      expect(size.lines).toBe(1)
      expect(size.textWidth).toBeLessThanOrEqual(size.available)
    }
    const stats = dialog.locator('[data-archive-stats] > div')
    const first = await stats.nth(0).boundingBox()
    const second = await stats.nth(1).boundingBox()
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    if (isMobile)
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height)
    else expect(second!.y).toBe(first!.y)
    await dialog.screenshot({ path: info.outputPath('blueprint-archive.png') })
    await activate(
      dialog.getByRole('button', { name: copy.common.close, exact: true })
    )

    for (const [category, itemId, name] of [
      ['charters', 'plentiful_stock', copy.charters.items.plentiful_stock.name],
      [
        'consumables',
        'script_of_ectoplasm',
        copy.scripts.items.script_of_ectoplasm.name,
      ],
    ]) {
      // Category navigation must remain in the chosen language on a phone too.
      const categoryButton = page.getByRole('button', {
        name: new RegExp(copy.archiveCategories.items[category].name),
      })
      await activate(categoryButton)
      await expect(categoryButton).toContainText(
        copy.archiveCategories.items[category].name
      )
      const itemCard = card(name)
      await expectCardFits(itemCard)
      await activate(itemCard)
      dialog = page.getByRole('dialog')
      await expect(dialog.locator('[data-archive-rarity]')).toHaveText(
        copy.shop.ui.rarity_rare
      )
      await expect(dialog).toContainText(copy.collection.discovered)
      const expectedDate = await page.evaluate(
        (lang) => new Date(Date.UTC(2026, 8, 20, 12)).toLocaleDateString(lang),
        language
      )
      await expect(dialog.locator('[data-archive-discovery-date]')).toHaveText(
        expectedDate
      )
      if (category === 'consumables') {
        const cost = dialog.locator('[data-archive-script-cost]')
        await expect(cost).toHaveText(
          copy.consumableUse.penalty_lose_hand_size.replace('{{count}}', '1')
        )
        await cost.scrollIntoViewIfNeeded()
      }
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await expect(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      ).toBeVisible()
      await dialog.screenshot({ path: info.outputPath(`${itemId}.png`) })
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
    }
    expect(
      await page.evaluate(() => localStorage.getItem('tensho-archive'))
    ).toBe(before)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
  })
}
