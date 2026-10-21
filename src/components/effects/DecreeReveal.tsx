/**
 * DecreeReveal: a new Decree comes out of its bag.
 *
 * A short sequence — the draw-bag shakes, bursts open, and the scroll rises in
 * its rarity's light with its name and effect — for starting Decrees and
 * Decrees created by items. (Pack rewards are revealed by the opened pack
 * itself, and a Decree bought directly goes straight into the build.) The
 * Decree is already owned before this plays: a tap skips straight to the
 * result, reduced motion shows the result at once, and closing it changes
 * nothing.
 *
 * @module components/effects/DecreeReveal
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDecreeRevealQueue } from '../../game/decreeRevealQueue'
import { useItemText } from '../../i18n/useItemText'
import { getItemArt } from '../../utils/itemArt'
import { getDecreeScrollIllustration } from '../../utils/assets'
import { getGeneratedArt } from '../../utils/generatedArt'
import type { DecreeRarity } from '../../systems/types'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { DECREE_ICON_COLORS } from '../gameplay/gameplayTypes'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { DecreePortrait } from '../ui/DecreePortrait'
import { DecreeModifierDetails } from '../ui/DecreeModifierDetails'

const RARITY_KEYS = {
  LocalEdict: 'common',
  RegionalMandate: 'uncommon',
  ImperialDecree: 'rare',
  HeavenlyOrdinance: 'mythic',
} as const

/** The light the scroll rises in. */
const RARITY_GLOW: Record<DecreeRarity, string> = {
  LocalEdict: 'reveal_overlay_ordinary',
  RegionalMandate: 'reveal_overlay_ordinary',
  ImperialDecree: 'reveal_overlay_rare',
  HeavenlyOrdinance: 'reveal_overlay_legendary',
}

export function DecreeReveal({ paused = false }: { paused?: boolean }) {
  const { t } = useTranslation()
  const itemText = useItemText()
  const reducedMotion = useReducedMotion()
  const queue = useDecreeRevealQueue((state) => state.queue)
  const dismiss = useDecreeRevealQueue((state) => state.dismiss)
  const current = paused ? undefined : queue[0]
  const [stage, setStage] = useState<'bag' | 'scroll'>('bag')

  useEffect(() => {
    if (!current) return
    if (reducedMotion) {
      setStage('scroll')
      return
    }
    setStage('bag')
    const timer = setTimeout(() => setStage('scroll'), 750)
    return () => clearTimeout(timer)
  }, [current, reducedMotion])

  if (!current) return null
  const { decree } = current
  const color = DECREE_ICON_COLORS[decree.rarity]
  const art = getItemArt('decrees', decree.id)
  const name = itemText.name('decrees', decree)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('decreeReveal.title', { name })}
      data-decree-reveal={decree.id}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => (stage === 'bag' ? setStage('scroll') : dismiss())}
    >
      {stage === 'bag' ? (
        <span
          aria-hidden="true"
          className="decree-bag-shake relative h-40 w-40 drop-shadow-[0_0_30px_rgba(255,213,79,0.6)]"
        >
          <img
            src={getGeneratedArt('reveals', 'decree_drawbag_closed')}
            alt=""
            className="game-illustration absolute inset-0 h-full w-full object-contain"
          />
          <img
            src={getGeneratedArt('reveals', 'decree_drawbag_open')}
            alt=""
            className="decree-bag-open game-illustration absolute inset-0 h-full w-full object-contain"
          />
        </span>
      ) : (
        <div
          className={`max-h-[calc(100dvh-2rem)] w-full max-w-xs overflow-y-auto rounded-2xl border-2 bg-[#0b1b15]/95 p-5 text-center shadow-2xl ${
            reducedMotion ? '' : 'decree-scroll-rise'
          }`}
          style={{ borderColor: color, boxShadow: `0 0 40px ${color}80` }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]">
            {t(
              current.source === 'starting'
                ? 'decreeReveal.starting'
                : 'decreeReveal.acquired'
            )}
          </p>
          <div className="relative mx-auto my-3 flex h-32 w-28 items-center justify-center">
            <img
              src={getGeneratedArt('reveals', RARITY_GLOW[decree.rarity])}
              alt=""
              aria-hidden="true"
              data-decree-reveal-glow={RARITY_GLOW[decree.rarity]}
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
            <DecreePortrait
              src={
                art.hasOwnArt
                  ? art.src
                  : getDecreeScrollIllustration(decree.rarity)
              }
              edition={decree.edition}
              className="absolute inset-0 h-full w-full"
            />
            {!art.hasOwnArt && (
              <span className="relative">
                <DecreeUniqueIcon
                  decreeId={decree.id}
                  size={44}
                  color={color}
                />
              </span>
            )}
          </div>
          <h2 className="font-decorative text-xl font-bold text-[var(--color-golden-yellow)]">
            {name}
          </h2>
          <p
            className="mt-1 text-xs font-black uppercase tracking-widest"
            style={{ color }}
          >
            {t(`decrees.rarity.${RARITY_KEYS[decree.rarity]}`)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-beige-white)]">
            {itemText.description('decrees', decree)}
          </p>
          <DecreeModifierDetails decree={decree} />
          <button
            type="button"
            autoFocus
            onClick={dismiss}
            className="mt-4 min-h-11 w-full rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] font-bold text-white"
          >
            {queue.length > 1
              ? t('floraReveal.next', { count: queue.length - 1 })
              : t('floraReveal.done', 'Got it')}
          </button>
        </div>
      )}
    </div>
  )
}

export default DecreeReveal
