import { expect, test, type Page, type Locator } from '@playwright/test'

test.setTimeout(60_000)

declare global {
  interface Window {
    __artGame: import('../src/game/GameOrchestrator').GameOrchestrator
    __artEvents: typeof import('../src/game/EventBus').eventBus
    __artOrbs: typeof import('../src/systems/CelestialOrbSystem')
    __artTile: typeof import('../src/core/Tile')
    __artDecrees: typeof import('../src/systems/DecreeSystem')
    __artClear: () => void
  }
}

async function prepareArtFixture(page: Page) {
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible({ timeout: 20_000 })
  // A module script avoids Chromium collecting dynamic-import promises in
  // Runtime.evaluate ("Promise was collected", reported as navigation).
  await page.addScriptTag({
    type: 'module',
    content: `
    import { gameOrchestrator } from '/src/game/GameOrchestrator.ts';
    import { eventBus } from '/src/game/EventBus.ts';
    import * as orbs from '/src/systems/CelestialOrbSystem.ts';
    import * as tile from '/src/core/Tile.ts';
    import * as decrees from '/src/systems/DecreeSystem.ts';
    import { useDecreeRevealQueue } from '/src/game/decreeRevealQueue.ts';
    import { useFloraRevealQueue } from '/src/game/floraRevealQueue.ts';
    import { useOrbRevealQueue } from '/src/game/orbRevealQueue.ts';
    window.__artGame = gameOrchestrator;
    window.__artEvents = eventBus;
    window.__artOrbs = orbs;
    window.__artTile = tile;
    window.__artDecrees = decrees;
    window.__artClear = () => {
      useDecreeRevealQueue.setState({ queue: [] });
      useFloraRevealQueue.setState({ queue: [] });
      useOrbRevealQueue.setState({ queue: [] });
    };
  `,
  })
  await page.waitForFunction(() => !!window.__artOrbs)
  await clearArtReveals(page)
}

async function clearArtReveals(page: Page) {
  await page.evaluate(() => window.__artClear())
  await page.mouse.move(1, 1)
}

