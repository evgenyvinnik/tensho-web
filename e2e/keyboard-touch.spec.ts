import { expect, test, type Page } from '@playwright/test'
import { openTable, rackTiles } from './helpers/table'

/** Where focus is: `zone:tile id`, or the element's tag. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    const zone = active
      ?.closest('[data-play-zone]')
      ?.getAttribute('data-play-zone')
    return zone && active?.dataset.playTile
      ? `${zone}:${active.dataset.playTile}`
      : (active?.tagName ?? 'none')
  })

/** How a control's CSS key cap (its ::after) is displayed. */
const capDisplay = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((control) => getComputedStyle(control, '::after').display)

const turnsLeft = (page: Page) =>
  page.locator('[data-turns-left]').getAttribute('data-turns-left')

const feltCount = (page: Page) =>
  page.locator('[data-play-zone="felt"] [data-play-tile]').count()

test.describe('keyboard play', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard journey runs on desktop')

  test('picks, moves between and plays tiles without losing focus', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openTable(page)

    // Each Enter moves a tile to the felt; focus stays in the rack.
    const ids = await rackTiles(page).evaluateAll((tiles) =>
      tiles.map((tile) => tile.getAttribute('data-play-tile')!)
    )
    await rackTiles(page).first().focus()
    for (let picked = 1; picked <= 3; picked++) {
      await page.keyboard.press('Enter')
      await expect.poll(() => feltCount(page)).toBe(picked)
      await expect.poll(() => focused(page)).toBe(`hand:${ids[picked]}`)
    }

    // Arrows walk the rack; Up reaches the felt and Down comes back.
    await page.keyboard.press('ArrowRight')
    expect(await focused(page)).toBe(`hand:${ids[4]}`)
    await page.keyboard.press('ArrowUp')
    expect(await focused(page)).toMatch(/^felt:/)
    await page.keyboard.press('ArrowDown')
    expect(await focused(page)).toMatch(/^hand:/)

    // P plays exactly the felt and hands focus back to the rack.
    const before = Number(await turnsLeft(page))
    const play = page.locator('[data-game-action="play"]')
    await expect(play).toHaveAttribute('aria-keyshortcuts', 'P')
    // The key cap shows with a mouse, drawn by CSS: the label stays the same.
    await expect(play).toHaveText('Play hand')
    await expect(page.getByRole('button', { name: 'Play hand' })).toBeVisible()
    expect(await capDisplay(page, '[data-game-action="play"]')).not.toBe('none')
    await page.keyboard.press('p')
    await expect
      .poll(async () => Number(await turnsLeft(page)))
      .toBe(before - 1)
    await expect.poll(() => feltCount(page)).toBe(0)
    await expect.poll(() => focused(page)).toMatch(/^hand:/)

    // A picks every tile, Esc puts them all back; focus is never dropped.
    await page.keyboard.press('a')
    await expect.poll(() => rackTiles(page).count()).toBe(0)
    await expect.poll(() => focused(page)).toMatch(/^felt:/)
    await page.keyboard.press('Escape')
    await expect.poll(() => feltCount(page)).toBe(0)
    await expect.poll(() => focused(page)).toMatch(/^hand:/)
    expect(Number(await turnsLeft(page))).toBe(before - 1)
  })

  test('shortcuts stand down for dialogs and can be turned off', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await openTable(page)
    await rackTiles(page).first().click()
    await rackTiles(page).first().click()
    const before = await turnsLeft(page)

    // Esc closes the guide; it does not also clear the felt.
    await page.getByRole('button', { name: 'How to play' }).click()
    await expect(page.locator('dialog[open]')).toBeVisible()
    await page.keyboard.press('p')
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    expect(await feltCount(page)).toBe(2)
    expect(await turnsLeft(page)).toBe(before)

    // Off in Settings: no key caps, no announcement, P does nothing.
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('tensho-settings') ?? '{}')
      localStorage.setItem(
        'tensho-settings',
        JSON.stringify({
          version: 1,
          ...raw,
          state: { ...raw.state, keyboardShortcuts: false },
        })
      )
    })
    await openTable(page)
    await expect(page.locator('[aria-keyshortcuts]')).toHaveCount(0)
    await expect(page.locator('[data-shortcut]')).toHaveCount(0)
    await rackTiles(page).first().click()
    await rackTiles(page).first().click()
    const turns = await turnsLeft(page)
    await page.keyboard.press('p')
    await page.waitForTimeout(300)
    expect(await turnsLeft(page)).toBe(turns)
  })
})

test.describe('touch play', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch journey runs on the phone')

  test('taps never zoom, keep focus off the tiles and show no key caps', async ({
    page,
  }) => {
    await openTable(page)
    const tile = rackTiles(page).first()
    // A double tap on neighbouring tiles must be two taps, not a page zoom.
    for (const selector of [
      '[data-play-zone="hand"] [data-play-tile]',
      '[data-game-action="play"]',
      // The table itself, so a double tap between tiles cannot zoom either.
      '.viewport-full',
    ])
      await expect(page.locator(selector).first()).toHaveCSS(
        'touch-action',
        'manipulation'
      )
    await tile.tap()
    await expect.poll(() => feltCount(page)).toBe(1)
    expect(await focused(page)).toBe('BODY')
    expect(await capDisplay(page, '[data-game-action="play"]')).toBe('none')
    expect(await capDisplay(page, '[data-select-all]')).toBe('none')
  })
})
