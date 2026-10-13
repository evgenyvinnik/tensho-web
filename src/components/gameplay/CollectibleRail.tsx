/**
 * CollectibleRail: everything the run owns besides Decrees, one icon each.
 *
 * Three Orbs are three icons; a Flower and a Season are separate icons; each
 * upgraded family is its own icon with its level. Every icon is the same
 * height and opens its own small panel. An Orb's panel is its use
 * confirmation: one tap to look, one tap to use that exact Orb.
 *
 * The rail scrolls sideways on narrow screens instead of shrinking icons
 * below a comfortable tap size.
 *
 * @module components/gameplay/CollectibleRail
 */

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import type {
  ActionResult,
  PlayerAction,
  ValidationResult,
} from '../../game/ActionProcessor'
import type { FateSeal } from '../../systems/FateSealSystem'
import {
  DEFAULT_ORB_MAX_LEVEL,
  getCelestialOrbByYaku,
  type CelestialOrb,
  type YakuCategory,
} from '../../systems/CelestialOrbSystem'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import { consumableTargetRange } from '../../gameplay/consumableTargeting'
import { useItemText } from '../../i18n/useItemText'
import { getFlowerArt, getItemArt, getSeasonArt } from '../../utils/itemArt'
import { CollectibleToken } from '../ui/CollectibleToken'
import { FlowerDetails, SeasonDetails, useSeasonName } from './FloraDetails'

type ConsumableAction = Extract<
  PlayerAction,
  { type: 'useSeal' | 'useOrb' | 'useScript' }
>
type Consumable = FateSeal | CelestialOrb | VoidScript

export interface CollectibleRailProps {
  flora: ReturnType<GameOrchestrator['getFloraState']>
  fateSeals: readonly FateSeal[]
  celestialOrbs: readonly CelestialOrb[]
  voidScripts: readonly VoidScript[]
  upgrades: ReturnType<GameOrchestrator['getYakuUpgradeState']>
  /** Current level of an upgrade family (1 is the baseline). */
  levelOf: (family: YakuCategory) => number
  validateUse: (action: ConsumableAction) => ValidationResult
  onUse: (action: ConsumableAction) => ActionResult
  /** Open target selection for an item that needs chosen tiles. */
  onChooseTargets: (item: FateSeal | VoidScript) => void
}

const FAMILY_TONES: Partial<Record<YakuCategory, string>> = {
  Pairs: '#7dd3fc',
  Pinfu: '#6ee7b7',
  Ittsu: '#a5b4fc',
  Toitoi: '#fcd34d',
  Yakuhai: '#fca5a5',
  Tanyao: '#bef264',
}

function actionFor(item: Consumable, targets: string[] = []): ConsumableAction {
  return item.type === 'FateSeal'
    ? { type: 'useSeal', sealId: item.instanceId, targets }
    : item.type === 'VoidScript'
      ? { type: 'useScript', scriptId: item.instanceId, targets }
      : { type: 'useOrb', orbId: item.instanceId }
}

/** Direct use from an item's own panel, guarded against double taps. */
function UseButton({
  item,
  validateUse,
  onUse,
  onChooseTargets,
  onUsed,
}: {
  item: Consumable
  validateUse: CollectibleRailProps['validateUse']
  onUse: CollectibleRailProps['onUse']
  onChooseTargets: CollectibleRailProps['onChooseTargets']
  onUsed: () => void
}) {
  const { t } = useTranslation()
  const busy = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const needsTargets =
    item.type !== 'CelestialOrb' && consumableTargetRange(item.effect).max > 0
  const check = needsTargets ? null : validateUse(actionFor(item))
  const allowed = needsTargets || !!check?.isValid
  return (
    <div className="mt-3">
      {!allowed && (
        <p role="status" className="mb-2 text-xs text-amber-200">
          {check?.errors[0]?.includes('max level')
            ? t('consumableUse.errorMaxLevel')
            : t('consumableUse.unavailable')}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-2 text-xs text-red-200">
          {error}
        </p>
      )}
      <button
        type="button"
        data-use-item={item.instanceId}
        disabled={!allowed}
        onClick={() => {
          if (busy.current) return
          if (needsTargets) {
            onChooseTargets(item as FateSeal | VoidScript)
            onUsed()
            return
          }
          busy.current = true
          try {
            // The action names this exact instance; a stale panel cannot
            // spend a different copy.
            const result = onUse(actionFor(item))
            if (result.success) onUsed()
            else setError(result.errors?.[0] ?? t('consumableUse.failed'))
          } finally {
            busy.current = false
          }
        }}
        className="min-h-11 w-full rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-4 font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-45"
      >
        {needsTargets
          ? t('consumableUse.chooseTargets', 'Choose tiles')
          : t('consumableUse.confirm')}
      </button>
    </div>
  )
}

