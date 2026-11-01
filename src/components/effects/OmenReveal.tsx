/**
 * OmenReveal: a swift clear's Omen, centre stage.
 *
 * An Omen is earned by clearing a Small or Large round with Turns to spare, so
 * it arrives with the round's pay rather than from anything the player bought.
 * This names where it came from — the swift clear, with the Turns spared —
 * before the talisman descends on its cord, then says what it does, when it
 * takes effect, what it costs and where it waits until then. The Omen is
 * already held (or already spent) before this plays: a tap skips straight to
 * the result, reduced motion shows the result at once, and closing it changes
 * nothing.
 *
 * @module components/effects/OmenReveal
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ALL_OMENS, type OmenRarity } from '../../config/omenDefinitions'
import { useItemText } from '../../i18n/useItemText'
import { getGeneratedArt } from '../../utils/generatedArt'
import { SWIFT_CLEAR_SPARE_TURNS } from '../../game/playRules'
import type { RoundType } from '../../systems/types'
import { OmenArtwork } from '../ui/OmenArtwork'
import { omenRailNote, omenTiming } from './omenTiming'

/** The Omen family's light, as on the rail. */
const OMEN_TONE = '#c4b5fd'

/** How long the swift-clear sign holds before the Omen's card. */
const SIGN_MS = 1700

const RARITY_GLOW: Record<OmenRarity, string> = {
  Common: 'reveal_overlay_ordinary',
  Uncommon: 'reveal_overlay_ordinary',
  Rare: 'reveal_overlay_rare',
  Legendary: 'reveal_overlay_legendary',
}

const RARITY_TONE: Record<OmenRarity, string> = {
  Common: '#d6d3d1',
  Uncommon: '#86efac',
  Rare: '#93c5fd',
  Legendary: '#fcd34d',
}

export interface OmenRevealProps {
  omenId: string
  /** The round whose swift clear earned it. */
  roundType: RoundType
  /** Turns left unspent at the clear; older saves did not record it. */
  spareTurns?: number
  /** Copies earned: more than one when Double Omen was held. */
  copies?: number
  onDone: () => void
  reducedMotion?: boolean
}

