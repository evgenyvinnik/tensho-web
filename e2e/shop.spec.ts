import { test, expect, type Page } from '@playwright/test'
import { buyOffer, collectCashOut } from './helpers/shop'
import { clearReveals, openTable } from './helpers/table'

for (const upgraded of [false, true]) {
  test(`illustrated Spanish Charter sits in the shop row and buys without a second step (${upgraded ? 'upgraded' : 'base'})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await openTable(page, '/es/play')
    const charterOffer = await page.evaluate(async (upgraded) => {
      const { gameOrchestrator: game } =
        await import('/src/game/GameOrchestrator.ts')
      const { TEA_HOUSE_BASE_CHARTERS, TEA_HOUSE_UPGRADED_CHARTERS } =
        await import('/src/systems/TeaHouseSystem.ts')
      const { eventBus } = await import('/src/game/EventBus.ts')
      game.startNewRun(7)
      Object.assign(game.getState(), {
        phase: 'shop',
        lastCompletedRoundType: 'Boss',
        gold: upgraded ? 0 : 1234567,
      })
      game.shop.open()
      // Deliberate offer/presentation fixtures, not proof of natural upgrade acquisition.
      game.shop.state.charterOffering.item = upgraded
        ? TEA_HOUSE_UPGRADED_CHARTERS.find(
            (item: { id: string }) => item.id === 'reroll_abundance'
          )
        : TEA_HOUSE_BASE_CHARTERS.find(
            (item: { id: string }) => item.id === 'ancient_script'
          )
      game.shop.state.charterOffering.finalCost = 10
      eventBus.emit('shopUpdated', { isOpen: true })
      return game.shop.state.charterOffering.id as string
    }, upgraded)
    await clearReveals(page)
    await expect(page).toHaveURL(/\/es\/shop$/)
    // The title is centred and explains the Tea House on tap.
    const title = page.getByRole('heading', { level: 1 })
    await expect(title).toContainText('Casa de Té')
    await title.getByRole('button').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    const row = page.locator('[data-shop-row]')
    const card = row.locator(`[data-shop-offer="${charterOffer}"]`)
    await expect(card).toHaveAttribute(
      'data-shop-offer-type',
      'ImperialCharter'
    )
    // Items, packs and the Charter are the same size.
    const sizes = await row.locator('[data-shop-offer]').evaluateAll((cards) =>
      cards.map((c) => {
        const r = c.getBoundingClientRect()
        return [Math.round(r.width), Math.round(r.height)]
      })
    )
    expect(new Set(sizes.map((size) => size.join('x'))).size).toBe(1)
    const title2 = upgraded ? 'Abundancia de renovación' : 'Escritura antigua'
    await expect(card).toHaveAccessibleName(new RegExp(title2))
    await expect(card).not.toContainText(/\p{Extended_Pictographic}/u)
    // The card prints only its price; the name is in its label and details.
    await expect(card).toHaveText(/^[\d.,\s]+$/)
    for (const width of [320, 640]) {
      await page.setViewportSize({ width, height: 568 })
      await card.scrollIntoViewIfNeeded()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(
          `charter-${upgraded ? 'upgraded' : 'base'}-${width}.png`
        ),
      })
    }
    await card.click()
    const buy = page.locator(`[data-shop-buy="${charterOffer}"]`)
    // The panel is titled with the Charter and explains what a Charter is.
    const panel = page.getByRole('dialog', { name: title2 })
    await expect(panel).toBeVisible()
    await expect(panel).toContainText(
      'Una Carta imperial es una mejora permanente'
    )
    if (upgraded) {
      await expect(buy).toBeDisabled()
    } else {
      const readPurchase = () =>
        page.evaluate(async () => {
          const { gameOrchestrator: game } =
            await import('/src/game/GameOrchestrator.ts')
          return {
            gold: game.getState().gold,
            owned: [...game.getState().charterSystem.getPurchasedIds()],
            purchases: game.shop.visitTotals.itemsPurchased,
          }
        })
      const before = await readPurchase()
      await buy.click()
      // Charters buy like everything else: no extra confirmation.
      await expect(
        page.getByRole('dialog', { name: 'Confirmar compra' })
      ).toHaveCount(0)
      expect(await readPurchase()).toEqual({
        gold: before.gold - 10,
        owned: [...before.owned, 'ancient_script'],
        purchases: before.purchases + 1,
      })
      await expect(card).toHaveCount(0)
    }
  })
}

test('Spanish shop shows the actual Seal and Orb before purchase and updates availability', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await openTable(page, '/es/play')
  const offers = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const sealPath = '/src/systems/FateSealSystem.ts'
    const orbPath = '/src/systems/CelestialOrbSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { FateSealSystem, FATE_SEALS } = await import(sealPath)
    const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(orbPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    Object.assign(game.getState(), {
      phase: 'shop',
      lastCompletedRoundType: 'Small',
      gold: 20,
    })
    game.shop.open()
    const seal = FateSealSystem.createFateSealInstance(
      FATE_SEALS.seal_of_the_sage
    )
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.mercury_orb
    )
    Object.assign(game.shop.state.itemOfferings[0], {
      item: seal,
      itemType: 'FateSeal',
      finalCost: 3,
      baseCost: 3,
      editionCost: 0,
      edition: 'Base',
    })
    Object.assign(game.shop.state.itemOfferings[1], {
      item: orb,
      itemType: 'CelestialOrb',
      finalCost: 3,
      baseCost: 3,
      editionCost: 0,
      edition: 'Base',
    })
    eventBus.emit('shopUpdated', { isOpen: true })
    return game.shop.state.itemOfferings.map(
      (offer: { id: string }) => offer.id
    )
  })
  await clearReveals(page)
  const text = await page.evaluate(async () => {
    const path = '/src/i18n/locales/es.json'
    const { default: locale } = await import(path)
    return [locale.seals.items.seal_of_the_sage, locale.orbs.items.mercury_orb]
  })
  for (let index = 0; index < 2; index++) {
    const card = page.locator(`[data-shop-offer="${offers[index]}"]`)
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveAccessibleName(new RegExp(text[index].name))
    await card.click()
    const details = page.locator(`[data-shop-offer-details="${offers[index]}"]`)
    await expect(details).toContainText(text[index].description)
    expect(
      await details.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`specific-stock-${index}.png`),
    })
    await page.keyboard.press('Escape')
  }
  // Buying a Seal asks which wall tiles it changes, then uses it at once.
  await buyOffer(page, offers[0])
  const picker = page.locator('[data-seal-wall-dialog="seal_of_the_sage"]')
  await expect(picker).toBeVisible()
  await expect(picker.getByRole('heading', { level: 2 })).toContainText(
    text[0].name
  )
  await expect(
    picker.locator('[data-seal-wall-suit="manzu"]')
  ).toHaveAccessibleName('Caracteres')
  // Nine rank columns fit the narrowest phone without sideways scrolling.
  for (const suit of await picker.locator('[data-seal-wall-suit]').all()) {
    const rail = suit.locator('div').first()
    expect(
      await rail.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
  }
  const confirm = picker.locator('[data-seal-wall-confirm]')
  await expect(confirm).toBeDisabled()
  const tiles = picker.locator('[data-seal-wall-tile]:not([disabled])')
  const chosen = [
    await tiles.nth(0).getAttribute('data-seal-wall-tile'),
    await tiles.nth(1).getAttribute('data-seal-wall-tile'),
  ]
  await tiles.nth(0).click()
  await tiles.nth(1).click()
  await expect(picker.locator('[data-seal-wall-result] li')).toHaveCount(2)
  await page.screenshot({
    path: testInfo.outputPath('seal-wall-picker-es-320.png'),
  })
  await confirm.click()
  await expect(picker).toHaveCount(0)
  await expect(page.locator(`[data-shop-offer="${offers[0]}"]`)).toHaveCount(0)
  expect(
    await page.evaluate(async (chosen) => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        seals: game.getState().fateSeals.length,
        marked: game
          .getState()
          .wallTemplate.filter((tile: { id: string }) =>
            chosen.includes(tile.id)
          )
          .map((tile: { enhancement: string }) => tile.enhancement),
      }
    }, chosen)
  ).toEqual({ gold: 17, seals: 0, marked: ['bonus', 'bonus'] })
})

/** Explicit transaction fixture on the dev server. No production debug hook,
 * artificial win-rate evidence, or substitute purchase/claim implementation.
 */
async function openPackFixture(page: Page, lang = 'en') {
  await openTable(page, `/${lang}/play`)
  const fixture = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const sealPath = '/src/systems/FateSealSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { FateSealSystem, FATE_SEALS } = await import(sealPath)
    game.startNewRun(7)
    const state = game.getState()
    state.phase = 'shop'
    state.lastCompletedRoundType = 'Small'
    state.gold = 20
    game.shop.open()
    const offer = game.shop.state.packOfferings[0]
    Object.assign(offer.item, {
      type: 'Arcana',
      size: 'Mega',
      choiceCount: 5,
      selectCount: 2,
    })
    offer.finalCost = 8
    const pack = game.shop.packOfferings.find(
      (p: { pack: { id: string } }) => p.pack.id === offer.item.id
    )
    // Fixed choices: the Hermit takes no tiles; the others ask for wall tiles.
    const seal = (id: string) =>
      FateSealSystem.createFateSealInstance(FATE_SEALS[id])
    pack.contents = [
      'seal_of_the_hermit',
      'seal_of_the_sage',
      'seal_of_glass',
      'seal_of_manzu',
      'seal_of_strength',
    ].map((id, index) => {
      const data = seal(id)
      return {
        id: `${offer.item.id}:choice:${index}`,
        type: 'FateSeal',
        name: data.name,
        description: data.description,
        rarity: 'common',
        data,
      }
    })
    pack.maxSelections = 2
    // Two Seals already held for the table, untouched by the pack.
    state.fateSeals = [seal('seal_of_glass'), seal('seal_of_manzu')]
    // Notify after fixture setup, just as the real session does after settlement.
    const eventPath = '/src/game/EventBus.ts'
    const { eventBus } = await import(eventPath)
    eventBus.emit('shopUpdated', { isOpen: true })
    return { packId: offer.item.id as string, offerId: offer.id as string }
  })
  await clearReveals(page)
  return fixture
}

test('Tile Pack rules identify the real modified tiles and a Spanish phone can claim them once', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  const { offerId } = await openPackFixture(page, 'es')
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit, EnhancementType } = await import(tilePath)
    const { eventBus } = await import(eventPath)
    const offering = game.shop.state.packOfferings[0]
    const pack = game.shop.packOfferings.find(
      (p: { pack: { id: string } }) => p.pack.id === offering.item.id
    )
    Object.assign(offering.item, { type: 'Tile', choiceCount: 2 })
    Object.assign(pack.pack, { type: 'Tile', choiceCount: 2 })
    pack.contents = [EnhancementType.Bonus, EnhancementType.Gold].map(
      (enhancement, index) => ({
        id: `rule-${index}`,
        type: 'Tile',
        name: 'Obsolete title',
        description: 'Obsolete rule',
        rarity: 'common',
        data: new Tile(
          TileSuit.Souzu,
          index + 4,
          `reward-tile-${index}`
        ).withEnhancement(enhancement),
      })
    )
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog')
  const choices = dialog.locator('[role="button"][aria-pressed]')
  await expect(choices).toHaveCount(2)
  await expect(choices.nth(0)).toContainText('Común')
  await expect(choices.nth(0)).toHaveAccessibleName(
    '4 de Bambúes · Marca de Bonificación'
  )
  await expect(choices.nth(1)).toHaveAccessibleName(
    '5 de Bambúes · Marca de Oro'
  )
  await expect(choices.nth(0)).toHaveAccessibleDescription(
    'La ficha puntúa de más. +30 Fichas al puntuar'
  )
  await expect(choices.nth(1)).toHaveAccessibleDescription(
    'Genera oro. +3 de oro si la conservas al final de la ronda'
  )
  await expect(dialog).not.toContainText('Obsolete')
  for (const choice of await choices.all()) {
    await choice.scrollIntoViewIfNeeded()
    expect(
      await choice.evaluate((node) =>
        Array.from(node.querySelectorAll<HTMLElement>('h3,p')).every(
          (child) =>
            child.scrollHeight <= child.clientHeight + 1 &&
            child.scrollWidth <= child.clientWidth + 1
        )
      )
    ).toBe(true)
    await choice.click()
  }
  await page.screenshot({
    path: testInfo.outputPath('tile-pack-rules-es-320.png'),
  })
  await dialog.getByRole('button', { name: 'Confirmar selección' }).click()
  await expect(dialog).not.toBeVisible()
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        rewards: game
          .getState()
          .wallTemplate.filter((tile: { id: string }) =>
            tile.id.startsWith('reward-tile-')
          )
          .map((tile: { id: string; enhancement: string }) => [
            tile.id,
            tile.enhancement,
          ]),
        pending: game.shop.pendingPack !== null,
      }
    })
  ).toEqual({
    gold: 12,
    rewards: [
      ['reward-tile-0', 'bonus'],
      ['reward-tile-1', 'gold'],
    ],
    pending: false,
  })
  await expect(page.locator(`[data-shop-offer="${offerId}"]`)).toHaveCount(0)
})

for (const [lang, bonus] of [
  ['es', 'Ajuste de recompensa'],
  ['ru', 'Корректировка награды'],
  ['ja', '報酬調整'],
] as const) {
  test(`localized cash-out toasts fit small and large screens with large values (${lang})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await openPackFixture(page, lang)
    // A deliberate presentation stress fixture; not evidence of organic earnings.
    // The authored run is saved as a new run so a fresh load resumes it.
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const savePath = '/src/game/classicPersistenceApp.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { initializeClassicPersistence } = await import(savePath)
      const service = initializeClassicPersistence()
      const raw = service.getSnapshot().disk.raw
      const state = game.getState()
      state.lastRoundSummary = {
        actNumber: 8,
        roundNumber: 2,
        roundType: 'Large',
        score: 1234567890123,
        target: 1000000000000,
        baseReward: 4,
        interest: 2,
        decreeGold: 3,
        heldGoldMarkReward: 3,
        rentalCost: 2,
        netGoldChange: 1234567890,
        goldBefore: 9876543210,
        goldAfter: 11111111100,
        nextRoundType: 'Boss',
        nextTarget: 2000000000000,
      }
      state.gold = 17
      if (!(await service.saveNewRun(raw)))
        throw new Error('Stress fixture save failed')
    })
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
            .state.lastRoundSummary.netGoldChange
      )
    ).toBe(1234567890)
    for (const [width, height] of [
      [320, 568],
      [1024, 768],
    ]) {
      await page.setViewportSize({ width, height })
      // Each viewport watches the authored pay arrive afresh.
      await page.evaluate(() =>
        sessionStorage.removeItem('tensho-cash-out-shown')
      )
      await page.goto(`/${lang}/shop`)
      await expect(page.locator('[data-shop-continue]')).toBeVisible()
      const seen = await collectCashOut(page, {
        screenshot: testInfo.outputPath(`cash-out-${lang}-${width}.png`),
      })
      const text = [...seen.values()].map((toast) => toast.text).join(' ')
      expect(text).toContain(bonus)
      expect(text).not.toMatch(
        /Gold tiles|Rentals|Reward adjustment|Round cleared|Next:/
      )
      expect(
        [...seen.values()].reduce((sum, toast) => sum + (toast.value ?? 0), 0)
      ).toBe(1234567890)
      expect([...seen.keys()].sort()).toEqual(
        ['bonus', 'clear', 'decrees', 'goldTiles', 'interest', 'rentals'].sort()
      )
      expect(seen.get('bonus')!.text).toContain(
        new Intl.NumberFormat(lang, { signDisplay: 'always' }).format(
          1234567880
        )
      )
      expect([...seen.values()].every((toast) => toast.fits)).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    }
  })
}

