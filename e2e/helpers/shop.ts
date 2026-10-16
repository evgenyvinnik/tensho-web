import type { Locator, Page } from '@playwright/test'

/**
 * Buy a Tea House offer the way a player does: open its card's details and
 * press Buy there. Items, Blessing Packs and the Charter all share this card.
 */
export async function buyOffer(page: Page, offerId: string): Promise<void> {
  const card = page.locator(`[data-shop-offer="${offerId}"]`)
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
