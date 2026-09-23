import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import ja from '../src/i18n/locales/ja.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
  ['ja', ja],
] as const) {
  test(`table setup is localized, scrollable, keyboard accessible and transactional (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${language}/`)
    const opener = page.getByRole('button', {
      name: copy.tableStyle.chooseTable,
      exact: true,
    })
    await opener.click()
    const dialog = page.getByRole('dialog', {
      name: copy.tableStyle.title,
      exact: true,
    })
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true)
    const close = dialog.getByRole('button', {
      name: copy.common.close,
      exact: true,
    })
    await expect(close).toBeFocused()
    const white = dialog.getByRole('radio', {
      name: new RegExp(`^${copy.stakes.white}:`),
    })
    await white.focus()
    await page.keyboard.press('ArrowRight')
    await expect(white).toBeChecked()
    await expect(
      dialog.getByRole('radio', { name: new RegExp(`^${copy.stakes.gold}:`) })
    ).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(opener).toBeFocused()

    // Give this isolated test profile access; selections and confirmation stay UI-only.
    await page.evaluate(async () => {
      const path = '/src/game/resetProgress.ts'
      const { activateFullUnlock } = await import(path)
      if (!activateFullUnlock().success)
        throw new Error('Fixture profile failed')
    })
    await opener.click()
    await close.focus()
    await page.keyboard.press('Shift+Tab')
    const confirm = dialog.getByRole('button', {
      name: copy.common.confirm,
      exact: true,
    })
    await expect(confirm).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await white.focus()
    await page.keyboard.press('End')
    const gold = dialog.getByRole('radio', {
      name: new RegExp(`^${copy.stakes.gold}:`),
    })
    await expect(gold).toBeFocused()
    await expect(gold).toBeChecked()
    const summary = dialog.locator('summary')
    await expect(summary).toHaveText(copy.stakes.rulesTitle)
    await expect(dialog.locator('details')).not.toHaveAttribute('open')
    await summary.click()
    await expect(dialog.locator('details li')).toHaveCount(6)
    await expect(dialog.locator('details')).toContainText(
      new Intl.NumberFormat(language).format(1.95)
    )
    await page.screenshot({ path: testInfo.outputPath('table-rules.png') })
    await dialog.locator('[data-table-style-card="dragons_den"]').click()
    await expect(confirm).toBeInViewport()
    const bounds = await dialog.evaluate((el) => {
      const panel = el.querySelector<HTMLElement>('[data-table-style-modal]')!
      const list = el.querySelector<HTMLElement>('[data-table-style-list]')!
      const box = panel.getBoundingClientRect()
      return {
        fits:
          box.top >= 0 &&
          box.bottom <= innerHeight &&
          box.left >= 0 &&
          box.right <= innerWidth,
        scrollable:
          list.scrollHeight > list.clientHeight &&
          getComputedStyle(list).overflowY === 'auto',
        readingSpace: list.clientHeight > 100,
        noHorizontalOverflow:
          list.scrollWidth <= list.clientWidth && el.scrollWidth <= innerWidth,
      }
    })
    expect(bounds).toEqual({
      fits: true,
      scrollable: true,
      readingSpace: true,
      noHorizontalOverflow: true,
    })
    expect(
      await dialog
        .locator('[data-table-style-footer] button')
        .evaluateAll((buttons) =>
          buttons.every((button) => {
            const range = document.createRange()
            range.selectNodeContents(button)
            return (
              range.getClientRects().length === 1 &&
              button.scrollWidth <= button.clientWidth
            )
          })
        )
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('table-selection.png') })
    await confirm.click()
    await expect(opener).toBeFocused()
    await page.reload()
    await opener.click()
    await expect(
      dialog.locator('[data-table-style-card="dragons_den"]')
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(gold).toBeChecked()
    await white.click()
    await dialog
      .getByRole('button', { name: copy.common.cancel, exact: true })
      .click()
    await opener.click()
    await expect(gold).toBeChecked()
    // Reducing motion covers both the popup and its illustrated table cards.
    const dragon = dialog.locator('[data-table-style-card="dragons_den"]')
    await dragon.hover()
    expect(await dragon.evaluate((el) => getComputedStyle(el).transform)).toBe(
      'matrix(1, 0, 0, 1, 0, 0)'
    )
    await expect(dragon.locator('img')).not.toHaveClass(/scale-\[1\.045\]/)
    await page.keyboard.press('Escape')
    await page
      .getByRole('button', { name: copy.menu.play, exact: true })
      .click()
    await expect(
      page.locator('[data-gameplay-table-identity]')
    ).toHaveAttribute('data-table-style-id', 'dragons_den')
    expect(
      await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator } = await import(path)
        const state = gameOrchestrator.getState()
        return {
          table: state.tableStyleId,
          stake: state.stake,
          target: state.targetScore,
        }
      })
    ).toEqual({ table: 'dragons_den', stake: 8, target: 731 })
  })
}
