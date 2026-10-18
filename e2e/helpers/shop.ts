import { expect, type Locator, type Page } from '@playwright/test'

/** A Tea House offer's card. Items, Blessing Packs and the Charter share it. */
export const offerCard = (page: Page, offerId: string): Locator =>
  page.locator(`[data-shop-offer="${offerId}"]`)

/** The cards of the row's items: everything but Blessing Packs and the Charter. */
export const itemOffers = (page: Page): Locator =>
  page.locator(
    '[data-shop-offer]:not([data-shop-offer-type="BlessingPack"]):not([data-shop-offer-type="ImperialCharter"])'
  )

/** The Imperial Charter's card; a visit offers at most one. */
export const charterCard = (page: Page): Locator =>
  page.locator('[data-shop-offer][data-shop-offer-type="ImperialCharter"]')

/**
 * Matches an offer card's accessible name: its item's name and its price.
 * The card itself prints only the price under the art.
 */
export const offerName = (name: string): RegExp =>
  new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

/** The details panel an offer card opens: name, description, Buy. */
export const offerDetails = (page: Page, offerId: string): Locator =>
  page
    .locator('[role="dialog"]')
    .filter({ has: page.locator(`[data-shop-offer-details="${offerId}"]`) })

/** Open an offer's details the way a player does and return them. */
export async function openOffer(page: Page, offerId: string): Promise<Locator> {
  const card = offerCard(page, offerId)
  await card.scrollIntoViewIfNeeded()
  await card.click()
  const details = offerDetails(page, offerId)
  await expect(details).toBeVisible()
  return details
}

/**
 * Buy a Tea House offer the way a player does: open its card's details and
 * press Buy there. Items, Blessing Packs and the Charter all share this card.
 */
export async function buyOffer(page: Page, offerId: string): Promise<void> {
  const card = offerCard(page, offerId)
  await card.scrollIntoViewIfNeeded()
  await card.click()
  await page.locator(`[data-shop-buy="${offerId}"]`).click()
}

/**
 * The open Blessing Pack. Offer details are non-modal dialogs that open on
 * hover, and a bought card leaving the row can slide another offer under the
 * pointer, so a bare `getByRole('dialog')` may find those details instead.
 * Reveals (a Decree from its bag, an Orb lighting its family) are modal too
 * and can follow a claimed pack, so they are left out.
 */
export const packModal = (page: Page): Locator =>
  page.locator(
    '[role="dialog"][aria-modal="true"]:not([data-orb-reveal]):not([data-decree-reveal])'
  )

export interface CashOutToastSeen {
  /** Gold the toast carried; null for the Omen itself. */
  value: number | null
  text: string
  omen: string | null
  /** The toast never overflowed itself or the screen while it showed. */
  fits: boolean
}

/**
 * The round's pay arriving as toasts, each source once. Toasts are staggered
 * and fade on their own, so this watches from the first until the last has
 * gone and returns everything it saw, keyed by source. Optionally takes one
 * screenshot while the toasts are on screen.
 */
export async function collectCashOut(
  page: Page,
  options: { screenshot?: string; timeout?: number } = {}
): Promise<Map<string, CashOutToastSeen>> {
  const seen = new Map<string, CashOutToastSeen>()
  const started = Date.now()
  let appeared = false
  let shot = false
  while (Date.now() - started < (options.timeout ?? 15_000)) {
    const toasts = await page
      .locator('[data-cash-out-toast]')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect()
          return {
            id: node.getAttribute('data-cash-out-toast')!,
            value: node.getAttribute('data-payout-value'),
            text: node.textContent ?? '',
            omen: node.getAttribute('data-payout-omen'),
            fits:
              node.scrollWidth <= node.clientWidth + 1 &&
              rect.right <= innerWidth + 1 &&
              rect.left >= -1,
          }
        })
      )
    for (const toast of toasts) {
      const before = seen.get(toast.id)
      seen.set(toast.id, {
        value: toast.value === null ? null : Number(toast.value),
        text: toast.text,
        omen: toast.omen,
        fits: (before?.fits ?? true) && toast.fits,
      })
    }
    if (toasts.length > 0) {
      appeared = true
      if (options.screenshot && !shot) {
        shot = true
        await page.screenshot({ path: options.screenshot })
      }
    } else if (appeared) break
    await page.waitForTimeout(80)
  }
  if (!appeared) throw new Error('No cash-out toasts appeared')
  return seen
}

/** Current level of an upgrade family in a saved snapshot. */
export const savedLevel = (
  snapshot: {
    state: { celestialOrbSystem: { orbLevels: [string, number][] } }
  },
  family: string
): number =>
  snapshot.state.celestialOrbSystem.orbLevels.find(
    ([f]) => f === family
  )?.[1] ?? 1
