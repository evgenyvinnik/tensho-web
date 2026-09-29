import { expect, test, type Page, type Locator } from '@playwright/test'

async function activate(locator: Locator, touch: boolean) {
  if (touch) await locator.tap()
  else await locator.click()
}

async function saved(page: Page) {
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
  )
}

async function fixture(page: Page, kind: 'sell' | 'heart' | 'ankh' | 'hex') {
  await page.addInitScript(() =>
    localStorage.setItem('tensho_tutorial_completed', 'true')
  )
  await page.goto('/en/play')
  await saved(page)
  return page.evaluate(async (kind) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const persistencePath = '/src/game/classicPersistenceApp.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const mandatePath = '/src/config/mandateDefinitions.ts'
    const scriptPath = '/src/systems/VoidScriptSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { initializeClassicPersistence } = await import(persistencePath)
    const { ALL_DECREES, DecreeSystem } = await import(decreePath)
    const { CRIMSON_HEART } = await import(mandatePath)
    const { VOID_SCRIPTS, VoidScriptSystem } = await import(scriptPath)
    const service = initializeClassicPersistence()
    const raw = service.getSnapshot().disk.raw
    game.startNewRun(7)
    const state = game.getState()
    state.decreeSystem = new DecreeSystem()
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    const definition = ALL_DECREES.find(
      (d: { id: string }) => d.id === 'decree-half-suited'
    )
    const first = state.decreeSystem.acquireDecree(
      definition,
      kind === 'sell' ? { type: 'Eternal' } : undefined
    )
    const second = state.decreeSystem.acquireDecree({
      ...definition,
      sellValue: 9,
      ...(kind === 'sell' ? { edition: 'Negative' } : {}),
    })
    if (kind === 'heart')
      state.mandateEffectSystem.activateMandate(
        CRIMSON_HEART,
        state.handTiles,
        state.decreeSystem.getOwnedDecrees()
      )
    if (kind === 'ankh' || kind === 'hex') {
      state.decreeSystem.acquireDecree(definition)
      game.addVoidScript(
        VoidScriptSystem.createVoidScriptInstance(
          VOID_SCRIPTS[`script_of_the_${kind}`]
        )
      )
    }
    if (!(await service.saveNewRun(raw))) throw new Error('Fixture save failed')
    return {
      first: first.instanceId,
      second: second.instanceId,
      gold: state.gold,
    }
  }, kind)
}

