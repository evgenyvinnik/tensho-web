import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prepareForReload } from '../../pwa/reloadGuards'
import type { ScreenDownloadError } from '../../router/screenDownloadRecovery'
import { APP_BASE_URL } from '../../utils/basePath'
import { FORMATTED_APP_VERSION } from '../../utils/version'

interface Props {
  error: ScreenDownloadError
  prepare?: () => Promise<boolean>
  reload?: () => void
  goHome?: () => void
}

/** A failed download is not a broken run. Both navigation actions save first. */
export function ScreenDownloadFallback({
  error,
  prepare = prepareForReload,
  reload = () => window.location.reload(),
  goHome = () => {
    window.location.href = APP_BASE_URL
  },
}: Props) {
  const { t } = useTranslation(undefined, { useSuspense: false })
  const title = useRef<HTMLHeadingElement>(null)
  const inFlight = useRef(false)
  const mounted = useRef(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<'save' | 'reload' | null>(
    error.recovery === 'save' ? 'save' : null
  )
  useEffect(() => {
    mounted.current = true
    title.current?.focus()
    return () => {
      mounted.current = false
    }
  }, [])
  const navigate = async (action: () => void) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setFailure(null)
    const requestedUrl = window.location.href
    let ready = false
    try {
      ready = await prepare()
    } catch {
      /* A failed guard must retain this tab. */
    }
    if (!mounted.current) return
    if (window.location.href !== requestedUrl) {
      setBusy(false)
      inFlight.current = false
      return
    }
    if (!ready) {
      setFailure('save')
      setBusy(false)
      inFlight.current = false
      return
    }
    try {
      action()
    } catch {
      setFailure('reload')
      setBusy(false)
      inFlight.current = false
    }
  }
  return (
    <main
      data-screen-download-error
      className="flex min-h-dvh w-full items-center justify-center bg-[var(--color-dark-forest)] p-4 text-[var(--color-beige-white)]"
    >
      <section className="w-full max-w-md rounded-xl border border-[var(--color-metallic-gold)] bg-black/15 p-5 text-center sm:p-8">
        <h1
          ref={title}
          tabIndex={-1}
          className="font-decorative text-2xl text-[var(--color-golden-yellow)] outline-none"
        >
          {t('screenDownload.title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed">
          {t('screenDownload.description')}
        </p>
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm leading-relaxed text-amber-100"
        >
          {busy
            ? t('screenDownload.saving')
            : failure
              ? t(`screenDownload.${failure}Failed`)
              : ''}
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void navigate(reload)}
            className="min-h-12 rounded-lg border border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-3 py-3 font-semibold disabled:opacity-50"
          >
            {t('screenDownload.retry')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void navigate(goHome)}
            className="min-h-12 rounded-lg border border-[var(--color-metallic-gold)] px-3 py-3 disabled:opacity-50"
          >
            {t('screenDownload.menu')}
          </button>
        </div>
        <details className="mt-5 text-left text-sm">
          <summary className="min-h-11 cursor-pointer py-3 text-center text-[var(--color-metallic-gold)]">
            {t('screenDownload.details')}
          </summary>
          <p className="break-all rounded-lg bg-black/25 p-3 font-mono text-xs">
            {error.message}
          </p>
        </details>
        <p className="mt-3 text-xs opacity-60">
          Tensho {FORMATTED_APP_VERSION}
        </p>
      </section>
    </main>
  )
}
