import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TablePattern } from './TablePattern'
import { BackButton } from './BackButton'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import {
  getDefaultTableStyle,
  getTableStyleById,
} from '../../config/tableStyleDefinitions'
import { feltPalette } from '../../utils/feltPalette'
import { withBasePath } from '../../utils/basePath'
import './pavilion.css'

export type PavilionPage = 'codex' | 'settings' | 'achievements' | 'collection'
const pavilionArt = (page: PavilionPage) =>
  withBasePath(`assets/illustrations/pavilion/${page}.webp`)

/** Dedicated painted rooms with the selected table's felt and safe corner frame. */
export function PavilionScreen({
  page,
  title,
  shortTitle,
  onBack,
  summary,
  children,
}: {
  page: PavilionPage
  title: string
  shortTitle?: string
  onBack: () => void
  summary?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const styleId = useTableStyleStore((state) => state.currentStyleId)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const table = getTableStyleById(styleId) ?? getDefaultTableStyle()
  const felt = feltPalette(table.feltColor)
  return (
    <div
      className="viewport-full pavilion"
      data-pavilion={page}
      data-reduced-motion={reducedMotion || undefined}
      style={
        {
          '--pavilion-surface': felt.surface,
          '--pavilion-raised': felt.surfaceRaised,
        } as CSSProperties
      }
    >
      <TablePattern
        colors={{ ...felt, waveColor: 'rgba(200, 178, 115, 0.06)' }}
        artwork={withBasePath(
          `assets/illustrations/pavilion/${page}-background.webp`
        )}
      >
        <div className="pavilion-layout">
          <header className="pavilion-header">
            <BackButton onClick={onBack} ariaLabel={t('common.back')} />
            <div className="pavilion-heading">
              <h1>
                {shortTitle ? (
                  <>
                    <span className="hidden sm:inline">{title}</span>
                    <span className="sm:hidden">{shortTitle}</span>
                  </>
                ) : (
                  title
                )}
              </h1>
              {summary && <div className="pavilion-summary">{summary}</div>}
            </div>
            <img
              className="pavilion-emblem"
              src={pavilionArt(page)}
              width={112}
              height={112}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          </header>
          <main className="pavilion-body">{children}</main>
        </div>
      </TablePattern>
    </div>
  )
}
