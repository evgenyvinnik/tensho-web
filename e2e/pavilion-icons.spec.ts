import { expect, test } from '@playwright/test'

for (const width of [320, 1280]) {
  test(`title-screen pavilion buttons and table locks use matching art at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('en/')
    for (const [name, room] of [
      ['Codex', 'codex'],
      ['Settings', 'settings'],
      ['Achievements', 'achievements'],
      ['Collection', 'collection'],
    ]) {
      const button = page.getByRole('button', { name, exact: true })
      const icon = button.locator('img')
      await expect(icon).toHaveAttribute(
        'src',
        new RegExp(`pavilion/${room}\\.webp$`)
      )
      await expect(button).toBeEnabled()
      // The emblem sits in front of the label, on the same line.
      const [iconBox, labelBox] = await Promise.all([
        icon.boundingBox(),
        button.locator('.neon-text-subtle').boundingBox(),
      ])
      expect(iconBox!.x + iconBox!.width).toBeLessThanOrEqual(labelBox!.x)
      expect(
        Math.abs(
          iconBox!.y +
            iconBox!.height / 2 -
            (labelBox!.y + labelBox!.height / 2)
        )
      ).toBeLessThan(4)
    }
    const codex = page.getByRole('button', { name: 'Codex', exact: true })
    await page
      .getByRole('button', { name: 'Choose table and stake', exact: true })
      .click()
    const locked = page.locator('[data-table-style-card="red_lacquer"]')
    await expect(locked).toBeDisabled()
    await locked.scrollIntoViewIfNeeded()
    const lock = locked.locator('img[src$="controls-jade/lock.webp"]')
    await expect(lock).toBeVisible()
    await expect(lock).toHaveCSS('width', '24px')
    await expect
      .poll(() =>
        lock.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth === 128
        )
      )
      .toBe(true)
    await page.screenshot({ path: info.outputPath(`table-lock-${width}.png`) })
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close', exact: true })
      .click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await codex.click()
    await expect(page.locator('[data-pavilion="codex"]')).toBeVisible()
  })
  for (const route of ['settings', 'collection', 'codex']) {
    test(`themed ${route} icons remain usable at ${width}px`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 800 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`en/${route}`)
      const shell = page.locator(`[data-pavilion="${route}"]`)
      await expect(shell).toBeVisible()
      if (route === 'settings') {
        const heading = page.getByRole('heading', {
          name: 'Language',
          exact: true,
        })
        await expect(heading.locator('img')).toHaveAttribute(
          'src',
          /controls-jade\/language\.webp$/
        )
        await page
          .getByRole('button', { name: 'Select Language', exact: true })
          .click()
        await expect(page.getByRole('option', { selected: true })).toBeVisible()
        await expect(
          page.getByRole('option', { selected: true }).locator('img')
        ).toHaveAttribute('src', /controls-jade\/check\.webp$/)
        await page.keyboard.press('Escape')
        await expect(page.getByRole('listbox')).toHaveCount(0)
      } else if (route === 'collection') {
        await expect(
          shell.locator('img[src$="controls-jade/archive.webp"]').first()
        ).toBeVisible()
        await expect(
          shell.locator('img[src$="controls-jade/lock.webp"]').first()
        ).toBeAttached()
        const mandates = shell.getByRole('button', { name: /Mandates/ })
        await expect(mandates.locator('img')).toHaveAttribute(
          'src',
          /cerulean-bell\.webp$/
        )
        await expect(
          shell.locator(
            'img[src*="generated/controls/archive"], img[src*="generated/controls/lock"], img[src*="generated/controls/challenge"]'
          )
        ).toHaveCount(0)
      } else {
        await expect(
          shell.locator('img[src$="controls-jade/tip.webp"]')
        ).toBeVisible()
        const categories = page.locator(
          width < 1024 ? '.pavilion-codex-mobile' : '.pavilion-codex-sidebar'
        )
        await categories.getByRole('button', { name: /Strategy/ }).click()
        await expect(shell.locator('[data-pavilion-symbol]')).toHaveCount(4)
        for (const image of await shell.locator('[data-pavilion-symbol]').all())
          await expect(image).not.toHaveAttribute('src', /generated\/controls/)
      }
      await expect
        .poll(() =>
          shell.locator('img').evaluateAll((nodes) =>
            nodes.every((node) => {
              const image = node as HTMLImageElement
              return image.complete && image.naturalWidth > 0
            })
          )
        )
        .toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({ path: info.outputPath(`${route}-${width}.png`) })
    })
  }
}
