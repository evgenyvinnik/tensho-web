import { test, expect, type Page } from '@playwright/test'
import { openTable, selectTiles, settleReveals } from './helpers/table'

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

/** Keep this audio check mid-round even when a random opening deal scores well. */
async function openAudioRound(page: Page) {
  // Apply only the target fixture during the next navigation, before the app
  // takes save ownership. No live engine imports: this also runs on a frozen
  // production build and cannot accidentally select a stale HMR singleton.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('audio-target-fixture')) return
    const raw = localStorage.getItem('tensho-classic-run-v1')
    if (!raw) return
    const saved = JSON.parse(raw)
    const state = saved.snapshot.state
    state.targetScore = 1e9
    state.roundManager.currentRound.scoreTarget = 1e9
    const round = state.roundManager.currentAct.rounds.find(
      (entry: { roundNumber: number }) =>
        entry.roundNumber === state.currentRound
    )
    round.scoreTarget = 1e9
    localStorage.setItem('tensho-classic-run-v1', JSON.stringify(saved))
    sessionStorage.setItem('audio-target-fixture', 'true')
  })
  await openTable(page)
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  await page.reload()
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  await settleReveals(page)
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
  await openAudioRound(page)
  await selectTiles(page, 2)
  await page.locator('[data-game-action="play"]').click()
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
  await settleReveals(page)
  await page.getByRole('button', { name: 'Exit', exact: true }).click()
  await page
    .getByRole('button', { name: 'Save and leave', exact: true })
    .click()
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
  await page.getByRole('button', { name: 'New Run', exact: true }).click()
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

test('a saved game preserves its paid play without replaying scoring audio on reload', async ({
  page,
}) => {
  await observeAudio(page)
  await openAudioRound(page)
  await selectTiles(page, 2)
  await page.locator('[data-game-action="play"]').click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioProbe.started.some((src) =>
          src.endsWith('/game_hand_played.wav')
        )
      )
    )
    .toBe(true)
  await settleReveals(page)
  const saved = () =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
    )
  await expect
    .poll(async () => (await saved()).state.handsPlayedThisRun)
    .toBe(1)
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  const before = await saved()
  await page.reload()
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  expect(await saved()).toEqual(before)
  // Music may resume, but restoring a receipt must not replay paid-play SFX.
  expect(
    await page.evaluate(() =>
      window.__audioProbe.started.filter((src) =>
        src.endsWith('/game_hand_played.wav')
      )
    )
  ).toEqual([])
})
