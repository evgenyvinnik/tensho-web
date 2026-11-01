import { expect, test, type Page, type Locator } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }
import { offerCard, offerName, openOffer } from './helpers/shop'
import { settleReveals } from './helpers/table'

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

async function fixture(
  page: Page,
  language: string,
  kind: 'shop' | 'expired' | 'hidden'
) {
  await page.addInitScript(() =>
    localStorage.setItem('tensho_tutorial_completed', 'true')
  )
  await page.goto(`/${language}/play`)
  await saved(page)
  await page.evaluate(async (kind) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const persistencePath = '/src/game/classicPersistenceApp.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const mandatePath = '/src/config/mandateDefinitions.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { initializeClassicPersistence } = await import(persistencePath)
    const { ALL_DECREES, DecreeSystem } = await import(decreePath)
    const { AMBER_ACORN } = await import(mandatePath)
    const { eventBus } = await import(eventPath)
    const service = initializeClassicPersistence()
    const raw = service.getSnapshot().disk.raw
    game.startNewRun(7)
    const state = game.getState()
    state.decreeSystem = new DecreeSystem()
    const definition = ALL_DECREES.find(
      (d: { id: string }) => d.id === 'decree-half-suited'
    )
    if (kind === 'hidden') {
      state.decreeSystem.acquireDecree({
        ...definition,
        edition: 'Foil',
        stickers: [{ type: 'Eternal' }, { type: 'Rental', goldPerRound: 3 }],
      })
      state.mandateEffectSystem.activateMandate(
        AMBER_ACORN,
        state.handTiles,
        state.decreeSystem.getOwnedDecrees()
      )
    } else {
      if (kind === 'expired')
        state.decreeSystem.acquireDecree({
          ...definition,
          edition: 'Polychrome',
          isDebuffed: true,
          stickers: [
            { type: 'Perishable', roundsRemaining: 0 },
            { type: 'Rental', goldPerRound: 3 },
          ],
        })
      Object.assign(state, {
        phase: 'shop',
        gold: 40,
        lastCompletedRoundType: 'Small',
      })
      game.shop.open()
      if (kind === 'shop') {
        const item = {
          ...definition,
          edition: 'Negative',
          stickers: [
            { type: 'Perishable', roundsRemaining: 5 },
            { type: 'Rental', goldPerRound: 0 },
          ],
        }
        const offer = game.shop.state.itemOfferings[0]
        Object.assign(offer, {
          itemType: 'Decree',
          item,
          baseCost: 1,
          editionCost: 5,
          finalCost: 6,
          sellValue: 3,
          edition: 'Negative',
          isPurchased: false,
          isLocked: false,
        })
      }
    }
    if (!(await service.saveNewRun(raw))) throw new Error('Fixture save failed')
    eventBus.emit('shopUpdated', { isOpen: kind !== 'hidden' })
  }, kind)
  await page.reload()
  return saved(page)
}

async function fits(page: Page, dialog: Locator) {
  await expect(dialog).toHaveCSS('opacity', '1')
  await expect(dialog).toHaveCSS('transform', 'none')
  const bounds = await dialog.boundingBox()
  const viewport = page.viewportSize()!
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height)
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true
  )
}

async function visibleTitleInk(dialog: Locator) {
  // DOM visibility alone passed while the bundled font painted zero Cyrillic
  // pixels. Check the browser's actual font selection/rasterization too.
  const ink = await dialog
    .locator('.font-decorative')
    .evaluate(async (title) => {
      const style = getComputedStyle(title)
      const font = `32px ${style.fontFamily}`
      await document.fonts.load(font, title.textContent ?? '')
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 80
      const context = canvas.getContext('2d')!
      context.font = font
      context.fillText(title.textContent ?? '', 0, 50)
      return context
        .getImageData(0, 0, 800, 80)
        .data.filter((value, index) => index % 4 === 3 && value > 0).length
    })
  expect(ink).toBeGreaterThan(100)
}