test('sells the chosen duplicate after reload, preserves its Eternal sibling and pays exactly once', async ({
  page,
  isMobile,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize(
    isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const info = await fixture(page, 'sell')
  const before = await saved(page)
  await page.reload()
  expect(await saved(page)).toEqual(before)
  const second = page.locator(`[data-decree-instance="${info.second}"]`)
  await expect(second.locator('img')).toHaveAttribute(
    'src',
    /half-suited\.webp$/
  )
  await expect
    .poll(() =>
      second
        .locator('img')
        .evaluate(
          (image: HTMLImageElement) =>
            image.complete && image.naturalWidth === 512
        )
    )
    .toBe(true)
  await activate(second, isMobile)
  const dialog = page.getByRole('dialog', {
    name: 'Half Suited details',
    exact: true,
  })
  const sell = dialog.locator('[data-decree-sell]')
  await expect(sell).toHaveText('Sell for ¥9')
  await expect(sell).toBeEnabled()
  await page.screenshot({ path: testInfo.outputPath('duplicate-sell.png') })
  await activate(sell, isMobile)
  await expect(second).toHaveCount(0)
  const after = await saved(page)
  expect(after.state.gold).toBe(info.gold + 9)
  expect(after.state.decreeSystem.maxSlots).toBe(5)
  expect(
    after.state.decreeSystem.ownedDecrees.map(
      (d: { instanceId: string }) => d.instanceId
    )
  ).toEqual([info.first])
  await activate(
    page.locator(`[data-decree-instance="${info.first}"]`),
    isMobile
  )
  await expect(dialog.locator('[data-decree-sell]')).toBeDisabled()
  await page.reload()
  expect(await saved(page)).toEqual(after)
  expect(errors).toEqual([])
})

test('legacy duplicate saves acquire distinct durable identities without replaying gameplay', async ({
  page,
}) => {
  await fixture(page, 'sell')
  const before = await saved(page)
  await page.evaluate(() => {
    const key = 'tensho-classic-run-v1'
    const legacy = JSON.parse(localStorage.getItem(key)!)
    delete legacy.snapshot.state.decreeSystem.nextInstanceId
    for (const decree of legacy.snapshot.state.decreeSystem.ownedDecrees)
      delete decree.instanceId
    localStorage.setItem(key, JSON.stringify(legacy))
  })
  await page.reload()
  const migrated = await saved(page)
  expect(migrated.random).toEqual(before.random)
  expect(migrated.state.gold).toBe(before.state.gold)
  expect(migrated.state.handsPlayedThisRun).toBe(
    before.state.handsPlayedThisRun
  )
  const inventory = migrated.state.decreeSystem.ownedDecrees
  expect(
    new Set(inventory.map((d: { instanceId: string }) => d.instanceId)).size
  ).toBe(2)
  expect(
    inventory.every((d: { instanceId: string }) =>
      /^owned-decree-\d+$/.test(d.instanceId)
    )
  ).toBe(true)
  await expect(page.locator('[data-decree-instance]')).toHaveCount(2)
  await page.reload()
  expect(await saved(page)).toEqual(migrated)
})

test('Crimson Heart shows only one duplicate as suppressed across reload', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize(
    isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await fixture(page, 'heart')
  const before = await saved(page)
  const disabled = before.state.mandateEffectSystem.disabledDecreeIds
  expect(disabled).toHaveLength(1)
  await page.reload()
  expect(await saved(page)).toEqual(before)
  const cards = page.locator('[data-decree-instance]')
  await expect(cards).toHaveCount(2)
  await expect(page.locator('[data-decree-instance].grayscale')).toHaveCount(1)
  await activate(
    page.locator(`[data-decree-instance="${disabled[0]}"]`),
    isMobile
  )
  await expect(page.getByRole('dialog')).toContainText(
    'Disabled by Crimson Heart this hand'
  )
  await page.screenshot({
    path: testInfo.outputPath('one-suppressed-copy.png'),
  })
})

for (const kind of ['hex', 'ankh'] as const) {
  test(`${kind} confirmation applies physical-target benefit and destruction, then resumes exactly`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await fixture(page, kind)
    const before = await saved(page)
    await activate(
      page.getByRole('button', {
        name: 'Void Scripts (1 available)',
        exact: true,
      }),
      isMobile
    )
    const dialog = page.getByRole('dialog', {
      name: 'Void Scripts',
      exact: true,
    })
    await activate(dialog.locator('[data-consumable-item]'), isMobile)
    // Selecting a destructive script is not confirmation.
    expect(await saved(page)).toEqual(before)
    await expect(dialog.locator('[data-consumable-confirm]')).toBeEnabled()
    await page.screenshot({
      path: testInfo.outputPath(`${kind}-confirmation.png`),
    })
    await activate(dialog.locator('[data-consumable-confirm]'), isMobile)
    await expect(dialog).toBeHidden()
    const after = await saved(page)
    const inventory = after.state.decreeSystem.ownedDecrees
    expect(inventory).toHaveLength(kind === 'hex' ? 1 : 2)
    expect(
      new Set(inventory.map((d: { instanceId: string }) => d.instanceId)).size
    ).toBe(inventory.length)
    if (kind === 'hex') expect(inventory[0].edition).toBe('Polychrome')
    expect(after.state.voidScripts).toHaveLength(0)
    expect(after.state.gold).toBe(before.state.gold)
    expect(after.state.handsRemaining).toBe(before.state.handsRemaining)
    await page.reload()
    expect(await saved(page)).toEqual(after)
    await expect(page.locator('[data-decree-instance]')).toHaveCount(
      inventory.length
    )
    expect(errors).toEqual([])
  })
}
