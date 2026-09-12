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

    for (const slot of await page
      .locator('[data-testid^="table-slot-"]')
      .all()) {
      await expect(slot).toBeDisabled()
    }
  })

  test('commits a group for exactly the forecast it showed', async ({
    page,
  }) => {
    await startRun(page)

    const group = findGroup(await readRack(page))
    expect(group, 'the seeded opening rack holds several groups').not.toBeNull()

    for (const tile of group!) await tile.button.click()

    const open = page
      .locator('[data-testid^="table-slot-"]:not([disabled])')
      .first()
    await expect(open).toBeVisible()

    const forecast = Number(
      ((await open.innerText()).match(/\+([\d,]+)/)?.[1] ?? '0').replace(
        /,/g,
        ''
      )
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
    const first = (await readRack(page)).map(
      (tile) => `${tile.suit}${tile.rank}`
    )

    // Explicitly discard this test's save to compare two fresh seeded runs.
    await page.evaluate(() => localStorage.removeItem('tensho-table-loop-v1'))
    await page.reload()
    await page.locator('[data-testid^="table-decree-"]').first().click()
    const second = (await readRack(page)).map(
      (tile) => `${tile.suit}${tile.rank}`
    )

    expect(second).toEqual(first)
  })

  test('reaches the prototype in another language', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/ja/table-loop?seed=${SEED}`)

    // Fully translated: the opening panel carries no English fallback.
    await expect(
      page.getByRole('heading', { name: '打ち方を選ぶ' })
    ).toBeVisible()
    await expect(page.locator('body')).not.toContainText(
      'Choose how you will play'
    )
  })
})

test.describe('Table Loop artwork and recovery', () => {
  for (const [id, name, rule] of [
    [
      'terminal_gate',
      'Terminal Gate',
      'A group containing a 1 or a 9 scores +40.',
    ],
    [
      'gap_bridge',
      'Gap Bridge',
      'Once a round, a run may skip one rank: 3·4·6 counts as a sequence.',
    ],
  ] as const) {
    test(`renders the generated ${name} scroll with accessible rule details`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await startRun(page)
      await page.setViewportSize({ width: 320, height: 568 })
      // Presentation fixture only; no acquisition or balance claim. The same
      // TableDecreeArt component is used by shop cards and owned inventory.
      await page.evaluate(async (id) => {
        const path = '/src/stores/tableLoopStore.ts'
        const { useTableLoopStore } = await import(path)
        const { state } = useTableLoopStore.getState()
        useTableLoopStore.setState({
          state: {
            ...state,
            ownedDecrees: [...state.ownedDecrees, id],
          },
        })
      }, id)
      const scroll = page.getByTestId(`owned-scroll-${id}`)
      await expect(scroll.locator('img')).toHaveAttribute(
        'src',
        new RegExp(`${id.replace(/_/g, '-')}\\.png$`)
      )
      await expect(scroll.locator('img')).toHaveJSProperty('naturalWidth', 1254)
      await scroll.click()
      const detail = page.getByRole('dialog', { name })
      await expect(detail).toContainText(rule)
      await expect(detail).toBeInViewport()
      const bounds = await detail.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.y).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(568)
      await page.screenshot({
        path: testInfo.outputPath(`${id.replace(/_/g, '-')}-owned.png`),
      })
    })
  }

  test('loads all starter artwork and keeps short-screen controls reachable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/en/table-loop?seed=7')
    const cards = page.locator('[data-testid^="table-decree-"]')
    await expect(cards).toHaveCount(3)
    expect(
      await page
        .getByRole('heading', { level: 1 })
        .evaluate((heading) =>
          Number.parseFloat(getComputedStyle(heading).fontSize)
        )
    ).toBeLessThanOrEqual(24)
    for (const card of await cards.all()) {
      await expect(card.locator('img')).toHaveJSProperty('complete', true)
      expect(
        await card
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.naturalWidth)
      ).toBeGreaterThan(0)
    }
    await page.getByTestId('practice-start').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('practice-start')).toBeInViewport()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })

  test('shows owned scroll details on focus and tap, and closes with Escape or outside tap', async ({
    page,
  }) => {
    await startRun(page)
    const scroll = page.locator('[data-testid^="owned-scroll-"]').first()
    const name = await scroll.getAttribute('aria-label')
    await scroll.focus()
    const detail = page.getByRole('dialog', { name: name! })
    await expect(detail).toBeVisible()
    await expect(detail.locator('p')).not.toBeEmpty()
    const bounds = await detail.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(PHONE.width)
    await page.keyboard.press('Escape')
    await expect(detail).not.toBeVisible()
    await scroll.hover()
    await expect(detail).toBeVisible()
    await page.mouse.move(PHONE.width - 1, PHONE.height - 1)
    await expect(detail).not.toBeVisible()
    await scroll.click()
    await expect(detail).toBeVisible()
    await page
      .getByTestId('table-loop-finish')
      .locator('..')
      .click({ position: { x: 1, y: 1 } })
    await expect(detail).not.toBeVisible()
  })

  test('keeps every table slot in bounds and resumes after a menu visit', async ({
    page,
  }) => {
    await startRun(page)
    for (const size of [
      { width: 320, height: 568 },
      PHONE,
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(size)
      for (const slot of await page
        .locator('[data-testid^="table-slot-"]')
        .all()) {
        const bounds = await slot.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width)
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    }
    const rackBefore = (await readRack(page)).map(
      (tile) => `${tile.suit}${tile.rank}`
    )
    await page.getByRole('button', { name: 'Main menu', exact: true }).click()
    await page
      .getByRole('button', { name: 'Table Loop (experiment)', exact: true })
      .click()
    await expect(page.getByTestId('table-loop-rack')).toBeVisible()
    expect(
      (await readRack(page)).map((tile) => `${tile.suit}${tile.rank}`)
    ).toEqual(rackBefore)
  })

  test('reloads a committed table and continues placing real tiles', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/en/table-loop?practice=1')
    await page.getByTestId('practice-inspect-run').click()
    await page.getByTestId('table-slot-0').click()
    const rackBefore = (await readRack(page)).map(
      (tile) => `${tile.suit}${tile.rank}`
    )
    await page.reload()
    await expect(page.getByTestId('practice-guide')).toHaveAttribute(
      'data-practice-step',
      'interact'
    )
    expect(
      (await readRack(page)).map((tile) => `${tile.suit}${tile.rank}`)
    ).toEqual(rackBefore)
    const group = findGroup(await readRack(page))!
    for (const tile of group) await tile.button.click()
    await page.getByTestId('table-slot-1').click()
    await expect(page.getByTestId('practice-guide')).toHaveAttribute(
      'data-practice-step',
      'upgrade'
    )
    await page.getByTestId('practice-take-decree').click()
    await page.reload()
    await expect(page.getByTestId('owned-scroll-echoing_bamboo')).toBeVisible()
    await expect(page.getByTestId('practice-guide')).toHaveAttribute(
      'data-practice-step',
      'ready'
    )
    await page.getByTestId('practice-start-real').click()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Choose how you will play' })
    ).toBeVisible()
    await expect(page.getByTestId('practice-guide')).toHaveCount(0)
  })

  test('keeps a pending draft choice across reload without an extra refill', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/en/table-loop?seed=7&draft=1')
    await page.getByTestId('table-decree-echoing_bamboo').click()
    const group = findGroup(await readRack(page))!
    for (const tile of group) await tile.button.click()
    await page.locator('[data-testid^="table-slot-"]:enabled').first().click()
    const offers = page.locator('[data-testid^="draft-tile-"]')
    await expect(offers.first()).toBeEnabled()
    const rackCount = await page.locator('[data-testid^="rack-tile-"]').count()
    const before = await offers
      .locator('img')
      .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('alt')))
    await page.reload()
    await expect(offers.first()).toBeEnabled()
    expect(
      await offers
        .locator('img')
        .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('alt')))
    ).toEqual(before)
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(
      rackCount
    )
    await offers.first().click()
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(
      rackCount + 1
    )
  })
})

test.describe('Table Loop readability and keyboard', () => {
  test('names every rack tile and reports which are selected', async ({
    page,
  }, testInfo) => {
    await startRun(page)

    // Keep a failing first click diagnosable without retrying or changing it.
    await page.evaluate(() => {
      const trace: unknown[] = []
      Object.assign(window, { __tileInputTrace: trace })
      for (const type of [
        'pointerdown',
        'pointerup',
        'mousedown',
        'mouseup',
        'click',
      ]) {
        document.addEventListener(
          type,
          (event) => {
            const button =
              event.target instanceof Element
                ? event.target.closest('[data-testid^="rack-tile-"]')
                : null
            if (!button) return
            trace.push({
              type,
              target: button.getAttribute('data-testid'),
              selected: button.getAttribute('aria-pressed'),
              time: performance.now(),
            })
          },
          true
        )
      }
    })

    const tiles = page.locator('[data-testid^="rack-tile-"]')
    const first = tiles.first()
    await expect(first).toHaveAttribute('aria-pressed', 'false')
    await expect(first).toHaveAttribute('aria-label', /.+/)

    try {
      await first.click()
      await expect(first).toHaveAttribute('aria-pressed', 'true')
    } catch (error) {
      const trace = await page.evaluate(
        () =>
          (window as unknown as { __tileInputTrace: unknown[] })
            .__tileInputTrace
      )
      await testInfo.attach('first-tile-input-trace', {
        body: JSON.stringify(trace, null, 2),
        contentType: 'application/json',
      })
      throw error
    }
  })

  test('shows the selection separately and says what it forms', async ({
    page,
  }) => {
    await startRun(page)

    const group = findGroup(await readRack(page))
    expect(group).not.toBeNull()
    for (const tile of group!) await tile.button.click()

    const strip = page.getByTestId('selection-strip')
    await expect(strip).toBeVisible()
    // Named shape, plus the exact score it would land.
    await expect(strip).toContainText(/Sequence|Triplet|Quad|Pair/)
    await expect(strip).toContainText(/\+\d/)
  })

  test('announces each slot state and forecast to assistive technology', async ({
    page,
  }) => {
    await startRun(page)

    const pairSlot = page.getByTestId('table-slot-4')
    await expect(pairSlot).toHaveAttribute('aria-label', /Pair slot, empty/)

    const group = findGroup(await readRack(page))
    for (const tile of group!) await tile.button.click()

    const open = page
      .locator('[data-testid^="table-slot-"]:not([disabled])')
      .first()
    await expect(open).toHaveAttribute('aria-label', /would score \d+/)
  })

  test('plays a group with the keyboard alone', async ({ page }) => {
    await startRun(page)

    const group = findGroup(await readRack(page))
    expect(group).not.toBeNull()

    // Focus each tile in turn and press it, without ever using the mouse.
    for (const tile of group!) {
      await tile.button.focus()
      await page.keyboard.press('Enter')
    }

    const open = page
      .locator('[data-testid^="table-slot-"]:not([disabled])')
      .first()
    await open.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('causal-chain')).toContainText('placed')
    await expect(page.locator('body')).toContainText('5 actions')
  })
})

test.describe('Table Loop offers row (E06)', () => {
  test('is off by default and on with the variant', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/en/table-loop?seed=${SEED}`)
    await expect(page.getByTestId('draft-toggle')).toHaveAttribute(
      'aria-checked',
      'false'
    )
    await page.locator('[data-testid^="table-decree-"]').first().click()
    await expect(page.getByTestId('draft-row')).toHaveCount(0)

    await page.goto(`/en/table-loop?seed=${SEED}&draft=1`)
    await expect(page.getByTestId('draft-toggle')).toHaveAttribute(
      'aria-checked',
      'true'
    )
    await page.locator('[data-testid^="table-decree-"]').first().click()
    await expect(page.locator('[data-testid^="draft-tile-"]')).toHaveCount(3)
  })

  test('replaces only the offer that was claimed', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/en/table-loop?seed=${SEED}&draft=1`)
    await page.locator('[data-testid^="table-decree-"]').first().click()
    await expect(page.getByTestId('table-loop-rack')).toBeVisible()

    // No pick is owed until a group is placed.
    await expect(page.getByTestId('draft-pass')).toHaveCount(0)

    const group = findGroup(await readRack(page))
    expect(group).not.toBeNull()
    for (const tile of group!) await tile.button.click()
    await page
      .locator('[data-testid^="table-slot-"]:not([disabled])')
      .first()
      .click()

    // The refill holds a slot open for the player's choice.
    await expect(page.getByTestId('draft-pass')).toBeVisible()
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(11)

    const offers = page.locator('[data-testid^="draft-tile-"]')
    const before = await offers.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-testid'))
    )

    await offers.nth(1).click()

    const after = await offers.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-testid'))
    )
    expect(after[0]).toBe(before[0])
    expect(after[2]).toBe(before[2])
    expect(after[1]).not.toBe(before[1])

    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    await expect(page.getByTestId('draft-pass')).toHaveCount(0)
  })

  test('can decline the offers and take the wall tile instead', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/en/table-loop?seed=${SEED}&draft=1`)
    await page.locator('[data-testid^="table-decree-"]').first().click()

    const group = findGroup(await readRack(page))
    for (const tile of group!) await tile.button.click()
    await page
      .locator('[data-testid^="table-slot-"]:not([disabled])')
      .first()
      .click()

    const offers = page.locator('[data-testid^="draft-tile-"]')
    const before = await offers.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-testid'))
    )

    await page.getByTestId('draft-pass').click()

    // The rack fills from the wall and every offer is untouched.
    await expect(page.locator('[data-testid^="rack-tile-"]')).toHaveCount(12)
    const after = await offers.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-testid'))
    )
    expect(after).toEqual(before)
  })
})

