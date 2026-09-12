import { test, expect, type Page } from '@playwright/test'

// Explicit development-only fixtures establish ownership/edge cases. Every use
// still goes through the rendered controls and the production orchestrator.
async function fixture(
  page: Page,
  kind = 'seal',
  id = 'seal_of_the_alchemist',
  lang = 'en'
) {
  await page.goto(`/${lang}/play`)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  return page.evaluate(
    async ({ kind, id }) => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const sealPath = '/src/systems/FateSealSystem.ts'
      const scriptPath = '/src/systems/VoidScriptSystem.ts'
      const orbPath = '/src/systems/CelestialOrbSystem.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { FateSealSystem, FATE_SEALS } = await import(sealPath)
      const { VoidScriptSystem, VOID_SCRIPTS } = await import(scriptPath)
      const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(orbPath)
      game.startNewRun(7)
      const state = game.getState()
      const firstId = state.handTiles[0].id
      const secondId = state.handTiles[1].id
      state.handTiles[0] = new Tile(TileSuit.Manzu, 1, 'source')
      state.handTiles[1] = new Tile(TileSuit.Souzu, 9, 'target')
      // Preserve the rest of the wall: the next round reserves a dead wall before
      // dealing, so a fourteen-tile template is not a valid progression fixture.
      state.wallTemplate = state.wallTemplate.map((tile: { id: string }) =>
        tile.id === firstId
          ? state.handTiles[0]
          : tile.id === secondId
            ? state.handTiles[1]
            : tile
      )
      const item =
        kind === 'script'
          ? VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
          : kind === 'orb'
            ? CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS[id])
            : FateSealSystem.createFateSealInstance(FATE_SEALS[id])
      if (kind === 'shop') {
        state.phase = 'shop'
        state.lastCompletedRoundType = 'Small'
        state.gold = 20
        game.shop.open()
        const offer = game.shop.state.itemOfferings[0]
        Object.assign(offer, {
          item,
          itemType: 'FateSeal',
          baseCost: 2,
          editionCost: 0,
          finalCost: 2,
        })
        const eventPath = '/src/game/EventBus.ts'
        const { eventBus } = await import(eventPath)
        eventBus.emit('shopUpdated', { isOpen: true })
        return { itemId: item.instanceId, offerId: offer.id }
      }
      if (kind === 'script') game.addVoidScript(item)
      else if (kind === 'orb') game.addCelestialOrb(item)
      else game.addFateSeal(item)
      return { itemId: item.instanceId, offerId: '' }
    },
    { kind, id }
  )
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    return {
      gold: state.gold,
      hand: state.handTiles.map(
        (tile: {
          id: string
          suit: string
          rank: number
          isRed: boolean
          modifiers: unknown
        }) => ({
          id: tile.id,
          suit: tile.suit,
          rank: tile.rank,
          isRed: tile.isRed,
          modifiers: tile.modifiers,
        })
      ),
      selected: game.getSelectedTileIds(),
      hidden: [...state.faceDownTileIds],
      seals: state.fateSeals.length,
      scripts: state.voidScripts.length,
      orbs: state.celestialOrbs.length,
      sealUses: state.consumableSystem.getFateSealUsesRemaining(),
      scriptUses: state.consumableSystem.getVoidScriptUsesRemaining(),
      level: state.celestialOrbSystem.getYakuLevel('Riichi'),
    }
  })
}

