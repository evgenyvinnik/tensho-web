import { expect, type Locator, type Page } from '@playwright/test'

/** A Tea House offer's card. Items, Blessing Packs and the Charter share it. */
export const offerCard = (page: Page, offerId: string): Locator =>
  page.locator(`[data-shop-offer="${offerId}"]`)

/** The cards of the row's items: everything but Blessing Packs and the Charter. */
export const itemOffers = (page: Page): Locator =>
  page.locator(
    '[data-shop-offer]:not([data-shop-offer-type="BlessingPack"]):not([data-shop-offer-type="ImperialCharter"])'
  )

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
 */
export const packModal = (page: Page): Locator =>
  page.locator('[role="dialog"][aria-modal="true"]')