for (const preference of ['app', 'system'] as const) {
  test(`pack purchase and rewards respect live ${preference} reduced motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 320, height: 568 })
    const { offerId } = await openPackFixture(page)
    async function setPreference(reduce: boolean) {
      if (preference === 'system') {
        await page.emulateMedia({
          reducedMotion: reduce ? 'reduce' : 'no-preference',
        })
      } else {
        await page.evaluate(async (reducedMotion) => {
          const path = '/src/stores/settingsStore.ts'
          const { useSettingsStore } = await import(path)
          useSettingsStore.setState({ reducedMotion })
        }, reduce)
      }
    }
    await setPreference(true)
    await buyOffer(page, offerId)
    const dialog = page.getByRole('dialog', { name: 'Mega Arcana Pack' })
    await expect(dialog).toHaveCSS('transform', 'none')
    const choice = dialog.locator('[aria-pressed]').first()
    await expect(choice).toHaveCSS('opacity', '1')
    await expect(choice).toHaveCSS('transform', 'none')
    await choice.click()
    await expect(choice).toHaveAttribute('aria-pressed', 'true')
    await setPreference(false)
    // Observe the preference in the DOM before checking that the choice survived.
    await expect(dialog).not.toHaveCSS('transform', 'none')
    await expect(choice).toHaveAttribute('aria-pressed', 'true')
    await setPreference(true)
    await expect(dialog).toHaveCSS('transform', 'none')
    await expect(choice).toHaveAttribute('aria-pressed', 'true')
    await expect(choice).toHaveCSS('transform', 'none')
    const confirm = dialog.getByRole('button', { name: 'Confirm Selection' })
    await expect(confirm).not.toHaveClass(/active:scale-95/)
    await confirm.click()
    await expect(dialog).not.toBeVisible()
    // The Hermit is used as it is claimed: the 12 gold left doubles.
    expect(await inventory(page)).toMatchObject({
      gold: 24,
      seals: 2,
      pending: false,
    })
    await expect(page.locator(`[data-shop-offer="${offerId}"]`)).toHaveCount(0)
  })
}

async function inventory(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    return {
      gold: game.getState().gold,
      seals: game.getState().fateSeals.length,
      decrees: game.getState().decreeSystem.getOwnedDecrees().length,
      pending: game.shop.pendingPack !== null,
      purchases: game.shop.visitTotals.itemsPurchased,
    }
  })
}

/** Turn the fixture into a Mega Decree pack of five choices with one Decree
 * slot free. Decrees are the only rewards that take a slot.
 */
async function useDecreeChoices(page: Page) {
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { ALL_DECREES } = await import(decreePath)
    const { eventBus } = await import(eventPath)
    const offering = game.shop.state.packOfferings[0]
    const pack = game.shop.packOfferings.find(
      (p: { pack: { id: string } }) => p.pack.id === offering.item.id
    )
    Object.assign(offering.item, { type: 'Decree' })
    Object.assign(pack.pack, { type: 'Decree' })
    const catalog = ALL_DECREES.filter(
      (d: { flowerRequirement?: number }) => !d.flowerRequirement
    )
    pack.contents = catalog
      .slice(0, 5)
      .map((decree: { name: string; description: string }, i: number) => ({
        id: `${pack.pack.id}:choice:${i}`,
        type: 'Decree',
        name: decree.name,
        description: decree.description,
        rarity: 'common',
        data: decree,
      }))
    const decrees = game.getState().decreeSystem
    const owned = catalog.slice(5)
    while (decrees.getAvailableSlots() > 1) decrees.acquireDecree(owned.shift())
    eventBus.emit('shopUpdated', { isOpen: true })
  })
}

test('a route revisit restores the paid pack without generating or charging again', async ({
  page,
}) => {
  const { offerId } = await openPackFixture(page)
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog', { name: 'Mega Arcana Pack' })
  await expect(dialog).toBeVisible()
  const before = await inventory(page)
  // Model browser navigation away from a blocking dialog, not a shop action.
  await page.evaluate(() => {
    history.pushState({}, '', '/en/settings')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(dialog).not.toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/en\/shop$/)
  await expect(dialog).toBeVisible()
  expect(await inventory(page)).toEqual(before)
  await dialog.getByRole('button', { name: 'Skip rewards' }).click()
  await expect(dialog).not.toBeVisible()
})

test('a Mega Arcana pack uses both chosen Seals on wall tiles, one after the other', async ({
  page,
}) => {
  const { offerId } = await openPackFixture(page)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const sealPath = '/src/systems/FateSealSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { FateSealSystem, FATE_SEALS } = await import(sealPath)
    // Three held Seals: the old shared limit, which no longer exists.
    game
      .getState()
      .fateSeals.push(
        FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_sage)
      )
  })
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog', { name: 'Mega Arcana Pack' })
  const choices = dialog.locator('[aria-pressed]')
  // Seal of the Sage (two tiles) and Seal of Characters (up to three).
  await choices.nth(1).click()
  await choices.nth(3).click()
  await expect(dialog.getByRole('status')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Confirm Selection' }).click()

  const sage = page.locator('[data-seal-wall-dialog="seal_of_the_sage"]')
  await expect(sage).toBeVisible()
  await expect(sage.getByRole('heading', { level: 2 })).toContainText('1 of 2')
  const marked = [
    await sage
      .locator('[data-seal-wall-tile]')
      .nth(0)
      .getAttribute('data-seal-wall-tile'),
    await sage
      .locator('[data-seal-wall-tile]')
      .nth(1)
      .getAttribute('data-seal-wall-tile'),
  ]
  for (const id of marked)
    await sage.locator(`[data-seal-wall-tile="${id}"]`).click()
  await sage.getByRole('button', { name: 'Confirm', exact: true }).click()

  const characters = page.locator('[data-seal-wall-dialog="seal_of_manzu"]')
  await expect(characters).toBeVisible()
  await expect(characters.getByRole('heading', { level: 2 })).toContainText(
    'Seal of Characters'
  )
  // Characters are what it makes, so those tiles cannot be chosen.
  await expect(
    characters.locator(
      '[data-seal-wall-suit="manzu"] [data-seal-wall-tile]:not([disabled])'
    )
  ).toHaveCount(0)
  const circle = await characters
    .locator('[data-seal-wall-suit="pinzu"] [data-seal-wall-tile]')
    .first()
    .getAttribute('data-seal-wall-tile')
  await characters.locator(`[data-seal-wall-tile="${circle}"]`).click()
  await characters.getByRole('button', { name: 'Use item' }).click()
  await expect(characters).toHaveCount(0)
  await expect(dialog).not.toBeVisible()
  expect(await inventory(page)).toMatchObject({ seals: 3, pending: false })
  expect(
    await page.evaluate(
      async ({ marked, circle }) => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        const wall = game.getState().wallTemplate as {
          id: string
          suit: string
          enhancement: string
        }[]
        return {
          marked: wall
            .filter((tile) => marked.includes(tile.id))
            .map((tile) => tile.enhancement),
          converted: wall.find((tile) => tile.id === circle)!.suit,
        }
      },
      { marked, circle }
    )
  ).toEqual({ marked: ['bonus', 'bonus'], converted: 'manzu' })
})

test('Mega Decree pack capacity is checked before confirmation and rewards are granted once', async ({
  page,
}) => {
  const { offerId } = await openPackFixture(page)
  await useDecreeChoices(page)
  const held = (await inventory(page)).decrees
  await expect(page).toHaveURL(/\/en\/shop$/)
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog', { name: 'Mega Decree Pack' })
  await expect(dialog).toBeVisible()
  const choices = dialog.locator('[aria-pressed]')
  await expect(choices).toHaveCount(5)
  await choices.nth(0).click()
  await choices.nth(1).click()
  const confirm = dialog.getByRole('button', { name: 'Confirm Selection' })
  await expect(confirm).toBeDisabled()
  await expect(dialog.getByRole('status')).toContainText(
    'Not enough Decree slots'
  )
  expect(await inventory(page)).toEqual({
    gold: 12,
    seals: 2,
    decrees: held,
    pending: true,
    purchases: 1,
  })

  // An accidental Escape or backdrop tap must not throw away paid rewards.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await page.mouse.click(2, 2)
  await expect(dialog).toBeVisible()

  await choices.nth(1).click()
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(dialog).not.toBeVisible()
  expect(await inventory(page)).toEqual({
    gold: 12,
    seals: 2,
    decrees: held + 1,
    pending: false,
    purchases: 1,
  })
  await expect(page.locator(`[data-shop-offer="${offerId}"]`)).toHaveCount(0)
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
})

test('pack choices work with the keyboard and trap focus until explicitly settled', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const { offerId } = await openPackFixture(page)
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog', { name: 'Mega Arcana Pack' })
  await expect(dialog).toBeFocused()
  await page.keyboard.press('Tab')
  const choice = dialog.locator('[aria-pressed]').first()
  await expect(choice).toBeFocused()
  await page.keyboard.press('Space')
  await expect(choice).toHaveAttribute('aria-pressed', 'true')
  const confirm = dialog.getByRole('button', { name: 'Confirm Selection' })
  await confirm.focus()
  await page.keyboard.press('Tab')
  await expect(choice).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).not.toBeVisible()
  // The Hermit takes no tiles and is used as it is claimed.
  expect((await inventory(page)).seals).toBe(2)
})

test('localized pack choices fit a short phone and skipping is an explicit action', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const { offerId } = await openPackFixture(page, 'es')
  await useDecreeChoices(page)
  const held = (await inventory(page)).decrees
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Elige hasta 2 de 5 recompensas')
  const choices = dialog.locator('[aria-pressed]')
  await choices.nth(0).click()
  await choices.nth(1).click()
  await expect(dialog.getByRole('status')).toContainText(
    'No hay espacios de Decreto suficientes'
  )
  await expect(dialog.getByRole('status')).toBeInViewport()
  const skip = dialog.getByRole('button', { name: /Saltar|Omitir/ })
  await expect(skip).toBeInViewport()
  const confirm = dialog.getByRole('button', { name: 'Confirmar selección' })
  await expect(confirm).toBeInViewport()
  expect(
    await confirm.evaluate((button) => button.scrollWidth <= button.clientWidth)
  ).toBe(true)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('shop-pack-capacity-es.png'),
  })
  await skip.click()
  await expect(dialog).not.toBeVisible()
  expect(await inventory(page)).toEqual({
    gold: 12,
    seals: 2,
    decrees: held,
    pending: false,
    purchases: 1,
  })
})