export function CollectibleRail({
  flora,
  fateSeals,
  celestialOrbs,
  voidScripts,
  upgrades,
  levelOf,
  validateUse,
  onUse,
  onChooseTargets,
}: CollectibleRailProps) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const seasonName = useSeasonName()
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  // Closing a used item's panel: its token disappears with the item.
  const [openId, setOpenId] = useState<string | null>(null)
  const control = (id: string) => ({
    open: openId === id,
    onOpenChange: (open: boolean) =>
      setOpenId((current) => (open ? id : current === id ? null : current)),
  })

  const familyName = (family: YakuCategory) =>
    t(`upgradeFamilies.${family}.name`)
  const consumable = (item: Consumable, kind: 'seals' | 'orbs' | 'scripts') => {
    const name = itemText.name(kind, item)
    const family =
      item.type === 'CelestialOrb' ? item.effect.targetYaku : null
    const level = family && family !== 'All' ? levelOf(family) : null
    return (
      <CollectibleToken
        key={item.instanceId}
        label={name}
        art={getItemArt(kind, item.id).src}
        tone={
          item.type === 'FateSeal'
            ? '#c084fc'
            : item.type === 'VoidScript'
              ? '#9ca3af'
              : '#60a5fa'
        }
        data={{
          'data-consumable-instance': item.instanceId,
          'data-consumable-type': item.type,
        }}
        {...control(item.instanceId)}
      >
        <div className="flex items-start gap-3 text-sm">
          <img
            src={getItemArt(kind, item.id).src}
            alt=""
            aria-hidden="true"
            className="game-illustration h-16 w-16 shrink-0 object-contain"
          />
          <div className="min-w-0 [overflow-wrap:anywhere]">
            {family && (
              <p
                data-orb-upgrade={family}
                className="font-bold text-[var(--color-golden-yellow)]"
              >
                {family === 'All'
                  ? t('upgradeFamilies.All.upgrade', 'Every family +1 level')
                  : t('upgradeFamilies.levelChange', {
                      family: familyName(family),
                      from: number(level ?? 1),
                      to: number(Math.min(DEFAULT_ORB_MAX_LEVEL, (level ?? 1) + 1)),
                    })}
              </p>
            )}
            {family && family !== 'All' && (
              <p className="mt-0.5 text-xs text-[var(--color-beige-white)]/70">
                {t(`upgradeFamilies.${family}.covers`)}
              </p>
            )}
            <p className="mt-1">{itemText.description(kind, item)}</p>
          </div>
        </div>
        <UseButton
          item={item}
          validateUse={validateUse}
          onUse={onUse}
          onChooseTargets={onChooseTargets}
          onUsed={() => setOpenId(null)}
        />
      </CollectibleToken>
    )
  }

  const owned = [
    ...flora.flowers.flowers.map((flower) => (
      <CollectibleToken
        key={flower.id}
        label={t('flora.' + flower.type.toLowerCase())}
        art={getFlowerArt(flower.type)}
        tone="#f9a8d4"
        dimmed={flora.flowersSuppressed}
        badge={flower.mutation?.isUnlocked ? '✦' : undefined}
        data={{ 'data-flora-flower': flower.type }}
        {...control(flower.id)}
      >
        <FlowerDetails flower={flower.type} flora={flora} />
      </CollectibleToken>
    )),
    ...flora.seasons.map((season) => (
      <CollectibleToken
        key={season.id}
        label={seasonName(season)}
        art={getSeasonArt(season.type)}
        tone={season.isCorrupted ? '#fb923c' : '#86efac'}
        dimmed={season.isCorrupted}
        data={{ 'data-flora-season': season.id }}
        {...control(season.id)}
      >
        <SeasonDetails season={season} flora={flora} />
      </CollectibleToken>
    )),
    ...celestialOrbs.map((orb) => consumable(orb, 'orbs')),
    ...fateSeals.map((seal) => consumable(seal, 'seals')),
    ...voidScripts.map((script) => consumable(script, 'scripts')),
    ...upgrades.map((upgrade) => (
      <CollectibleToken
        key={`upgrade-${upgrade.yaku}`}
        label={t('upgradeFamilies.tokenLabel', {
          family: familyName(upgrade.yaku),
          level: number(upgrade.level),
        })}
        art={getItemArt('yakuUpgrades', upgrade.yaku).src}
        badge={number(upgrade.level)}
        tone={FAMILY_TONES[upgrade.yaku] ?? '#facc15'}
        data={{ 'data-yaku-upgrade': upgrade.yaku }}
        {...control(`upgrade-${upgrade.yaku}`)}
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
          {getCelestialOrbByYaku(upgrade.yaku) && (
            <p className="text-xs opacity-60">
              {t('yakuUpgrades.fromOrb', {
                orb: itemText.name('orbs', getCelestialOrbByYaku(upgrade.yaku)!),
              })}
            </p>
          )}
        </div>
      </CollectibleToken>
    )),
  ]

  if (owned.length === 0) return null
  return (
    <div
      data-collectible-rail
      data-tutorial="flora"
      role="list"
      aria-label={t('gameplay.collection', 'Your items')}
      className="scroll-rail flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto px-1 py-1.5"
    >
      {owned.map((token) => (
        <div role="listitem" key={token.key} className="shrink-0">
          {token}
        </div>
      ))}
    </div>
  )
}

export default CollectibleRail
