import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { ClassicRunSnapshot } from '../src/game/ClassicRunSnapshot'
import { settleReveals, turnBudget } from './helpers/table'

type SavedTile = ClassicRunSnapshot['state']['handTiles'][number]

const ids = (tiles: SavedTile[]) => tiles.map((tile) => tile.id)
const sorted = (values: string[]) => [...values].sort()
const isBonus = (tile: SavedTile) =>
  tile.suit === 'flower' || tile.suit === 'season'
/** The rack holds 14 tiles, plus two for each uncorrupted Spring. */
const rackSize = (run: ClassicRunSnapshot) =>
  14 +
  2 *
    run.state.seasonSystem.seasonStack.filter(
      (season: { type: string; isCorrupted: boolean }) =>
        season.type === 'Spring' && !season.isCorrupted
    ).length

/** Triplets and runs first, then pairs: the scoring groups in a rack. */
function groupsIn(hand: SavedTile[]): string[][] {
  const same = new Map<string, SavedTile[]>()
  for (const tile of hand) {
    const key = `${tile.suit}:${tile.rank}`
    same.set(key, [...(same.get(key) ?? []), tile])
  }
  const at = (suit: string, rank: number) => same.get(`${suit}:${rank}`)?.[0]
  const triplets = [...same.values()].filter((tiles) => tiles.length >= 3)
  const runs = hand.flatMap((tile) => {
    if (!['manzu', 'pinzu', 'souzu'].includes(tile.suit)) return []
    if (at(tile.suit, tile.rank) !== tile) return []
    const next = at(tile.suit, tile.rank + 1)
    const last = at(tile.suit, tile.rank + 2)
    return next && last ? [[tile, next, last]] : []
  })
  const pairs = [...same.values()].filter((tiles) => tiles.length >= 2)
  return [
    ...triplets.map((tiles) => ids(tiles.slice(0, 3))),
    ...runs.map(ids),
    ...pairs.map((tiles) => ids(tiles.slice(0, 2))),
  ]
}

