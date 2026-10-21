import { expect, test } from '@playwright/test'
import { openTable } from './helpers/table'

for (const width of [320, 390, 1280]) {
  test(`jade controls remain readable and functional at ${width}px`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('en')
    const sound = page.getByRole('button', {
      name: 'Toggle Music',
      exact: true,
    })
    await expect(sound).toBeVisible()
    const initial = await sound.locator('img').getAttribute('src')
    expect(initial).toMatch(/controls-jade\/sound(-off)?\.webp$/)
    if (isMobile) await sound.tap()
    else await sound.click()
    await expect(sound.locator('img')).toHaveAttribute(
      'src',
      initial!.endsWith('sound-off.webp')
        ? /\/sound.webp$/
        : /\/sound-off.webp$/
    )
    await expect(sound.locator('img')).toHaveCount(1)
    await openTable(page)
    for (const [label, icon] of [
      ['How to play', 'help'],
      ['Exit', 'exit'],
      ['Settings', 'settings'],
    ]) {
      const button = page.getByRole('button', { name: label, exact: true })
      await expect(button.locator('img')).toHaveAttribute(
        'src',
        new RegExp(`controls-jade/${icon}.webp$`)
      )
      expect(
        await button.evaluate(async (el) => {
          await el.querySelector('img')!.decode()
          const rect = el.getBoundingClientRect()
          return (
            rect.width >= 44 &&
            rect.height >= 44 &&
            rect.left >= 0 &&
            rect.right <= innerWidth
          )
        })
      ).toBe(true)
    }
    await page.screenshot({ path: testInfo.outputPath('jade-header.png') })
    await page.getByRole('button', { name: 'How to play', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Exit', exact: true }).click()
    const exit = page.getByRole('dialog', {
      name: 'Leave the table?',
      exact: true,
    })
    await expect(exit).toBeVisible()
    await exit.getByRole('button', { name: 'Cancel', exact: true }).click()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page).toHaveURL(/\/settings$/)
  })
}