test('a purchased Seal is staged, targeted and consumed once through the live UI', async ({
  page,
}) => {
  const { offerId, itemId } = await fixture(page, 'shop')
  await expect(page).toHaveURL(/\/en\/shop$/)
  await page
    .locator(`[data-shop-item="${offerId}"]`)
    .getByRole('button')
    .click()
  expect((await snapshot(page)).gold).toBe(18)
  expect((await snapshot(page)).seals).toBe(1)
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  await page
    .getByRole('button', { name: 'Fate Seals (1 available)', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Fate Seals' })
  const before = await snapshot(page)
  await dialog.locator(`[data-consumable-item="${itemId}"]`).click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  expect(await snapshot(page)).toEqual(before)
  const targets = dialog.locator('[data-consumable-target]')
  const ids = await targets.evaluateAll((nodes) =>
    nodes.slice(0, 2).map((node) => node.getAttribute('data-consumable-target'))
  )
  await targets.nth(0).click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await targets.nth(1).click()
  await expect(targets.nth(2)).toBeDisabled()
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  expect(after.seals).toBe(0)
  expect(after.sealUses).toBe(before.sealUses - 1)
  expect(after.gold).toBe(before.gold)
  for (const id of ids)
    expect(after.hand.find((tile) => tile.id === id)?.modifiers).toMatchObject({
      enhancement: 'lucky',
    })
  await expect(
    page.getByRole('button', { name: 'Fate Seals (0 available)', exact: true })
  ).toBeDisabled()
})

test('inspection and Escape preserve staged tiles, hidden identities and focus', async ({
  page,
  isMobile,
}) => {
  await fixture(page)
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    game.getState().faceDownTileIds.add('source')
    game.clearSelection()
  })
  const staged = page.locator(
    '[data-play-zone="hand"] [data-play-tile="target"]'
  )
  if (isMobile) await staged.tap()
  else await staged.click()
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile="target"]')
  ).toBeVisible()
  const before = await snapshot(page)
  const opener = page.getByRole('button', {
    name: 'Fate Seals (1 available)',
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Fate Seals' })
  await expect(
    dialog.getByRole('button', { name: 'Close', exact: true })
  ).toBeFocused()
  await dialog.locator('[data-consumable-item]').click()
  await expect(
    dialog.locator('[data-consumable-target="source"]')
  ).toHaveAccessibleName('Face-down tile')
  await dialog.locator('[data-consumable-target="source"]').click()
  await dialog.locator('[data-consumable-target="target"]').click()
  await dialog.locator('[data-consumable-confirm]').focus()
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: 'Close', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(opener).toBeFocused()
  expect(await snapshot(page)).toEqual(before)
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile="target"]')
  ).toBeVisible()
})

test('copy targets follow the numbered selection order, not rack order', async ({
  page,
}) => {
  await fixture(page, 'seal', 'seal_of_transmutation')
  await page
    .getByRole('button', { name: 'Fate Seals (1 available)', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog).toContainText('Tile 1 becomes a copy of tile 2')
  await dialog.locator('[data-consumable-target="target"]').click()
  await dialog.locator('[data-consumable-target="source"]').click()
  await expect(
    dialog.locator('[data-consumable-target="target"]')
  ).toContainText('1')
  await expect(
    dialog.locator('[data-consumable-target="source"]')
  ).toContainText('2')
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const state = await snapshot(page)
  expect(state.hand.find((tile) => tile.id === 'target')).toMatchObject({
    suit: 'manzu',
    rank: 1,
  })
  expect(state.hand.find((tile) => tile.id === 'source')).toMatchObject({
    suit: 'manzu',
    rank: 1,
  })
})

test('a short localized phone can recover from a no-op target without losing the Seal', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await fixture(page, 'seal', 'seal_of_strength', 'es')
  await page
    .getByRole('button', {
      name: 'Sellos del Destino (1 disponibles)',
      exact: true,
    })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Sellos del Destino' })
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog.getByRole('status')).toContainText('0 / 1–2')
  const before = await snapshot(page)
  await dialog.locator('[data-consumable-target="target"]').click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await expect(dialog.locator('[data-consumable-availability]')).toContainText(
    'entre 1 y 9'
  )
  expect(await snapshot(page)).toEqual(before)
  const bounds = await dialog.locator('footer button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const r = button.getBoundingClientRect()
      return {
        x: r.x,
        right: r.right,
        y: r.y,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        fits: button.scrollWidth <= button.clientWidth,
      }
    })
  )
  for (const b of bounds) {
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.right).toBeLessThanOrEqual(320)
    expect(b.y).toBeGreaterThanOrEqual(0)
    expect(b.bottom).toBeLessThanOrEqual(568)
    expect(b.width).toBeGreaterThanOrEqual(44)
    expect(b.height).toBeGreaterThanOrEqual(44)
    expect(b.fits).toBe(true)
  }
  await page.screenshot({
    path: testInfo.outputPath('consumable-error-phone.png'),
  })
  await dialog.locator('[data-consumable-target="target"]').click()
  await dialog.locator('[data-consumable-target="source"]').click()
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  expect(after.seals).toBe(0)
  expect(after.hand.find((tile) => tile.id === 'source')?.rank).toBe(2)
})

