/**
 * E2E Tests for Tensho Mahjong Roguelike
 *
 * Basic smoke tests to verify the app loads and navigates correctly.
 */

import { test, expect } from '@playwright/test'
import {
  rackTiles,
  selectTiles,
  settleReveals,
  startRun,
  turnBudget,
} from './helpers/table'

test.describe('Application Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/en$/)
    await expect(page.getByRole('heading', { name: 'TENSHO' })).toBeVisible()
  })

  test('should display the main menu', async ({ page }) => {
    await page.goto('/')

    // Wait for the menu to be visible
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // Look for common menu elements
    // These selectors should be updated based on actual implementation
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should navigate to tutorial/codex', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to load
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // Missing navigation must fail, not silently skip the only action.
    const codexButton = page.getByRole('button', { name: /Codex/ })
    await expect(codexButton).toBeVisible()
    await codexButton.click()
    await expect(page).toHaveURL(/\/en\/codex$/)
    await expect(
      page.getByRole('heading', { name: /Codex/, level: 1 })
    ).toBeVisible()
  })

  test('keeps illustrated Codex categories readable on a narrow phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/en/codex')

    const hero = page.locator('[data-codex-category-hero]')
    const image = page.locator('[data-codex-category-image]')

    await expect(hero).toBeVisible()
    await expect(image).toHaveAttribute('src', /codex\/archive\.webp$/)

    await page.getByRole('button', { name: /Flora/ }).click()
    await expect(image).toHaveAttribute('src', /codex\/flora\.webp$/)
    // Let the new illustration finish loading before measuring it.
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.complete))
      .toBe(true)

    const layout = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(
        '[data-codex-category-hero]'
      )
      const image = document.querySelector<HTMLImageElement>(
        '[data-codex-category-image]'
      )
      const bounds = hero?.getBoundingClientRect()

      return {
        noHorizontalOverflow:
          document.documentElement.scrollWidth <= window.innerWidth,
        heroFits:
          !!bounds &&
          bounds.left >= 0 &&
          bounds.right <= window.innerWidth &&
          bounds.height >= 120,
        imageLoaded:
          !!image &&
          image.complete &&
          image.naturalWidth === 1280 &&
          image.naturalHeight === 720,
      }
    })

    expect(layout).toEqual({
      noHorizontalOverflow: true,
      heroFits: true,
      imageLoaded: true,
    })
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // The page should still be functional on mobile
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('keeps the illustrated table selector readable and in bounds', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Choose table and stake' }).click()

    const modal = page.locator('[data-table-style-modal]')
    const greenFelt = page.getByRole('button', {
      name: 'Green Felt, Classic table',
    })
    await expect(modal).toBeVisible()
    await expect(greenFelt).toBeVisible()
    await expect(greenFelt.locator('img[src*="/tables/"]')).toHaveAttribute(
      'src',
      /green_felt\.webp$/
    )
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
    // Let every table illustration finish loading before measuring them.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLImageElement>(
              'img[src*="/illustrations/tables/"]'
            )
          ).every((image) => image.complete)
        )
      )
      .toBe(true)

    const layout = await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>(
        '[data-table-style-modal]'
      )
      const header = document.querySelector<HTMLElement>(
        '[data-table-style-header]'
      )
      const footer = document.querySelector<HTMLElement>(
        '[data-table-style-footer]'
      )
      const list = document.querySelector<HTMLElement>(
        '[data-table-style-list]'
      )
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          'img[src*="/illustrations/tables/"]'
        )
      )

      return {
        noHorizontalOverflow:
          document.documentElement.scrollWidth <= window.innerWidth,
        headerFits: !!header && header.scrollHeight <= header.clientHeight,
        footerFits: !!footer && footer.scrollHeight <= footer.clientHeight,
        listScrolls: !!list && getComputedStyle(list).overflowY === 'auto',
        modalFits:
          !!modal &&
          modal.getBoundingClientRect().left >= 0 &&
          modal.getBoundingClientRect().right <= window.innerWidth &&
          modal.getBoundingClientRect().top >= 0 &&
          modal.getBoundingClientRect().bottom <= window.innerHeight,
        imagesLoaded: images.every(
          (image) =>
            image.complete &&
            image.naturalWidth === 1280 &&
            image.naturalHeight === 720
        ),
      }
    })

    expect(layout).toEqual({
      noHorizontalOverflow: true,
      headerFits: true,
      footerFits: true,
      listScrolls: true,
      modalFits: true,
      imagesLoaded: true,
    })

    const descriptionsFit = await page
      .locator('[data-table-description]')
      .evaluateAll((descriptions) =>
        descriptions.every(
          (description) => description.scrollHeight <= description.clientHeight
        )
      )
    expect(descriptionsFit).toBe(true)
  })

  test('localizes table names and descriptions', async ({ page }) => {
    await page.goto('/es/')
    await page.getByRole('button', { name: 'Elige mesa y apuesta' }).click()

    await expect(
      page.getByRole('heading', { name: 'Fieltro Verde', exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(/La mesa de mahjong clásica/, { exact: false })
    ).toBeVisible()
    const bamboo = page.locator('[data-table-style-card="bamboo_mat"]')
    await expect(bamboo).toHaveAccessibleName(
      /Reúne las 4 flores en una partida/
    )
    await expect(bamboo).toContainText('+25% al peso de robo de flores')
    await expect(
      page.locator('[data-table-style-card="temple_stone"]')
    ).toContainText('+50% a la puntuación base')
  })

  test('carries a chosen table into gameplay rules and illustration, without a felt icon', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'tensho-table-style-progress',
        JSON.stringify({
          state: {
            currentStyleId: 'green_felt',
            unlockedStyles: ['green_felt', 'dragons_den'],
          },
          version: 0,
        })
      )
    })
    await page.goto('/en')
    await page.getByRole('button', { name: 'Choose table and stake' }).click()
    await page.locator('[data-table-style-card="dragons_den"]').click()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await page.getByRole('button', { name: 'New Run', exact: true }).click()
    await expect(page.locator('[data-table-style-id]')).toHaveAttribute(
      'data-table-style-id',
      'dragons_den'
    )
    // The table is the backdrop; it is not repeated as an icon in the header.
    await expect(
      page.locator('[data-run-header] img[src*="/tables/"]')
    ).toHaveCount(0)
    await expect(page.locator('[data-tutorial="score-target"]')).toHaveText(
      '375'
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })

  test('direct play uses the selected Imperial table and grants its extra scroll', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'tensho-table-style-progress',
        JSON.stringify({
          state: {
            currentStyleId: 'imperial_gold',
            unlockedStyles: ['green_felt', 'imperial_gold'],
          },
          version: 0,
        })
      )
    })
    await page.goto('/en/play')
    await expect(page.locator('[data-table-style-id]')).toHaveAttribute(
      'data-table-style-id',
      'imperial_gold'
    )
    await expect(page.locator('[data-decree-scroll]')).toHaveCount(3)
    // Ordinary starters can themselves be Regional Mandates. The table grants
    // an additional third scroll, rather than replacing those two starters.
    await expect(page.locator('[data-decree-scroll]').last()).toHaveAttribute(
      'data-decree-scroll',
      'RegionalMandate'
    )
  })
})

