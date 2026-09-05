/**
 * E2E coverage for the Table Loop prototype.
 *
 * The experiments document asks for the irreversible transitions to be walked
 * through in a real browser: the opening build choice, a committed placement
 * that matches its forecast, and slot legality. These run at a phone viewport
 * because the loop is meant to be decided with taps.
 *
 * `?seed=` pins the deal. Without it an opening rack occasionally holds no
 * legal group at all — a real situation the player answers with an exchange,
 * but not one a placement test should have to survive.
 */

import { test, expect, type Page } from '@playwright/test'

const PHONE = { width: 390, height: 844 }

/** A deal whose opening rack holds several groups, so placement is testable. */
const SEED = 7

/** Enter the prototype and take the first offered Decree. */
async function startRun(page: Page) {
  await page.setViewportSize(PHONE)
  await page.goto(`/en/table-loop?seed=${SEED}`)

  await expect(
    page.getByRole('heading', { name: 'Choose how you will play' })
  ).toBeVisible()

  await page.locator('[data-testid^="table-decree-"]').first().click()
  await expect(page.getByTestId('table-loop-rack')).toBeVisible()
}

/** Rack tiles as {locator, suit, rank}, read from their accessible names. */
async function readRack(page: Page) {
  const buttons = await page.locator('[data-testid^="rack-tile-"]').all()
  const tiles: {
    button: (typeof buttons)[number]
    suit: string
    rank: number | string
  }[] = []

  for (const button of buttons) {
    const alt = (await button.locator('img').getAttribute('alt')) ?? ''
    const suited = alt.match(/^(?:Red )?(\d) of (Characters|Circles|Bamboo)$/)
    tiles.push(
      suited
        ? { button, suit: suited[2], rank: Number(suited[1]) }
        : { button, suit: 'honor', rank: alt }
    )
  }
  return tiles
}

/** The first sequence, triplet or pair the rack can make. */
function findGroup(tiles: Awaited<ReturnType<typeof readRack>>) {
  for (const tile of tiles) {
    if (typeof tile.rank !== 'number') continue
    const second = tiles.find(
      (other) => other.suit === tile.suit && other.rank === tile.rank + 1
    )
    const third = tiles.find(
      (other) => other.suit === tile.suit && other.rank === tile.rank + 2
    )
    if (second && third) return [tile, second, third]
  }

  const byIdentity = new Map<string, typeof tiles>()
  for (const tile of tiles) {
    const key = `${tile.suit}:${tile.rank}`
    byIdentity.set(key, [...(byIdentity.get(key) ?? []), tile])
  }
  for (const bucket of byIdentity.values()) {
    if (bucket.length >= 2) return bucket.slice(0, 2)
  }
  return null
}

test.describe('Table Loop prototype', () => {
  test('opens on a build choice and deals a rack once one is taken', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/en/table-loop?seed=${SEED}`)

    // Three understandable starting Decrees, and no tiles until one is chosen.
    await expect(page.locator('[data-testid^="table-decree-"]')).toHaveCount(3)
    await expect(page.getByTestId('table-loop-rack')).toHaveCount(0)

    await page.locator('[data-testid^="table-decree-"]').first().click()

    await expect(page.getByTestId('table-loop-rack')).toBeVisible()
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    await expect(page.locator('[data-testid^="table-slot-"]')).toHaveCount(5)
  })

  test('every slot is disabled until a legal group is selected', async ({
    page,
  }) => {
    await startRun(page)

    for (const slot of await page.locator('[data-testid^="table-slot-"]').all()) {
      await expect(slot).toBeDisabled()
    }
  })

  test('commits a group for exactly the forecast it showed', async ({ page }) => {
    await startRun(page)

    const group = findGroup(await readRack(page))
    expect(group, 'the seeded opening rack holds several groups').not.toBeNull()

    for (const tile of group!) await tile.button.click()

    const open = page.locator('[data-testid^="table-slot-"]:not([disabled])').first()
    await expect(open).toBeVisible()

    const forecast = Number(
      ((await open.innerText()).match(/\+([\d,]+)/)?.[1] ?? '0').replace(/,/g, '')
    )
    expect(forecast).toBeGreaterThan(0)

    await open.click()

    // The chain names the placement, and the total equals the forecast.
    const chain = page.getByTestId('causal-chain')
    await expect(chain).toBeVisible()
    await expect(chain).toContainText('placed')

    const scoreLine = page.locator('text=/^\\/ \\d+$/').first()
    await expect(scoreLine).toBeVisible()
    await expect(page.locator('body')).toContainText(String(forecast))

    // One placement action was spent, and the rack refilled.
    await expect(page.locator('body')).toContainText('5 actions')
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
  })

  test('cannot finish the round before the target is met', async ({ page }) => {
    await startRun(page)
    await expect(page.getByTestId('table-loop-finish')).toBeDisabled()
  })

  test('replays the same deal for the same seed', async ({ page }) => {
    await startRun(page)
    const first = (await readRack(page)).map((tile) => `${tile.suit}${tile.rank}`)

    await page.reload()
    await page.locator('[data-testid^="table-decree-"]').first().click()
    const second = (await readRack(page)).map((tile) => `${tile.suit}${tile.rank}`)

    expect(second).toEqual(first)
  })

  test('reaches the prototype in another language', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/ja/table-loop?seed=${SEED}`)

    // Fully translated: the opening panel carries no English fallback.
    await expect(page.getByRole('heading', { name: '打ち方を選ぶ' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Choose how you will play')
  })
})
