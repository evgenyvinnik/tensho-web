import { test, expect, type Page } from '@playwright/test'
import { buyOffer } from './helpers/shop'
import { clearReveals, openTable } from './helpers/table'

for (const upgraded of [false, true]) {
  test(`illustrated Spanish Charter sits in the shop row and buys without a second step (${upgraded ? 'upgraded' : 'base'})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await openTable(page, '/es/play')
    const charterOffer = await page.evaluate(async (upgraded) => {
      const { gameOrchestrator: game } = await import(
        '/src/game/GameOrchestrator.ts'
      )
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
    await expect(card).toHaveAttribute('data-shop-offer-type', 'ImperialCharter')
    // Items, packs and the Charter are the same size.
    const sizes = await row
      .locator('[data-shop-offer]')
      .evaluateAll((cards) =>
        cards.map((c) => {
          const r = c.getBoundingClientRect()
          return [Math.round(r.width), Math.round(r.height)]
        })
      )
    expect(new Set(sizes.map((size) => size.join('x'))).size).toBe(1)
    const title2 = upgraded ? 'Abundancia de renovación' : 'Escritura antigua'
    await expect(card).toHaveAccessibleName(new RegExp(title2))
    await expect(card).not.toContainText(/\p{Extended_Pictographic}/u)
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
    await expect(panel).toContainText('Una Carta imperial es una mejora permanente')
    if (upgraded) {
      await expect(buy).toBeDisabled()
    } else {
      const readPurchase = () =>
        page.evaluate(async () => {
          const { gameOrchestrator: game } = await import(
            '/src/game/GameOrchestrator.ts'
          )
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
      await details.evaluate(
        (node) => node.scrollWidth <= node.clientWidth + 1
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`specific-stock-${index}.png`),
    })
    await page.keyboard.press('Escape')
  }
  await buyOffer(page, offers[0])
  await expect(page.locator(`[data-shop-offer="${offers[0]}"]`)).toHaveCount(0)
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        seals: game.getState().fateSeals.map((item: { id: string }) => item.id),
      }
    })
  ).toEqual({ gold: 17, seals: ['seal_of_the_sage'] })
})

/** Explicit transaction fixture on the dev server. No production debug hook,
 * artificial win-rate evidence, or substitute purchase/claim implementation.
 */
async function openPackFixture(page: Page, lang = 'en') {
  await openTable(page, `/${lang}/play`)
  const fixture = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const packsPath = '/src/systems/BlessingPackSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { BlessingPackSystem } = await import(packsPath)
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
    const fixture = new BlessingPackSystem().generateOfferingsForPacks([
      offer.item,
    ])[0]
    pack.contents = fixture.contents
    pack.maxSelections = 2
    state.fateSeals = fixture.contents
      .slice(2, 4)
      .map((c: { data: unknown }) => c.data)
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

for (const [lang, heading, bonus, next] of [
  ['es', 'Acto 8 · Ronda Grande', 'Ajuste de recompensa', 'Siguiente:'],
  ['ru', 'Акт 8 · Большой раунд', 'Корректировка награды', 'Далее:'],
  ['ja', '第8幕', '報酬調整', '次：'],
] as const) {
  test(`localized payout receipt fits small and large screens with large values (${lang})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await openPackFixture(page, lang)
    // A deliberate presentation stress fixture; not evidence of organic earnings.
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { eventBus } = await import(eventPath)
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
      eventBus.emit('shopUpdated', { isOpen: true })
    })
    const receipt = page.getByTestId('round-cash-out')
    await receipt.locator('[data-payout-toggle]').click()
    await expect(receipt).toContainText(heading)
    await expect(receipt).toContainText(bonus)
    await expect(receipt).toContainText(next)
    await expect(receipt).not.toContainText(
      /Gold tiles|Rentals|current savings|Next cash-out|Next:/
    )
    expect(
      await receipt
        .locator('[data-payout-value]')
        .evaluateAll((nodes) =>
          nodes.reduce(
            (sum, node) => sum + Number(node.getAttribute('data-payout-value')),
            0
          )
        )
    ).toBe(1234567890)
    for (const [width, height] of [
      [320, 568],
      [1024, 768],
    ]) {
      await page.setViewportSize({ width, height })
      await receipt.scrollIntoViewIfNeeded()
      const overflow = await receipt.evaluate((node) => {
        const frame = node.getBoundingClientRect()
        return Array.from(
          node.querySelectorAll<HTMLElement>(
            '[data-payout-round], p, strong, [data-payout-value], [data-payout-total]'
          )
        )
          .filter((child) => {
            const r = child.getBoundingClientRect()
            return (
              r.left < frame.left ||
              r.right > frame.right ||
              child.scrollWidth > child.clientWidth + 1
            )
          })
          .map((child) => child.textContent)
      })
      expect(overflow).toEqual([])
      expect(
        await receipt
          .locator('[data-payout-total]')
          .evaluate(
            (node) =>
              node.getBoundingClientRect().height <=
              parseFloat(getComputedStyle(node).lineHeight) + 1
          )
      ).toBe(true)
      const pageGeometry = await page.evaluate(() => {
        const fits = document.documentElement.scrollWidth <= innerWidth
        return {
          fits,
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          offenders: fits
            ? []
            : Array.from(document.body.querySelectorAll<HTMLElement>('*'))
                .filter((node) => {
                  const r = node.getBoundingClientRect()
                  return (
                    r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)
                  )
                })
                .slice(0, 12)
                .map((node) => ({
                  tag: node.tagName,
                  classes: String(node.className),
                  text: node.textContent?.slice(0, 100),
                })),
        }
      })
      expect(pageGeometry, JSON.stringify(pageGeometry)).toMatchObject({
        fits: true,
      })
      await receipt.locator('[data-payout-round]').scrollIntoViewIfNeeded()
      await page.screenshot({
        path: testInfo.outputPath(`payout-${lang}-${width}-top.png`),
      })
      await receipt.locator('[data-interest-coach]').scrollIntoViewIfNeeded()
      await expect(receipt.locator('[data-interest-coach]')).toBeInViewport()
      await page.screenshot({
        path: testInfo.outputPath(`payout-${lang}-${width}.png`),
      })
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
    expect(await inventory(page)).toMatchObject({
      gold: 12,
      seals: 3,
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
      pending: game.shop.pendingPack !== null,
      purchases: game.shop.visitTotals.itemsPurchased,
    }
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

test('Mega pack capacity is checked before confirmation and rewards are granted once', async ({
  page,
}) => {
  const { offerId } = await openPackFixture(page)
  await expect(page).toHaveURL(/\/en\/shop$/)
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog', { name: 'Mega Arcana Pack' })
  await expect(dialog).toBeVisible()
  const choices = dialog.locator('[aria-pressed]')
  await expect(choices).toHaveCount(5)
  await choices.nth(0).click()
  await choices.nth(1).click()
  const confirm = dialog.getByRole('button', { name: 'Confirm Selection' })
  await expect(confirm).toBeDisabled()
  await expect(dialog.getByRole('status')).toContainText('Not enough space')
  expect(await inventory(page)).toEqual({
    gold: 12,
    seals: 2,
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
    seals: 3,
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
  expect((await inventory(page)).seals).toBe(3)
})

test('localized pack choices fit a short phone and skipping is an explicit action', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const { offerId } = await openPackFixture(page, 'es')
  await buyOffer(page, offerId)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Elige hasta 2 de 5 recompensas')
  const choices = dialog.locator('[aria-pressed]')
  await choices.nth(0).click()
  await choices.nth(1).click()
  await expect(dialog.getByRole('status')).toContainText('No hay espacio')
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
    pending: false,
    purchases: 1,
  })
})
