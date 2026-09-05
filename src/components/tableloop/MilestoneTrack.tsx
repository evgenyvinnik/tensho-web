/**
 * MilestoneTrack
 *
 * Shows the pattern milestones (E02) and how close the table is to each one, so
 * a player can see a plan forming before the table is finished. A claimed
 * milestone stays visible and marked, because it explains the standing
 * multiplier the table is now scoring with.
 *
 * @module components/tableloop/MilestoneTrack
 */

import { useTranslation } from 'react-i18next'
import { MILESTONES } from '../../tableloop/content'
import { milestoneProgress } from '../../tableloop/milestones'
import type { MilestoneId, TableSlot } from '../../tableloop/types'

export interface MilestoneTrackProps {
  slots: readonly TableSlot[]
  claimed: readonly MilestoneId[]
  tableMult: number
}

export function MilestoneTrack({
  slots,
  claimed,
  tableMult,
}: MilestoneTrackProps) {
  const { t } = useTranslation()
  const claimedSet = new Set(claimed)
  const progress = new Map(
    milestoneProgress(slots).map((entry) => [entry.id, entry])
  )

  return (
    <div className="px-2 py-1">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]">
          {t('tableLoop.milestones.title', 'Patterns')}
        </p>
        {tableMult > 0 && (
          <p className="text-[10px] text-[var(--color-golden-yellow)]">
            {t('tableLoop.milestones.momentum', 'Table momentum +{{mult}} Mult', {
              mult: tableMult.toFixed(1),
            })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {MILESTONES.map((milestone) => {
          const isClaimed = claimedSet.has(milestone.id)
          const entry = progress.get(milestone.id)
          const name = t(
            `tableLoop.milestones.${milestone.id}.name`,
            milestone.name
          )
          const description = t(
            `tableLoop.milestones.${milestone.id}.description`,
            milestone.description
          )

          return (
            <span
              key={milestone.id}
              title={description}
              data-testid={`milestone-${milestone.id}`}
              className={`rounded-md border px-1.5 py-0.5 text-[10px] leading-tight ${
                isClaimed
                  ? 'border-[var(--color-golden-yellow)] bg-[var(--color-golden-yellow)]/15 text-[var(--color-golden-yellow)]'
                  : 'border-[var(--color-metallic-gold)]/25 text-[var(--color-beige-white)]/55'
              }`}
            >
              {name}
              <span className="ml-1 tabular-nums opacity-70">
                {isClaimed
                  ? t('tableLoop.milestones.claimed', 'paid')
                  : `${entry?.progress ?? 0}/${entry?.goal ?? 0}`}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default MilestoneTrack