for (const [language, copy] of [
  ['es', es],
  ['ru', ru],
] as const) {
  test(`${language} purchase and owned details explain the same actual modifiers`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const shop = await fixture(page, language, 'shop')
    const offerId = shop.shop.teaHouse.itemOfferings[0].id
    // The card is art and price; its name is read out with it.
    await expect(offerCard(page, offerId)).toHaveAccessibleName(
      offerName(copy.decrees.items['decree-half-suited'].name)
    )
    const rental = copy.decreeModifiers.rentalDescription.replace(
      '{{amount}}',
      '0'
    )
    // The offer's details explain its modifiers next to its Buy button.
    const details = await openOffer(page, offerId)
    const modifiers = details.locator('[data-decree-modifiers]')
    await expect(modifiers).toContainText(rental)
    await expect(modifiers).toContainText(
      copy.editions.items.negative.description
    )
    await expect(modifiers).toContainText(copy.decreeModifiers.perishableName)
    await expect(modifiers.locator('dt')).toHaveCount(3)
    await page.screenshot({ path: testInfo.outputPath('shop-modifiers.png') })
    await activate(details.locator(`[data-shop-buy="${offerId}"]`), isMobile)
    await expect(offerCard(page, offerId)).toHaveCount(0)
    const purchased = await saved(page)
    expect(purchased.state.gold).toBe(34)
    // The bought Decree is revealed over the shop.
    await settleReveals(page)
    await activate(
      page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true }),
      isMobile
    )
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
    // The new round can open on Flower and Season reveals.
    await settleReveals(page, 2_000)
    const before = await saved(page)
    expect(before.state.decreeSystem.ownedDecrees[0].stickers).toEqual([
      { type: 'Perishable', roundsRemaining: 5 },
      { type: 'Rental', goldPerRound: 0 },
    ])
    await activate(page.locator('[data-decree-instance]').first(), isMobile)
    const dialog = page.getByRole('dialog')
    await fits(page, dialog)
    await visibleTitleInk(dialog)
    await expect(dialog).toContainText(rental)
    await expect(dialog).toContainText(
      copy.decreeModifiers.remaining.replace('{{remaining}}', '5')
    )
    await expect(dialog).toContainText(copy.editions.items.negative.description)
    await page.screenshot({ path: testInfo.outputPath('owned-modifiers.png') })
    expect(await saved(page)).toEqual(before)
    await page.reload()
    expect(await saved(page)).toEqual(before)
    expect(errors).toEqual([])
  })

  test(`${language} expired Decree survives another real round start and reload`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await fixture(page, language, 'expired')
    await activate(
      page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true }),
      isMobile
    )
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
    // The new round can open on Flower and Season reveals.
    await settleReveals(page, 2_000)
    const before = await saved(page)
    expect(
      before.state.decreeSystem.ownedDecrees[0].stickers[0].roundsRemaining
    ).toBe(0)
    expect(before.state.decreeSystem.ownedDecrees[0].isDebuffed).toBe(true)
    await activate(page.locator('[data-decree-instance]').first(), isMobile)
    const dialog = page.getByRole('dialog')
    await fits(page, dialog)
    await visibleTitleInk(dialog)
    await expect(dialog).toContainText(copy.decreeModifiers.expired)
    await expect(dialog).toContainText(
      copy.decreeModifiers.rentalDescription.replace('{{amount}}', '3')
    )
    await expect(dialog).toContainText(copy.editions.items.polychrome.name)
    await page.screenshot({
      path: testInfo.outputPath('expired-modifiers.png'),
    })
    await page.reload()
    expect(await saved(page)).toEqual(before)
  })
}

test('concealed Eternal scrolls retain no name or modifier description in the popup', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await fixture(page, 'en', 'hidden')
  await activate(
    page.getByRole('button', { name: 'Face-down Decree', exact: true }),
    isMobile
  )
  const dialog = page.getByRole('dialog')
  await expect(dialog).not.toContainText('Half Suited')
  await expect(dialog.locator('[data-decree-modifiers]')).toHaveCount(0)
  await expect(dialog.locator('[data-decree-sell]')).toHaveAccessibleName(
    'Hidden Decree is Eternal and cannot be sold'
  )
  await expect(dialog.locator('[data-decree-sell]')).toBeDisabled()
  await expect(dialog.locator('img[src$="half-suited.webp"]')).toHaveCount(0)
})

test('open details reflow across translation, viewport and motion-preference changes', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await fixture(page, 'es', 'expired')
  await activate(
    page.getByRole('button', { name: es.shop.ui.nextRound, exact: true }),
    isMobile
  )
  await expect(page).toHaveURL(/\/es\/play$/)
  // The new round can open on Flower and Season reveals.
  await settleReveals(page, 2_000)
  const before = await saved(page)
  const scroll = page.locator('[data-decree-instance]').first()
  // The Decree's own Polychrome art; a debuffed scroll also carries a ban icon.
  const art = scroll.locator(
    'img[src$="/decree-editions/decree-half-suited/polychrome.webp"]'
  )
  await activate(scroll, isMobile)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveCSS('opacity', '1')
  await page.evaluate(() => {
    // LanguageSync treats the route as authoritative. A native history change
    // exercises that subscription without leaving/reopening this detail view.
    history.pushState(history.state, '', '/ru/play')
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: history.state })
    )
  })
  await expect(page).toHaveURL(/\/ru\/play$/)
  await page.setViewportSize({ width: 320, height: 400 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(dialog).toContainText(ru.decreeModifiers.expired)
  await visibleTitleInk(dialog)
  await fits(page, dialog)
  await expect(art).toHaveCSS('transform', 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(async () => {
    const path = '/src/stores/settingsStore.ts'
    const { useSettingsStore } = await import(path)
    useSettingsStore.setState({ reducedMotion: true })
  })
  await fits(page, dialog)
  await expect(art).toHaveCSS('transition-duration', '0s')
  await dialog.locator('[data-decree-sell]').scrollIntoViewIfNeeded()
  await expect(dialog.locator('[data-decree-sell]')).toBeInViewport()
  await page.screenshot({
    path: testInfo.outputPath('reflow-reduced-motion.png'),
  })
  expect(await saved(page)).toEqual(before)
})
