/**
 * YakuUpgradeRow: the run's Yaku upgrades, in the Tea House.
 *
 * One token per family with its level, counted from 0, under its label at the
 * right end of the build's line, across from the Decrees. Every family a run
 * can upgrade shows from the start, so a new player sees what Orbs level; on
 * a phone the nine sit in a three-by-three grid. A family that rises while
 * the shop is open (an Orb or a Seal of the Void just bought) flashes once;
 * opening a token only reads.
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
    <div data-yaku-upgrades role="group" aria-label={title} className="min-w-0">
      <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-beige-white)]/60">
        {title}
      </span>
      <div
        role="list"
        data-yaku-upgrade-grid
        className="shop-build-grid mt-1 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:p-0.5"
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
