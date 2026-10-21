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

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import { eventBus } from '../../game/EventBus'
import { useFloraRevealQueue } from '../../game/floraRevealQueue'
import type {
  ActionResult,
  PlayerAction,
  ValidationResult,
} from '../../game/ActionProcessor'
import type { FateSeal } from '../../systems/FateSealSystem'
import {
  DEFAULT_ORB_MAX_LEVEL,
  type CelestialOrb,
  type YakuCategory,
} from '../../systems/CelestialOrbSystem'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import type { BaseConsumable } from '../../systems/ConsumableSystem'
import { consumableTargetRange } from '../../gameplay/consumableTargeting'
import { useItemText } from '../../i18n/useItemText'
import { getFlowerArt, getItemArt, getSeasonArt } from '../../utils/itemArt'
import { CollectibleToken } from '../ui/CollectibleToken'
import { CharterArtwork } from '../ui/CharterArtwork'
import { FlowerDetails, SeasonDetails, useSeasonName } from './FloraDetails'
import { consumableMessage } from './consumableMessages'
import { YakuUpgradeToken } from './YakuUpgradeToken'

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
  /** What a copying Seal (the Fool) would create now. */
  lastCopyableConsumable?: BaseConsumable | null
  /** An Omen cancels the next Void Script's penalty. */
  scriptDownsideProtected?: boolean
  /** The Observatory Charter pays for Orbs held rather than used. */
  observatoryActive?: boolean
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
        <p
          role="status"
          data-consumable-availability
          className="mb-2 text-xs text-amber-200"
        >
          {check?.errors
            .map((error) => consumableMessage(error, t))
            .join(' ') || t('consumableUse.unavailable')}
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
            else
              setError(
                result.errors
                  ?.map((error) => consumableMessage(error, t))
                  .join(' ') || t('consumableUse.failed')
              )
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
  lastCopyableConsumable,
  scriptDownsideProtected = false,
  observatoryActive = false,
}: CollectibleRailProps) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const seasonName = useSeasonName()
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  // Closing a used item's panel: its token disappears with the item.
  const [openId, setOpenId] = useState<string | null>(null)
  // What Orchid drew and Plum recovered on the last play, kept for their
  // panels until the round ends.
  const [floraNotes, setFloraNotes] = useState({ bloom: 0, recovered: 0 })
  // A drawn Flower or Season shows once its tile has flown here from the
  // Wall (see WallDraw), not while the draw still waits or plays.
  const drawing = useFloraRevealQueue((state) => state.queue)
  useEffect(() => {
    const reset = () => setFloraNotes({ bloom: 0, recovered: 0 })
    const subscriptions = [
      eventBus.on('orchidBloom', ({ count }) =>
        setFloraNotes((notes) => ({ ...notes, bloom: count }))
      ),
      eventBus.on('plumRecovery', ({ count }) =>
        setFloraNotes((notes) => ({ ...notes, recovered: count }))
      ),
      eventBus.on('roundStart', reset),
      eventBus.on('gameLoaded', reset),
    ]
    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [])
  const control = (id: string) => ({
    open: openId === id,
    onOpenChange: (open: boolean) =>
      setOpenId((current) => (open ? id : current === id ? null : current)),
  })

  const familyName = (family: YakuCategory) =>
    t(`upgradeFamilies.${family}.name`)
  const consumable = (item: Consumable, kind: 'seals' | 'orbs' | 'scripts') => {
    const name = itemText.name(kind, item)
    const family = item.type === 'CelestialOrb' ? item.effect.targetYaku : null
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
                      to: number(
                        Math.min(DEFAULT_ORB_MAX_LEVEL, (level ?? 1) + 1)
                      ),
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
        {/* What using it costs, before the one tap that uses it. */}
        {observatoryActive && item.type === 'CelestialOrb' && (
          <aside
            data-observatory-holding
            className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200/30 bg-black/20 p-2 text-xs leading-relaxed [overflow-wrap:anywhere]"
          >
            <CharterArtwork
              charterId="observatory"
              className="h-12 w-12 shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <p>{t('observatory.description')}</p>
              <p data-observatory-cost className="text-amber-100/85">
                {t('observatory.holdingNote')}
              </p>
            </div>
          </aside>
        )}
        {item.type === 'VoidScript' && (
          <p
            data-script-cost
            className="mt-3 rounded-lg border border-red-400/40 p-2 text-xs text-red-200"
          >
            {t('consumableUse.cost')}:{' '}
            {scriptDownsideProtected
              ? t('consumableUse.protected')
              : t(`consumableUse.penalty_${item.penalty.type}`, {
                  count: item.penalty.value || 1,
                })}
          </p>
        )}
        {item.type === 'FateSeal' &&
          item.effect.type === 'duplicate_consumable' &&
          lastCopyableConsumable &&
          lastCopyableConsumable.type !== 'VoidScript' && (
            <p
              role="status"
              data-consumable-copy-result
              className="mt-3 text-xs text-amber-200"
            >
              {t('consumableUse.copyResult', {
                name: itemText.name(
                  lastCopyableConsumable.type === 'FateSeal' ? 'seals' : 'orbs',
                  lastCopyableConsumable
                ),
              })}
            </p>
          )}
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
        art={getFlowerArt(flower)}
        tone="#f9a8d4"
        dimmed={flora.flowersSuppressed}
        arriving={drawing.some(
          (entry) => entry.kind === 'flower' && entry.flower === flower.type
        )}
        badge={flower.mutation?.isUnlocked ? '✦' : undefined}
        data={{ 'data-flora-flower': flower.type }}
        {...control(flower.id)}
      >
        <FlowerDetails
          flower={flower.type}
          flora={flora}
          orchidBloom={floraNotes.bloom}
          plumRecovery={floraNotes.recovered}
        />
      </CollectibleToken>
    )),
    ...flora.seasons.map((season) => (
      <CollectibleToken
        key={season.id}
        label={seasonName(season)}
        art={getSeasonArt(season)}
        tone={season.isCorrupted ? '#fb923c' : '#86efac'}
        arriving={drawing.some(
          (entry) => entry.kind === 'season' && entry.season.id === season.id
        )}
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
      <YakuUpgradeToken
        key={`upgrade-${upgrade.yaku}`}
        upgrade={upgrade}
        {...control(`upgrade-${upgrade.yaku}`)}
      />
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
