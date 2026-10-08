import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import type { ActionResult } from '../../game/ActionProcessor'
import { Popup } from '../ui/Popup'
import { DecreeArtwork } from '../ui/DecreeArtwork'

/** Optional, explicit pledge; opening its explanation never changes the run. */
export function RiichiControl({
  status = 'available',
  inspect,
  onAction,
}: {
  status: 'available' | 'active' | 'spent' | undefined
  inspect: GameOrchestrator['getRiichiState']
  onAction: (type: 'declareRiichi' | 'abandonRiichi') => ActionResult
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  // Shape search is on demand, not on every idle table render.
  const current = open ? inspect() : null
  const act = () => {
    const result = onAction(
      status === 'active' ? 'abandonRiichi' : 'declareRiichi'
    )
    setFailed(!result.success)
    if (result.success) setOpen(false)
  }
  return (
    <>
      <button
        type="button"
        data-open-riichi
        data-riichi-status={status}
        onClick={() => {
          setFailed(false)
          setOpen(true)
        }}
        className="min-h-11 max-w-full rounded-lg border border-amber-200/35 px-2 py-1 text-left text-sm text-amber-200 [overflow-wrap:anywhere]"
        aria-haspopup="dialog"
      >
        {t(`riichiPledge.${status === 'available' ? 'title' : status}`)}
      </button>
      <Popup
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t('riichiPledge.title')}
        footer={
          status !== 'spent' && (
            <div className="space-y-2 text-sm [overflow-wrap:anywhere]">
              <p
                data-riichi-cost
                className="text-xs leading-relaxed text-amber-200"
              >
                {t('riichiPledge.abandonNote')}
              </p>
              <button
                type="button"
                data-riichi-confirm
                onClick={act}
                disabled={current?.reason !== null}
                className="min-h-11 w-full rounded-lg border-2 border-amber-300 bg-emerald-900 px-3 py-2 font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t(
                  `riichiPledge.${status === 'active' ? 'abandon' : 'declare'}`
                )}
              </button>
            </div>
          )
        }
      >
        <div
          data-riichi-dialog
          className="min-w-0 space-y-3 text-sm leading-relaxed [overflow-wrap:anywhere]"
        >
          <div className="flex justify-center">
            <DecreeArtwork decreeId="decree-riichi-devotee" size={48} />
          </div>
          <p>{t('riichiPledge.intro')}</p>
          <p>{t('riichiPledge.risk')}</p>
          <p>{t('riichiPledge.reward')}</p>
          {current?.reason && (
            <p
              data-riichi-reason={current.reason}
              className="rounded-lg border border-amber-200/30 p-3"
            >
              {t(`riichiPledge.${current.reason}`)}
            </p>
          )}
          {failed && <p role="alert">{t('riichiPledge.failed')}</p>}
        </div>
      </Popup>
    </>
  )
}
