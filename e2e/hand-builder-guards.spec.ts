import { expect, test } from '@playwright/test'

test('open workshop removes candidates when a face becomes hidden', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem('tensho_tutorial_completed', 'true')
    localStorage.setItem('tensho_hints_disabled', 'true')
  })
  await page.goto('/en/play')
  await expect(page.locator('[data-open-hand-builder]')).toBeVisible()
  const mutate = async (hidden: boolean) =>
    page.evaluate(async (hidden) => {
      const loaded = (path: string) => {
        const url = performance
          .getEntriesByType('resource')
          .map((e) => e.name)
          .find((url) => new URL(url).pathname === path)
        if (!url) throw Error(`Missing native module ${path}`)
        return url
      }
      const { gameOrchestrator: game } = await import(
        loaded('/src/game/GameOrchestrator.ts')
      )
      const { eventBus } = await import(loaded('/src/game/EventBus.ts'))
      if (!hidden) {
        game.startNewRun(1)
        game.getState().targetScore = 1e9
      }
      const state = game.getState()
      if (hidden) state.faceDownTileIds.add(state.handTiles[0].id)
      eventBus.emit('tileDrawn', {
        tileId: state.handTiles[0].id,
        tilesRemaining: state.wall.length - state.drawIndex,
      })
    }, hidden)
  await mutate(false)
  const open = page.locator('[data-open-hand-builder]')
  if (isMobile) await open.tap()
  else await open.click()
  const dialog = page.getByRole('dialog', { name: 'Build a hand' })
  await expect(dialog.locator('[data-plan-stage]')).toBeVisible()
  await mutate(true)
  await expect(dialog.locator('[data-plan-status="hidden"]')).toBeVisible()
  await expect(dialog.locator('[data-plan-stage]')).toHaveCount(0)
  await expect(
    dialog.locator('[data-plan-keep], [data-plan-exchange]')
  ).toHaveCount(0)
  await expect(dialog.locator('img')).toHaveCount(1) // Decorative guidebook only.
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(open).toBeFocused()
})
