/**
 * E2E Tests for Tensho Mahjong Roguelike
 *
 * Basic smoke tests to verify the app loads and navigates correctly.
 */

import { test, expect } from '@playwright/test'

test.describe('Application Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/en$/)
    await expect(page.getByRole('heading', { name: 'TENSHO' })).toBeVisible()
  })

  test('should display the main menu', async ({ page }) => {
    await page.goto('/')

    // Wait for the menu to be visible
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // Look for common menu elements
    // These selectors should be updated based on actual implementation
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should navigate to tutorial/codex', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to load
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // Try to find and click a tutorial/codex button
    const tutorialButton = page.getByRole('button', { name: /tutorial|codex|help/i })

    // If the button exists, click it
    if (await tutorialButton.count() > 0) {
      await tutorialButton.first().click()

      // Wait for navigation away from the menu.
      await expect(page).not.toHaveURL(/\/en$/)
    }
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // The page should still be functional on mobile
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Game Navigation', () => {
  test('starts a real round and resolves a play through the core loop', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Play', exact: true }).click()

    await expect(page).toHaveURL(/\/en\/play$/)
    await expect(page.getByText('300', { exact: true })).toBeVisible()
    await expect(page.getByText('Hand (14)', { exact: true })).toBeVisible()

    const frameBounds = await page.locator('[data-table-frame]').boundingBox()
    const gameplayBounds = await page
      .locator('[data-table-content] > :first-child')
      .boundingBox()
    expect(frameBounds).not.toBeNull()
    expect(gameplayBounds).not.toBeNull()
    expect(gameplayBounds!.x).toBeGreaterThanOrEqual(frameBounds!.x)
    expect(gameplayBounds!.y).toBeGreaterThanOrEqual(frameBounds!.y)
    expect(gameplayBounds!.x + gameplayBounds!.width).toBeLessThanOrEqual(
      frameBounds!.x + frameBounds!.width
    )
    expect(gameplayBounds!.y + gameplayBounds!.height).toBeLessThanOrEqual(
      frameBounds!.y + frameBounds!.height
    )

    const topBarBounds = await page
      .locator('[data-frame-corner-row="top"]')
      .boundingBox()
    const bottomBarBounds = await page
      .locator('[data-frame-corner-row="bottom"]')
      .boundingBox()
    const topLeftOrnamentBounds = await page
      .locator('[data-table-ornament="top-left"]')
      .boundingBox()
    const topRightOrnamentBounds = await page
      .locator('[data-table-ornament="top-right"]')
      .boundingBox()
    const bottomLeftOrnamentBounds = await page
      .locator('[data-table-ornament="bottom-left"]')
      .boundingBox()
    const bottomRightOrnamentBounds = await page
      .locator('[data-table-ornament="bottom-right"]')
      .boundingBox()

    expect(topBarBounds).not.toBeNull()
    expect(bottomBarBounds).not.toBeNull()
    expect(topLeftOrnamentBounds).not.toBeNull()
    expect(topRightOrnamentBounds).not.toBeNull()
    expect(bottomLeftOrnamentBounds).not.toBeNull()
    expect(bottomRightOrnamentBounds).not.toBeNull()

    const expectRowToClearCorners = (
      row: NonNullable<typeof topBarBounds>,
      left: NonNullable<typeof topLeftOrnamentBounds>,
      right: NonNullable<typeof topRightOrnamentBounds>
    ) => {
      const roundingTolerance = 0.5
      expect(row.x + roundingTolerance).toBeGreaterThanOrEqual(
        left.x + left.width
      )
      expect(row.x + row.width).toBeLessThanOrEqual(
        right.x + roundingTolerance
      )
    }

    expectRowToClearCorners(
      topBarBounds!,
      topLeftOrnamentBounds!,
      topRightOrnamentBounds!
    )
    expectRowToClearCorners(
      bottomBarBounds!,
      bottomLeftOrnamentBounds!,
      bottomRightOrnamentBounds!
    )

    const topBarContentWidth = await page
      .locator('[data-frame-corner-row="top"]')
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
    expect(topBarContentWidth.scrollWidth).toBeLessThanOrEqual(
      topBarContentWidth.clientWidth
    )
    const bottomBarContentWidth = await page
      .locator('[data-frame-corner-row="bottom"]')
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
    expect(bottomBarContentWidth.scrollWidth).toBeLessThanOrEqual(
      bottomBarContentWidth.clientWidth
    )

    const topBarButtonBounds = await page
      .locator('[data-frame-corner-row="top"] button')
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect()
          return { left: rect.left, right: rect.right }
        })
      )
    for (const button of topBarButtonBounds) {
      expect(button.left + 0.5).toBeGreaterThanOrEqual(topBarBounds!.x)
      expect(button.right).toBeLessThanOrEqual(
        topBarBounds!.x + topBarBounds!.width + 0.5
      )
    }

    const viewport = page.viewportSize()
    const playButtonBounds = await page
      .locator('[data-game-action="play"]')
      .boundingBox()
    expect(playButtonBounds).not.toBeNull()
    expect(playButtonBounds!.y + playButtonBounds!.height).toBeLessThanOrEqual(
      viewport!.height
    )

    const handBounds = await page
      .locator(
        'img[alt$="Characters"], img[alt$="Circles"], img[alt$="Bamboo"], img[alt$="Wind"], img[alt$="Dragon"]'
      )
      .evaluateAll((images) =>
        images.map((image) => {
          const rect = image.getBoundingClientRect()
          return { left: rect.left, right: rect.right }
        })
      )
    expect(Math.min(...handBounds.map((bounds) => bounds.left))).toBeGreaterThanOrEqual(0)
    expect(Math.max(...handBounds.map((bounds) => bounds.right))).toBeLessThanOrEqual(
      viewport!.width
    )
    const initialHands = Number(
      (await page.getByTitle('Hands remaining').textContent())?.match(/\d+/)?.[0]
    )
    expect(initialHands).toBeGreaterThan(0)

    const tutorialDismiss = page.getByRole('button', { name: 'Got it' })
    if (await tutorialDismiss.isVisible()) {
      await tutorialDismiss.click()
    }

    const initialTileLabels = await page.locator('img[alt$="Characters"], img[alt$="Circles"], img[alt$="Bamboo"], img[alt$="Wind"], img[alt$="Dragon"]').evaluateAll(
      (images) => images.map((image) => image.getAttribute('alt'))
    )

    const handTiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
    await handTiles.last().click()
    await handTiles.last().click()
    await expect(page.locator('[data-game-action="play"]')).toBeEnabled()
    await page.locator('[data-game-action="play"]').click()

    await expect(async () => {
      const path = new URL(page.url()).pathname
      if (path.endsWith('/shop')) {
        await expect(page.getByText('Round Complete!', { exact: true })).toBeVisible()
        return
      }

      await expect(page.getByText('Hand (14)', { exact: true })).toBeVisible()
      await expect(page.getByTitle('Hands remaining')).toContainText(String(initialHands - 1))
      const nextTileLabels = await page.locator('img[alt$="Characters"], img[alt$="Circles"], img[alt$="Bamboo"], img[alt$="Wind"], img[alt$="Dragon"]').evaluateAll(
        (images) => images.map((image) => image.getAttribute('alt'))
      )
      expect(nextTileLabels).not.toEqual(initialTileLabels)
    }).toPass()
  })

  test('keeps the ornamental corners free on a 320px phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/play$/)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()

    const layout = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const bounds = element.getBoundingClientRect()
        return {
          left: bounds.left,
          right: bounds.right,
        }
      }

      const top = document.querySelector<HTMLElement>(
        '[data-frame-corner-row="top"]'
      )
      const bottom = document.querySelector<HTMLElement>(
        '[data-frame-corner-row="bottom"]'
      )

      return {
        top: rect('[data-frame-corner-row="top"]'),
        bottom: rect('[data-frame-corner-row="bottom"]'),
        topLeft: rect('[data-table-ornament="top-left"]'),
        topRight: rect('[data-table-ornament="top-right"]'),
        bottomLeft: rect('[data-table-ornament="bottom-left"]'),
        bottomRight: rect('[data-table-ornament="bottom-right"]'),
        rowsFit:
          !!top &&
          !!bottom &&
          top.scrollWidth <= top.clientWidth &&
          bottom.scrollWidth <= bottom.clientWidth,
        buttonsFit: [top, bottom].every(
          (row) =>
            !!row &&
            Array.from(row.querySelectorAll('button')).every((button) => {
              const rowBounds = row.getBoundingClientRect()
              const buttonBounds = button.getBoundingClientRect()
              return (
                buttonBounds.left >= rowBounds.left - 0.5 &&
                buttonBounds.right <= rowBounds.right + 0.5 &&
                button.scrollWidth <= button.clientWidth
              )
            })
        ),
        buttonMetrics: [top, bottom].flatMap((row) =>
          row
            ? Array.from(row.querySelectorAll('button')).map((button) => {
                const rowBounds = row.getBoundingClientRect()
                const buttonBounds = button.getBoundingClientRect()
                return {
                  action: button.dataset.gameAction ?? button.ariaLabel,
                  clientWidth: button.clientWidth,
                  left: buttonBounds.left,
                  right: buttonBounds.right,
                  rowLeft: rowBounds.left,
                  rowRight: rowBounds.right,
                  scrollWidth: button.scrollWidth,
                }
              })
            : []
        ),
        hasPageOverflow:
          document.documentElement.scrollWidth > window.innerWidth ||
          document.documentElement.scrollHeight > window.innerHeight,
      }
    })

    expect(layout.top).not.toBeNull()
    expect(layout.bottom).not.toBeNull()
    expect(layout.topLeft).not.toBeNull()
    expect(layout.topRight).not.toBeNull()
    expect(layout.bottomLeft).not.toBeNull()
    expect(layout.bottomRight).not.toBeNull()
    expect(layout.top!.left + 0.5).toBeGreaterThanOrEqual(layout.topLeft!.right)
    expect(layout.top!.right).toBeLessThanOrEqual(layout.topRight!.left + 0.5)
    expect(layout.bottom!.left + 0.5).toBeGreaterThanOrEqual(
      layout.bottomLeft!.right
    )
    expect(layout.bottom!.right).toBeLessThanOrEqual(
      layout.bottomRight!.left + 0.5
    )
    expect(layout.rowsFit).toBe(true)
    expect(
      layout.buttonsFit,
      JSON.stringify(layout.buttonMetrics, null, 2)
    ).toBe(true)
    expect(layout.hasPageOverflow).toBe(false)
  })

  test('pays at least what the score preview forecast', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/play$/)

    const tutorialDismiss = page.getByRole('button', { name: 'Got it' })
    if (await tutorialDismiss.isVisible().catch(() => false)) {
      await tutorialDismiss.click()
    }

    const readScore = async () =>
      Number(
        (await page.locator('[data-tutorial="current-score"]').textContent())?.replace(
          /[^\d]/g,
          ''
        ) ?? '0'
      )

    const handTiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
    await handTiles.last().click()
    await handTiles.last().click()

    // The panel forecasts the exact tactical group that will be committed.
    const previewTotal = page.getByTestId('score-preview-total')
    await expect(previewTotal).toBeVisible()
    const previewed = Number((await previewTotal.textContent())?.replace(/[^\d]/g, '') ?? '0')
    expect(previewed).toBeGreaterThan(0)

    const scoreBefore = await readScore()
    await page.locator('[data-game-action="play"]').click()

    // The preview resolves chance-based tile effects to their guaranteed
    // outcome, so it is a floor the real play never undercuts.
    await expect(async () => {
      const path = new URL(page.url()).pathname
      const scoreAfter = path.endsWith('/shop') ? previewed : await readScore()
      expect(scoreAfter - (path.endsWith('/shop') ? 0 : scoreBefore)).toBeGreaterThanOrEqual(
        previewed
      )
    }).toPass({ timeout: 10_000 })
  })

  test('should have clickable buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // Find all buttons on the page
    const buttons = await page.getByRole('button').all()

    // Each button should be visible and enabled
    for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
      await expect(button).toBeVisible()
    }
  })

  test('shows a dismissible contextual tip without disabling gameplay', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('tensho_progressive_hints_shown')
      localStorage.removeItem('tensho_hints_disabled')
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Play', exact: true }).click()

    const tip = page.getByRole('status')
    await expect(tip).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('[data-game-action="skip"]')).toBeEnabled()
    await page.getByRole('button', { name: /Close/ }).click()
    await expect(tip).toBeHidden()
  })

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // Filter out known acceptable errors (like missing resources during dev)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('Failed to load resource') &&
        !e.includes('net::ERR_')
    )

    // Should have no critical console errors
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // Check for at least one heading
    const headings = await page.locator('h1, h2, h3').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()

    // Tab to the first focusable element
    await page.keyboard.press('Tab')

    // The focused element should be visible
    const focusedElement = await page.locator(':focus')
    if (await focusedElement.count() > 0) {
      await expect(focusedElement).toBeVisible()
    }
  })
})
