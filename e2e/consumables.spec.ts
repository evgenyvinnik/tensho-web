import { test, expect, type Page } from '@playwright/test'
import { buyOffer } from './helpers/shop'
import { clearReveals, openTable, settleReveals } from './helpers/table'

// Explicit development-only fixtures establish ownership/edge cases. Every use
// still goes through the rendered controls and the production orchestrator.
async function fixture(
  page: Page,
  kind = 'seal',
  id = 'seal_of_the_alchemist',
  lang = 'en'
) {
  await openTable(page, `/${lang}/play`)
  const result = await page.evaluate(
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
  await clearReveals(page)
  return result
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
      level: state.celestialOrbSystem.getYakuLevel('Pairs'),
    }
  })
}

/** An owned consumable's token on the item rail. */
const token = (page: Page, itemId: string) =>
  page.locator(`[data-consumable-instance="${itemId}"]`)

/**
 * Use an item the way a player does: open its rail token and press its Use
 * button. A Seal or Script that needs tiles goes on to the target dialog.
 */
async function openAndUse(page: Page, itemId: string) {
  await token(page, itemId).click()
  await page.locator(`[data-use-item="${itemId}"]`).click()
}

/** Target selection for a Seal or Script, opened from its Use button. */
const targetDialog = (page: Page) =>
  page.locator('dialog[data-consumable-dialog]')

test('a purchased Seal is used at once on the wall tiles chosen in the Tea House', async ({
  page,
}) => {
  const { offerId, itemId } = await fixture(page, 'shop')
  await expect(page).toHaveURL(/\/en\/shop$/)
  await buyOffer(page, offerId)
  // Buying asks for its tiles first; nothing is paid until they are chosen.
  const picker = page.locator('[data-seal-wall-dialog="seal_of_the_alchemist"]')
  await expect(picker).toBeVisible()
  const confirm = picker.locator('[data-seal-wall-confirm]')
  await expect(confirm).toBeDisabled()
  expect((await snapshot(page)).gold).toBe(20)
  await picker.locator('[data-seal-wall-tile="source"]').click()
  await expect(confirm).toBeDisabled()
  await picker.locator('[data-seal-wall-tile="target"]').click()
  // Two chosen: the Seal takes no more until one is let go.
  await expect(
    picker.locator('[data-seal-wall-tile]:not([aria-pressed="true"])').first()
  ).toBeDisabled()
  await expect(picker.locator('[data-seal-wall-result] li')).toHaveCount(2)
  await confirm.click()
  await expect(picker).toHaveCount(0)
  await expect(
    page.locator('[data-seal-used="seal_of_the_alchemist"]')
  ).toBeVisible()
  const lucky = () =>
    page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game
        .getState()
        .wallTemplate.filter((tile: { id: string }) =>
          ['source', 'target'].includes(tile.id)
        )
        .map((tile: { enhancement: string }) => tile.enhancement)
    })
  const bought = await snapshot(page)
  expect(bought.gold).toBe(18)
  expect(bought.seals).toBe(0)
  expect(await lucky()).toEqual(['lucky', 'lucky'])
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  // The new round can open on Flower and Season reveals.
  await settleReveals(page, 2_000)
  // The Marks stay on those wall tiles; nothing waits on the rail.
  expect(await lucky()).toEqual(['lucky', 'lucky'])
  await expect(token(page, itemId)).toHaveCount(0)
})

test('inspection and Escape preserve staged tiles, hidden identities and focus', async ({
  page,
  isMobile,
}) => {
  const { itemId } = await fixture(page, 'script', 'script_of_the_cryptid')
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
  // A picked tile flies onto the felt above the rack.
  const onFelt = page.locator(
    '[data-play-zone="felt"] [data-play-tile="target"]'
  )
  await expect(onFelt).toBeVisible()
  const before = await snapshot(page)
  await openAndUse(page, itemId)
  const dialog = targetDialog(page)
  await expect(
    dialog.getByRole('button', { name: 'Close', exact: true })
  ).toBeFocused()
  await dialog.locator('[data-consumable-item]').click()
  await expect(
    dialog.locator('[data-consumable-target="source"]')
  ).toHaveAccessibleName('Face-down tile')
  await dialog.locator('[data-consumable-target="source"]').click()
  await dialog.locator('[data-consumable-confirm]').focus()
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: 'Close', exact: true })
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  // The Use button that opened it closed with its panel; focus falls back to
  // the table's persistent wall control.
  await expect(page.locator('[data-wall-chip]')).toBeFocused()
  expect(await snapshot(page)).toEqual(before)
  await expect(onFelt).toBeVisible()
})

