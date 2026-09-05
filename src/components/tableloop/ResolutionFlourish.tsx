/**
 * ResolutionFlourish
 *
 * Section 7 asks for intensity that escalates with the actual chain rather than
 * with every score update, and for a stronger flourish reserved for a newly
 * discovered interaction or a completed table. It also warns against long
 * mandatory celebrations, so this is short, dismissible, and silent for an
 * ordinary placement.
 *
 * Under reduced motion it renders nothing at all: the causal chain already
 * carries the same information as static text, which is the readable result the
 * document asks to preserve.
 *
 * @module components/tableloop/ResolutionFlourish
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  selectAnimationMultiplier,
  useSettingsStore,
} from '../../stores/settingsStore'
import { flourishLevel } from '../../tableloop/flourish'
import type { CausalStage } from '../../tableloop/types'

const HOLD_MS = 1100

export interface ResolutionFlourishProps {
  stages: readonly CausalStage[]
}

export function ResolutionFlourish({ stages }: ResolutionFlourishProps) {
  const { t } = useTranslation()
  const animationMultiplier = useSettingsStore(selectAnimationMultiplier)
  const [visible, setVisible] = useState(false)

  const level = flourishLevel(stages)
  const named = stages.find(
    (stage) => stage.kind === (level === 'completion' ? 'completion' : 'milestone')
  )

  useEffect(() => {
    if (level === 'none' || animationMultiplier === 0) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = window.setTimeout(
      () => setVisible(false),
      HOLD_MS * animationMultiplier
    )
    return () => window.clearTimeout(timer)
  }, [stages, level, animationMultiplier])

  if (!visible || level === 'none') return null

  const label =
    level === 'completion'
      ? t('tableLoop.flourish.completion', 'Table complete')
      : named?.labelKey
        ? t(
            named.labelVarKeys?.name ?? '',
            String(named.labelVars?.name ?? named.label)
          )
        : (named?.label ?? '')

  return (
    <button
      type="button"
      data-testid="resolution-flourish"
      data-flourish-level={level}
      onClick={() => setVisible(false)}
      aria-hidden="true"
      tabIndex={-1}
      className={`pointer-events-auto absolute inset-x-0 top-1/3 z-30 mx-auto w-fit rounded-xl border px-4 py-2 text-center backdrop-blur-sm ${
        level === 'completion'
          ? 'animate-pulse border-emerald-300 bg-emerald-500/20 text-emerald-100'
          : 'border-[var(--color-golden-yellow)] bg-[var(--color-golden-yellow)]/15 text-[var(--color-golden-yellow)]'
      }`}
    >
      <span
        className={`block font-black tracking-wide ${
          level === 'completion' ? 'text-xl' : 'text-base'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

export default ResolutionFlourish