test.describe('Table Loop practice deal (section 7)', () => {
  test('walks the first session in the order the document sets out', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/en/table-loop?practice=1')

    // 1. A short deal, clearly labelled as practice, dealt without a build
    //    choice to make first.
    const guide = page.getByTestId('practice-guide')
    await expect(guide).toBeVisible()
    await expect(guide).toContainText('Practice deal')
    await expect(guide).toHaveAttribute('data-practice-step', 'choose')
    await expect(page.locator('[data-testid^="table-decree-"]')).toHaveCount(0)

    // 2. Both outcomes can be inspected, and each names its own slot.
    await page.getByTestId('practice-inspect-pair').click()
    await expect(page.getByTestId('selection-strip')).toContainText('Pair')
    await expect(page.getByTestId('table-slot-4')).toBeEnabled()
    await expect(page.getByTestId('table-slot-0')).toBeDisabled()

    await page.getByTestId('practice-inspect-run').click()
    await expect(page.getByTestId('selection-strip')).toContainText('Sequence')
    await expect(page.getByTestId('table-slot-0')).toBeEnabled()
    await expect(page.getByTestId('table-slot-4')).toBeDisabled()

    // 3. The chosen group is committed and stays visible.
    await page.getByTestId('table-slot-0').click()
    await expect(guide).toHaveAttribute('data-practice-step', 'interact')

    // 4. The rack refills with the answering run; the guide points at the
    //    opportunity without playing it.
    await expect(page.getByTestId('practice-inspect-run')).toHaveCount(0)

    const second = findGroup(await readRack(page))
    expect(second).not.toBeNull()
    for (const tile of second!) await tile.button.click()
    await page.getByTestId('table-slot-1').click()

    // 5. The interaction resolves visibly and is named after it happened.
    await expect(page.getByTestId('causal-chain')).toContainText(
      'Twin Sequence'
    )
    await expect(guide).toHaveAttribute('data-practice-step', 'upgrade')
    await expect(guide).toContainText('That was a Twin Sequence')

    // 6. One upgrade, obviously connected to what just happened.
    await page.getByTestId('practice-take-decree').click()
    await expect(guide).toHaveAttribute('data-practice-step', 'ready')

    // 7. Control passes to ordinary seeded play.
    await page.getByTestId('practice-start-real').click()
    await expect(
      page.getByRole('heading', { name: 'Choose how you will play' })
    ).toBeVisible()
    await expect(page.getByTestId('practice-guide')).toHaveCount(0)
  })

  test('offers the practice deal from the opening panel', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto(`/en/table-loop?seed=${SEED}`)
    await expect(page.getByTestId('practice-guide')).toHaveCount(0)

    await page.getByTestId('practice-start').click()
    await expect(page.getByTestId('practice-guide')).toBeVisible()
  })

  test('teaches in the interface language', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/ja/table-loop?practice=1')

    const guide = page.getByTestId('practice-guide')
    await expect(guide).toContainText('練習の配牌')
    await expect(guide).not.toContainText('Practice deal')
  })
})

