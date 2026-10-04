import { expect, test } from '@playwright/test'
import { ROUTES, SUPPORTED_LANGUAGES } from '../src/router/routeManifest'

// Vite's development fallback cannot prove production HTTP status behavior.
test.skip(
  !process.env.VERIFY_STATIC_ROUTES,
  'Requires a built static server or deployed Pages, not Vite dev fallback'
)

test('all known locale routes have real HTTP 200 entry documents and initial indexing policy', async ({
  request,
}) => {
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const route of Object.values(ROUTES)) {
      const path = [lang, route].filter(Boolean).join('/')
      const response = await request.get(`${path}/?route-check=1`)
      expect(response.status(), path).toBe(200)
      const html = await response.text()
      expect(html, path).toContain(
        `content="${route ? 'noindex' : 'index'}, follow"`
      )
      expect(html, path).toMatch(
        /<script[^>]+src="[^"]*\/assets\/index-[^"]+\.js"/
      )
      expect(html, path).not.toContain('/src/main.tsx')
      expect(html, path).toContain('<div id="root"></div>')
    }
  }
  expect((await request.get('en/not-a-real-route/')).status()).toBe(404)
  expect((await request.get('not-a-real-language/play/')).status()).toBe(404)
})

test('menu navigation restores indexing and direct practice preserves its query', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const menu = await page.goto('en/')
  expect(menu?.status()).toBe(200)
  const robots = page.locator('meta[name="robots"]')
  await expect(robots).toHaveCount(1)
  await expect(robots).toHaveAttribute('content', 'index, follow')
  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  if (isMobile) await settings.tap()
  else await settings.click()
  await expect(page).toHaveURL(/\/en\/settings\/?$/)
  await expect(robots).toHaveAttribute('content', 'noindex, follow')
  const back = page.getByRole('button', { name: 'Back', exact: true })
  if (isMobile) await back.tap()
  else await back.click()
  await expect(settings).toBeVisible()
  await expect(robots).toHaveAttribute('content', 'index, follow')
  const practice = await page.goto('en/table-loop?practice=1')
  expect(practice?.status()).toBe(200)
  await expect(page).toHaveURL(/\/en\/table-loop\/?\?practice=1$/)
  await expect(page.locator('body')).toContainText('Practice deal')
  await expect(robots).toHaveAttribute('content', 'noindex, follow')
  await page.reload()
  await expect(robots).toHaveAttribute('content', 'noindex, follow')
  expect(errors).toEqual([])
})