/** The wall picker a Seal made at the table opens at once. */
const wallPicker = (page: Page, sealId: string) =>
  page.locator(`[data-seal-wall-dialog="${sealId}"]`)

test('a Seal made at the table asks for its wall tiles at once and cannot be kept', async ({
  page,
}) => {
  await fixture(page, 'seal', 'seal_of_transmutation')
  const picker = wallPicker(page, 'seal_of_transmutation')
  await expect(picker).toBeVisible()
  await expect(picker.locator('[data-seal-wall-close]')).toHaveCount(0)
  await expect(
    picker.getByRole('button', { name: 'Cancel', exact: true })
  ).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(picker).toBeVisible()
  await expect(page.locator('[data-consumable-type="FateSeal"]')).toHaveCount(0)
  // Copy targets follow the numbered selection order, not rack order.
  await expect(picker).toContainText('Tile 1 becomes a copy of tile 2')
  await picker.locator('[data-seal-wall-tile="target"]').click()
  await picker.locator('[data-seal-wall-tile="source"]').click()
  await expect(picker.locator('[data-seal-wall-tile="target"]')).toContainText(
    '1'
  )
  await expect(picker.locator('[data-seal-wall-tile="source"]')).toContainText(
    '2'
  )
  await picker.locator('[data-seal-wall-confirm]').click()
  await expect(picker).toHaveCount(0)
  await expect(
    page.locator('[data-seal-used="seal_of_transmutation"]')
  ).toBeVisible()
  const state = await snapshot(page)
  expect(state.seals).toBe(0)
  for (const id of ['target', 'source'])
    expect(state.hand.find((tile) => tile.id === id)).toMatchObject({
      suit: 'manzu',
      rank: 1,
    })
})

test('a made Seal on a short localized phone dims tiles it cannot change and fits its picker', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await fixture(page, 'seal', 'seal_of_strength', 'es')
  const picker = wallPicker(page, 'seal_of_strength')
  await expect(picker.locator('footer [role="status"]').first()).toContainText(
    '0 / 1–2'
  )
  // A Nine cannot rise, so Strength cannot take it.
  await expect(picker.locator('[data-seal-wall-tile="target"]')).toBeDisabled()
  const bounds = await picker.locator('footer button').evaluateAll((buttons) =>
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
    path: testInfo.outputPath('seal-wall-phone.png'),
  })
  await picker.locator('[data-seal-wall-tile="source"]').click()
  await picker.locator('[data-seal-wall-confirm]').click()
  await expect(picker).toHaveCount(0)
  const after = await snapshot(page)
  expect(after.seals).toBe(0)
  expect(after.hand.find((tile) => tile.id === 'source')?.rank).toBe(2)
})

test('Unity made at the table turns two wall tiles into a playable pair of Winds', async ({
  page,
  isMobile,
}) => {
  await fixture(page, 'seal', 'seal_of_unity')
  const picker = wallPicker(page, 'seal_of_unity')
  await picker.locator('[data-seal-wall-tile="source"]').click()
  await picker.locator('[data-seal-wall-tile="target"]').click()
  await expect(picker.locator('[data-seal-wall-result] li')).toHaveCount(2)
  await picker.locator('[data-seal-wall-confirm]').click()
  await expect(picker).toHaveCount(0)
  const after = await snapshot(page)
  // A One and a Nine both map to the East Wind.
  for (const id of ['source', 'target'])
    expect(after.hand.find((t) => t.id === id)).toMatchObject({
      suit: 'wind',
      rank: 1,
      isRed: false,
    })
  expect(after.seals).toBe(0)
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
  const { itemId } = await fixture(page, 'script', 'script_of_the_cryptid')
  const before = await snapshot(page)
  await openAndUse(page, itemId)
  const dialog = targetDialog(page)
  await expect(dialog).toContainText(
    'Lock 1 random tile in the river: it cannot be drawn again.'
  )
  await expect(dialog.locator('[data-consumable-confirm]')).toBeDisabled()
  await dialog.locator('[data-consumable-target="source"]').click()
  expect(await snapshot(page)).toEqual(before)
  await dialog.locator('[data-consumable-confirm]').click()
  await expect(dialog).not.toBeVisible()
  const after = await snapshot(page)
  expect(after.scripts).toBe(0)
  expect(after.hand).toHaveLength(before.hand.length + 2 - 1)
  expect(
    after.hand.filter((tile) => tile.suit === 'manzu' && tile.rank === 1).length
  ).toBeGreaterThanOrEqual(2)
})

