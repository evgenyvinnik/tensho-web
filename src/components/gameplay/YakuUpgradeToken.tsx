/**
 * YakuUpgradeToken: one upgraded family as an icon with its level.
 *
 * Shared by the table's item rail and the Tea House's build panel, so an
 * upgrade looks and reads the same everywhere. Its panel holds the level,
 * the bonus a matching score earns, what the family covers, how often it has
 * scored and the Orb that levels it. A family that has just risen flashes
 * once; nothing in the token changes the run.
 *
 * @module components/gameplay/YakuUpgradeToken
 */

import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import {
  DEFAULT_ORB_MAX_LEVEL,
  getCelestialOrbByYaku,
} from '../../systems/CelestialOrbSystem'
import { useItemText } from '../../i18n/useItemText'
import { getItemArt } from '../../utils/itemArt'
import { CollectibleToken } from '../ui/CollectibleToken'
import { DEFAULT_FAMILY_TONE, FAMILY_TONES } from './yakuFamilyTones'

export type YakuUpgrade = ReturnType<
  GameOrchestrator['getYakuUpgradeState']
>[number]

export interface YakuUpgradeTokenProps {
  upgrade: YakuUpgrade
  /** The family rose a level just now. */
  flash?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function YakuUpgradeToken({
  upgrade,
  flash = false,
  open,
  onOpenChange,
}: YakuUpgradeTokenProps) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  const orb = getCelestialOrbByYaku(upgrade.yaku)
  return (
    <span
      className={flash ? 'yaku-upgrade-flash' : 'inline-flex'}
      data-yaku-upgrade-flash={flash ? '' : undefined}
    >
      <CollectibleToken
        label={t('upgradeFamilies.tokenLabel', {
          family: t(`upgradeFamilies.${upgrade.yaku}.name`),
          level: number(upgrade.level),
        })}
        art={getItemArt('yakuUpgrades', upgrade.yaku).src}
        badge={number(upgrade.level)}
        tone={FAMILY_TONES[upgrade.yaku] ?? DEFAULT_FAMILY_TONE}
        data={{ 'data-yaku-upgrade': upgrade.yaku }}
        open={open}
        onOpenChange={onOpenChange}
      >
        <div className="space-y-1 text-sm [overflow-wrap:anywhere]">
          <p className="font-bold text-[var(--color-golden-yellow)]">
            {t('yakuUpgrades.level', {
              level: number(upgrade.level),
              max: number(DEFAULT_ORB_MAX_LEVEL),
            })}
          </p>
          <p className="text-emerald-200">
            {t('yakuUpgrades.bonus', {
              chips: number(upgrade.chips),
              mult: number(upgrade.mult),
            })}
          </p>
          <p className="text-xs opacity-80">
            {t(`upgradeFamilies.${upgrade.yaku}.covers`)}
          </p>
          <p className="text-xs opacity-60">
            {t('yakuUpgrades.triggers', { total: number(upgrade.timesScored) })}
          </p>
          {orb && (
            <p className="text-xs opacity-60">
              {t('yakuUpgrades.fromOrb', {
                orb: itemText.name('orbs', orb),
              })}
            </p>
          )}
        </div>
      </CollectibleToken>
    </span>
  )
}

export default YakuUpgradeToken
