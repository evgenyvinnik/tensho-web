import { test, expect, type Locator } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import type { ClassicRunSnapshot } from '../src/game/ClassicRunSnapshot'
import { collectCashOut, offerCard } from './helpers/shop'
import { settleReveals } from './helpers/table'

// A valid, deliberately funded shop fixture, not evidence of an organic win.
const fixture = execFileSync('bun', ['e2e/fixtures/shop-layout.mts'], {
  encoding: 'utf8',
})
const languages = [
  'en',
  'es',
  'fr',
  'it',
  'ru',
  'ja',
  'ko',
  'zh-Hans',
  'zh-Hant',
  'tr',
  'id',
  'th',
  'tl',
]
test.use({ trace: 'retain-on-failure' })

for (const [index, language] of languages.entries()) {
  test(`compact shop preserves payment, disclosures and progression (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({
      reducedMotion: index % 2 ? 'reduce' : 'no-preference',
    })
    await page.addInitScript((raw) => {
      if (!localStorage.getItem('tensho-classic-run-v1'))
        localStorage.setItem('tensho-classic-run-v1', raw)
      localStorage.setItem('tensho_tutorial_completed', 'true')
    }, fixture)
    await page.goto(new URL(`${language}/shop`, baseURL).href)
    const raw = () =>
      page.evaluate(() => localStorage.getItem('tensho-classic-run-v1')!)
    const saved = async (): Promise<ClassicRunSnapshot> => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return JSON.parse(await raw()).snapshot
    }
    const activate = async (control: Locator) => {
      await control.scrollIntoViewIfNeeded()
      if (isMobile) await control.tap()
      else {
        await control.focus()
        await page.keyboard.press(index % 2 ? 'Space' : 'Enter')
      }
    }
    const before = await saved(),
      untouched = await raw()
    await page.evaluate(() => document.fonts.ready)
    const toasts = page.locator('[data-cash-out-toasts]')
    const hint = page.locator('[data-progressive-hint="shop-intro"]')
    const next = page.locator('[data-shop-continue]')
    // The round's pay arrives as toasts in the corner; nothing to open.
    await expect(toasts).toHaveAttribute(
      'aria-label',
      copy.shop.payoutBreakdown
    )
    await expect(toasts.locator('[data-cash-out-toast="clear"]')).toBeVisible()
    await expect(page.getByTestId('round-cash-out')).toHaveCount(0)
    await expect(hint.locator('details')).not.toHaveAttribute('open')
    await expect(next).toBeInViewport({ ratio: 1 })
    // The first product, not just a title, is now discoverable on arrival.
    await expect(page.locator('[data-shop-offer]').first()).toBeInViewport()
    // The ledger marks each pay toast.
    const ledger = toasts.locator('img').first()
    await expect(ledger).toHaveAttribute('src', /settlement-ledger\.webp$/)
    expect(
      await ledger.evaluate(async (node: HTMLImageElement) => {
        await node.decode()
        return node.naturalWidth
      })
    ).toBe(512)
    await page.screenshot({ path: info.outputPath('shop-compact.png') })
    // Every source is paid once, and together they are the settled total.
    const seen = await collectCashOut(page, {
      screenshot: info.outputPath('shop-arrival.png'),
    })
    expect(
      [...seen.values()].reduce((sum, toast) => sum + (toast.value ?? 0), 0)
    ).toBe(before.state.lastRoundSummary!.netGoldChange)
    expect([...seen.values()].every((toast) => toast.fits)).toBe(true)
    expect(seen.get('clear')!.text).toContain(copy.shop.roundCleared)
    // Once gone, the pay does not arrive again on this visit.
    await expect(toasts).toHaveCount(0)
    expect(await raw()).toBe(untouched)
    const geometry = await page.locator('[data-shop-row]').evaluate((node) => ({
      itemsTop: node.getBoundingClientRect().top,
      pageFits: document.documentElement.scrollWidth <= innerWidth,
    }))
    expect(geometry.pageFits).toBe(true)
    expect(
      await page.locator('[data-shop-build]').evaluate((node) =>
        [...node.querySelectorAll<HTMLElement>('h2,[data-build-slots],button')]
          .filter((child) => child.getBoundingClientRect().width > 0)
          .filter(
            (child) =>
              (child.matches('h2,[data-build-slots]') &&
                child.scrollWidth > child.clientWidth + 1) ||
              child.getBoundingClientRect().right > innerWidth
          )
          .map((child) => child.textContent)
      )
    ).toEqual([])
    await info.attach('initial-geometry', {
      body: JSON.stringify(geometry),
      contentType: 'application/json',
    })

    // The whole build shows on phones too: Decrees left, upgrades right.
    await expect(
      page.locator('[data-shop-build-content] [data-decree-instance]').first()
    ).toBeVisible()
    for (const control of [hint.locator('summary')]) {
      const bounds = (await control.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
      await activate(control)
      await expect(next).toBeInViewport({ ratio: 1 })
      expect(await raw()).toBe(untouched)
      await activate(control)
    }
    if (!isMobile) {
      // A desktop inventory card must not vanish with focus inside it when
      // rotating/narrowing to the phone layout.
      const card = page
        .locator('[data-shop-build-content] [data-decree-instance]')
        .first()
      await card.focus()
      await page.setViewportSize({ width: 320, height: 568 })
      await expect(card).toBeVisible()
      await expect(card).toBeFocused()
      await expect(next).toBeInViewport({ ratio: 1 })
      expect(await raw()).toBe(untouched)
      await page.setViewportSize({ width: 1280, height: 800 })
    }
    const offer = before.shop.teaHouse.itemOfferings[0]
    // Buy sits in the offer's details, opened from its card.
    await activate(offerCard(page, offer.id))
    await activate(page.locator(`[data-shop-buy="${offer.id}"]`))
    await expect(offerCard(page, offer.id)).toHaveCount(0)
    const purchased = await saved()
    expect(purchased.state.gold).toBe(46)
    expect(purchased.state.decreeSystem.ownedDecrees).toHaveLength(
      before.state.decreeSystem.ownedDecrees.length + 1
    )
    expect(purchased.state.lastRoundSummary).toEqual(
      before.state.lastRoundSummary
    )
    await page.reload()
    expect(await saved()).toEqual(purchased)
    // A reload is not a new settlement: the pay is not shown arriving twice.
    await expect(next).toBeVisible()
    await expect(toasts).toHaveCount(0)
    await activate(
      page.getByRole('button', { name: copy.shop.reroll, exact: true })
    )
    const rerolled = await saved()
    expect(rerolled.state.gold).toBe(41)
    expect(rerolled.shop.teaHouse.itemOfferings).not.toEqual(
      purchased.shop.teaHouse.itemOfferings
    )
    expect(rerolled.state.lastRoundSummary).toEqual(
      before.state.lastRoundSummary
    )
    await page.reload()
    expect(await saved()).toEqual(rerolled)
    await expect(next).toBeInViewport({ ratio: 1 })
    await activate(next)
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
    // The new round can open on Flower and Season reveals.
    await settleReveals(page, 2_000)
    const progressed = await saved()
    expect(progressed.state.currentRound).toBe(before.state.currentRound + 1)
    expect(progressed.state.gold).toBe(41)
    await page.reload()
    expect(await saved()).toEqual(progressed)
    expect(errors).toEqual([])
  })
}
