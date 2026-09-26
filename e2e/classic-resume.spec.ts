import { expect, test, type Page } from '@playwright/test'

const saveKey = 'tensho-classic-run-v1'
async function saved(page: Page) {
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), saveKey)
}
async function profile(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/stores/progressionStore.ts'
    const { useProgressionStore } = await import(path)
    return JSON.parse(
      JSON.stringify(useProgressionStore.getState().stats, (_key, value) =>
        value instanceof Set
          ? [...value].sort()
          : value === Infinity
            ? 'Infinity'
            : value
      )
    )
  })
}

test('a real tile play survives reload and leaving; replacement requires confirmation', async ({
  page,
}) => {
  await page.goto('/en/play')
  await saved(page)
  const tiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
  await tiles.last().click()
  await tiles.last().click()
  await page.locator('[data-game-action="play"]').click()
  await expect
    .poll(async () => (await saved(page)).snapshot.state.handsPlayedThisRun)
    .toBe(1)
  const before = await saved(page)
  const stats = await profile(page)
  await page.reload()
  const after = await saved(page)
  expect(after.runId).toBe(before.runId)
  expect(after.snapshot).toEqual(before.snapshot)
  expect(await profile(page)).toEqual(stats)
  await page.getByRole('button', { name: 'Exit', exact: true }).click()
  await page
    .getByRole('button', { name: 'Save and leave', exact: true })
    .click()
  await expect(page).toHaveURL(/\/en\/?$/)
  await expect(page.locator('[data-classic-resume] img')).toBeVisible()
  await page.getByRole('button', { name: 'New Run', exact: true }).click()
  const dialog = page.getByRole('dialog', {
    name: 'Start a new run?',
    exact: true,
  })
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).runId,
      saveKey
    )
  ).toBe(before.runId)
  await page.getByRole('button', { name: 'Resume run', exact: true }).click()
  expect((await saved(page)).snapshot).toEqual(after.snapshot)
  await page.getByRole('button', { name: 'Exit', exact: true }).click()
  await page
    .getByRole('button', { name: 'Save and leave', exact: true })
    .click()
  await page.getByRole('button', { name: 'New Run', exact: true }).click()
  await dialog.getByRole('button', { name: 'New Run', exact: true }).click()
  expect((await saved(page)).runId).not.toBe(before.runId)
})

test('paid pending pack resumes in the shop without another payment or reward replay', async ({
  page,
}) => {
  await page.goto('/en/play')
  await saved(page)
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const appPath = '/src/game/classicPersistenceApp.ts'
    const { gameOrchestrator: game } = await import(path)
    const { initializeClassicPersistence } = await import(appPath)
    const service = initializeClassicPersistence()
    const raw = service.getSnapshot().disk.raw
    game.startNewRun(7)
    // Author only funding/target. Win, purchase, restore and claim are real.
    const state = game.getState()
    state.gold = 100
    state.targetScore = 1
    state.roundManager.getCurrentRound().scoreTarget = 1
    if (!(await service.saveNewRun(raw))) throw new Error('Fixture save failed')
    if (
      !game.processAction({
        type: 'play',
        tileIds: game
          .getHandTiles()
          .slice(0, 2)
          .map((t: { id: string }) => t.id),
      }).success
    )
      throw new Error('Play failed')
    game.shop.open()
    if (!game.shop.purchase(game.shop.state.packOfferings[0].id).success)
      throw new Error('Purchase failed')
    await service.flush()
  })
  await expect(page).toHaveURL(/\/shop$/)
  const before = await saved(page)
  expect(before.snapshot.shop.pendingPackId).not.toBeNull()
  const stats = await profile(page)
  await page.goto('/en/play')
  await expect(page).toHaveURL(/\/shop$/)
  expect((await saved(page)).snapshot).toEqual(before.snapshot)
  expect(await profile(page)).toEqual(stats)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /Skip/, exact: false }).click()
  const skipped = await saved(page)
  expect(skipped.snapshot.shop.pendingPackId).toBeNull()
  expect(skipped.snapshot.state.gold).toBe(before.snapshot.state.gold)
  await page
    .getByRole('button', { name: 'Continue to Next Round', exact: true })
    .click()
  await expect(page).toHaveURL(/\/play$/)
  const next = await saved(page)
  await page.reload()
  expect((await saved(page)).snapshot).toEqual(next.snapshot)
})