test.describe('Game Navigation', () => {
  test('opens the illustrated hand guide on a first run, and again from the ? beside Exit', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.removeItem('tensho_hand_guide_seen')
    )
    await page.goto('/')
    await page.getByRole('button', { name: 'New Run', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/play$/)
    const guide = page.locator('[data-beginner-guide]')
    await expect(
      page.getByRole('heading', { name: 'How to play', exact: true })
    ).toBeVisible()
    await expect(guide.locator('[data-guide-pattern]')).toHaveCount(11)
    await expect(guide).toContainText('Winds are worth 50 points each')
    await expect(guide).toContainText('Each round gives you 6 Turns')
    const guideLayout = await page
      .locator('dialog [data-popup-scroll]')
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return {
          noHorizontalOverflow:
            document.documentElement.scrollWidth <= window.innerWidth,
          fitsViewport:
            bounds.left >= 0 &&
            bounds.right <= window.innerWidth &&
            bounds.top >= 0 &&
            bounds.bottom <= window.innerHeight,
          scrollable: getComputedStyle(element).overflowY === 'auto',
        }
      })
    expect(guideLayout).toEqual({
      noHorizontalOverflow: true,
      fitsViewport: true,
      scrollable: true,
    })
    await page.getByRole('button', { name: /^Let.s play$/ }).click()
    await expect(guide).toHaveCount(0)
    await settleReveals(page)

    // "?" sits immediately before Exit and Settings.
    const controls = await page
      .locator('[data-run-header] button[aria-label]')
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute('aria-label'))
      )
    expect(controls.slice(-3)).toEqual(['How to play', 'Exit', 'Settings'])
    await page.getByRole('button', { name: 'How to play', exact: true }).click()
    await expect(guide).toBeVisible()
  })

  test('opens illustrated Decree details and keeps Sell contextual', async ({
    page,
  }) => {
    await startRun(page)

    const firstDecree = page.locator('[data-decree-scroll]').first()
    await expect(firstDecree).toBeVisible()
    await expect(firstDecree.locator('img').first()).toHaveAttribute(
      'src',
      /\/illustrations\/(decrees|items\/decrees)\/.+\.(png|webp)$/
    )
    await expect(page.getByRole('button', { name: /^Sell / })).toHaveCount(0)

    await firstDecree.click()
    const details = page.getByRole('dialog')
    await expect(details).toBeVisible()
    const sellButton = details.getByRole('button', { name: /^Sell / })
    await expect(sellButton).toBeVisible()

    const bounds = await details.boundingBox()
    const viewport = page.viewportSize()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height)
  })

  test('starts a real round and resolves a play through the two actions', async ({
    page,
  }) => {
    await startRun(page)
    await expect(page.locator('[data-tutorial="score-target"]')).toHaveText(
      '300'
    )
    // Act/round and score/target share one header row.
    const header = await page.locator('[data-run-header]').evaluate((el) => {
      const round = el.querySelector('[data-run-header-round]')!
      const score = el.querySelector('[data-run-header-score]')!
      const a = round.getBoundingClientRect()
      const b = score.getBoundingClientRect()
      return {
        sameRow: Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) < 12,
        round: round.textContent,
      }
    })
    expect(header).toEqual({ sameRow: true, round: 'Act 1 · Small' })

    // Exactly two actions, with stable labels.
    const actions = page.locator('[data-action-bar] button')
    await expect(actions).toHaveCount(2)
    await expect(page.locator('[data-game-action="redraw"]')).toContainText(
      'REDRAW'
    )
    await expect(page.locator('[data-game-action="play"]')).toHaveText(
      'Play hand'
    )
    await expect(page.getByRole('button', { name: /skip|discard/i })).toHaveCount(
      0
    )

    const rackSize = async () => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('tensho-classic-run-v1')!)
        const springs = saved.snapshot.state.seasonSystem.seasonStack.filter(
          (season: { type: string; isCorrupted: boolean }) =>
            season.type === 'Spring' && !season.isCorrupted
        ).length
        return 14 + 2 * springs
      })
    }
    await expect(rackTiles(page)).toHaveCount(await rackSize())
    const turnsLeft = async () => (await turnBudget(page)).turns
    const initialTurns = await turnsLeft()
    // Six, plus any a starting Decree grants.
    expect(initialTurns).toBeGreaterThanOrEqual(6)

    // Selecting shows the hand score; the labels do not change.
    await selectTiles(page, 2)
    await expect(page.locator('[data-hand-score-state]')).toHaveAttribute(
      'data-hand-score-state',
      'preview'
    )
    await expect(page.locator('[data-game-action="play"]')).toHaveText(
      'Play hand'
    )
    const before = await rackTiles(page).evaluateAll((tiles) =>
      tiles.map((tile) => tile.getAttribute('data-play-tile'))
    )
    await page.locator('[data-game-action="play"]').click()
    await expect(page.locator('[data-play-toast]')).toBeVisible()

    await expect(async () => {
      if (new URL(page.url()).pathname.endsWith('/shop')) {
        await expect(page.getByTestId('round-cash-out')).toBeVisible()
        return
      }
      await settleReveals(page)
      await expect(rackTiles(page)).toHaveCount(await rackSize())
      expect(await turnsLeft()).toBe(initialTurns - 1)
      const after = await rackTiles(page).evaluateAll((tiles) =>
        tiles.map((tile) => tile.getAttribute('data-play-tile'))
      )
      expect(after).not.toEqual(before)
      await expect(page.locator('[data-hand-score-state]')).toHaveAttribute(
        'data-hand-score-state',
        'last'
      )
    }).toPass()
  })

  test('REDRAW replaces any number of tiles with one Turn', async ({ page }) => {
    await startRun(page)
    const { turns, free } = await turnBudget(page)
    const chosen = await rackTiles(page)
      .evaluateAll((tiles) =>
        tiles.slice(0, 7).map((tile) => tile.getAttribute('data-play-tile'))
      )
    for (const id of chosen)
      await page.locator(`[data-play-tile="${id}"]`).click()
    await page.locator('[data-game-action="redraw"]').click()
    await settleReveals(page)
    for (const id of chosen)
      await expect(page.locator(`[data-play-tile="${id}"]`)).toHaveCount(0)
    await expect(page.locator('[data-turns-left]')).toHaveAttribute(
      'data-turns-left',
      String(free > 0 ? turns : turns - 1)
    )
  })

  test('keeps the ornamental corners free on a 320px phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await startRun(page)

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
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        overflowY: document.documentElement.scrollHeight - window.innerHeight,
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
    expect(layout.rowsFit, JSON.stringify(layout, null, 2)).toBe(true)
    expect(
      layout.buttonsFit,
      JSON.stringify(layout.buttonMetrics, null, 2)
    ).toBe(true)
    // The ornaments and action rows staying inside a 320px phone is what this
    // test is for, and the assertions above check it directly.
    //
    // The document itself intermittently measures one pixel wider and taller
    // than the viewport. Diagnosed: every element is exactly 320px wide but an
    // ancestor offsets the tree by 0.6px, so `scrollWidth` rounds to 321. It is
    // not `.viewport-full` — replacing its `100vw` with `100%` changes nothing —
    // and it appears only after another test has run, which is why this was the
    // flakiest assertion in the suite. One pixel is tolerated so a real overflow
    // still fails; the sub-pixel offset is a separate, cosmetic defect.
    expect(layout.overflowX).toBeLessThanOrEqual(1)
    expect(layout.overflowY).toBeLessThanOrEqual(1)
  })

  test('pays at least what the hand score forecast', async ({ page }) => {
    await startRun(page)
    const readScore = async () =>
      Number(
        (
          await page.locator('[data-tutorial="current-score"]').textContent()
        )?.replace(/[^\d]/g, '') ?? '0'
      )
    await selectTiles(page, 2)
    const previewTotal = page.locator('[data-hand-score-total]')
    await expect(previewTotal).toHaveAttribute('title', /\d/)
    const previewed = Number(
      (await previewTotal.getAttribute('title'))?.replace(/[^\d]/g, '') ?? '0'
    )
    expect(previewed).toBeGreaterThan(0)
    const scoreBefore = await readScore()
    await page.locator('[data-game-action="play"]').click()
    // Chance-based tile effects resolve to their guaranteed outcome in the
    // forecast, so it is a floor the real play never undercuts.
    await expect(async () => {
      const path = new URL(page.url()).pathname
      const scoreAfter = path.endsWith('/shop') ? previewed : await readScore()
      expect(
        scoreAfter - (path.endsWith('/shop') ? 0 : scoreBefore)
      ).toBeGreaterThanOrEqual(previewed)
    }).toPass({ timeout: 10_000 })
  })

  test('should have clickable buttons', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // Find all buttons on the page
    const buttons = await page.getByRole('button').all()

    // Each button should be visible and enabled
    for (const button of buttons.slice(0, 5)) {
      // Check first 5 buttons
      await expect(button).toBeVisible()
    }
  })

  test('keeps the table quiet: no coach tips or ready labels', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('tensho_progressive_hints_shown')
      localStorage.removeItem('tensho_hints_disabled')
    })
    await startRun(page)
    await expect(page.locator('[data-beginner-coach]')).toHaveCount(0)
    await expect(page.getByText(/ready|Your first move/i)).toHaveCount(0)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  })

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // Filter out known acceptable errors (like missing resources during dev)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Failed to load resource') && !e.includes('net::ERR_')
    )

    // Should have no critical console errors
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // Check for at least one heading
    const headings = await page.locator('h1, h2, h3').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'New Run', exact: true })
    ).toBeVisible()

    // Tab to the first focusable element
    await page.keyboard.press('Tab')

    // The focused element should be visible
    const focusedElement = await page.locator(':focus')
    if ((await focusedElement.count()) > 0) {
      await expect(focusedElement).toBeVisible()
    }
  })
})
