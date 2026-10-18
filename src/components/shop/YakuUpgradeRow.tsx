/**
 * YakuUpgradeRow: the run's Yaku upgrades, in the Tea House.
 *
 * One token per upgraded family with its level, in a row that scrolls
 * sideways on phones. Nothing shows until an Orb has been used, so a fresh
 * run's build panel stays clean. A family that rises while the shop is open
 * (an Orb just bought) flashes once; opening a token only reads.
 *
 * @module components/shop/YakuUpgradeRow
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { YakuCategory } from '../../systems/CelestialOrbSystem'
import {
  YakuUpgradeToken,
  type YakuUpgrade,
} from '../gameplay/YakuUpgradeToken'

const FLASH_MS = 1000

export function YakuUpgradeRow({ upgrades }: { upgrades: YakuUpgrade[] }) {
  const { t } = useTranslation()
  const [openYaku, setOpenYaku] = useState<YakuCategory | null>(null)
  const [flashing, setFlashing] = useState<YakuCategory[]>([])
  // Levels as last rendered, so only a rise since then flashes — never the
  // levels a saved run already had when the shop opened.
  const seen = useRef<Map<YakuCategory, number> | null>(null)

  useEffect(() => {
    const current = new Map(upgrades.map((u) => [u.yaku, u.level] as const))
    const previous = seen.current
    seen.current = current
    if (!previous) return
    const rose = upgrades
      .filter((u) => u.level > (previous.get(u.yaku) ?? 1))
      .map((u) => u.yaku)
    if (rose.length === 0) return
    setFlashing(rose)
    const timer = setTimeout(() => setFlashing([]), FLASH_MS)
    return () => clearTimeout(timer)
  }, [upgrades])

  if (upgrades.length === 0) return null
  const title = t('yakuUpgrades.title')
  return (
    <div
      data-yaku-upgrades
      role="group"
      aria-label={title}
      className="mt-2 flex min-w-0 items-center gap-2"
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--color-beige-white)]/60">
        {title}
      </span>
      <div
        role="list"
        className="scroll-rail flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 pr-1"
      >
        {upgrades.map((upgrade) => (
          <div role="listitem" key={upgrade.yaku} className="shrink-0">
            <YakuUpgradeToken
              upgrade={upgrade}
              flash={flashing.includes(upgrade.yaku)}
              open={openYaku === upgrade.yaku}
              onOpenChange={(open) =>
                setOpenYaku((current) =>
                  open
                    ? upgrade.yaku
                    : current === upgrade.yaku
                      ? null
                      : current
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default YakuUpgradeRow
