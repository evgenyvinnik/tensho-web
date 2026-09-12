import { test, expect, type Page } from '@playwright/test'

type AudioProbe = {
  elements: HTMLMediaElement[]
  started: string[]
  failed: { src: string; name: string }[]
}
declare global {
  interface Window {
    __audioProbe: AudioProbe
  }
}

/** Observe real native playback; no fake Audio implementation or fake success. */
async function observeAudio(page: Page, muted = false) {
  await page.addInitScript(
    ({ muted }) => {
      localStorage.setItem(
        'tensho-settings',
        JSON.stringify({
          state: {
            musicEnabled: !muted,
            sfxEnabled: !muted,
            musicVolume: 0.3,
            sfxVolume: 0.5,
          },
          version: 1,
        })
      )
      window.__audioProbe = { elements: [], started: [], failed: [] }
      const nativePlay = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function () {
        const probe = window.__audioProbe
        if (!probe.elements.includes(this)) probe.elements.push(this)
        const src = this.src
        const result = nativePlay.call(this)
        void result.then(
          () => probe.started.push(src),
          (error: DOMException) => probe.failed.push({ src, name: error.name })
        )
        return result
      }
    },
    { muted }
  )
}

test('plays native scoring audio, keeps music across navigation, and obeys mute', async ({
  page,
}) => {
  await observeAudio(page)
  const missing: string[] = []
  page.on('response', (response) => {
    if (response.url().includes('/sfx/') && !response.ok())
      missing.push(response.url())
  })
  await page.goto('/en/table-loop?practice=1')
  await page.getByTestId('practice-inspect-run').click()
  await page.getByTestId('table-slot-0').click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.started.some((src) =>
          src.endsWith('/game_hand_played.wav')
        )
      )
    )
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.elements.some(
          (audio) =>
            audio.src.endsWith('.mp3') && !audio.paused && audio.readyState >= 2
        )
      )
    )
    .toBe(true)
  await page.getByRole('button', { name: 'Main menu', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'TENSHO' })).toBeVisible()
  await page.getByRole('button', { name: 'Toggle Music', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.elements
          .filter((audio) => audio.src.endsWith('.mp3'))
          .every((audio) => audio.paused)
      )
    )
    .toBe(true)
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/play$/)
  expect(
    await page.evaluate(() =>
      window.__audioProbe.elements
        .filter((audio) => audio.src.endsWith('.mp3'))
        .every((audio) => audio.paused)
    )
  ).toBe(true)
  expect(missing).toEqual([])
  expect(
    await page.evaluate(() =>
      window.__audioProbe.failed.filter(
        (failure) => failure.name === 'NotSupportedError'
      )
    )
  ).toEqual([])
})

test('persisted mute blocks playback and settings can independently enable SFX', async ({
  page,
}) => {
  await observeAudio(page, true)
  await page.goto('/en/settings')
  const sfx = page.getByRole('switch', {
    name: 'Mute Sound Effects',
    exact: true,
  })
  await expect(sfx).toHaveAttribute('aria-checked', 'true')
  expect(await page.evaluate(() => window.__audioProbe.started)).toEqual([])
  await sfx.click()
  await expect(sfx).toHaveAttribute('aria-checked', 'false')
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.started.some((src) =>
          src.endsWith('/ui_button_click.wav')
        )
      )
    )
    .toBe(true)
  expect(
    await page.evaluate(() =>
      window.__audioProbe.started.some((src) => src.endsWith('.mp3'))
    )
  ).toBe(false)
  await sfx.click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.elements
          .filter((audio) => audio.src.includes('/sfx/'))
          .every((audio) => audio.paused)
      )
    )
    .toBe(true)
})

test('a saved Table Loop does not replay sounds on reload', async ({
  page,
}) => {
  await observeAudio(page)
  await page.goto('/en/table-loop?practice=1')
  await page.getByTestId('practice-inspect-run').click()
  await page.getByTestId('table-slot-0').click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.started.some((src) =>
          src.endsWith('/game_hand_played.wav')
        )
      )
    )
    .toBe(true)
  await page.reload()
  await expect(page.getByTestId('practice-guide')).toHaveAttribute(
    'data-practice-step',
    'interact'
  )
  expect(await page.evaluate(() => window.__audioProbe.started)).toEqual([])
})
