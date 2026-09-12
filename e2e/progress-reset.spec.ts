import { expect, test, type Page } from '@playwright/test'

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const paths = [
      '/src/stores/achievementStore.ts',
      '/src/stores/progressionStore.ts',
      '/src/stores/tableStyleStore.ts',
      '/src/stores/stakeStore.ts',
      '/src/stores/archiveStore.ts',
      '/src/stores/tableLoopStore.ts',
      '/src/game/GameOrchestrator.ts',
      '/src/game/resetProgress.ts',
    ]
    const [a, p, t, s, c, l, g, reset] = await Promise.all(
      paths.map((path) => import(path))
    )
    const achievements = a.useAchievementStore.getState()
    const progression = p.useProgressionStore.getState()
    const tables = t.useTableStyleStore.getState()
    const stakes = s.useStakeStore.getState()
    const archive = c.useArchiveStore.getState()
    const loop = l.useTableLoopStore.getState()
    const game = g.gameOrchestrator.getState()
    return JSON.parse(
      JSON.stringify(
        {
          meta: {
            achievements: achievements.achievements,
            achievementStats: achievements.stats,
            progression: progression.stats,
            unlocks: progression.unlocks,
            recent: progression.recentUnlocks,
            tables: {
              current: tables.currentStyleId,
              unlocked: tables.unlockedStyles,
              history: tables.unlockHistory,
              stats: tables.stats,
            },
            stakes: {
              current: stakes.currentStakeTier,
              walls: stakes.wallProgress,
              highest: stakes.globalHighestCompleted,
            },
            archive: {
              entries: archive.entries,
              history: archive.discoveryHistory,
              runItems: archive.currentRunItems,
            },
          },
          classic: {
            active: game.isRunActive,
            phase: game.phase,
            tiles: game.handTiles.map((tile: { id: string }) => tile.id),
            pending: g.gameOrchestrator.shop.pendingPack !== null,
          },
          table: {
            phase: loop.state.phase,
            owned: loop.state.ownedDecrees,
            draft: loop.state.draftEnabled,
            selected: loop.selectedTileIds,
          },
          preferences: localStorage.getItem('tensho-settings'),
          language: localStorage.getItem('tensho-language'),
          unrelated: localStorage.getItem('unrelated-project'),
          raw: Object.fromEntries(
            reset.PROGRESS_STORAGE_KEYS.map((key: string) => [
              key,
              localStorage.getItem(key),
            ])
          ),
        },
        (_key, value) => (value instanceof Set ? [...value] : value)
      )
    )
  })
}

/** Author earned history and a pending purchase; reset itself always goes through Settings. */
async function seedProgress(page: Page) {
  await page.evaluate(async () => {
    const paths = [
      '/src/game/GameOrchestrator.ts',
      '/src/game/EventBus.ts',
      '/src/stores/tableStyleStore.ts',
      '/src/stores/stakeStore.ts',
      '/src/stores/archiveStore.ts',
      '/src/stores/tableLoopStore.ts',
      '/src/stores/settingsStore.ts',
      '/src/game/resetProgress.ts',
    ]
    const [g, e, t, s, c, l, settings, reset] = await Promise.all(
      paths.map((path) => import(path))
    )
    const game = g.gameOrchestrator
    game.startNewRun(7)
    e.eventBus.emit('actComplete', { actNumber: 3, totalScore: 5000 })
    t.useTableStyleStore.getState().selectStyle('red_lacquer')
    s.useStakeStore.getState().recordVictory(5000, 8, 'red_lacquer', 2)
    c.useArchiveStore.getState().unlockAll()
    l.useTableLoopStore.getState().restart(7, { draftEnabled: true })
    l.useTableLoopStore.getState().chooseStarter('echoing_bamboo')
    for (const key of reset.TUTORIAL_PROGRESS_KEYS)
      localStorage.setItem(key, 'true')
    settings.useSettingsStore.setState({
      musicEnabled: false,
      reducedMotion: true,
      musicVolume: 0.25,
    })
    localStorage.setItem('unrelated-project', 'keep me')
    const state = game.getState()
    state.phase = 'shop'
    state.lastCompletedRoundType = 'Boss'
    state.gold = 100
    game.shop.open()
    const result = game.shop.purchase(game.shop.state.packOfferings[0].id)
    if (!result.success || !game.shop.pendingPack)
      throw new Error('Expected a paid pending pack')
  })
}

