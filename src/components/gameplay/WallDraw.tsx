/**
 * WallDraw: tiles come off the Wall.
 *
 * Each round opens with its deal: the Wall rises over the rack and the hand
 * flies out of it, and every Flower or Season drawn on the way turns face up
 * with its name before it flies into the collection. A Flower or Season drawn
 * later in the round gets the same short flight on its own. About two
 * seconds, nothing to dismiss; a tap skips to the end. Tapping the token in
 * the collection still explains what it does.
 *
 * It plays the engine's draw queue (see floraRevealQueue), so each draw plays
 * once and nothing replays after a reload. Reduced motion skips the flights
 * and shows any drawn Flower or Season in place for a moment.
 *
 * @module components/gameplay/WallDraw
 */

import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TileSuit } from '../../core/Tile'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import {
  nextWallDraw,
  useFloraRevealQueue,
  type FloraRevealEntry,
  type WallDrawBatch,
} from '../../game/floraRevealQueue'
import { playWallDraw } from '../../animations/wallDraw'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { getTileImagePath, illustrationAssets } from '../../utils/assets'
import { getFlowerArt, getSeasonArt } from '../../utils/itemArt'
import { useSeasonName } from './FloraDetails'

type Flora = ReturnType<GameOrchestrator['getFloraState']>

const FLOWER_RANK = { Plum: 1, Orchid: 2, Chrysanthemum: 3, Bamboo: 4 }
const SEASON_RANK = { Spring: 1, Summer: 2, Autumn: 3, Winter: 4 }

export function WallDraw({
  flora,
  paused = false,
}: {
  flora: Flora
  /** Wait while a play is being celebrated; the queue keeps every draw. */
  paused?: boolean
}) {
  const queue = useFloraRevealQueue((state) => state.queue)
  const batch = paused ? null : nextWallDraw(queue)
  if (!batch) return null
  return <WallDrawRun key={batch.lastKey} batch={batch} flora={flora} />
}

function WallDrawRun({ batch, flora }: { batch: WallDrawBatch; flora: Flora }) {
  const { t } = useTranslation()
  const seasonName = useSeasonName()
  const reducedMotion = useReducedMotion()
  const dismissThrough = useFloraRevealQueue((state) => state.dismissThrough)
  const overlayRef = useRef<HTMLDivElement>(null)
  const { deal, lastKey } = batch
  const finish = () => dismissThrough(lastKey)

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const { animations, afterglow, duration } = playWallDraw({
      overlay,
      deal,
      reducedMotion,
    })
    let ended = false
    const timer = setTimeout(() => {
      ended = true
      dismissThrough(lastKey)
    }, duration)
    return () => {
      clearTimeout(timer)
      for (const animation of animations) animation.cancel()
      // The last token's pulse may outlive the draw; a skip ends it too.
      if (!ended) for (const animation of afterglow) animation.cancel()
    }
  }, [deal, lastKey, reducedMotion, dismissThrough])

  const cards = batch.flora.map((entry) =>
    describe(entry, flora, t, seasonName)
  )
  // In flight, the glow and the name wait for the tile to turn face up.
  const hidden = reducedMotion ? '' : 'opacity-0'

  return (
    <div
      ref={overlayRef}
      data-wall-draw={deal ? 'deal' : 'bonus'}
      className="fixed inset-0 z-[60] overflow-hidden"
      onPointerDown={finish}
    >
      <p role="status" className="sr-only">
        {cards.map((card) => card.announcement).join(' ')}
      </p>
      <div
        data-wall-draw-backdrop
        aria-hidden="true"
        className="absolute inset-0 opacity-0"
      />
      {!reducedMotion && (
        <img
          data-wall-draw-wall
          src={illustrationAssets.wall}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute left-0 top-0 object-contain opacity-0 drop-shadow-[0_10px_14px_rgba(0,0,0,0.55)]"
        />
      )}
      {cards.map((card) => (
        <div
          key={card.key}
          data-flora-reveal={card.kind}
          data-target={card.target}
          aria-hidden="true"
          className="absolute left-0 top-0 flex w-16 flex-col items-center opacity-0"
        >
          <span
            data-flora-reveal-glow
            className={`pointer-events-none absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 ${hidden}`}
          >
            <span
              data-flora-reveal-rays
              className="absolute inset-0 rounded-full opacity-70"
              style={{
                background:
                  'repeating-conic-gradient(rgba(255,213,79,0.32) 0deg 8deg, rgba(255,213,79,0) 8deg 30deg)',
                maskImage:
                  'radial-gradient(circle, black 18%, transparent 68%)',
                WebkitMaskImage:
                  'radial-gradient(circle, black 18%, transparent 68%)',
              }}
            />
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,213,79,0.6),rgba(255,213,79,0)_62%)]" />
          </span>
          <span
            data-flora-reveal-flip
            className="relative block h-20 w-16"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* The back: the Wall's red tile top. */}
            <span
              className="absolute inset-0 rounded-md border-2 border-[#e9d9b8] bg-[linear-gradient(160deg,#d0503a,#9e2f22)] shadow-lg"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            />
            <img
              src={card.face}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_10px_rgba(255,213,79,0.85)]"
              style={{ backfaceVisibility: 'hidden' }}
            />
            <img
              data-flora-reveal-art
              src={card.art}
              alt=""
              draggable={false}
              className="game-illustration absolute inset-0 m-auto h-16 w-16 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-black/60 object-contain p-0.5 opacity-0"
              style={{ backfaceVisibility: 'hidden' }}
            />
          </span>
          <span
            data-flora-reveal-name
            className={`relative mt-1.5 whitespace-nowrap rounded-full border border-[var(--color-golden-yellow)]/70 bg-black/75 px-2.5 py-0.5 text-xs font-bold text-[var(--color-golden-yellow)] shadow-lg ${hidden}`}
          >
            {card.name}
          </span>
        </div>
      ))}
    </div>
  )
}

/** A value safe inside a double-quoted attribute selector. */
const attribute = (value: string) => value.replace(/["\\]/g, '\\$&')

/** Everything a drawn Flower or Season shows on its way to the collection. */
function describe(
  entry: FloraRevealEntry,
  flora: Flora,
  t: ReturnType<typeof useTranslation>['t'],
  seasonName: ReturnType<typeof useSeasonName>
) {
  if (entry.kind === 'flower') {
    const name = t('flora.' + entry.flower.toLowerCase())
    return {
      key: entry.key,
      kind: entry.kind,
      name,
      announcement: t('floraReveal.flowerTitle', { name }),
      face: getTileImagePath(TileSuit.Flower, FLOWER_RANK[entry.flower]),
      // The collected Flower carries the awakening a duplicate can unlock.
      art: getFlowerArt(
        flora.flowers.flowers.find((owned) => owned.type === entry.flower) ??
          entry.flower
      ),
      target: `[data-flora-flower="${attribute(entry.flower)}"]`,
    }
  }
  const name = seasonName(entry.season)
  return {
    key: entry.key,
    kind: entry.kind,
    name,
    announcement: t('floraReveal.seasonTitle', { name }),
    face: getTileImagePath(TileSuit.Season, SEASON_RANK[entry.season.type]),
    art: getSeasonArt(entry.season),
    target: `[data-flora-season="${attribute(entry.season.id)}"]`,
  }
}

export default WallDraw