test('an Orb needs confirmation, upgrades the real level, and prevents capped use', async ({
  page,
}) => {
  const { itemId } = await fixture(page, 'orb', 'pluto_orb')
  const before = await snapshot(page)
  // The Orb's own panel is its confirmation: looking changes nothing.
  await token(page, itemId).click()
  const use = page.locator(`[data-use-item="${itemId}"]`)
  await expect(use).toBeEnabled()
  expect(await snapshot(page)).toEqual(before)
  await use.click()
  await expect(token(page, itemId)).toHaveCount(0)
  expect((await snapshot(page)).level).toBe(before.level + 1)
  expect((await snapshot(page)).orbs).toBe(0)
  const cappedId = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const orbPath = '/src/systems/CelestialOrbSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(orbPath)
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    for (let i = 0; i < 10; i++) game.getState().celestialOrbSystem.useOrb(orb)
    const item = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    game.addCelestialOrb(item)
    return item.instanceId as string
  })
  await token(page, cappedId).click()
  const capped = await snapshot(page)
  await expect(page.locator(`[data-use-item="${cappedId}"]`)).toBeDisabled()
  await expect(page.locator('[data-consumable-availability]')).toContainText(
    'maximum level'
  )
  expect(await snapshot(page)).toEqual(capped)
})

test('a Script with no Decree to modify explains the missing target without charging its penalty', async ({
  page,
}) => {
  const { itemId } = await fixture(page, 'script', 'script_of_the_hex')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const system = game.getState().decreeSystem
    for (const item of system.getOwnedDecrees()) system.removeDecree(item.id)
  })
  const before = await snapshot(page)
  await token(page, itemId).click()
  await expect(page.locator(`[data-use-item="${itemId}"]`)).toBeDisabled()
  await expect(page.locator('[data-consumable-availability]')).toHaveText(
    'You need an owned Decree for this effect.'
  )
  await page.keyboard.press('Escape')
  await expect(page.locator(`[data-use-item="${itemId}"]`)).toHaveCount(0)
  expect(await snapshot(page)).toEqual(before)
})

test('a made Fool works at once, copying the last Orb despite an intervening Script', async ({
  page,
}) => {
  const { itemId: orbId } = await fixture(page, 'orb', 'pluto_orb')
  // Untargeted items are used straight from their rail panel.
  const use = async (itemId: string) => {
    await openAndUse(page, itemId)
    await expect(token(page, itemId)).toHaveCount(0)
    // The Wraith's new Decree is revealed over the table.
    await settleReveals(page)
  }
  await use(orbId)
  const scriptId = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const scriptPath = '/src/systems/VoidScriptSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { VoidScriptSystem, VOID_SCRIPTS } = await import(scriptPath)
    const item = VoidScriptSystem.createVoidScriptInstance(
      VOID_SCRIPTS.script_of_the_wraith
    )
    game.addVoidScript(item)
    return item.instanceId as string
  })
  await use(scriptId)
  const before = await snapshot(page)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const sealPath = '/src/systems/FateSealSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { FateSealSystem, FATE_SEALS } = await import(sealPath)
    game.addFateSeal(
      FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_fool)
    )
  })
  await expect(
    page.locator('[data-seal-used="seal_of_the_fool"]')
  ).toBeVisible()
  const after = await snapshot(page)
  expect(after.seals).toBe(0)
  expect(after.orbs).toBe(1)
  // The copied Orb is created, not used: it waits on the rail.
  expect(after.level).toBe(before.level)
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
  expect(created[0].instanceId).not.toBe(orbId)
})

test('Omen protection is disclosed and preserved on cancel, then consumed with a successful Script', async ({
  page,
}) => {
  const { itemId } = await fixture(page, 'script', 'script_of_the_wraith')
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
  // The Script's panel names its cost before the one tap that uses it.
  await token(page, itemId).click()
  await expect(page.locator('[data-script-cost]')).toContainText(
    'Omen protection cancels the additional penalty.'
  )
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-script-cost]')).toHaveCount(0)
  expect(await protectedNow()).toBe(true)
  const before = await snapshot(page)
  await openAndUse(page, itemId)
  await expect(token(page, itemId)).toHaveCount(0)
  expect(await protectedNow()).toBe(false)
  expect((await snapshot(page)).gold).toBe(before.gold)
  expect((await snapshot(page)).scripts).toBe(0)
})
