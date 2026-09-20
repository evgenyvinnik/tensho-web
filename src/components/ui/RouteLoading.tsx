import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** The fallback must not suspend itself while a language or route is loading. */
export function RouteLoading() {
  const { t } = useTranslation(undefined, { useSuspense: false })
  const reducedMotion = useReducedMotion()
  const animation = reducedMotion ? '' : ' animate-spin'

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="route-loading"
      className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)] p-6"
    >
      <div className="min-w-0 text-center">
        <div aria-hidden="true" className="relative mx-auto mb-6 h-20 w-20">
          <div
            className={`absolute inset-0 rounded-full border-4 border-[var(--color-golden-yellow)] border-t-transparent${animation}`}
          />
          <div
            className={`absolute inset-2 rounded-full border-4 border-[var(--color-vibrant-orange)] border-b-transparent${animation}`}
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
          />
        </div>
        <p className="break-words font-ui text-lg text-[var(--color-golden-yellow)]">
          {t('common.loading', 'Loading...')}
        </p>
      </div>
    </div>
  )
}