test('Strength cancellation keeps a red five and confirmation renders an ordinary six', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await fixture(page, 'seal', 'seal_of_strength')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const state = game.getState()
    const red = new Tile(TileSuit.Manzu, 5, 'source', true)
    state.handTiles = state.handTiles.map((tile: { id: string }) =>
      tile.id === red.id ? red : tile
    )
    state.wallTemplate = state.wallTemplate.map((tile: { id: string }) =>
      tile.id === red.id ? red : tile
    )
  })
  const before = await snapshot(page)
  const opener = page.getByRole('button', {
    name: 'Fate Seals (1 available)',
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('[data-consumable-item]').click()
  await dialog.locator('[data-consumable-target="source"]').click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeEnabled()
  expect(await snapshot(page)).toEqual(before)
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await snapshot(page)).toEqual(before)
  await opener.click()
  await dialog.locator('[data-consumable-item]').click()
  await dialog.locator('[data-consumable-target="source"]').click()
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  expect(after.hand.find((tile) => tile.id === 'source')).toMatchObject({
    rank: 6,
    isRed: false,
  })
  expect(after.seals).toBe(0)
  await expect(
    page.locator('[data-play-tile="source"]').getByRole('img', {
      name: '6 of Characters',
      exact: true,
    })
  ).toBeVisible()
})

test('Unity explains its Wind mapping on a small phone, preserves hidden targets on cancel, and creates a playable pair', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await fixture(page, 'seal', 'seal_of_unity', 'es')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const state = game.getState()
    const source = new Tile(TileSuit.Manzu, 5, 'source', true)
    state.handTiles = state.handTiles.map((t: { id: string }) =>
      t.id === 'source' ? source : t
    )
    state.wallTemplate = state.wallTemplate.map((t: { id: string }) =>
      t.id === 'source' ? source : t
    )
    state.faceDownTileIds.add('target')
  })
  const before = await snapshot(page)
  const opener = page.getByRole('button', {
    name: 'Sellos del Destino (1 disponibles)',
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('[data-consumable-item]').click()
  const legend = dialog.locator('[data-unity-mapping]')
  await expect(legend).toContainText('Número original → Viento')
  await expect(legend.locator('[data-unity-wind]')).toHaveCount(4)
  await expect(legend.locator('[data-unity-wind="1"]')).toHaveAccessibleName(
    '1, 5, 9 → Este'
  )
  await expect(legend.locator('[data-unity-wind="4"]')).toHaveAccessibleName(
    '4, 8 → Norte'
  )
  for (const img of await legend.locator('img').all())
    await expect
      .poll(() =>
        img.evaluate(
          (node) =>
            (node as HTMLImageElement).complete &&
            (node as HTMLImageElement).naturalWidth > 0
        )
      )
      .toBe(true)
  const bounds = await legend.evaluate((node) => {
    const r = node.getBoundingClientRect()
    return {
      left: r.left,
      right: r.right,
      fits: node.scrollWidth <= node.clientWidth,
    }
  })
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(320)
  expect(bounds.fits).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('unity-mapping-phone.png'),
  })
  await dialog.locator('[data-consumable-target="source"]').click()
  await dialog.locator('[data-consumable-target="target"]').click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeEnabled()
  expect(await snapshot(page)).toEqual(before)
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  expect(await snapshot(page)).toEqual(before)
  await opener.click()
  await dialog.locator('[data-consumable-item]').click()
  await dialog.locator('[data-consumable-target="source"]').click()
  await dialog.locator('[data-consumable-target="target"]').click()
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  for (const id of ['source', 'target'])
    expect(after.hand.find((t) => t.id === id)).toMatchObject({
      suit: 'wind',
      rank: 1,
      isRed: false,
    })
  expect(after.seals).toBe(0)
  expect(after.hidden).not.toContain('target')
  for (const id of ['source', 'target']) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  const play = page.locator('[data-game-action="play"]')
  await expect(play).toBeEnabled()
  await play.click()
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return game.getState().runScore
      })
    )
    .toBeGreaterThan(0)
})

test('a targeted Script discloses its penalty and applies both effect and cost once', async ({
  page,
}) => {
  await fixture(page, 'script', 'script_of_the_cryptid')
  await page
    .getByRole('button', { name: 'Void Scripts (1 available)', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Void Scripts' })
  const before = await snapshot(page)
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog).toContainText('Lock 1 random tile in the Dead Pool.')
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await dialog.locator('[data-consumable-target="source"]').click()
  expect(await snapshot(page)).toEqual(before)
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  expect(after.scripts).toBe(0)
  expect(after.scriptUses).toBe(before.scriptUses - 1)
  expect(after.hand).toHaveLength(before.hand.length + 2 - 1)
  expect(
    after.hand.filter((tile) => tile.suit === 'manzu' && tile.rank === 1).length
  ).toBeGreaterThanOrEqual(2)
})

test('an Orb needs confirmation, upgrades the real level, and prevents capped use', async ({
  page,
}) => {
  await fixture(page, 'orb', 'pluto_orb')
  const opener = page.getByRole('button', {
    name: 'Celestial Orbs (1 available)',
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Celestial Orbs' })
  const before = await snapshot(page)
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog.locator('[data-consumable-target]')).toHaveCount(0)
  expect(await snapshot(page)).toEqual(before)
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  expect((await snapshot(page)).level).toBe(before.level + 1)
  expect((await snapshot(page)).orbs).toBe(0)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const orbPath = '/src/systems/CelestialOrbSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(orbPath)
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    for (let i = 0; i < 10; i++) game.getState().celestialOrbSystem.useOrb(orb)
    game.addCelestialOrb(
      CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
    )
  })
  await opener.click()
  await dialog.locator('[data-consumable-item]').click()
  const capped = await snapshot(page)
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await expect(dialog.locator('[data-consumable-availability]')).toContainText(
    'maximum level'
  )
  expect(await snapshot(page)).toEqual(capped)
})

