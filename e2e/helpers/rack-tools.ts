import { expect, type Page } from '@playwright/test'

/** Reveal secondary actions on narrow viewports; desktop keeps them inline. */
export async function revealRackTools(page: Page) {
  const more = page.locator('[data-open-rack-tools]')
  if (await more.isVisible()) {
    if ((await more.getAttribute('aria-expanded')) === 'false') {
      await more.click()
    }
    await expect(more).toHaveAttribute('aria-expanded', 'true')
  }
}
