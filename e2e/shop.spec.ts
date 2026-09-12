import { test, expect, type Page } from '@playwright/test'

for (const upgraded of [false, true]) {
  test(`illustrated Spanish Charter stays readable and accessible (${upgraded ? 'upgraded' : 'base'})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/es/play')
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    await page.evaluate(async (upgraded) => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const shopPath = '/src/systems/TeaHouseSystem.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { TEA_HOUSE_BASE_CHARTERS, TEA_HOUSE_UPGRADED_CHARTERS } =
        await import(shopPath)
      const { eventBus } = await import(eventPath)
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
    }, upgraded)
    await expect(page).toHaveURL(/\/es\/shop$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Casa de Té'
    )
    await expect(
      page.getByRole('heading', { name: 'Objetos', exact: false })
    ).toContainText('Disponibles: 2')
    await expect(
      page.getByRole('heading', {
        name: 'Paquetes de bendiciones',
        exact: true,
      })
    ).toBeAttached()
    await expect(
      page.getByRole('button', {
        name: 'Continuar a la siguiente ronda',
        exact: true,
      })
    ).toBeInViewport()
    const card = page.getByTestId('charter-card')
    const title = upgraded ? 'Abundancia de renovación' : 'Escritura antigua'
    await expect(card.getByRole('heading')).toHaveText(title)
    await expect(
      card.getByText(upgraded ? 'Mejorado' : 'Edición básica', { exact: true })
    ).toBeVisible()
    const art = card.getByRole('img', { name: 'Carta imperial' })
    expect(
      await art.evaluate(async (node: HTMLImageElement) => {
        await node.decode()
        return node.naturalWidth
      })
    ).toBeGreaterThan(0)
    for (const width of [320, 640]) {
      await page.setViewportSize({ width, height: 568 })
      await card.scrollIntoViewIfNeeded()
      await expect(card.getByRole('button')).toBeInViewport()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      expect(
        await card.evaluate((node) =>
          Array.from(
            node.querySelectorAll<HTMLElement>('h3,p,span,button,img')
          ).every((child) => {
            const rect = child.getBoundingClientRect()
            return (
              rect.left >= 0 &&
              rect.right <= innerWidth &&
              child.scrollWidth <= child.clientWidth + 1
            )
          })
        )
      ).toBe(true)
      await expect(card).not.toContainText(
        /\\u[0-9a-f]{4}|Imperial Charter|Base edition/i
      )
      await page.screenshot({
        path: testInfo.outputPath(
          `charter-${upgraded ? 'upgraded' : 'base'}-${width}.png`
        ),
      })
    }
    if (upgraded) {
      await expect(card.getByRole('button')).toBeDisabled()
    } else {
      const readPurchase = () =>
        page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return {
            gold: game.getState().gold,
            owned: [...game.getState().charterSystem.getPurchasedIds()],
            purchases: game.shop.visitTotals.itemsPurchased,
          }
        })
      const before = await readPurchase()
      await card.getByRole('button').click()
      const dialog = page.getByRole('dialog', {
        name: 'Confirmar compra',
        exact: true,
      })
      await expect(dialog).toHaveAccessibleDescription(
        '¿Comprar Escritura antigua por 10G?'
      )
      await dialog
        .getByRole('button', { name: 'Cancelar', exact: true })
        .click()
      expect(await readPurchase()).toEqual(before)
      await card.getByRole('button').click()
      await dialog.getByRole('button', { name: 'Comprar', exact: true }).click()
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
  await page.goto('/es/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
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
  const text = await page.evaluate(async () => {
    const path = '/src/i18n/locales/es.json'
    const { default: locale } = await import(path)
    return [locale.seals.items.seal_of_the_sage, locale.orbs.items.mercury_orb]
  })
  for (let index = 0; index < 2; index++) {
    const card = page.locator(`[data-shop-item="${offers[index]}"]`)
    await card.scrollIntoViewIfNeeded()
    await expect(card.getByRole('heading')).toHaveText(text[index].name)
    await expect(
      card.getByText(text[index].description, { exact: true })
    ).toBeVisible()
    expect(
      await card.evaluate((node) =>
        Array.from(node.querySelectorAll<HTMLElement>('h3,p,button')).every(
          (child) =>
            child.scrollHeight <= child.clientHeight + 1 &&
            child.scrollWidth <= child.clientWidth + 1
        )
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`specific-stock-${index}.png`),
    })
  }
  await page
    .locator(`[data-shop-item="${offers[0]}"]`)
    .getByRole('button')
    .click()
  await expect(
    page.getByRole('heading', { name: 'Objetos', exact: false })
  ).toContainText('Disponibles: 1')
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
  await page.goto(`/${lang}/play`)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  return page.evaluate(async () => {
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
    return { packId: offer.item.id }
  })
}

test('Tile Pack rules identify the real modified tiles and a Spanish phone can claim them once', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  const { packId } = await openPackFixture(page, 'es')
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
  await page.locator(`[data-shop-pack="${packId}"]`).click()
  const dialog = page.getByRole('dialog')
  const choices = dialog.locator('[role="button"][aria-pressed]')
  await expect(choices).toHaveCount(2)
  await expect(choices.nth(0)).toContainText('Común')
  await expect(choices.nth(0)).toHaveAccessibleName(
    '4 Bambúes · Marca de Bonificación'
  )
  await expect(choices.nth(1)).toHaveAccessibleName('5 Bambúes · Marca de Oro')
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
  await expect(page.locator(`[data-shop-pack="${packId}"]`)).toHaveCount(0)
})

for (const [lang, heading, bonus, next] of [
  ['es', 'Acto 8 · Ronda Grande', 'Bonificación', 'Siguiente:'],
  ['ru', 'Акт 8 · Большой раунд', 'Бонус к награде', 'Далее:'],
  ['ja', '第8幕', '報酬ボーナス', '次：'],
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
    await expect(receipt).toContainText(heading)
    await expect(receipt).toContainText(bonus)
    await expect(receipt).toContainText(next)
    await expect(receipt).not.toContainText(
      /Gold tiles|Rentals|With current savings|Next:/
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
            'h2, p, strong, [data-payout-value], [data-payout-total]'
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
      await receipt.locator('h2').scrollIntoViewIfNeeded()
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
    const { packId } = await openPackFixture(page)
    const card = page.locator(`[data-shop-pack-card="${packId}"]`)
    await card.hover()
    // Normal motion remains available until either preference is enabled.
    await expect(card.locator('[style*="shimmer"]')).toHaveCount(1)
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
    await expect(card).toHaveCSS('transform', 'none')
    await expect(card.locator('[style*="shimmer"]')).toHaveCount(0)
    const buy = card.getByRole('button')
    await expect(buy).not.toHaveClass(/active:scale-95/)
    await buy.click()
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
    await expect(page.locator(`[data-shop-pack="${packId}"]`)).toHaveCount(0)
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
  const { packId } = await openPackFixture(page)
  await page.locator(`[data-shop-pack="${packId}"]`).click()
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
  const { packId } = await openPackFixture(page)
  await expect(page).toHaveURL(/\/en\/shop$/)
  await page.locator(`[data-shop-pack="${packId}"]`).click()
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
  await expect(page.locator(`[data-shop-pack="${packId}"]`)).toHaveCount(0)
  await page.getByRole('button', { name: 'Continue to Next Round' }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
})

test('pack choices work with the keyboard and trap focus until explicitly settled', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const { packId } = await openPackFixture(page)
  await page.locator(`[data-shop-pack="${packId}"]`).click()
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
  const { packId } = await openPackFixture(page, 'es')
  await page.locator(`[data-shop-pack="${packId}"]`).click()
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
