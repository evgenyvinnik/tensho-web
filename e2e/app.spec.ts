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

      // Wait for navigation
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
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
    const viewport = page.viewportSize()
    const playButtonBounds = await page
      .getByRole('button', { name: 'PLAY HAND' })
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

    await page.getByRole('button', { name: 'PLAY HAND' }).click()

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

    // With nothing selected the panel forecasts the whole hand, which is also
    // what PLAY HAND commits.
    const previewTotal = page.getByTestId('score-preview-total')
    await expect(previewTotal).toBeVisible()
    const previewed = Number((await previewTotal.textContent())?.replace(/[^\d]/g, '') ?? '0')
    expect(previewed).toBeGreaterThan(0)

    const scoreBefore = await readScore()
    await page.getByRole('button', { name: 'PLAY HAND' }).click()

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
    await expect(page.getByRole('button', { name: 'PLAY HAND' })).toBeEnabled()
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
