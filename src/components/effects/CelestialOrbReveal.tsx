/**
 * CelestialOrbReveal: a bought Orb lights its family.
 *
 * A short sequence — the Orb rises in its light, then the family it levelled
 * pops to its new level with the bonus a matching score now earns — for Orbs
 * bought in the Tea House or chosen from a Blessing Pack. Black Hole lists
 * every family it raised. The upgrade is already applied before this plays: a
 * tap skips straight to the result, reduced motion shows the result at once,
 * and closing it changes nothing.
 *
 * @module components/effects/CelestialOrbReveal
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useOrbRevealQueue,
  type OrbLevelChange,
} from '../../game/orbRevealQueue'
import { useItemText } from '../../i18n/useItemText'
import { getItemArt } from '../../utils/itemArt'
import { getGeneratedArt } from '../../utils/generatedArt'
import {
  CELESTIAL_ORBS,
  getCelestialOrbByYaku,
} from '../../systems/CelestialOrbSystem'
import { DEFAULT_FAMILY_TONE, FAMILY_TONES } from '../gameplay/yakuFamilyTones'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const ORB_TONE = '#7dd3fc'

function LevelRow({
  change,
  index,
  reducedMotion,
}: {
  change: OrbLevelChange
  index: number
  reducedMotion: boolean
}) {
  const { t, i18n } = useTranslation()
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  const orb = getCelestialOrbByYaku(change.yaku)
  // Level 1 is the baseline; the bonus counts only Orb-granted levels.
  const chips = (orb?.effect.chipsPerLevel ?? 0) * Math.max(0, change.to - 1)
  const mult = (orb?.effect.multPerLevel ?? 0) * Math.max(0, change.to - 1)
  const tone = FAMILY_TONES[change.yaku] ?? DEFAULT_FAMILY_TONE
  return (
    <li
      data-orb-reveal-level={change.yaku}
      data-orb-reveal-to={change.to}
      className="flex items-center gap-3 rounded-xl border bg-black/25 px-3 py-2 text-left"
      style={{ borderColor: `${tone}80` }}
    >
      <img
        src={getItemArt('yakuUpgrades', change.yaku).src}
        alt=""
        aria-hidden="true"
        className="game-illustration h-12 w-12 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <p className="text-sm font-bold text-[var(--color-golden-yellow)]">
          {t('upgradeFamilies.levelChange', {
            family: t(`upgradeFamilies.${change.yaku}.name`),
            from: number(change.from),
            to: number(change.to),
          })}
        </p>
        <p className="text-xs text-emerald-200">
          {t('yakuUpgrades.bonus', {
            chips: number(chips),
            mult: number(mult),
          })}
        </p>
      </div>
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--color-golden-yellow)] text-base font-black text-[#1b1206] shadow ${
          reducedMotion ? '' : 'orb-level-pop'
        }`}
        style={{
          borderColor: tone,
          ['--pop-delay' as string]: `${index * 90}ms`,
        }}
      >
        {number(change.to)}
      </span>
    </li>
  )
}

export function CelestialOrbReveal({ paused = false }: { paused?: boolean }) {
  const { t } = useTranslation()
  const itemText = useItemText()
  const reducedMotion = useReducedMotion()
  const queue = useOrbRevealQueue((state) => state.queue)
  const dismiss = useOrbRevealQueue((state) => state.dismiss)
  const current = paused ? undefined : queue[0]
  const [stage, setStage] = useState<'orb' | 'upgrade'>('orb')

  useEffect(() => {
    if (!current) return
    if (reducedMotion) {
      setStage('upgrade')
      return
    }
    setStage('orb')
    const timer = setTimeout(() => setStage('upgrade'), 750)
    return () => clearTimeout(timer)
  }, [current, reducedMotion])

  if (!current) return null
  const { orb, levels } = current
  const name = itemText.name('orbs', orb)
  const art = getItemArt('orbs', orb.id)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('orbReveal.title', { name })}
      data-orb-reveal={orb.id}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => (stage === 'orb' ? setStage('upgrade') : dismiss())}
    >
      {stage === 'orb' ? (
        <span
          aria-hidden="true"
          className="orb-ascend relative flex h-40 w-40 items-center justify-center"
        >
          <img
            src={getGeneratedArt('reveals', 'reveal_overlay_rare')}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
          />
          <img
            src={art.src}
            alt=""
            className="game-illustration relative h-32 w-32 object-contain drop-shadow-[0_0_30px_rgba(125,211,252,0.7)]"
          />
        </span>
      ) : (
        <div
          className={`w-full max-w-sm rounded-2xl border-2 bg-[#0b1b15]/95 p-5 text-center shadow-2xl ${
            reducedMotion ? '' : 'decree-scroll-rise'
          }`}
          style={{ borderColor: ORB_TONE, boxShadow: `0 0 40px ${ORB_TONE}80` }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]">
            {t('orbReveal.used')}
          </p>
          <div className="mx-auto my-3 flex h-24 w-24 items-center justify-center">
            <img
              src={art.src}
              alt=""
              aria-hidden="true"
              className="game-illustration h-full w-full object-contain drop-shadow-[0_0_18px_rgba(125,211,252,0.6)]"
            />
          </div>
          <h2 className="font-decorative text-xl font-bold text-[var(--color-golden-yellow)]">
            {name}
          </h2>
          {/* The family names the Orb; its planet is flavor. */}
          <p
            data-orb-reveal-planet
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-beige-white)]/60"
          >
            {t(
              `orbs.items.${orb.id}.planet`,
              CELESTIAL_ORBS[orb.id]?.planetName ?? ''
            )}
          </p>
          {levels.length > 1 && (
            <p
              className="mt-1 text-xs font-black uppercase tracking-widest"
              style={{ color: ORB_TONE }}
            >
              {t('upgradeFamilies.All.upgrade')}
            </p>
          )}
          <ul
            data-orb-reveal-levels
            className="mt-3 max-h-[46vh] space-y-2 overflow-y-auto pr-0.5"
          >
            {levels.map((change, index) => (
              <LevelRow
                key={change.yaku}
                change={change}
                index={index}
                reducedMotion={reducedMotion}
              />
            ))}
          </ul>
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

export default CelestialOrbReveal
