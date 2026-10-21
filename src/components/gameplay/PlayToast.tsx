/**
 * PlayToast: one short, loud line after every committed play — "Two Pairs!"
 * and the points it scored. It reads the pattern the engine actually scored,
 * so a mixed or partial play is never named as something it was not, and it
 * never fires for a preview.
 *
 * @module components/gameplay/PlayToast
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayPatternId } from '../../rules/PlayPattern'
import { scoreNumber } from '../../utils/scoreNumber'

export interface PlayToastData {
  /** Changes for every play. */
  id: number
  pattern: PlayPatternId
  score: number
  /** 0–1: how big the play was for this round. */
  intensity: number
  /** The Boss forbade this hand type (The Mouth): it scored nothing. */
  blocked?: boolean
}

export function PlayToast({
  toast,
  onDone,
  reducedMotion = false,
}: {
  toast: PlayToastData | null
  onDone: () => void
  reducedMotion?: boolean
}) {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDone, reducedMotion ? 1400 : 1800)
    return () => clearTimeout(timer)
  }, [toast, onDone, reducedMotion])
  if (!toast) return null
  const big = toast.intensity >= 0.6
  return (
    <div
      key={toast.id}
      role="status"
      data-play-toast={toast.pattern}
      data-play-toast-blocked={toast.blocked || undefined}
      className={`pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center ${
        reducedMotion ? '' : 'play-toast-enter'
      }`}
    >
      <div
        className={`rounded-2xl border-2 px-5 py-2 text-center shadow-2xl ${
          big
            ? 'border-[var(--color-golden-yellow)] bg-gradient-to-b from-orange-600/95 to-red-800/95'
            : 'border-[var(--color-metallic-gold)] bg-[#10261d]/95'
        }`}
      >
        <p
          className={`font-decorative font-black leading-tight text-[var(--color-golden-yellow)] drop-shadow ${
            big ? 'text-3xl' : 'text-2xl'
          }`}
        >
          {toast.blocked
            ? t(`patterns.${toast.pattern}.name`)
            : t('patterns.toast', {
                name: t(`patterns.${toast.pattern}.name`),
              })}
        </p>
        {toast.blocked && (
          <p className="text-sm font-black uppercase tracking-wider text-red-300">
            {t('gameplay.notAllowed')}
          </p>
        )}
        <p className="text-sm font-black tabular-nums text-white">
          +{scoreNumber(toast.score, i18n.resolvedLanguage ?? i18n.language).display}
        </p>
      </div>
    </div>
  )
}

export default PlayToast
