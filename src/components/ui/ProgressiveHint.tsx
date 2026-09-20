import { useEffect, useRef, type KeyboardEvent } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import type { ProgressiveHint } from '../../config/progressiveTutorialHints'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** In-flow guidance: never covers the game, traps focus, or scrolls on arrival. */
export function ProgressiveHintCard({
  hint,
  onDismiss,
  onDisableHints,
  queueCount,
}: {
  hint: ProgressiveHint | null
  onDismiss: () => void
  onDisableHints: () => void
  queueCount: number
}) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const slot = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const previousId = useRef<string | undefined>(undefined)
  const spring = useSpring({
    opacity: hint ? 1 : 0,
    from: { opacity: 0 },
    immediate: reducedMotion,
  })

  useEffect(() => {
    if (hint?.id !== previousId.current) {
      const active = document.activeElement
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        !slot.current?.contains(active)
      ) {
        returnFocus.current = active
      }
      previousId.current = hint?.id
    }
  }, [hint?.id])

  const finish = (action: () => void) => {
    // Only deliberate dismissal moves focus out of a disappearing control.
    const target = returnFocus.current
    if (target?.isConnected) target.focus({ preventScroll: true })
    if (!target?.isConnected || document.activeElement !== target)
      slot.current?.focus({ preventScroll: true })
    action()
  }

  return (
    <div
      ref={slot}
      tabIndex={-1}
      data-hint-slot
      className="min-w-0 focus:outline-none"
    >
      {hint && (
        <animated.div
          data-progressive-hint={hint.id}
          style={spring}
          className="mx-3 my-2 min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/95 px-3 py-1 text-[var(--color-beige-white)] [overflow-wrap:anywhere] sm:mx-5"
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              finish(onDismiss)
            }
          }}
        >
          <details key={hint.id} open>
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-[var(--color-golden-yellow)] focus-visible:outline-2 focus-visible:outline-amber-300">
              <span role="status" aria-live="polite" aria-atomic="true">
                {hint.title}
              </span>
              {queueCount > 1 && (
                <span aria-hidden="true" className="ml-2 text-xs opacity-60">
                  +{queueCount - 1}
                </span>
              )}
            </summary>
            <p className="max-w-3xl text-sm leading-relaxed">{hint.content}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 py-1">
              <button
                type="button"
                onClick={() => finish(onDisableHints)}
                className="min-h-11 min-w-11 px-2 text-xs text-[var(--color-metallic-gold)] underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                {t('progressiveHints.dontShow', "Don't show tips")}
              </button>
              <button
                type="button"
                onClick={() => finish(onDismiss)}
                className="min-h-11 min-w-11 rounded-lg border border-[var(--color-metallic-gold)]/50 px-3 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                {t('progressiveHints.gotIt', 'Got it')}
              </button>
            </div>
          </details>
        </animated.div>
      )}
    </div>
  )
}
