import { expect, test, type Page } from '@playwright/test'

// Establish an explicit late-run fixture, then finish through the rendered play
// action. This tests settlement/navigation, not organic reach or game balance.
async function prepareFinalPlay(page: Page, victory: boolean, lang = 'en') {
  await page.goto(`/${lang}/play`)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await page.evaluate(async (victory) => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    game.startNewRun(7)
    const state = game.getState()
    state.roundManager.startAct(8)
    state.roundManager.skipRound()
    state.roundManager.skipRound()
    state.currentAct = 8
    state.currentRound = 3
    const round = state.roundManager.getCurrentRound()
    // Isolate settlement from specific randomized boss restrictions.
    round.bossMandate = undefined
    state.mandateEffectSystem.deactivateMandate()
    state.targetScore = victory ? 1 : 1e12
    round.scoreTarget = state.targetScore
    state.handsRemaining = 1
    state.runScore = 123456789012
    state.handTiles
      .slice(0, 2)
      .forEach((tile: { id: string }) => game.selectTile(tile.id))
  }, victory)
  await page.locator('[data-game-action="play"]').click()
  await expect(page).toHaveURL(/\/game-over$/)
  await expect(page.getByText('Round Complete!', { exact: true })).toHaveCount(
    0
  )
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const progressionPath = '/src/stores/progressionStore.ts'
    const stakePath = '/src/stores/stakeStore.ts'
    const { gameOrchestrator: game } = await import(path)
    const { useProgressionStore } = await import(progressionPath)
    const { useStakeStore } = await import(stakePath)
    const state = game.getState()
    return {
      phase: state.phase,
      act: state.currentAct,
      round: state.currentRound,
      active: state.isRunActive,
      won: state.hasWonRun,
      enteredEndless: state.hasEnteredEndless,
      hands: state.handsRemaining,
      handAllowance: state.handsAllowance,
      gold: state.gold,
      score: state.runScore,
      wins: useProgressionStore.getState().stats.totalRunsWon,
      completed: useProgressionStore.getState().stats.totalRunsCompleted,
      nextStake: useStakeStore.getState().isStakeUnlocked('green_felt', 2),
    }
  })
}

test('Act 8 win settles once, unlocks the next Stake, and survives an Endless defeat', async ({
  page,
}) => {
  await prepareFinalPlay(page, true)
  await expect(page.getByRole('heading', { name: 'Victory!' })).toBeVisible()
  const secured = await snapshot(page)
  expect(secured).toMatchObject({
    phase: 'gameOver',
    won: true,
    active: false,
    wins: 1,
    completed: 1,
    nextStake: true,
  })
  await page
    .getByRole('button', { name: 'Continue into Endless', exact: true })
    .click()
  await expect(page).toHaveURL(/\/shop$/)
  const shop = await snapshot(page)
  expect(shop.gold).toBe(secured.gold)
  expect(shop.score).toBe(secured.score)
  expect(shop.wins).toBe(1)
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.continueEndless()
    })
  ).toBe(false)
  await page
    .getByRole('button', { name: 'Continue to Next Round', exact: true })
    .click()
  await expect(page).toHaveURL(/\/play$/)
  expect(await snapshot(page)).toMatchObject({
    act: 9,
    round: 1,
    active: true,
    won: true,
  })

  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    state.targetScore = 1e12
    state.roundManager.getCurrentRound().scoreTarget = 1e12
    state.handsRemaining = 1
    state.handTiles
      .slice(0, 2)
      .forEach((tile: { id: string }) => game.selectTile(tile.id))
  })
  await page.locator('[data-game-action="play"]').click()
  await expect(
    page.getByRole('heading', { name: 'Endless Ascent Complete' })
  ).toBeVisible()
  expect(await snapshot(page)).toMatchObject({
    phase: 'gameOver',
    active: false,
    won: true,
    wins: 1,
    completed: 1,
    nextStake: true,
  })
  await expect(
    page.getByRole('button', { name: 'Continue into Endless', exact: true })
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Return to Menu', exact: true })
    .click()
  expect(await snapshot(page)).toMatchObject({
    phase: 'menu',
    won: false,
    score: 0,
    wins: 1,
    completed: 1,
    nextStake: true,
  })
})

