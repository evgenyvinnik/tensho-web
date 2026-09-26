import { test, expect } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import fr from '../src/i18n/locales/fr.json' with { type: 'json' }
import ja from '../src/i18n/locales/ja.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }
import th from '../src/i18n/locales/th.json' with { type: 'json' }

for (const [language, copy] of [
  ['es', es],
  ['fr', fr],
  ['ja', ja],
] as const) {
  test(`localized tile details fit a short phone without spending an action (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(`/${language}/table-loop?seed=7`)
    await page.locator('[data-testid^="table-decree-"]').first().click()
    const rack = page.locator('[data-testid^="rack-tile-"]')
    await expect(rack).toHaveCount(12)
    const before = await page.evaluate(() =>
      localStorage.getItem('tensho-table-loop-v1')
    )
    const tile = rack.first()
    const name = await tile.locator('img').getAttribute('alt')
    await expect(tile).toHaveAccessibleName(name!)
    await tile.focus()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText(name!)
    const text = await tooltip.innerText()
    expect(
      text.includes(copy.tileDetails.numberedRule) ||
        text.includes(copy.tileDetails.honorRule)
    ).toBe(true)
    expect(text).not.toMatch(/base points|of Bamboo|of Characters|of Circles/)
    const geometry = await tooltip.evaluate((node) => {
      const box = node.getBoundingClientRect()
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        content: node.scrollWidth,
        width: node.clientWidth,
      }
    })
    expect(geometry.left).toBeGreaterThanOrEqual(11)
    expect(geometry.right).toBeLessThanOrEqual(309)
    expect(geometry.top).toBeGreaterThanOrEqual(11)
    expect(geometry.bottom).toBeLessThanOrEqual(557)
    expect(geometry.content).toBeLessThanOrEqual(geometry.width)
    await page.screenshot({
      path: testInfo.outputPath(`${language}-tile-details.png`),
    })
    await page.keyboard.press('Escape')
    await expect(tooltip).toHaveCount(0)
    expect(
      await page.evaluate(() => localStorage.getItem('tensho-table-loop-v1'))
    ).toBe(before)
    if (isMobile) await tile.tap()
    else await tile.click()
    await expect(tile).toHaveAttribute('aria-pressed', 'true')
  })

  test(`Classic stage and return controls use the same localized tile identity (${language})`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(`/${language}/play`)
    const hand = page.locator('[data-play-zone="hand"] [data-play-tile]')
    await expect(hand).toHaveCount(14)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const before = await page.evaluate(
      () => JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
    )
    const first = hand.first()
    const id = await first.getAttribute('data-play-tile')
    const name = await first.locator('img').getAttribute('alt')
    await expect(first).toHaveAccessibleName(
      copy.tileDetails.stage.replace('{{tile}}', name!)
    )
    if (isMobile) await first.tap()
    else await first.click()
    const staged = page.locator(
      `[data-play-zone="staging"] [data-play-tile="${id}"]`
    )
    await expect(staged).toHaveAccessibleName(
      copy.tileDetails.return.replace('{{tile}}', name!)
    )
    if (isMobile) await staged.tap()
    else await staged.click()
    await expect(hand).toHaveCount(14)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    ).toEqual(before)
  })
}

for (const [language, copy] of [
  ['ru', ru],
  ['th', th],
] as const) {
  test(`stacked modifier rules remain fully readable in the tile popup (${language})`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(`/${language}/table-loop?seed=7`)
    await page.locator('[data-testid^="table-decree-"]').first().click()
    await expect(page.getByTestId('table-loop-rack')).toBeVisible()
    // Presentation-only fixture: no claim about Table Loop modifier acquisition.
    await page.evaluate(async () => {
      const storePath = '/src/stores/tableLoopStore.ts'
      const tilePath = '/src/core/Tile.ts'
      const { useTableLoopStore } = await import(storePath)
      const { EnhancementType, SealType, EditionType } = await import(tilePath)
      const { state } = useTableLoopStore.getState()
      const modified = state.rack[0]
        .withEnhancement(EnhancementType.Steel)
        .withSeal(SealType.Purple)
        .withEdition(EditionType.Polychrome)
      useTableLoopStore.setState({
        state: { ...state, rack: [modified, ...state.rack.slice(1)] },
      })
    })
    await page.locator('[data-testid^="rack-tile-"]').first().focus()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    for (const rule of [
      copy.tileMarks.items.steel.description,
      copy.archiveSeals.items.purple.description,
      copy.editions.items.polychrome.description,
    ])
      await expect(tooltip).toContainText(rule)
    const bounds = await tooltip.evaluate((node) => ({
      width: node.clientWidth,
      contentWidth: node.scrollWidth,
      height: node.clientHeight,
      contentHeight: node.scrollHeight,
    }))
    expect(bounds.contentWidth).toBeLessThanOrEqual(bounds.width)
    expect(bounds.contentHeight).toBeLessThanOrEqual(bounds.height)
    await page.screenshot({
      path: testInfo.outputPath(`${language}-modified-details.png`),
    })
    await page.keyboard.press('Escape')
    await expect(tooltip).toHaveCount(0)
  })
}
