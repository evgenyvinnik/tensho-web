import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import {
  classicDestination,
  resumableRun,
} from '../../game/classicPersistenceApp'
import { useAppNavigation } from '../../router'
import { getTableStyleById } from '../../config/tableStyleDefinitions'
import { getTableStyleIllustration } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'
import { ClassicSaveNotice } from '../gameplay/ClassicSaveNotice'
import { Button } from '../ui/Button'

/**
 * Resume for a run that is still being played. A lost or finished run is a
 * result, so it is never offered here; New Run simply replaces it.
 */
export function ClassicResumeCard() {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const { navigateTo } = useAppNavigation()
  const { service, disk } = useClassicPersistence()
  const [busy, setBusy] = useState(false)
  const run = resumableRun(service, disk)
  const table = run ? getTableStyleById(run.tableStyleId) : null
  // Storage that cannot be used at all still needs saying before the player
  // starts. An unreadable run is not shown: New Run, right below, replaces it.
  const storageProblem = disk.kind === 'unavailable'
  if (!run && !storageProblem) return null
  const resume = async () => {
    setBusy(true)
    try {
      if (
        service.hasLocalRun ||
        (disk.kind === 'ready' && (await service.resume(disk.raw)))
      )
        navigateTo(classicDestination())
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      data-classic-resume
      className="w-full rounded-xl border border-[var(--color-metallic-gold)]/60 bg-black/25 p-3 text-[var(--color-beige-white)]"
    >
      {run && (
        <>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={getTableStyleIllustration(run.tableStyleId)}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="break-words text-sm">
                {table
                  ? itemText.name('tableStyles', {
                      ...table,
                      name: table.displayName,
                    })
                  : run.tableStyleId}
              </p>
              <p className="text-xs opacity-75">
                {t('classicSave.position', {
                  act: new Intl.NumberFormat(i18n.language).format(
                    run.currentAct
                  ),
                  round: new Intl.NumberFormat(i18n.language).format(
                    run.currentRound
                  ),
                })}
              </p>
            </div>
          </div>
          <Button
            className="w-full min-w-0"
            disabled={busy}
            onClick={() => void resume()}
          >
            {t('classicSave.resume')}
          </Button>
        </>
      )}
      <ClassicSaveNotice errorsOnly offerNewRun={false} />
    </section>
  )
}
