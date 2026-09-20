import { test, expect } from '@playwright/test'

test('menu guides lead to static pages and back to practice', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('en/')
  const nav = page.getByRole('navigation', { name: 'Public guides (English)' })
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: 'About (English)' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'About Tensho: a Mahjong roguelike'
  )
  await page.getByRole('link', { name: 'Try the practice table' }).click()
  await expect(page).toHaveURL(/\/en\/table-loop\?practice=1$/)
  await expect(page.getByTestId('practice-start')).toHaveCount(0)
  await expect(page.locator('body')).toContainText('Practice deal')
})

test.describe('public guides without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const [path, title] of [
    ['about', 'About Tensho: a Mahjong roguelike'],
    ['how-to-play', 'How to play Tensho'],
    ['faq', 'Tensho questions and answers'],
  ]) {
    test(`${path} is readable, linked and responsive`, async ({
      page,
      request,
    }, testInfo) => {
      const response = await page.goto(`${path}/`)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
      await expect(page).toHaveTitle(`${title} | Tensho`)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://evgenyvinnik.github.io/tensho-web/${path}/`
      )
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        expect(
          await page.evaluate(
            (width) => document.documentElement.scrollWidth <= width,
            width
          )
        ).toBe(true)
        for (const img of await page.locator('img').all()) {
          await img.scrollIntoViewIfNeeded()
          await expect
            .poll(() =>
              img.evaluate(
                (el: HTMLImageElement) => el.complete && el.naturalWidth > 0
              )
            )
            .toBe(true)
        }
      }
      // Text enlargement, not a claim of physical-device/native browser zoom coverage.
      await page.setViewportSize({ width: 320, height: 900 })
      await page.locator('html').evaluate((el) => {
        el.style.fontSize = '32px'
      })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= 320)
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${path}-large-text.png`),
        fullPage: true,
      })
      await page.locator('html').evaluate((el) => {
        el.style.fontSize = ''
      })
      await page.reload()
      await page.keyboard.press('Tab')
      const skip = page.getByRole('link', { name: 'Skip to content' })
      await expect(skip).toBeFocused()
      await expect(skip).toBeInViewport()
      expect(
        await skip.evaluate((el) => getComputedStyle(el).outlineStyle)
      ).toBe('solid')
      await page.keyboard.press('Enter')
      await expect(page.locator('main')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(
        page.getByRole('link', { name: 'Try the practice table' })
      ).toBeFocused()
      const play = page.getByRole('link', { name: 'Try the practice table' })
      expect(await play.getAttribute('href')).toMatch(
        /\/en\/table-loop\?practice=1$/
      )
      for (const a of await page.locator('header nav a').all()) {
        const href = await a.getAttribute('href')
        expect((await request.get(href!)).status()).toBe(200)
      }
      await page.setViewportSize({
        width: testInfo.project.name === 'mobile-chrome' ? 320 : 1440,
        height: 900,
      })
      await page.screenshot({
        path: testInfo.outputPath(`${path}.png`),
        fullPage: true,
      })
    })
  }
})