test('Act 8 defeat offers a fresh run, not Endless or a Stake victory', async ({
  page,
}) => {
  await prepareFinalPlay(page, false)
  await expect(
    page.getByRole('heading', { name: 'Defeat', exact: true })
  ).toBeVisible()
  expect(await snapshot(page)).toMatchObject({
    won: false,
    wins: 0,
    completed: 1,
    nextStake: false,
  })
  await expect(
    page.getByRole('button', { name: 'Continue into Endless', exact: true })
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Try Again', exact: true }).click()
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  expect(await snapshot(page)).toMatchObject({
    act: 1,
    round: 1,
    won: false,
    score: 0,
    active: true,
  })
})

test('an Ancient Script purchased after victory rewinds the Act without offering a second victory', async ({
  page,
}) => {
  await prepareFinalPlay(page, true)
  await page
    .getByRole('button', { name: 'Continue into Endless', exact: true })
    .click()
  await expect(page).toHaveURL(/\/shop$/)
  const before = await snapshot(page)
  await expect(
    page.getByText('Next: Act 9 ascent', { exact: true })
  ).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const shopPath = '/src/systems/TeaHouseSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(path)
    const { TEA_HOUSE_BASE_CHARTERS } = await import(shopPath)
    const { eventBus } = await import(eventPath)
    game.shop.open()
    const offer = game.shop.state.charterOffering
    // Author the offer, not its purchase, effect, or subsequent result.
    offer.item = TEA_HOUSE_BASE_CHARTERS.find(
      (charter: { id: string }) => charter.id === 'ancient_script'
    )
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await page.getByText('Ancient Script', { exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Confirm Purchase', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Buy', exact: true }).click()
  expect((await snapshot(page)).gold).toBe(before.gold - 10)
  await expect(
    page.getByText('Next: Act 8 ascent', { exact: true })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Continue to Next Round', exact: true })
    .click()
  await expect(page).toHaveURL(/\/play$/)
  expect(await snapshot(page)).toMatchObject({
    act: 8,
    round: 1,
    won: true,
    active: true,
    enteredEndless: true,
    // Preserve starter Decree bonuses; the Charter removes exactly one hand.
    hands: before.handAllowance - 1,
  })
  await expect(
    page
      .locator('[data-gameplay-top-bar-act]')
      .getByText('Endless', { exact: true })
  ).toBeVisible()
  await expect(page.getByLabel('Act 8 of 8', { exact: true })).toHaveCount(0)
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    state.targetScore = 1e12
    state.roundManager.getCurrentRound().scoreTarget = 1e12
    state.handsRemaining = 1
    state.handTiles
      .slice(0, 2)
      .forEach((tile: { id: string }) => game.selectTile(tile.id))
  })
  await page.locator('[data-game-action="play"]').click()
  await expect(
    page.getByRole('heading', { name: 'Endless Ascent Complete', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Continue into Endless', exact: true })
  ).toHaveCount(0)
  expect(await snapshot(page)).toMatchObject({
    won: true,
    wins: 1,
    completed: 1,
    nextStake: true,
    active: false,
  })
})

test('localized victory details and actions fit a short phone and a compact desktop', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await prepareFinalPlay(page, true, 'es')
  await expect(
    page.getByRole('button', {
      name: 'Continuar en modo infinito',
      exact: true,
    })
  ).toBeVisible()
  await expect(
    page.getByText(
      'Has superado el duelo del acto 8. Tu victoria está asegurada.',
      { exact: true }
    )
  ).toBeVisible()
  const finalScore = await snapshot(page)
  await expect(page.locator('[data-result-score]')).toHaveText(
    finalScore.score.toLocaleString('es')
  )
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 568 })
    expect(
      await page.locator('main').evaluate((main) => {
        const within = (node: Element) => {
          const rect = node.getBoundingClientRect()
          return (
            rect.left >= 0 &&
            rect.right <= window.innerWidth &&
            node.scrollWidth <= node.clientWidth + 1
          )
        }
        return [
          main,
          ...main.querySelectorAll('button, h1, [data-result-score]'),
        ].every(within)
      })
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`victory-${width}.png`),
      fullPage: true,
    })
    const menu = page.getByRole('button', {
      name: 'Volver al Menú',
      exact: true,
    })
    await menu.scrollIntoViewIfNeeded()
    await expect(menu).toBeInViewport()
  }
  await page
    .getByRole('button', { name: 'Continuar en modo infinito', exact: true })
    .click()
  await expect(page).toHaveURL(/\/es\/shop$/)
})
