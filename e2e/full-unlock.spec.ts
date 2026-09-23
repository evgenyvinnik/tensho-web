import { expect, test, type Page } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

async function profile(page: Page) {
  return page.evaluate(async () => {
    const paths = [
      '/src/stores/progressionStore.ts',
      '/src/stores/achievementStore.ts',
      '/src/stores/tableStyleStore.ts',
      '/src/stores/stakeStore.ts',
    ]
    const [p, a, t, s] = await Promise.all(paths.map((path) => import(path)))
    return {
      full: p.useProgressionStore.getState().fullUnlockEnabled,
      moneyTree: p.useProgressionStore.getState().isItemUnlocked('money_tree'),
      awards: a.useAchievementStore.getState().achievements,
      stats: a.useAchievementStore.getState().stats,
      tables: t.useTableStyleStore.getState().unlockedStyles.length,
      highestWin: s.useStakeStore.getState().globalHighestCompleted,
    }
  })
}

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`Full Unlock requires consent, unlocks playable content, persists and resets (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.goto(`/${language}/settings`)
    const open = page.getByRole('button', {
      name: copy.settings.fullUnlock.title,
      exact: true,
    })
    await expect(open).toBeVisible()
    // Seed one prior achievement to prove preservation; activation is UI-only.
    await page.evaluate(async () => {
      const path = '/src/stores/achievementStore.ts'
      const a = await import(path)
      a.useAchievementStore
        .getState()
        .unlockAchievement(a.ACHIEVEMENT_DEFINITIONS[0].id)
    })
    const before = await profile(page)
    await open.click()
    const dialog = page.getByRole('dialog', {
      name: copy.settings.fullUnlock.title,
      exact: true,
    })
    await expect(dialog).toContainText(copy.settings.fullUnlock.confirm)
    await page.screenshot({
      path: testInfo.outputPath('full-unlock-confirmation.png'),
    })
    await expect(
      dialog.getByRole('button', { name: copy.common.cancel, exact: true })
    ).toBeFocused()
    await dialog
      .getByRole('button', { name: copy.common.cancel, exact: true })
      .click()
    expect(await profile(page)).toEqual(before)
    await open.click()
    await dialog
      .getByRole('button', { name: copy.common.confirm, exact: true })
      .click()
    await expect(page.getByRole('status')).toContainText(
      copy.settings.fullUnlock.active
    )
    expect(await profile(page)).toEqual({
      ...before,
      full: true,
      moneyTree: true,
      tables: 8,
    })
    await page.getByRole('status').scrollIntoViewIfNeeded()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath('full-unlock-settings.png'),
    })
    await page.reload()
    await expect(page.getByRole('status')).toContainText(
      copy.settings.fullUnlock.active
    )
    expect(await profile(page)).toEqual({
      ...before,
      full: true,
      moneyTree: true,
      tables: 8,
    })

    await page.goto(`/${language}/`)
    await page
      .getByRole('button', { name: copy.tableStyle.chooseTable, exact: true })
      .click()
    await expect(page.locator('[data-table-style-card]')).toHaveCount(8)
    for (const card of await page.locator('[data-table-style-card]').all())
      await expect(card).toBeEnabled()
    await page.locator('[data-table-style-card="dragons_den"]').click()
    await page
      .getByRole('radio', { name: new RegExp(`^${copy.stakes.gold}:`) })
      .click()
    await page.screenshot({
      path: testInfo.outputPath('full-unlock-tables.png'),
    })
    await page
      .locator('[data-table-style-footer]')
      .getByRole('button', { name: copy.common.confirm, exact: true })
      .click()
    expect(
      await page.evaluate(async () => {
        const path = '/src/stores/stakeStore.ts'
        const { useStakeStore } = await import(path)
        return {
          tier: useStakeStore.getState().currentStakeTier,
          highest: useStakeStore.getState().globalHighestCompleted,
        }
      })
    ).toEqual({ tier: 8, highest: 0 })

    await page.goto(`/${language}/play`)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    // Controlled base, gold and shop offer; eligibility and payment stay real.
    await page.evaluate(async () => {
      const paths = [
        '/src/game/GameOrchestrator.ts',
        '/src/systems/TeaHouseSystem.ts',
        '/src/game/EventBus.ts',
      ]
      const [g, c, e] = await Promise.all(paths.map((path) => import(path)))
      const game = g.gameOrchestrator
      if (game.getState().charterSystem.canPurchaseCharter('money_tree'))
        throw new Error('Base prerequisite bypassed')
      game.addImperialCharter(
        c.TEA_HOUSE_BASE_CHARTERS.find(
          (item: { id: string }) => item.id === 'seed_pouch'
        )
      )
      Object.assign(game.getState(), {
        phase: 'shop',
        lastCompletedRoundType: 'Boss',
        gold: 100,
      })
      game.shop.open()
      game.shop.state.charterOffering.item = c.TEA_HOUSE_UPGRADED_CHARTERS.find(
        (item: { id: string }) => item.id === 'money_tree'
      )
      game.shop.state.charterOffering.finalCost = 10
      e.eventBus.emit('shopUpdated', { isOpen: true })
    })
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    await page.getByTestId('charter-card').getByRole('button').click()
    await page
      .getByRole('dialog', { name: copy.shop.ui.confirmPurchase, exact: true })
      .getByRole('button', { name: copy.shop.buy, exact: true })
      .click()
    expect(
      await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return {
          gold: game.getState().gold,
          cap: game.getState().charterSystem.calculateEffects().interestCap,
        }
      })
    ).toEqual({ gold: 90, cap: 20 })
    expect((await profile(page)).awards).toEqual(before.awards)
    expect((await profile(page)).stats).toEqual(before.stats)
    await page.goto(`/${language}/achievements`)
    await expect(page.getByRole('status')).toContainText(
      copy.settings.fullUnlock.active
    )
    await page.goto(`/${language}/settings`)
    await page
      .getByRole('button', { name: copy.settings.resetProgress, exact: true })
      .click()
    await page
      .getByRole('dialog', { name: copy.settings.resetProgress, exact: true })
      .getByRole('button', { name: copy.common.confirm, exact: true })
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: copy.common.ok, exact: true })
      .click()
    await expect(open).toBeVisible()
    await page.reload()
    await expect(open).toBeVisible()
    expect(await profile(page)).toMatchObject({
      full: false,
      moneyTree: false,
      tables: 1,
      highestWin: 0,
    })
  })
}

test('Full Unlock reports persistence failure and restores the previous earned profile', async ({
  page,
}) => {
  await page.goto('/en/settings')
  const button = page.getByRole('button', { name: 'Full Unlock', exact: true })
  await expect(button).toBeVisible()
  const before = await profile(page)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'tensho-archive')
        throw new DOMException('denied', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await button.click()
  await page
    .getByRole('dialog', { name: 'Full Unlock', exact: true })
    .getByRole('button', { name: 'Confirm', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toContainText(
    en.settings.fullUnlock.error
  )
  expect(await profile(page)).toEqual(before)
  await page.reload()
  await expect(button).toBeVisible()
  expect(await profile(page)).toEqual(before)
})
