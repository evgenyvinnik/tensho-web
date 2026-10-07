import { expect, test } from '@playwright/test'
import type { ClassicRunSnapshot } from '../src/game/classicRunSnapshot'

const autumnAllowance = (snapshot: ClassicRunSnapshot) =>
  snapshot.state.seasonSystem.seasonStack.filter(
    (season) => season.type === 'Autumn' && !season.isCorrupted
  ).length

// A drop target must not move when font metrics change while a tile is held.
// Exercise the real game and browser layout, not a mocked bounding rectangle.
for (const language of ['en', 'es', 'ru'])
  for (const change of ['text spacing', 'font loading'])
    test(`discard stays anchored during ${change} (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, testInfo) => {
      let releaseFonts = () => {}
      if (change === 'font loading') {
        const ready = new Promise<void>((resolve) => {
          releaseFonts = resolve
        })
        await page.route('**/*.ttf', async (route) => {
          await ready
          await route.continue()
        })
      }
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.addInitScript(() => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
      })
      await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
      const saved = async () => {
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        return page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
        )
      }
      const before = await saved()
      if (change !== 'font loading')
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
      const tile = page
        .locator('[data-play-zone="hand"] [data-play-tile]')
        .last()
      const zone = page.locator('[data-play-zone="discard"]')
      await tile.scrollIntoViewIfNeeded()
      await expect(zone).toBeInViewport()
      const tileId = await tile.getAttribute('data-play-tile')
      const a = (await tile.boundingBox())!,
        b = (await zone.boundingBox())!
      const from = { x: a.x + a.width / 2, y: a.y + a.height / 2 }
      const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
      const touch = isMobile ? await page.context().newCDPSession(page) : null
      if (touch)
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ ...from, id: 1 }],
        })
      else {
        await page.mouse.move(from.x, from.y)
        await page.mouse.down()
      }
      // Deterministic metric stress models font fallback / increased text spacing.
      // It changes only the rack's copy, never the drop target or game state.
      if (change === 'font loading') {
        releaseFonts()
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
      } else
        await zone.locator('..').evaluate((header) => {
          for (const span of header.querySelectorAll('span'))
            if (!span.closest('[data-play-zone="discard"]'))
              span.style.letterSpacing = '2px'
        })
      const shifted = (await zone.boundingBox())!
      await testInfo.attach('discard-geometry', {
        body: JSON.stringify({ before: b, after: shifted, from, to }),
        contentType: 'application/json',
      })
      // Require a stable center, not merely a surviving sliver of hit area.
      expect(Math.abs(shifted.x + shifted.width / 2 - to.x)).toBeLessThan(1)
      expect(Math.abs(shifted.y + shifted.height / 2 - to.y)).toBeLessThan(1)
      expect(shifted.width).toBeGreaterThanOrEqual(44)
      expect(shifted.height).toBeGreaterThanOrEqual(44)
      if (touch) {
        for (let step = 1; step <= 8; step++)
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
              {
                x: from.x + ((to.x - from.x) * step) / 8,
                y: from.y + ((to.y - from.y) * step) / 8,
                id: 1,
              },
            ],
          })
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        })
        await touch.detach()
      } else {
        await page.mouse.move(to.x, to.y, { steps: 8 })
        await page.mouse.up()
      }
      await expect
        .poll(async () =>
          (await saved()).state.discards.some(
            (tile: { id: string }) => tile.id === tileId
          )
        )
        .toBe(true)
      const after = await saved()
      // An organic replacement can draw Autumn and grant a new action.
      // Check expenditure independently of that legitimate allowance increase.
      expect(after.state.discardsRemaining).toBe(
        before.state.discardsRemaining -
          1 +
          autumnAllowance(after) -
          autumnAllowance(before)
      )
      expect(after.state.seasonSystem.discardCount).toBe(
        before.state.seasonSystem.discardCount + 1
      )
      expect(after.state.handsRemaining).toBe(before.state.handsRemaining)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('rack-layout.png') })
    })
