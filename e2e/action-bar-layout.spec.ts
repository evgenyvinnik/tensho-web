import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SUPPORTED_LANGUAGES } from '../src/router/routeManifest'
import { openTable, settleReveals } from './helpers/table'

for (const language of SUPPORTED_LANGUAGES) {
  test(`action labels and counters fit without shrinking or clipping (${language})`, async ({
    page,
    isMobile,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.addInitScript(() => {
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    await openTable(page, `/${language}/play`)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    // Author only a presentation resource before the app mounts. Never race
    // the live persistence writer, and don't treat this as earning free draws.
    await page.addInitScript(() => {
      const key = 'tensho-classic-run-v1'
      const record = JSON.parse(localStorage.getItem(key)!)
      record.snapshot.state.redrawsRemaining = 2
      localStorage.setItem(key, JSON.stringify(record))
    })
    await page.reload()
    await settleReveals(page)
    const bar = page.locator('[data-action-bar]')
    const redraw = bar.locator('[data-game-action="redraw"]')
    const play = bar.locator('[data-game-action="play"]')
    await expect(redraw.locator('[data-free-redraws="2"]')).toBeVisible()
    await expect(redraw).toContainText(copy.gameplay.redraw)
    await expect(play).toHaveAccessibleName(copy.gameplay.playHand)

    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 800 })
      await expect(bar).toBeInViewport()
      await expect
        .poll(() =>
          bar.evaluate((node) => {
            const buttons = [
              ...node.querySelectorAll<HTMLElement>('[data-game-action]'),
            ]
            return (
              buttons.every((button) => {
                const bounds = button.getBoundingClientRect()
                const walker = document.createTreeWalker(
                  button,
                  NodeFilter.SHOW_TEXT
                )
                let text: Node | null
                const rects: DOMRect[] = []
                while ((text = walker.nextNode())) {
                  if (!text.textContent?.trim()) continue
                  const range = document.createRange()
                  range.selectNodeContents(text)
                  rects.push(...range.getClientRects())
                }
                return (
                  bounds.height >= 44 &&
                  bounds.width >= 44 &&
                  bounds.left >= 0 &&
                  bounds.right <= innerWidth &&
                  bounds.top >= 0 &&
                  bounds.bottom <= innerHeight &&
                  parseFloat(getComputedStyle(button).fontSize) >= 13 &&
                  rects.every(
                    (rect) =>
                      rect.left >= bounds.left + 1 &&
                      rect.right <= bounds.right - 1 &&
                      rect.top >= bounds.top &&
                      rect.bottom <= bounds.bottom
                  ) &&
                  button.scrollWidth <= button.clientWidth + 1
                )
              }) && document.documentElement.scrollWidth <= innerWidth
            )
          })
        )
        .toBe(true)
      // Both rectangles must come from the same frame after responsive reflow;
      // separate calls can straddle the viewport resize and compare two layouts.
      await expect
        .poll(() =>
          bar.evaluate((node, narrow) => {
            const red = node
              .querySelector('[data-game-action="redraw"]')!
              .getBoundingClientRect()
            const paid = node
              .querySelector('[data-game-action="play"]')!
              .getBoundingClientRect()
            return narrow
              ? paid.y >= red.bottom
              : Math.abs(paid.y + paid.height / 2 - red.y - red.height / 2) < 2
          }, width === 320)
        )
        .toBe(true)
      if (language === 'es')
        await page.screenshot({ path: info.outputPath(`actions-${width}.png`) })
    }
    await page.setViewportSize({ width: 320, height: 568 })
    const wall = bar.locator('[data-wall-chip]')
    if (isMobile) await wall.tap()
    else {
      await wall.focus()
      await wall.press('Enter')
    }
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog
      .getByRole('button', { name: copy.common.close, exact: true })
      .click()
    await expect(dialog).toBeHidden()
  })
}