export function OmenReveal({
  omenId,
  roundType,
  spareTurns,
  copies = 1,
  onDone,
  reducedMotion = false,
}: OmenRevealProps) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const [stage, setStage] = useState<'sign' | 'card'>(
    reducedMotion ? 'card' : 'sign'
  )
  const omen = ALL_OMENS.find((entry) => entry.id === omenId)

  useEffect(() => {
    if (reducedMotion) {
      setStage('card')
      return
    }
    const timer = setTimeout(() => setStage('card'), SIGN_MS)
    return () => clearTimeout(timer)
  }, [reducedMotion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  // An Omen the catalog no longer holds has nothing to show.
  useEffect(() => {
    if (!omen) onDone()
  }, [omen, onDone])
  if (!omen) return null

  const locale = i18n.resolvedLanguage ?? i18n.language
  const number = (value: number) => value.toLocaleString(locale)
  const name = itemText.name('omens', omen)
  const timing = omenTiming(omen)
  const rail = omenRailNote(timing)
  const round = t(`rounds.${roundType.toLowerCase()}`, roundType)
  const origin = [
    t('omenReveal.cleared', { round }),
    ...(spareTurns === undefined
      ? []
      : [
          t('omenReveal.spareTurns', {
            count: spareTurns,
            formattedCount: number(spareTurns),
          }),
        ]),
  ].join(' · ')
  const tradeoff =
    omen.tradeoff.type === 'lock_season' && omen.tradeoff.value
      ? t('omens.effects.seasonLock', {
          season: t(`flora.${String(omen.tradeoff.value).toLowerCase()}`),
        })
      : omen.tradeoff.type === 'lose_gold'
        ? t('omens.effects.shopFee', {
            amount: number(Number(omen.tradeoff.value) || 0),
          })
        : null
  const glow = getGeneratedArt('reveals', RARITY_GLOW[omen.rarity])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('omenReveal.title', { name })}
      data-omen-reveal={omen.id}
      data-omen-reveal-stage={stage}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(76,29,149,0.55),rgba(0,0,0,0.82)_70%)] p-4 backdrop-blur-sm"
      onClick={() => (stage === 'sign' ? setStage('card') : onDone())}
    >
      {stage === 'sign' ? (
        <div
          aria-hidden="true"
          className="flex max-w-full flex-col items-center gap-2 text-center [overflow-wrap:anywhere]"
        >
          <p className="omen-banner font-decorative text-3xl font-black uppercase tracking-[0.18em] text-[var(--color-golden-yellow)] drop-shadow-[0_0_18px_rgba(255,213,79,0.55)] sm:text-4xl">
            {t('omenReveal.swiftClear')}
          </p>
          <p className="omen-banner-sub text-sm font-semibold text-purple-100">
            {origin}
          </p>
          <span className="relative mt-2 flex h-48 w-48 items-start justify-center">
            <span className="omen-halo absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.6),transparent_65%)]" />
            <img
              src={glow}
              alt=""
              className="omen-halo pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
            <span className="omen-ring absolute inset-8 rounded-full border-2 border-purple-200/80" />
            <span className="omen-descend relative mt-4 flex">
              <OmenArtwork
                omenId={omen.id}
                className="h-36 w-36 drop-shadow-[0_0_28px_rgba(196,181,253,0.85)]"
              />
            </span>
          </span>
        </div>
      ) : (
        <div
          data-omen-reveal-card
          className={`max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border-2 bg-[#120b24]/95 p-5 text-center shadow-2xl [overflow-wrap:anywhere] ${
            reducedMotion ? '' : 'decree-scroll-rise'
          }`}
          style={{
            borderColor: OMEN_TONE,
            boxShadow: `0 0 40px ${OMEN_TONE}80`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <p
            data-omen-reveal-origin
            className="mx-auto flex w-fit max-w-full flex-col items-center rounded-2xl border border-[var(--color-golden-yellow)]/50 bg-black/30 px-4 py-1.5 text-[11px] leading-snug"
          >
            <span className="font-bold uppercase tracking-[0.14em] text-[var(--color-golden-yellow)]">
              {t('omenReveal.swiftClear')}
            </span>
            <span className="font-semibold text-[var(--color-beige-white)]">
              {origin}
            </span>
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-purple-200">
            {t('omenReveal.earned')}
          </p>
          <div className="relative mx-auto my-2 flex h-28 w-28 items-center justify-center">
            <img
              src={glow}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            />
            <span
              className={`relative flex ${reducedMotion ? '' : 'omen-sway'}`}
            >
              <OmenArtwork
                omenId={omen.id}
                className="h-24 w-24 drop-shadow-[0_0_18px_rgba(196,181,253,0.7)]"
              />
            </span>
            {copies > 1 && (
              <span
                data-omen-reveal-copies={copies}
                className="absolute -right-3 top-0 rounded-full border-2 border-[var(--color-golden-yellow)] bg-purple-700 px-2 py-0.5 text-xs font-black text-white shadow"
              >
                {t('omenReveal.copies', { amount: number(copies) })}
              </span>
            )}
          </div>
          <h2 className="font-decorative text-xl font-bold text-[var(--color-golden-yellow)]">
            {name}
          </h2>
          <p
            className="mt-0.5 text-xs font-black uppercase tracking-widest"
            style={{ color: RARITY_TONE[omen.rarity] }}
          >
            {t(`shop.ui.rarity_${omen.rarity.toLowerCase()}`)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-beige-white)]">
            {itemText.description('omens', omen)}
          </p>
          {copies > 1 && (
            <p className="mt-1 text-xs font-semibold text-purple-200">
              {t('omenReveal.copiesNote', { amount: number(copies) })}
            </p>
          )}
          <div
            data-omen-reveal-timing={timing}
            className="mt-3 rounded-xl border border-purple-300/40 bg-purple-950/60 px-3 py-2 text-left"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-purple-200">
              {t('omenReveal.when')}
            </p>
            <p className="text-sm font-semibold text-[var(--color-beige-white)]">
              {t(`omenReveal.timing.${timing}`)}
            </p>
            {rail && (
              <p className="mt-0.5 text-xs text-purple-100/80">
                {t(`omenReveal.rail.${rail}`)}
              </p>
            )}
          </div>
          {tradeoff && (
            <p
              data-omen-reveal-tradeoff
              className="mt-2 rounded-xl border border-amber-300/40 bg-amber-950/40 px-3 py-2 text-left text-xs leading-relaxed text-amber-200"
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em]">
                {t('omenReveal.tradeoff')}
              </span>
              {tradeoff}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-snug text-[var(--color-beige-white)]/60">
            {t('omenReveal.rule', {
              spare: number(SWIFT_CLEAR_SPARE_TURNS),
            })}
          </p>
          <button
            type="button"
            autoFocus
            onClick={onDone}
            className="mt-4 min-h-11 w-full rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] font-bold text-white"
          >
            {t('floraReveal.done', 'Got it')}
          </button>
        </div>
      )}
    </div>
  )
}

export default OmenReveal