test('a full Decree inventory explains why a reward Seal cannot be used', async ({
  page,
}) => {
  await fixture(page, 'seal', 'seal_of_judgment')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { ALL_DECREES } = await import(decreePath)
    const system = game.getState().decreeSystem
    for (const item of ALL_DECREES) {
      if (system.getAvailableSlots() === 0) break
      system.acquireDecree(item)
    }
    if (system.getAvailableSlots() !== 0) throw new Error('Fixture not full')
  })
  const before = await snapshot(page)
  await page
    .getByRole('button', { name: 'Fate Seals (1 available)', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Fate Seals' })
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await expect(dialog.locator('[data-consumable-availability]')).toHaveText(
    'Make space for the reward before using this item.'
  )
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  expect(await snapshot(page)).toEqual(before)
})

test('a Script with no Decree to modify explains the missing target without charging its penalty', async ({
  page,
}) => {
  await fixture(page, 'script', 'script_of_the_hex')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const system = game.getState().decreeSystem
    for (const item of system.getOwnedDecrees()) system.removeDecree(item.id)
  })
  const before = await snapshot(page)
  await page
    .getByRole('button', { name: 'Void Scripts (1 available)', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Void Scripts' })
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await expect(dialog.locator('[data-consumable-availability]')).toHaveText(
    'You need an owned Decree for this effect.'
  )
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  expect(await snapshot(page)).toEqual(before)
})

test('concealed suitability stays unknown until confirmation and a rejected use preserves the tile', async ({
  page,
}) => {
  await fixture(page, 'seal', 'seal_of_strength')
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    game.getState().faceDownTileIds.add('source')
    game.getState().faceDownTileIds.add('target')
  })
  const before = await snapshot(page)
  await page
    .getByRole('button', { name: 'Fate Seals (1 available)', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Fate Seals' })
  await dialog.locator('[data-consumable-item]').click()
  const confirm = dialog.locator('[data-consumable-confirm]')
  // Both a legal rank 1 and an ineffective rank 9 have identical public
  // suitability. Selecting either must not reveal its identity through state.
  for (const id of ['source', 'target']) {
    const tile = dialog.locator(`[data-consumable-target="${id}"]`)
    await expect(tile).toHaveAccessibleName('Face-down tile')
    await tile.click()
    await expect(confirm).toBeEnabled()
    await expect(dialog.locator('[data-consumable-uncertainty]')).toHaveText(
      'The outcome for concealed targets is checked only when you confirm.'
    )
    await expect(dialog.locator('[data-consumable-availability]')).toHaveCount(
      0
    )
    expect(await snapshot(page)).toEqual(before)
    await tile.click()
  }
  await dialog.locator('[data-consumable-target="target"]').click()
  await confirm.click()
  await expect(dialog.getByRole('alert')).toContainText('between 1 and 9')
  expect(await snapshot(page)).toEqual(before)
  await dialog.locator('[data-consumable-target="target"]').click()
  await dialog.locator('[data-consumable-target="source"]').click()
  await confirm.click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  expect(after.seals).toBe(0)
  expect(after.hidden).toEqual(['target'])
  expect(after.hand.find((tile) => tile.id === 'source')?.rank).toBe(2)
})

