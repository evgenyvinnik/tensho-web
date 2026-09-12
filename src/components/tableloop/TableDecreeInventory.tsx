import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTableDecree } from '../../tableloop/content'
import type { TableDecreeId } from '../../tableloop/types'
import { TableDecreeArt } from './TableDecreeArt'

function OwnedScroll({ id }: { id: TableDecreeId }) {
  const { t } = useTranslation()
  const definition = getTableDecree(id)
  const name = t(`tableLoop.decrees.${id}.name`, definition.name)
  const description = t(
    `tableLoop.decrees.${id}.description`,
    definition.description
  )
  const popoverId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const detail = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pinned = useRef(false)
  const [open, setOpen] = useState(false)

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current)
  }
  const position = () => {
    const anchor = trigger.current?.getBoundingClientRect()
    const popup = detail.current
    if (!anchor || !popup) return
    const width = Math.min(320, window.innerWidth - 24)
    popup.style.width = `${width}px`
    const height = popup.getBoundingClientRect().height
    popup.style.left = `${Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12))}px`
    popup.style.top = `${Math.max(12, Math.min(anchor.bottom + 8, window.innerHeight - height - 12))}px`
  }
  const show = () => {
    cancelClose()
    detail.current?.showPopover()
    position()
  }
  const scheduleClose = () => {
    cancelClose()
    if (!pinned.current) {
      timer.current = setTimeout(() => detail.current?.hidePopover(), 180)
    }
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        data-testid={`owned-scroll-${id}`}
        aria-label={name}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={() => {
          pinned.current = true
          show()
        }}
        className="group flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-[var(--color-metallic-gold)]/35 bg-black/20 pr-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
      >
        <TableDecreeArt
          id={id}
          className="h-11 w-11 motion-safe:transition-transform motion-safe:group-hover:scale-110"
        />
        <span className="max-w-24 text-[11px] font-semibold leading-tight text-[var(--color-golden-yellow)]">
          {name}
        </span>
      </button>
      <div
        ref={detail}
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-labelledby={`${popoverId}-name`}
        onToggle={(event) => {
          const isOpen = event.newState === 'open'
          setOpen(isOpen)
          if (!isOpen) pinned.current = false
        }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onFocus={cancelClose}
        onBlur={scheduleClose}
        className="fixed m-0 max-h-[calc(100dvh-24px)] overflow-y-auto rounded-xl border border-[var(--color-metallic-gold)] bg-[#0b1b15] p-3 text-[var(--color-beige-white)] shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <TableDecreeArt id={id} className="h-20 w-20" />
          <h2
            id={`${popoverId}-name`}
            className="min-w-0 flex-1 font-decorative text-lg text-[var(--color-golden-yellow)]"
          >
            {name}
          </h2>
          <button
            type="button"
            aria-label={t('common.close', 'Close')}
            onClick={() => detail.current?.hidePopover()}
            className="min-h-11 min-w-11 self-start rounded-lg border border-white/20 text-xl focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{description}</p>
      </div>
    </>
  )
}

export function TableDecreeInventory({
  ids,
}: {
  ids: readonly TableDecreeId[]
}) {
  const { t } = useTranslation()
  if (ids.length === 0) return null
  return (
    <section
      aria-label={t('collection.categories.decrees', 'Decrees')}
      className="flex shrink-0 gap-2 overflow-x-auto px-3 py-2"
    >
      {ids.map((id) => (
        <OwnedScroll key={id} id={id} />
      ))}
    </section>
  )
}
