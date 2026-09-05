/**
 * CausalChain
 *
 * Resolves a placement in readable stages (E05): the group that was placed, the
 * groups already on the table that answered it, the Decrees that triggered, the
 * milestones that were earned, and the total that lands on the target meter.
 *
 * The stages arrive from the engine already ordered, so the animation only
 * paces what happened rather than deciding it. A player can skip ahead, and the
 * finished list stays on screen as a static, readable result.
 *
 * @module components/tableloop/CausalChain
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore, selectAnimationMultiplier } from '../../stores/settingsStore'
import type { CausalStage } from '../../tableloop/types'

export interface CausalChainProps {
  stages: readonly CausalStage[]
  /** Called with the slots the visible stage wants highlighted. */
  onHighlight?: (slots: readonly number[]) => void
}

const STAGE_INTERVAL_MS = 420

const STAGE_TONE: Record<CausalStage['kind'], string> = {
  group: 'text-[var(--color-beige-white)]',
  table: 'text-sky-300',
  decree: 'text-fuchsia-300',
  milestone: 'text-[var(--color-golden-yellow)]',
  boss: 'text-rose-300',
  completion: 'text-emerald-300',
  total: 'text-[var(--color-golden-yellow)] font-black',
}


/**
 * Interpolation values for one stage, with translatable values resolved first.
 *
 * `labelVarKeys` names the values that are themselves i18n keys; the plain
 * `labelVars` entry of the same name is the English fallback.
 */
function resolveVars(
  stage: CausalStage,
  translate: (key: string, fallback: string) => string
): Record<string, string | number> {
  const values: Record<string, string | number> = { ...(stage.labelVars ?? {}) }
  for (const [name, key] of Object.entries(stage.labelVarKeys ?? {})) {
    values[name] = translate(key, String(values[name] ?? ''))
  }
  return values
}

export function CausalChain({ stages, onHighlight }: CausalChainProps) {
  const { t } = useTranslation()
  const animationMultiplier = useSettingsStore(selectAnimationMultiplier)
  const [revealed, setRevealed] = useState(stages.length)

  // A new resolution replays from the first stage; reduced motion shows it all
  // at once rather than removing the information.
  useEffect(() => {
    if (stages.length === 0) return
    if (animationMultiplier === 0) {
      setRevealed(stages.length)
      return
    }
    setRevealed(1)
    const interval = window.setInterval(() => {
      setRevealed((count) => {
        if (count >= stages.length) {
          window.clearInterval(interval)
          return count
        }
        return count + 1
      })
    }, STAGE_INTERVAL_MS * animationMultiplier)
    return () => window.clearInterval(interval)
  }, [stages, animationMultiplier])

  useEffect(() => {
    const stage = stages[revealed - 1]
    onHighlight?.(stage?.highlightSlots ?? [])
  }, [revealed, stages, onHighlight])

  if (stages.length === 0) return null

  const visible = stages.slice(0, revealed)
  const isComplete = revealed >= stages.length

  return (
    <div
      data-testid="causal-chain"
      className="mx-2 rounded-lg border border-[var(--color-metallic-gold)]/30 bg-black/30 px-2.5 py-1.5"
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]">
          {t('tableLoop.chain.title', 'How it scored')}
        </p>
        {!isComplete && (
          <button
            onClick={() => setRevealed(stages.length)}
            className="text-[10px] uppercase tracking-wider text-[var(--color-beige-white)]/50 hover:text-[var(--color-beige-white)]"
          >
            {t('tableLoop.chain.skip', 'Skip')}
          </button>
        )}
      </div>

      <ol className="space-y-0.5">
        {visible.map((stage, index) => (
          <li
            key={`${stage.kind}-${index}`}
            className={`flex items-baseline justify-between gap-2 text-[11px] leading-snug ${STAGE_TONE[stage.kind]}`}
          >
            <span className="min-w-0 flex-1 truncate">
              {stage.labelKey ? t(stage.labelKey, stage.label, resolveVars(stage, (key, fallback) => t(key, fallback))) : stage.label}
            </span>
            <span className="flex-shrink-0 tabular-nums opacity-80">
              {stage.kind === 'total'
                ? `+${(stage.points ?? 0).toLocaleString()}`
                : [
                    stage.points ? `+${stage.points.toLocaleString()}` : null,
                    stage.mult ? `+${stage.mult.toFixed(1)}x` : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default CausalChain