for (const language of [
  {
    lang: 'en',
    seals: 'Fate Seals (1 available)',
    orbs: 'Celestial Orbs (1 available)',
    scripts: 'Void Scripts (1 available)',
    missing: 'First use an item from Fate Seals or Celestial Orbs.',
    result: 'Creates: Pluto Orb',
    cancel: 'Cancel',
  },
  {
    lang: 'es',
    seals: 'Sellos del Destino (1 disponibles)',
    orbs: 'Orbes Celestiales (1 disponibles)',
    scripts: 'Escritos del Vacío (1 disponibles)',
    missing: 'Primero usa un objeto de Sellos del Destino o Orbes Celestiales.',
    result: 'Crea: Orbe de Plutón',
    cancel: 'Cancelar',
  },
]) {
  test(`the Fool previews and creates the last eligible item despite intervening Scripts (${language.lang})`, async ({
    page,
  }) => {
    await fixture(page, 'seal', 'seal_of_the_fool', language.lang)
    const dialog = page.getByRole('dialog')
    const open = async (name: string) => {
      await page.getByRole('button', { name, exact: true }).click()
      await dialog.locator('[data-consumable-item]').click()
    }
    const use = async (name: string) => {
      await open(name)
      await dialog.locator('[data-consumable-confirm]').click()
      await expect(dialog).not.toBeVisible()
    }
    const add = async (kind: 'orb' | 'script') =>
      page.evaluate(async (kind) => {
        const gamePath = '/src/game/GameOrchestrator.ts'
        const orbPath = '/src/systems/CelestialOrbSystem.ts'
        const scriptPath = '/src/systems/VoidScriptSystem.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        game.getState().consumableSystem.setMaxScriptsPerRound(2)
        if (kind === 'orb') {
          const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(orbPath)
          const item = CelestialOrbSystem.createCelestialOrbInstance(
            CELESTIAL_ORBS.pluto_orb
          )
          if (!game.addCelestialOrb(item))
            throw new Error('Orb fixture has no room')
          return item.instanceId
        }
        const { VoidScriptSystem, VOID_SCRIPTS } = await import(scriptPath)
        const item = VoidScriptSystem.createVoidScriptInstance(
          VOID_SCRIPTS.script_of_the_wraith
        )
        if (!game.addVoidScript(item))
          throw new Error('Script fixture has no room')
        return item.instanceId
      }, kind)

    await add('script')
    await use(language.scripts)
    await open(language.seals)
    await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
    await expect(dialog.locator('[data-consumable-availability]')).toHaveText(
      language.missing
    )
    await expect(dialog.locator('[data-consumable-copy-result]')).toHaveCount(0)
    await dialog
      .getByRole('button', { name: language.cancel, exact: true })
      .click()

    const usedOrbId = await add('orb')
    await use(language.orbs)
    await add('script')
    await use(language.scripts)
    const before = await snapshot(page)
    await open(language.seals)
    await expect(dialog.locator('[data-consumable-copy-result]')).toHaveText(
      language.result
    )
    expect(await snapshot(page)).toEqual(before)
    await dialog
      .getByRole('button', { name: language.cancel, exact: true })
      .click()
    expect(await snapshot(page)).toEqual(before)
    await open(language.seals)
    await expect(dialog.locator('[data-consumable-copy-result]')).toHaveText(
      language.result
    )
    await dialog.locator('[data-consumable-confirm]').click()
    await expect(dialog).not.toBeVisible()
    const after = await snapshot(page)
    expect(after.seals).toBe(0)
    expect(after.scripts).toBe(0)
    expect(after.orbs).toBe(1)
    expect(after.level).toBe(before.level)
    expect(after.sealUses).toBe(before.sealUses - 1)
    const created = await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game
        .getCelestialOrbs()
        .map((item: { id: string; instanceId: string }) => ({
          id: item.id,
          instanceId: item.instanceId,
        }))
    })
    expect(created[0].id).toBe('pluto_orb')
    expect(created[0].instanceId).not.toBe(usedOrbId)
  })
}

test('Omen protection is disclosed and preserved on cancel, then consumed with a successful Script', async ({
  page,
}) => {
  await fixture(page, 'script', 'script_of_the_wraith')
  await page.evaluate(async () => {
    const omenPath = '/src/stores/omenStore.ts'
    const definitionsPath = '/src/config/omenDefinitions.ts'
    const { useOmenStore } = await import(omenPath)
    const { OMEN_OF_ASH } = await import(definitionsPath)
    useOmenStore.getState().addTag(OMEN_OF_ASH.id)
  })
  const protectedNow = () =>
    page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.getState().omenSystem.hasVoidScriptDownsideProtection()
    })
  const opener = page.getByRole('button', {
    name: 'Void Scripts (1 available)',
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Void Scripts' })
  await dialog.locator('[data-consumable-item]').click()
  await expect(dialog).toContainText(
    'Omen protection cancels the additional penalty.'
  )
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  expect(await protectedNow()).toBe(true)
  const before = await snapshot(page)
  await opener.click()
  await dialog.locator('[data-consumable-item]').click()
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  expect(await protectedNow()).toBe(false)
  expect((await snapshot(page)).gold).toBe(before.gold)
  expect((await snapshot(page)).scripts).toBe(0)
})