for (const width of [320, 390, 1280]) {
  test(`Season art and Pairs badge remain usable at ${width}px`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const activate = (target: Locator) =>
      isMobile ? target.tap() : target.click()
    await page.setViewportSize({ width, height: 740 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await prepareArtFixture(page)
    for (const [type, corruption] of [
      ['Spring', 'monsoon'],
      ['Summer', 'drought'],
      ['Autumn', 'decay'],
      ['Winter', 'frostbite'],
    ]) {
      await page.evaluate((type) => {
        const season = type as import('../src/systems/types').SeasonVariant
        window.__artGame.getState().seasonSystem.forceSetSeason(season, true)
        window.__artEvents.emit('seasonActivated', {
          seasonType: season,
          effect: 'Art fixture',
        })
      }, type)
      const reveal = page.locator('[data-flora-reveal] img')
      await expect(reveal).toHaveAttribute(
        'src',
        new RegExp(`/states/seasons/${corruption}.webp$`)
      )
      await expect(reveal).not.toHaveClass(/grayscale/)
      expect(
        await reveal.evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          return img.naturalWidth === 224
        })
      ).toBe(true)
      await clearArtReveals(page)
      const token = page.locator('[data-flora-season]')
      await token.scrollIntoViewIfNeeded()
      await expect(token.locator('img')).toHaveAttribute(
        'src',
        new RegExp(`/states/seasons/${corruption}.webp$`)
      )
      await expect(token).not.toHaveClass(/grayscale/)
      expect(
        await token.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return r.width >= 44 && r.height >= 44
        })
      ).toBe(true)
      await activate(token)
      const panel = page.getByRole('dialog', {
        name: new RegExp(corruption, 'i'),
      })
      await expect(panel).toBeVisible()
      await expect(panel).toHaveCSS('opacity', '1')
      expect(
        await panel.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return (
            r.left >= 0 &&
            r.right <= innerWidth &&
            r.top >= 0 &&
            r.bottom <= innerHeight &&
            el.scrollWidth <= el.clientWidth
          )
        })
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${corruption}.png`) })
      await page.keyboard.press('Escape')
    }
    await page.evaluate(() => {
      const game = window.__artGame
      const { CelestialOrbSystem, getCelestialOrbByYaku } = window.__artOrbs
      game.setConsumableUnlockResolver(() => true)
      const orb = CelestialOrbSystem.createCelestialOrbInstance(
        getCelestialOrbByYaku('Pairs')!
      )
      if (!game.addCelestialOrb(orb)) throw new Error('Orb fixture failed')
    })
    await clearArtReveals(page)
    const orb = page.locator('[data-consumable-type="CelestialOrb"]').last()
    // The real inventory interaction spends the held Orb and shows its family.
    await activate(orb)
    await activate(page.locator('[data-use-item]'))
    await clearArtReveals(page)
    const pairs = page.locator('[data-yaku-upgrade="Pairs"]')
    await pairs.scrollIntoViewIfNeeded()
    await expect(pairs.locator('img')).toHaveAttribute(
      'src',
      /upgrades\/pairs.webp$/
    )
    await activate(pairs)
    const pairPanel = page.getByRole('dialog', { name: /Pairs/ })
    await expect(pairPanel).toHaveCSS('opacity', '1')
    await expect(pairPanel).toBeInViewport()
    expect(
      await pairPanel.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return (
          r.left >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight &&
          el.scrollWidth <= el.clientWidth
        )
      })
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('pairs.png') })
  })

  test(`awakened Flower and Decree sticker art remain usable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 740 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await prepareArtFixture(page)
    // Collecting all four Flowers lets a duplicate Plum awaken the one held.
    await page.evaluate(() => {
      const { Tile, FlowerType } = window.__artTile
      const flowers = window.__artGame.getState().flowerSystem
      for (const type of [
        FlowerType.Plum,
        FlowerType.Orchid,
        FlowerType.Chrysanthemum,
        FlowerType.Bamboo,
        FlowerType.Plum,
      ])
        flowers.addFlower(Tile.createFlower(type))
      window.__artEvents.emit('flowerCollected', {
        flowerType: String(FlowerType.Plum),
        totalFlowers: 4,
      })
    })
    const reveal = page.locator('[data-flora-reveal="flower"] img')
    await expect(reveal).toHaveAttribute(
      'src',
      /\/states\/flowers\/plum-awakened.webp$/
    )
    expect(
      await reveal.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth === 224
      })
    ).toBe(true)
    await clearArtReveals(page)
    const plum = page.locator('[data-flora-flower="Plum"]')
    await plum.scrollIntoViewIfNeeded()
    await expect(plum.locator('img')).toHaveAttribute(
      'src',
      /\/states\/flowers\/plum-awakened.webp$/
    )
    await expect(
      page.locator('[data-flora-flower="Orchid"] img')
    ).toHaveAttribute('src', /\/orchid-bloom.webp$/)

    await page.evaluate(() => {
      const game = window.__artGame
      const decree = window.__artDecrees.ALL_DECREES.find(
        (d) => d.id === 'river_tax'
      )!
      const added = game.addDecree(
        {
          ...decree,
          stickers: [
            { type: 'Eternal' },
            { type: 'Perishable', roundsRemaining: 4 },
            { type: 'Rental', goldPerRound: 2 },
          ],
        },
        'generated'
      )
      if (!added) throw new Error('Decree fixture failed')
    })
    await clearArtReveals(page)
    const badges = page.locator('[data-decree-instance] [data-sticker-badge]')
    await expect(badges).toHaveCount(3)
    await expect(badges.nth(1)).toHaveText('4')
    await expect(badges.nth(2)).toHaveText('2')
    for (const badge of await badges.all()) {
      expect(
        await badge.evaluate(async (el) => {
          const img = el.querySelector('img')!
          await img.decode()
          const r = el.getBoundingClientRect()
          const art = img.getBoundingClientRect()
          return (
            img.naturalWidth === 64 &&
            art.width >= 18 &&
            r.left >= 0 &&
            r.right <= innerWidth
          )
        })
      ).toBe(true)
    }
    const card = page
      .locator('[data-decree-instance]')
      .filter({ has: page.locator('[data-sticker-badge]') })
    await card.click()
    const details = page.getByRole('dialog').locator('[data-decree-modifiers]')
    await expect(details.locator('[data-sticker-badge] img')).toHaveCount(3)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath('awakened-stickers.png'),
    })
  })

  for (const outcome of ['victory', 'defeat', 'endless']) {
    test(`${outcome} ending art at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 740 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await prepareArtFixture(page)
      await page.evaluate((outcome) => {
        const game = window.__artGame
        const state = game.getState()
        state.roundManager.startAct(8)
        state.roundManager.skipRound()
        state.roundManager.skipRound()
        state.currentAct = 8
        state.currentRound = 3
        const round = state.roundManager.getCurrentRound()
        round.bossMandate = undefined
        state.mandateEffectSystem.deactivateMandate()
        state.targetScore = outcome === 'victory' ? 1 : 1e12
        round.scoreTarget = state.targetScore
        state.handsRemaining = 1
        state.hasWonRun = outcome === 'endless'
        state.hasEnteredEndless = outcome === 'endless'
        state.handTiles
          .slice(0, 2)
          .forEach((tile: { id: string }) => game.selectTile(tile.id))
      }, outcome)
      await page.locator('[data-game-action="play"]').click()
      await expect(page).toHaveURL(/\/game-over$/)
      const art = page.locator('[data-result-art]')
      await expect(art).toHaveAttribute(
        'src',
        new RegExp(
          `/states/results/${outcome === 'endless' ? 'endless-completion' : outcome}.webp$`
        )
      )
      expect(
        await art.evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          const r = img.getBoundingClientRect()
          return (
            img.naturalWidth === 960 &&
            img.naturalHeight === 320 &&
            r.left >= 0 &&
            r.right <= innerWidth
          )
        })
      ).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${outcome}.png`),
        fullPage: true,
      })
    })
  }
}