for (const language of ['en', 'fr', 'ja'])
  test(`Play hand and REDRAW each spend one Turn, refill from the wall and survive reload (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    test.setTimeout(60_000)
    page.setDefaultTimeout(10_000)
    page.setDefaultNavigationTimeout(30_000)
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // A new run seeds itself from the clock: this pins the same run each time.
    await page.clock.setFixedTime(new Date(1791731727055))
    await page.addInitScript(() => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const activate = async (node: Locator) => {
      await node.scrollIntoViewIfNeeded()
      if (isMobile) await node.tap()
      else await node.click()
    }
    const saved = async (): Promise<ClassicRunSnapshot> => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    }
    /** Selecting is saved with the run, but stages nothing else. */
    const staged = async (run: ClassicRunSnapshot, selection: string[]) => {
      await expect
        .poll(async () => sorted((await saved()).state.selectedTileIds))
        .toEqual(sorted(selection))
      const now = await saved()
      expect({ ...now, state: { ...now.state, selectedTileIds: [] } }).toEqual(
        run
      )
    }
    const rack = page.locator('[data-play-zone="hand"] [data-play-tile]')
    const rackIds = () =>
      rack.evaluateAll((tiles) =>
        tiles.map((tile) => tile.getAttribute('data-play-tile')!)
      )
    const tile = (id: string) =>
      page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
    // A picked tile flies onto the felt; its rack slot waits for it.
    const onFelt = (id: string) =>
      page.locator(`[data-play-zone="felt"] [data-play-tile="${id}"]`)
    const anywhere = (id: string) => page.locator(`[data-play-tile="${id}"]`)
    const picked = async (id: string) => {
      await expect(onFelt(id)).toHaveAttribute('aria-pressed', 'true')
      await expect(tile(id)).toHaveCount(0)
      await expect(page.locator(`[data-rack-slot="${id}"]`)).toHaveCount(1)
    }
    const play = page.locator('[data-game-action="play"]')
    const redraw = page.locator('[data-game-action="redraw"]')
    const score = page.locator('[data-hand-score]')
    const total = page.locator('[data-hand-score-total]')
    const forecastTotal = async () =>
      Number((await total.textContent())!.replace(/\D/g, ''))
    const noOverflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    /** The table shows exactly the saved rack and Turn budget. */
    const showsRun = async (run: ClassicRunSnapshot) => {
      await expect
        .poll(async () => sorted(await rackIds()))
        .toEqual(sorted(ids(run.state.handTiles)))
      expect(await turnBudget(page)).toEqual({
        turns: run.state.handsRemaining,
        free: run.state.redrawsRemaining,
      })
    }
    /**
     * The rack refilled to its size from the front of the live wall, in
     * order. A Flower or Season drawn on the way goes to the rail and is
     * replaced from the front of the dead wall; the wall only ever loses
     * tiles from its far end (dead-wall upkeep, Summer's set-aside).
     */
    const refilledFromWall = (
      before: ClassicRunSnapshot,
      after: ClassicRunSnapshot,
      removed: string[]
    ) => {
      const kept = new Set(ids(before.state.handTiles))
      for (const id of removed) kept.delete(id)
      const fresh = ids(after.state.handTiles).filter((id) => !kept.has(id))
      expect(after.state.handTiles).toHaveLength(rackSize(after))
      expect(fresh.length).toBeGreaterThanOrEqual(removed.length)
      expect(after.state.drawIndex).toBeGreaterThan(before.state.drawIndex)
      expect(ids(after.state.wall)).toEqual(
        ids(before.state.wall.slice(0, after.state.wall.length))
      )
      const drawn = before.state.wall.slice(
        before.state.drawIndex,
        after.state.drawIndex
      )
      const bonus = drawn.filter(isBonus)
      const rail = new Set([
        ...after.state.flowerSystem.flowers.map((flower) => flower.id),
        ...after.state.seasonSystem.seasonStack.map((season) => season.id),
      ])
      for (const { id } of bonus) expect(rail.has(id)).toBe(true)
      expect(sorted(fresh)).toEqual(
        sorted([
          ...ids(drawn.filter((tile) => !isBonus(tile))),
          ...ids(before.state.deadWall.slice(0, bonus.length)),
        ])
      )
    }

    /**
     * A Flower or Season drawn by the refill is revealed once the action's
     * animation ends; closing the reveal changes nothing in the run.
     */
    const settleDraw = async (
      before: ClassicRunSnapshot,
      after: ClassicRunSnapshot
    ) => {
      const drawn = before.state.wall.slice(
        before.state.drawIndex,
        after.state.drawIndex
      )
      if (drawn.some(isBonus))
        await expect(page.locator('[data-flora-reveal]').first()).toBeVisible()
      await settleReveals(page)
      expect(await saved()).toEqual(after)
    }

    await page.goto(new URL(`${language}/play`, baseURL).href)
    await expect(play).toBeVisible()
    // A new run reveals its starting Decrees once the table is up.
    await settleReveals(page, 2_000)
    const start = await saved()
    await info.attach('initial-save', {
      body: JSON.stringify(start),
      contentType: 'application/json',
    })
    expect(start.state.phase).toBe('gameplay')
    await showsRun(start)
    expect(start.state.handTiles).toHaveLength(rackSize(start))
    // Exactly the two actions, labelled in the player's language.
    await expect(page.locator('[data-action-bar] button')).toHaveCount(2)
    await expect(play).toHaveText(copy.gameplay.playHand)
    await expect(redraw).toContainText(copy.gameplay.redraw)
    expect(await noOverflow()).toBe(true)

    // Play hand: pick a real group that leaves the round open.
    let group: string[] | undefined
    let forecast = 0
    for (const candidate of groupsIn(start.state.handTiles)) {
      for (const id of candidate) await activate(tile(id))
      await expect(score).toHaveAttribute('data-hand-score-state', 'preview')
      const value = await forecastTotal()
      if (value > 0 && start.state.score + value < start.state.targetScore) {
        group = candidate
        forecast = value
        break
      }
      for (const id of candidate) await activate(onFelt(id))
      await expect(score).not.toHaveAttribute(
        'data-hand-score-state',
        'preview'
      )
    }
    expect(
      group,
      'A fresh rack holds a group that leaves the round open'
    ).toBeDefined()
    const played = group!
    expect(played.length).toBeGreaterThanOrEqual(2)
    expect(played.length).toBeLessThanOrEqual(6)
    for (const id of played) await picked(id)
    await expect(page.locator('[data-hand-score-pattern]')).toHaveText(
      played.length === 2
        ? copy.patterns.pair.name
        : new RegExp(
            `^(${copy.patterns.sequence.name}|${copy.patterns.triplet.name})$`
          )
    )
    // Selecting stages a play; nothing is spent until it is played.
    await staged(start, played)
    await page.screenshot({ path: info.outputPath('play-forecast.png') })

    await activate(play)
    await expect
      .poll(async () => (await saved()).state.handsRemaining)
      .toBe(start.state.handsRemaining - 1)
    const afterPlay = await saved()
    await settleDraw(start, afterPlay)
    expect(new URL(page.url()).pathname).toMatch(
      new RegExp(`/${language}/play/?$`)
    )
    expect(afterPlay.state.score - start.state.score).toBe(forecast)
    expect(afterPlay.state.lastHandScore).toBe(forecast)
    expect(afterPlay.state.redrawsRemaining).toBe(start.state.redrawsRemaining)
    for (const id of played) await expect(anywhere(id)).toHaveCount(0)
    refilledFromWall(start, afterPlay, played)
    await showsRun(afterPlay)
    // The last hand stays on show, at the score it paid.
    await expect(score).toHaveAttribute('data-hand-score-state', 'last')
    expect(await forecastTotal()).toBe(forecast)
    expect(await noOverflow()).toBe(true)

    // REDRAW: several tiles at once go to the river for one Turn.
    const sent = ids(afterPlay.state.handTiles.slice(0, 4))
    for (const id of sent) await activate(tile(id))
    for (const id of sent) await picked(id)
    await expect(redraw).toBeEnabled()
    await staged(afterPlay, sent)
    await activate(redraw)
    await expect
      .poll(async () => (await saved()).state.discards.length)
      .toBe(afterPlay.state.discards.length + sent.length)
    const afterRedraw = await saved()
    await settleDraw(afterPlay, afterRedraw)
    expect(ids(afterRedraw.state.discards.slice(0, -sent.length))).toEqual(
      ids(afterPlay.state.discards)
    )
    expect(sorted(ids(afterRedraw.state.discards.slice(-sent.length)))).toEqual(
      sorted(sent)
    )
    // A free redraw is spent before a Turn; never both, never more than one.
    const free = afterPlay.state.redrawsRemaining > 0
    expect(afterRedraw.state.redrawsRemaining).toBe(
      afterPlay.state.redrawsRemaining - (free ? 1 : 0)
    )
    expect(afterRedraw.state.handsRemaining).toBe(
      afterPlay.state.handsRemaining - (free ? 0 : 1)
    )
    // REDRAW never scores.
    expect(afterRedraw.state.score).toBe(afterPlay.state.score)
    for (const id of sent) await expect(anywhere(id)).toHaveCount(0)
    refilledFromWall(afterPlay, afterRedraw, sent)
    await showsRun(afterRedraw)
    expect(await noOverflow()).toBe(true)
    await page.screenshot({ path: info.outputPath('after-redraw.png') })

    // Reload restores the same run, rack and Turns.
    const shown = await rackIds()
    await page.reload()
    await expect(play).toBeVisible()
    expect(await saved()).toEqual(afterRedraw)
    await expect.poll(rackIds).toEqual(shown)
    await showsRun(afterRedraw)
    await expect(play).toHaveText(copy.gameplay.playHand)
    expect(await noOverflow()).toBe(true)
    expect(errors).toEqual([])
  })
