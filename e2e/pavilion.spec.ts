import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { openTable, selectTiles } from './helpers/table'

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
  test(`achievement copy is localized and fits a phone in ${language}`, async ({
    page,
  }, info) => {
    const locale = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const copy = locale.achievements
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(`${language}/achievements`)
    await expect(page.locator('.pavilion-heading h1')).toContainText(
      copy.shortTitle
    )
    const first = page.locator('[data-achievement-card="first_steps"]')
    await expect(first).toContainText(copy.firstSteps.name)
    await expect(first).toContainText(copy.firstSteps.description)
    await expect(page.locator('.pavilion-progress')).toContainText('0 / 31')
    for (const [category, award, kind, itemId] of [
      ['progression', 'victory', 'decrees', 'decree-blueprint'],
      ['cumulative', 'tile_master', 'charters', 'swift_hand'],
      ['cumulative', 'discard_artist', 'charters', 'wasteful_plenty'],
    ]) {
      await page
        .locator('.pavilion-tab')
        .filter({ hasText: copy.categories[category] })
        .click()
      const reward = page.locator(
        `[data-achievement-card="${award}"] [data-achievement-reward]`
      )
      await expect(reward).toHaveText(
        `${copy.unlocks}: ${locale[kind].items[itemId].name}`
      )
      await reward.scrollIntoViewIfNeeded()
      expect(
        await reward.evaluate(
          (el) =>
            el.scrollWidth <= el.clientWidth + 1 &&
            el.scrollHeight <= el.clientHeight + 1
        )
      ).toBe(true)
    }
    await page
      .locator('.pavilion-tab')
      .filter({ hasText: copy.categories.challenge })
      .click()
    await expect(page.locator('[data-achievement-card]')).toHaveCount(3)
    await expect(
      page.locator(
        '[data-achievement-card="rule_bender"], [data-achievement-card="rule_breaker"]'
      )
    ).toHaveCount(0)
    await page
      .locator('.pavilion-tab')
      .filter({ hasText: copy.categories.scoring })
      .click()
    await expect(
      page.locator('[data-achievement-card="score_100m"]')
    ).toContainText(copy.score100m.description)
    await page
      .locator('.pavilion-tab')
      .filter({ hasText: copy.categories.skill })
      .click()
    const collector = page.locator(
      '[data-achievement-card="charter_collector"]'
    )
    await expect(
      page.locator('[data-achievement-card="speed_run"]')
    ).toContainText(copy.speedRun.description)
    await expect(collector).toContainText(copy.charterCollector.description)
    await expect(
      page.locator('[data-achievement-card="wild_flush"]')
    ).toContainText(copy.wildFlush.description)
    await expect(
      page.locator('[data-achievement-card="shattered"]')
    ).toContainText(copy.shattered.description)
    const winds = page.locator('[data-achievement-card="keeper_of_winds"]')
    await expect(winds).toContainText(copy.keeperOfWinds.description)
    await winds.scrollIntoViewIfNeeded()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(
      await page
        .locator('.accolade-title, .accolade-description')
        .evaluateAll((nodes) =>
          nodes.every(
            (el) =>
              el.scrollWidth <= el.clientWidth + 1 &&
              el.scrollHeight <= el.clientHeight + 1
          )
        )
    ).toBe(true)
    await page.screenshot({
      path: info.outputPath(`achievements-${language}-320.png`),
    })
  })
}

for (const width of [320, 390, 1280]) {
  for (const route of ['codex', 'settings', 'achievements', 'collection']) {
    test(`illustrated ${route} fits ${width}px and retains its controls`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 800 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`en/${route}`)
      const shell = page.locator(`[data-pavilion="${route}"]`)
      await expect(shell).toBeVisible()
      await expect(shell.locator('h1')).toBeVisible()
      const background = shell.locator('[data-table-artwork]')
      await expect(background).toHaveCSS(
        'background-image',
        new RegExp(`${route}-background\\.webp`)
      )
      await background.evaluate(async (el) => {
        const src = getComputedStyle(el).backgroundImage.slice(5, -2)
        const image = new Image()
        image.src = src
        await image.decode()
        if (image.naturalWidth !== 1280)
          throw new Error('Unexpected background dimensions')
      })
      await shell
        .locator('.pavilion-emblem')
        .evaluate(async (img: HTMLImageElement) => {
          await img.decode()
        })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      expect(
        await shell
          .locator('.pavilion-body')
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      expect(
        await shell.locator('h1').evaluate((el) => {
          const r = el.getBoundingClientRect()
          return (
            r.left >= 0 &&
            r.right <= innerWidth &&
            el.scrollWidth <= el.clientWidth + 1
          )
        })
      ).toBe(true)
      await page.screenshot({ path: info.outputPath(`${route}-${width}.png`) })
      if (route === 'settings') {
        const mute = page.getByRole('switch', {
          name: 'Mute Music',
          exact: true,
        })
        const before = await mute.getAttribute('aria-checked')
        await mute.click()
        await expect(mute).toHaveAttribute(
          'aria-checked',
          before === 'true' ? 'false' : 'true'
        )
        await page.getByRole('button', { name: 'Fast', exact: true }).click()
        await expect(
          page.getByRole('button', { name: 'Fast', exact: true })
        ).toHaveAttribute('aria-pressed', 'true')
      }
      if (route === 'codex') {
        const active = shell.locator('[aria-current="step"]')
        const before = await active.getAttribute('aria-label')
        await page.getByRole('button', { name: 'Next', exact: true }).click()
        await expect(active).not.toHaveAttribute('aria-label', before!)
      }
      if (route === 'achievements') {
        await page.getByRole('button', { name: /Scoring/ }).click()
        await expect(
          page.locator('[data-achievement-card="score_10k"]')
        ).toContainText('10,000 points')
      }
      if (route === 'collection') {
        await page.locator('[data-archive-card]').first().click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
      }
    })
  }
}

test('a real tile play earns an illustrated toast, dismisses, and stays quiet on reload', async ({
  page,
}, info) => {
  // Seed only prior lifetime progress. The actual unlock is earned by a real
  // button-driven play; no runtime module imports or synthetic unlock events.
  await page.addInitScript(() => {
    if (!localStorage.getItem('tensho-achievements')) {
      localStorage.setItem(
        'tensho-achievements',
        JSON.stringify({
          version: 2,
          state: {
            stats: { totalTilesPlayed: 2498 },
            achievements: {
              deck_maximalist: {
                id: 'deck_maximalist',
                unlocked: true,
                seen: true,
              },
            },
          },
        })
      )
    }
  })
  await openTable(page)
  await selectTiles(page, 2)
  await page.locator('[data-game-action="play"]').click()
  const toast = page.locator('[data-achievement-toast="tile_master"]')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Tile Master')
  await toast
    .locator('.achievement-toast-art')
    .evaluate(async (img: HTMLImageElement) => {
      await img.decode()
    })
  expect(
    await toast.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return (
        r.left >= 0 &&
        r.right <= innerWidth &&
        el.scrollWidth <= el.clientWidth + 1
      )
    })
  ).toBe(true)
  await page.screenshot({ path: info.outputPath('achievement-earned.png') })
  await toast.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(toast).toHaveCount(0)
  await page.reload()
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  await expect(page.locator('[data-achievement-toast]')).toHaveCount(0)
})
