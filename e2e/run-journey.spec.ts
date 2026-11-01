import { expect, test } from '@playwright/test'
import { clearReveals, openTable } from './helpers/table'

test('Tea House journey and optional synergy advice fit phones and desktops', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openTable(page, '/en/play')
  // Presentation fixture: organic completion is covered by the balance harness.
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const persistencePath = '/src/game/classicPersistenceApp.ts'
    const { gameOrchestrator: game } = await import(path)
    const { initializeClassicPersistence } = await import(persistencePath)
    const persistence = initializeClassicPersistence()
    const expectedRaw = persistence.getSnapshot().disk.raw
    game.startNewRun(7)
    const state = game.getState()
    state.roundManager.startAct(5)
    state.roundManager.skipRound()
    state.roundManager.skipRound()
    Object.assign(state, {
      currentAct: 5,
      currentRound: 3,
      targetScore: 1,
    })
    const round = state.roundManager.getCurrentRound()
    round.scoreTarget = 1
    round.bossMandate = undefined
    state.mandateEffectSystem.deactivateMandate()
    if (!(await persistence.saveNewRun(expectedRaw)))
      throw new Error('Journey fixture save failed')
    game.processAction({
      type: 'play',
      tileIds: state.handTiles
        .slice(0, 2)
        .map((tile: { id: string }) => tile.id),
    })
  })
  await clearReveals(page)
  await expect(page).toHaveURL(/\/shop$/)
  await expect(
    page.getByRole('button', { name: 'New Run', exact: true })
  ).toHaveCount(0)
  const journey = page.locator('[data-run-journey]')
  await expect(journey).toContainText('Act 5 / 6 · Round 3 / 3 cleared')
  await expect(journey).toContainText('Next: Act 6 · Round 1')
  await expect(journey.getByRole('progressbar')).toHaveAttribute('value', '15')
  await expect(journey.getByRole('progressbar')).toHaveAttribute('max', '18')
  // The synergy guide is a wide-screen aside; phones read it in the Codex.
  const guide = page.locator('[data-decree-build-guide]')
  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(guide).not.toHaveAttribute('open')
  await guide.locator('summary').click()
  await expect(guide).toHaveAttribute('open')
  await expect(guide).toContainText(
    '100 Points × (4 Mult + 6 Mult) × 2 = 2,000'
  )
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 720 })
    await journey.scrollIntoViewIfNeeded()
    await expect(journey).toBeInViewport()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    const phone = width < 640
    if (phone) await expect(guide).toBeHidden()
    else await expect(guide).toBeVisible()
    for (const element of phone ? [journey] : [journey, guide]) {
      expect(
        await element.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
    }
    await page.screenshot({ path: testInfo.outputPath(`journey-${width}.png`) })
  }
})
