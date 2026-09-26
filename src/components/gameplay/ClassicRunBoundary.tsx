import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import { useGameController } from '../../game/useGameController'
import {
  classicDestination,
  enterClassicRoute,
  type ClassicDestination,
} from '../../game/classicPersistenceApp'
import { RouteLoading } from '../ui/RouteLoading'
import { Button } from '../ui/Button'

/** Do not mount a routed game/shop until its authoritative run is ready. */
export function ClassicRunBoundary({
  requested,
  children,
}: {
  requested: ClassicDestination
  children: ReactNode
}) {
  const { t } = useTranslation()
  const { lang } = useParams()
  const navigate = useNavigate()
  const { service, ownershipLost, disk } = useClassicPersistence()
  const game = useGameController()
  const [ready, setReady] = useState(() => service.hasLocalRun)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let mounted = true
    void enterClassicRoute(requested).then((destination) => {
      if (!mounted) return
      if (!destination) navigate(`/${lang}`, { replace: true })
      else setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [requested, navigate, lang])
  if (!ready) return <RouteLoading />
  if (ownershipLost)
    return (
      <main className="viewport-full grid place-items-center bg-[var(--color-dark-forest)] p-5 text-[var(--color-beige-white)]">
        <section className="w-full max-w-md rounded-xl border border-[var(--color-metallic-gold)] bg-black/20 p-5 text-center">
          <h1 className="text-xl font-decorative text-[var(--color-golden-yellow)]">
            {t('classicSave.savedTitle')}
          </h1>
          <p role="alert" className="my-4 leading-relaxed">
            {t('classicSave.conflict')}
          </p>
          <div className="grid gap-3">
            {disk.kind === 'ready' && (
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await service.resume(disk.raw)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {t('classicSave.resume')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate(`/${lang}`)}>
              {t('common.mainMenu')}
            </Button>
          </div>
        </section>
      </main>
    )
  if (game.phase === 'menu') return <Navigate to={`/${lang}`} replace />
  const destination = classicDestination()
  if (destination !== requested)
    return <Navigate to={`/${lang}/${destination}`} replace />
  return <>{children}</>
}
