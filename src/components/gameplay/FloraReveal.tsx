/**
 * FloraReveal: when a Flower or Season is drawn from the wall, say so.
 *
 * Bonus tiles never stay in the rack: the engine sets them aside into your
 * collection and draws a replacement. This small card shows what was drawn,
 * what it does and how long it lasts. It reads the engine's draw queue (see
 * floraRevealQueue), so it appears once per tile actually drawn — on the
 * opening deal or a chain of draws alike — and nothing replays after a
 * reload. Several draws queue as one card with a counter, never a stack.
 *
 * @module components/gameplay/FloraReveal
 */

import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import { useFloraRevealQueue } from '../../game/floraRevealQueue'
import { getFlowerArt, getSeasonArt } from '../../utils/itemArt'
import { Popup } from '../ui/Popup'
import { FlowerDetails, SeasonDetails, useSeasonName } from './FloraDetails'

type Flora = ReturnType<GameOrchestrator['getFloraState']>

export function FloraReveal({
  flora,
  paused = false,
}: {
  flora: Flora
  /** Wait while a play is being celebrated; the queue keeps every draw. */
  paused?: boolean
}) {
  const { t } = useTranslation()
  const seasonName = useSeasonName()
  const queue = useFloraRevealQueue((state) => state.queue)
  const next = useFloraRevealQueue((state) => state.dismiss)
  const current = queue[0]
  if (!current || paused) return null

  const name =
    current.kind === 'flower'
      ? t('flora.' + current.flower.toLowerCase())
      : seasonName(current.season)
  const art =
    current.kind === 'flower'
      ? getFlowerArt(current.flower)
      : getSeasonArt(current.season)

  return (
    <Popup
      isOpen
      onClose={next}
      title={t(
        current.kind === 'flower' ? 'floraReveal.flowerTitle' : 'floraReveal.seasonTitle',
        { name }
      )}
      className="w-[min(92vw,380px)]"
    >
      <div data-flora-reveal={current.kind} className="text-center">
        <img
          src={art}
          alt=""
          className="game-illustration mx-auto h-28 w-28 object-contain"
        />
        <p className="mt-2 text-sm text-[var(--color-beige-white)]/80">
          {t('floraReveal.drawn')}
        </p>
        <div className="mt-3 rounded-lg bg-black/20 p-3 text-left">
          {current.kind === 'flower' ? (
            <FlowerDetails flower={current.flower} flora={flora} />
          ) : (
            <SeasonDetails season={current.season} flora={flora} />
          )}
        </div>
        <button
          type="button"
          onClick={next}
          className="mt-4 min-h-11 w-full rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-6 font-bold text-white"
        >
          {queue.length > 1
            ? t('floraReveal.next', { count: queue.length - 1 })
            : t('floraReveal.done', 'Got it')}
        </button>
      </div>
    </Popup>
  )
}

export default FloraReveal