test.describe('Table Loop revision pricing', () => {
  test('a slot already paid for is worth less than an empty one', async ({
    page,
  }) => {
    // The practice deal guarantees a second run identical to the first, which
    // makes this comparison deterministic.
    await page.setViewportSize(PHONE)
    await page.goto('/en/table-loop?practice=1')
    await expect(page.getByTestId('table-loop-rack')).toBeVisible()

    await page.getByTestId('practice-inspect-run').click()
    const freshForecast = Number(
      (
        (await page.getByTestId('table-slot-0').innerText()).match(
          /\+([\d,]+)/
        )?.[1] ?? '0'
      ).replace(/,/g, '')
    )
    expect(freshForecast).toBeGreaterThan(0)
    await page.getByTestId('table-slot-0').click()

    // Select the answering run and aim it at the slot that is already paid for.
    const second = findGroup(await readRack(page))
    expect(second).not.toBeNull()
    for (const tile of second!) await tile.button.click()

    const replaceText = await page.getByTestId('table-slot-0').innerText()
    expect(replaceText.toLowerCase()).toContain('replace')
    const replaceForecast = Number(
      (replaceText.match(/\+([\d,]+)/)?.[1] ?? '0').replace(/,/g, '')
    )
    const emptyForecast = Number(
      (
        (await page.getByTestId('table-slot-1').innerText()).match(
          /\+([\d,]+)/
        )?.[1] ?? '0'
      ).replace(/,/g, '')
    )

    // Replacing an equal group pays nothing; the empty slot pays in full.
    expect(emptyForecast).toBeGreaterThan(replaceForecast)
    expect(replaceForecast).toBe(0)
  })
})