test('native Web Locks transfer ownership and pause the previous tab', async ({
  page,
  context,
}) => {
  await page.goto('/en/play')
  const first = await saved(page)
  const other = await context.newPage()
  await other.goto('/en/play')
  const claimed = await saved(other)
  expect(claimed.runId).toBe(first.runId)
  expect(claimed.owner).not.toBe(first.owner)
  const tiles = other.locator('[data-play-zone="hand"] [data-play-tile]')
  await tiles.last().click()
  await tiles.last().click()
  await other.locator('[data-game-action="play"]').click()
  const played = await saved(other)
  const handedOffProfile = await profile(other)
  await expect(page.getByRole('alert')).toHaveText(
    'Saved progress changed in another tab. This table is paused.'
  )
  await expect(page.locator('[data-game-action="play"]')).toHaveCount(0)
  const raw = await other.evaluate((key) => localStorage.getItem(key), saveKey)
  await page.evaluate(async () => {
    const path = '/src/game/classicPersistenceApp.ts'
    const { initializeClassicPersistence } = await import(path)
    await initializeClassicPersistence().flush()
  })
  expect(
    await other.evaluate((key) => localStorage.getItem(key), saveKey)
  ).toBe(raw)
  await page.getByRole('button', { name: 'Resume run', exact: true }).click()
  expect((await saved(page)).snapshot).toEqual(played.snapshot)
  expect(await profile(page)).toEqual(handedOffProfile)
  await expect(other.getByRole('alert')).toHaveText(
    'Saved progress changed in another tab. This table is paused.'
  )
  const resumedTiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
  await resumedTiles.last().click()
  await resumedTiles.last().click()
  await page.locator('[data-game-action="play"]').click()
  await saved(page)
  expect((await profile(page)).totalTilesPlayed).toBe(
    handedOffProfile.totalTilesPlayed + 2
  )
  await other.close()
})

test('quota failure preserves the checkpoint and Retry saves the live action', async ({
  page,
}) => {
  await page.goto('/en/play')
  const before = await saved(page)
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem
    Object.assign(window, {
      restoreClassicStorage: () => {
        Storage.prototype.setItem = original
      },
    })
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException('Test quota denial', 'QuotaExceededError')
      original.call(this, name, value)
    }
  }, saveKey)
  const tiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
  await tiles.last().click()
  await tiles.last().click()
  await page.locator('[data-game-action="play"]').click()
  await expect(page.getByRole('alert')).toContainText('Keep this tab open')
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).snapshot,
      saveKey
    )
  ).toEqual(before.snapshot)
  await page.evaluate(() => {
    ;(
      window as unknown as { restoreClassicStorage: () => void }
    ).restoreClassicStorage()
  })
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click()
  const after = await saved(page)
  expect(after.snapshot.state.handsPlayedThisRun).toBe(
    before.snapshot.state.handsPlayedThisRun + 1
  )
  await page.reload()
  expect((await saved(page)).snapshot).toEqual(after.snapshot)
})

test('corrupt data is retained for backup until explicit discard', async ({
  page,
}) => {
  await page.goto('/en')
  await page.evaluate(
    (key) => localStorage.setItem(key, '{broken checkpoint'),
    saveKey
  )
  await page.goto('/en/play')
  await expect(page).toHaveURL(/\/en\/?$/)
  await expect(page.getByRole('alert')).toContainText(
    'stored checkpoint has not been changed'
  )
  const download = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click()
  expect((await download).suggestedFilename()).toBe(
    'tensho-classic-backup.json'
  )
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    '{broken checkpoint'
  )
  await page.getByRole('button', { name: 'Discard run', exact: true }).click()
  const dialog = page.getByRole('dialog', {
    name: 'Discard this run?',
    exact: true,
  })
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    '{broken checkpoint'
  )
  await page.getByRole('button', { name: 'Discard run', exact: true }).click()
  await dialog.getByRole('button', { name: 'Discard run', exact: true }).click()
  await expect(page.locator('[data-classic-resume]')).toHaveCount(0)
  expect(
    await page.evaluate((key) => localStorage.getItem(key), saveKey)
  ).toBeNull()
})

test('localized resume card and leave dialog fit a short phone', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/es/play')
  await saved(page)
  const labels = await page.evaluate(async () => {
    const path = '/src/i18n/locales/es.json'
    return (await import(path)).default
  })
  await page
    .getByRole('button', { name: labels.common.exit ?? 'Exit', exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: labels.classicSave.leaveTitle,
    exact: true,
  })
  await expect(dialog).toBeVisible()
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)
  ).toBe(true)
  await page.screenshot({ path: info.outputPath('spanish-save-leave.png') })
  await dialog
    .getByRole('button', { name: labels.classicSave.saveLeave, exact: true })
    .click()
  const card = page.locator('[data-classic-resume]')
  await expect(card).toBeVisible()
  await card.scrollIntoViewIfNeeded()
  expect(
    await card.evaluate((node) =>
      [node, ...node.querySelectorAll('button, h2, p')].every((element) => {
        const rect = element.getBoundingClientRect()
        return (
          rect.left >= 0 &&
          rect.right <= innerWidth &&
          element.scrollWidth <= element.clientWidth + 1
        )
      })
    )
  ).toBe(true)
  await expect(
    card.getByRole('button', { name: labels.classicSave.resume, exact: true })
  ).toBeInViewport()
  await expect(
    page.getByText(labels.menu.nowPlaying, { exact: true })
  ).toHaveCount(0)
  await page.screenshot({ path: info.outputPath('spanish-resume-320.png') })
})