test('reset confirmation clears all earned systems and both runs, survives reload, and preserves preferences', async ({
  page,
}) => {
  await page.goto('/en/settings')
  const baseline = await snapshot(page)
  await seedProgress(page)
  const before = await snapshot(page)
  expect(before.meta.tables.unlocked).toContain('red_lacquer')
  expect(before.classic.pending).toBe(true)
  expect(before.table.owned).toEqual(['echoing_bamboo'])
  const opener = page.getByRole('button', {
    name: 'Reset All Progress',
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog', {
    name: 'Reset All Progress',
    exact: true,
  })
  await expect(dialog).toContainText('active or saved runs')
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Escape')
  expect(await snapshot(page)).toEqual(before)
  await opener.click()
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(dialog).toHaveAccessibleDescription(
    'All progress has been reset.'
  )
  const after = await snapshot(page)
  expect(after.meta).toEqual(baseline.meta)
  expect(after.classic).toEqual({
    active: false,
    phase: 'menu',
    tiles: [],
    pending: false,
  })
  expect(after.table).toEqual(baseline.table)
  expect(after.preferences).toBe(before.preferences)
  expect(after.language).toBe(before.language)
  expect(after.unrelated).toBe('keep me')
  expect(after.raw['tensho-table-loop-v1']).toBeNull()
  await dialog.getByRole('button', { name: 'OK' }).click()
  await expect(opener).toBeFocused()
  await page.reload()
  const reloaded = await snapshot(page)
  expect(reloaded.meta).toEqual(baseline.meta)
  expect(reloaded.classic).toEqual(after.classic)
  expect(reloaded.table).toEqual(after.table)
  expect(reloaded.preferences).toBe(before.preferences)
  await page.goto('/en/table-loop')
  await expect(page.getByTestId('table-loop-rack')).toHaveCount(0)
  await expect(page.locator('[data-testid^="table-decree-"]')).toHaveCount(3)
})

test('tutorial-only reset retains earned progression and active runs', async ({
  page,
}) => {
  await page.goto('/en/settings')
  await seedProgress(page)
  const before = await snapshot(page)
  await page
    .getByRole('button', { name: 'Reset Tutorial', exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'Reset Tutorial',
    exact: true,
  })
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(dialog).toHaveAccessibleDescription(
    'Tutorial has been reset. It will show on next visit.'
  )
  const after = await snapshot(page)
  expect(after.meta).toEqual(before.meta)
  expect(after.classic).toEqual(before.classic)
  expect(after.table).toEqual(before.table)
  expect(after.raw['tensho-table-loop-v1']).toBe(
    before.raw['tensho-table-loop-v1']
  )
  expect(after.raw['tensho_codex_completed']).toBeNull()
})

test('denied saved-run deletion reports failure, restores progress, and allows a deliberate retry', async ({
  page,
}) => {
  await page.goto('/en/settings')
  await seedProgress(page)
  const before = await snapshot(page)
  await page.evaluate(() => {
    const remove = Storage.prototype.removeItem
    Storage.prototype.removeItem = function (key) {
      if (key === 'tensho-table-loop-v1') {
        Storage.prototype.removeItem = remove
        throw new DOMException('Test storage denial', 'SecurityError')
      }
      return remove.call(this, key)
    }
  })
  const opener = page.getByRole('button', {
    name: 'Reset All Progress',
    exact: true,
  })
  await opener.click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click()
  const error = page.getByRole('dialog', { name: 'Error', exact: true })
  await expect(error).toHaveAccessibleDescription(
    'Reset failed. Your progress has been kept. Check browser storage and try again.'
  )
  expect(await snapshot(page)).toEqual(before)
  await error.getByRole('button', { name: 'OK' }).click()
  await expect(opener).toBeFocused()
  await opener.click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toHaveAccessibleDescription(
    'All progress has been reset.'
  )
  expect((await snapshot(page)).classic.active).toBe(false)
})
