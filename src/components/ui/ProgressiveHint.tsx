import { useEffect, useRef, type KeyboardEvent } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import type { ProgressiveHint } from '../../config/progressiveTutorialHints'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * Optional guidance. In flow by default; `floating` lays it over the top of the
 * board on wider screens instead of pushing the table down. Either way it never
 * traps focus or scrolls on arrival, and it never covers the rack or actions.
 */
export function ProgressiveHintCard({
  hint,
  onDismiss,
  onDisableHints,
  queueCount,
  floating = false,
}: {
  hint: ProgressiveHint | null
  onDismiss: () => void
  onDisableHints: () => void
  queueCount: number
  /**
   * From tablet width up, float from the top of the nearest positioned
   * ancestor without taking space (place it in a zero-height positioned
   * wrapper where it should hang); only the card takes input. Phones keep it
   * in flow: a popup there would cover the tiles the player has just staged.
   */
  floating?: boolean
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
      className={
        floating
          ? 'min-w-0 focus:outline-none sm:pointer-events-none sm:absolute sm:inset-x-0 sm:top-1 sm:flex sm:justify-center sm:px-1'
          : 'min-w-0 focus:outline-none'
      }
    >
      {hint && (
        <animated.div
          data-progressive-hint={hint.id}
          style={spring}
          className={`min-w-0 rounded-xl border px-3 text-[var(--color-beige-white)] [overflow-wrap:anywhere] ${
            floating
              ? 'mx-2 my-1 border-[var(--color-metallic-gold)]/70 bg-[var(--color-dark-forest)] sm:pointer-events-auto sm:mx-0 sm:my-0 sm:w-full sm:max-w-3xl sm:shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
              : 'mx-2 my-1 border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/95'
          }`}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              finish(onDismiss)
            }
          }}
        >
          <details key={hint.id} open>
            <summary className="flex min-h-11 cursor-pointer items-center py-1 text-sm font-semibold text-[var(--color-golden-yellow)] focus-visible:outline-2 focus-visible:outline-amber-300">
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block text-xs transition-transform [details:not([open])_&]:-rotate-90"
              >
                ▾
              </span>
              <span role="status" aria-live="polite" aria-atomic="true">
                {hint.title}
              </span>
              {queueCount > 1 && (
                <span aria-hidden="true" className="ml-2 text-xs opacity-60">
                  +{queueCount - 1}
                </span>
              )}
            </summary>
            <div className="flex flex-wrap items-center gap-x-3 pb-1">
              <p className="min-w-0 flex-[1_1_20rem] text-sm leading-snug">
                {hint.content}
              </p>
              <div className="ml-auto flex items-center gap-2">
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
            </div>
          </details>
        </animated.div>
      )}
    </div>
  )
}
