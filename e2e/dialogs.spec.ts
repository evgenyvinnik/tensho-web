import { expect, test, type Page } from '@playwright/test'

async function gameSnapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    return {
      phase: state.phase,
      active: state.isRunActive,
      gold: state.gold,
      score: state.score,
      hand: state.handTiles.map((tile: { id: string }) => tile.id),
      selected: [...state.selectedTileIds],
    }
  })
}

test('exit confirmation contains focus, blocks background focus, and restores its opener on Escape', async ({
  page,
}, testInfo) => {
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  const before = await gameSnapshot(page)
  const opener = page.getByRole('button', { name: 'Exit', exact: true })
  await opener.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Exit Game', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAccessibleDescription(
    'Are you sure you want to exit? Your current run progress will be lost.'
  )
  const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true })
  const confirm = dialog.getByRole('button', { name: 'Exit', exact: true })
  await expect(cancel).toBeFocused()
  await expect(dialog.locator(':scope > div')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: testInfo.outputPath('exit-dialog.png') })
  // Native modality must resist even programmatic focus outside the dialog.
  const background = page.locator('button[aria-label="Settings"]')
  await expect(background).toBeEnabled()
  await background.evaluate((node: HTMLElement) => node.focus())
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  expect(await gameSnapshot(page)).toEqual(before)
})

test('Enter defaults to cancellation; only explicitly confirming Exit ends the run', async ({
  page,
}) => {
  await page.goto('/en/play')
  const opener = page.getByRole('button', { name: 'Exit', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Exit Game', exact: true })
  await expect(
    dialog.getByRole('button', { name: 'Cancel', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveCount(0)
  expect((await gameSnapshot(page)).phase).toBe('gameplay')
  await opener.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: 'Exit', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/en\/?$/)
  expect(await gameSnapshot(page)).toMatchObject({
    phase: 'menu',
    active: false,
    hand: [],
    selected: [],
  })
})

test('tutorial reset hands focus to its success alert and returns to the original button', async ({
  page,
}) => {
  await page.goto('/en/settings')
  const opener = page.getByRole('button', {
    name: 'Reset Tutorial',
    exact: true,
  })
  await opener.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', {
    name: 'Reset Tutorial',
    exact: true,
  })
  await expect(dialog).toHaveAccessibleDescription('Reset tutorial guidance?')
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveAccessibleDescription(
    'Tutorial has been reset. It will show on next visit.'
  )
  const ok = dialog.getByRole('button', { name: 'OK', exact: true })
  await expect(ok).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(ok).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('keyboard purchase can be cancelled without payment and explicitly bought once', async ({
  page,
}) => {
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const shopPath = '/src/systems/TeaHouseSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { TEA_HOUSE_BASE_CHARTERS } = await import(shopPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    state.phase = 'shop'
    state.lastCompletedRoundType = 'Boss'
    state.gold = 20
    game.shop.open()
    // Author only the offer. Input, confirmation, payment and ownership are real.
    game.shop.state.charterOffering.item = TEA_HOUSE_BASE_CHARTERS.find(
      (charter: { id: string }) => charter.id === 'ancient_script'
    )
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await expect(page).toHaveURL(/\/en\/shop$/)
  const purchase = page.getByRole('button', {
    name: 'Ancient Script 10G',
    exact: true,
  })
  const snapshot = () =>
    page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        owned: [...game.getState().charterSystem.getPurchasedIds()],
        purchases: game.shop.visitTotals.itemsPurchased,
      }
    })
  const before = await snapshot()
  await purchase.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', {
    name: 'Confirm Purchase',
    exact: true,
  })
  await expect(dialog).toHaveAccessibleDescription(
    'Buy Ancient Script for 10G?'
  )
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(purchase).toBeFocused()
  expect(await snapshot()).toEqual(before)
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: 'Buy', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toHaveCount(0)
  const after = await snapshot()
  expect(after).toEqual({
    gold: before.gold - 10,
    owned: [...before.owned, 'ancient_script'],
    purchases: before.purchases + 1,
  })
  await page.keyboard.press('Enter')
  expect(await snapshot()).toEqual(after)
})

test('long localized confirmation fits a small screen and backdrop cancellation preserves progress', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/es/settings')
  const labels = await page.evaluate(async () => {
    const path = '/src/i18n/locales/es.json'
    return (await import(path)).default
  })
  const opener = page.getByRole('button', {
    name: labels.settings.resetProgress,
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog', {
    name: labels.settings.resetProgress,
    exact: true,
  })
  await expect(dialog).toHaveAccessibleDescription(
    `${labels.settings.resetProgressConfirm} ${labels.settings.resetProgressScope}`
  )
  const cancel = dialog.getByRole('button', {
    name: labels.common.cancel,
    exact: true,
  })
  await expect(cancel).toBeFocused()
  const heading = dialog.getByRole('heading')
  await expect(heading).toBeVisible()
  const card = await dialog.locator(':scope > div').boundingBox()
  expect(card).not.toBeNull()
  for (const element of [
    heading,
    cancel,
    dialog.getByRole('button', { name: labels.common.confirm, exact: true }),
  ]) {
    await element.scrollIntoViewIfNeeded()
    const rect = await element.boundingBox()
    expect(rect).not.toBeNull()
    expect(rect!.x).toBeGreaterThanOrEqual(12)
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(308)
    expect(rect!.y).toBeGreaterThanOrEqual(12)
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(556)
    // Scrolling must not consume the clearance around the decorative rollers.
    expect(rect!.y).toBeGreaterThanOrEqual(card!.y + 56)
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(
      card!.y + card!.height - 56
    )
  }
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)
  ).toBe(true)
  for (const button of await dialog.getByRole('button').all()) {
    const fits = await button.evaluate((node) => {
      const bounds = node.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(node)
      const text = range.getBoundingClientRect()
      return text.left >= bounds.left + 2 && text.right <= bounds.right - 2
    })
    expect(fits).toBe(true)
  }
  await page.screenshot({
    path: testInfo.outputPath('spanish-reset-dialog.png'),
  })
  const saved = await page.evaluate(() => JSON.stringify(localStorage))
  await page.mouse.click(2, 2)
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(saved)
})
