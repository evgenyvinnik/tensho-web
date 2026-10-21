/**
 * SecretPatternReveal: the banner for a secret hand's first play on this
 * profile — "Secret hand found", its name, and that the "?" guide now lists
 * it. It follows the meta bridge's discovery event, so it fires once ever,
 * beside the play's own toast.
 *
 * @module components/gameplay/SecretPatternReveal
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { SecretPatternId } from '../../rules/PlayPattern'

export function SecretPatternReveal({
  pattern,
  onDone,
  reducedMotion = false,
}: {
  pattern: SecretPatternId
  onDone: () => void
  reducedMotion?: boolean
}) {
  const { t } = useTranslation()
  useEffect(() => {
    const timer = setTimeout(onDone, reducedMotion ? 2600 : 3200)
    return () => clearTimeout(timer)
  }, [pattern, onDone, reducedMotion])
  return (
    <div
      role="status"
      data-secret-pattern={pattern}
      className={`rounded-2xl border-2 border-[var(--color-golden-yellow)] bg-gradient-to-b from-violet-800/95 to-indigo-950/95 px-5 py-2 text-center shadow-2xl ${
        reducedMotion ? '' : 'play-toast-enter'
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-golden-yellow)]">
        ✦ {t('guide.secretFound')} ✦
      </p>
      <p className="font-decorative text-2xl font-black leading-tight text-white drop-shadow">
        {t(`patterns.${pattern}.name`)}
      </p>
      <p className="text-xs text-white/80">{t('guide.secretInGuide')}</p>
    </div>
  )
}

export default SecretPatternReveal
