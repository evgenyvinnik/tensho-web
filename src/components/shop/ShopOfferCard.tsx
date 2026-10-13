/**
 * ShopOfferCard: one thing for sale in the Tea House.
 *
 * Every offer — a Decree, an Orb, a Seal, a Script, a tile, a Blessing Pack,
 * an Imperial Charter — is the same size: its picture, its name and its price.
 * Tap it (or hover with a mouse, or focus it) to see what it is; the details
 * panel holds the Buy button, so looking never buys by accident.
 *
 * @module components/shop/ShopOfferCard
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type {
  BlessingPack,
  Decree,
  ImperialCharter,
} from '../../systems/types'
import type { FateSeal } from '../../systems/FateSealSystem'
import type { CelestialOrb } from '../../systems/CelestialOrbSystem'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import { Tile } from '../../core/Tile'
import { useItemText } from '../../i18n/useItemText'
import { tileRewardText } from '../../i18n/tileRewardText'
import { getItemArt } from '../../utils/itemArt'
import { getDecreeScrollIllustration } from '../../utils/assets'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { DecreeModifierDetails } from '../ui/DecreeModifierDetails'
import { TileImage } from '../tiles/TileImage'
import { GoldIcon } from '../ui/GoldIcon'
import { DECREE_ICON_COLORS } from '../gameplay/gameplayTypes'

const RARITY_COLORS: Record<string, string> = {
  common: '#A0A0A0',
  LocalEdict: '#A0A0A0',
  uncommon: '#4CAF50',
  RegionalMandate: '#4CAF50',
  rare: '#2196F3',
  ImperialDecree: '#2196F3',
  legendary: '#9C27B0',
  mythic: '#9C27B0',
  HeavenlyOrdinance: '#9C27B0',
}

const DECREE_RARITY_KEYS: Record<Decree['rarity'], string> = {
  LocalEdict: 'common',
  RegionalMandate: 'uncommon',
  ImperialDecree: 'rare',
  HeavenlyOrdinance: 'legendary',
}

export interface ShopOfferCardProps {
  offering: TeaHouseOffering
  canAfford: boolean
  /** Why the engine would refuse this purchase now, if it would. */
  unavailableReason?: string
  onBuy: () => void
  /** Decrees that accept a Flower as payment. */
  onOfferFlower?: () => void
}

interface OfferText {
  name: string
  kind: string
  description: string
  extra?: string
  rarity: string
}

function useOfferText(offering: TeaHouseOffering): OfferText {
  const { t } = useTranslation()
  const itemText = useItemText()
  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      return {
        name: itemText.name('decrees', decree),
        kind: t('shop.kinds.decree', {
          rarity: t(`shop.ui.rarity_${DECREE_RARITY_KEYS[decree.rarity]}`),
        }),
        description: itemText.description('decrees', decree),
        extra: t('shop.kinds.decreeHelp'),
        rarity: decree.rarity,
      }
    }
    case 'FateSeal': {
      const seal = offering.item as FateSeal
      return {
        name: itemText.name('seals', seal),
        kind: t('shop.kinds.seal'),
        description: itemText.description('seals', seal),
        extra: t('shop.kinds.consumableHelp'),
        rarity: seal.rarity.toLowerCase(),
      }
    }
    case 'CelestialOrb': {
      const orb = offering.item as CelestialOrb
      return {
        name: itemText.name('orbs', orb),
        kind: t('shop.kinds.orb'),
        description: itemText.description('orbs', orb),
        extra:
          orb.effect.targetYaku === 'All'
            ? undefined
            : t(`upgradeFamilies.${orb.effect.targetYaku}.covers`),
        rarity: orb.rarity.toLowerCase(),
      }
    }
    case 'VoidScript': {
      const script = offering.item as VoidScript
      return {
        name: itemText.name('scripts', script),
        kind: t('shop.kinds.script'),
        description: itemText.description('scripts', script),
        extra: t('shop.kinds.consumableHelp'),
        rarity: script.rarity.toLowerCase(),
      }
    }
    case 'Tile': {
      const tile = offering.item as Tile
      const text = tileRewardText(tile, t)
      return {
        name: text.name,
        kind: t('shop.kinds.tile'),
        description: tile.hasModifiers
          ? text.description
          : t('shop.kinds.tileHelp'),
        rarity: tile.hasModifiers ? 'uncommon' : 'common',
      }
    }
    case 'BlessingPack': {
      const pack = offering.item as BlessingPack
      const id = `${pack.type.toLowerCase()}_${pack.size.toLowerCase()}`
      return {
        name: t(`packs.items.${id}.name`),
        kind: t('shop.kinds.pack', {
          choose: pack.selectCount,
          from: pack.choiceCount,
        }),
        description: t(`packs.items.${id}.description`),
        rarity: pack.size === 'Mega' ? 'rare' : pack.size === 'Jumbo' ? 'uncommon' : 'common',
      }
    }
    case 'ImperialCharter': {
      const charter = offering.item as ImperialCharter
      return {
        name: itemText.name('charters', charter),
        kind: t('shop.kinds.charter'),
        description: itemText.description('charters', charter),
        extra: t('shop.kinds.charterHelp'),
        rarity: 'legendary',
      }
    }
  }
}

/** The offer's picture: its own art, or its family art with its emblem. */
function OfferArt({
  offering,
  large = false,
}: {
  offering: TeaHouseOffering
  large?: boolean
}) {
  const size = large ? 'h-24 w-24' : 'h-full w-full'
  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      const art = getItemArt('decrees', decree.id)
      return (
        <span className={`relative flex items-center justify-center ${size}`}>
          <img
            src={art.hasOwnArt ? art.src : getDecreeScrollIllustration(decree.rarity)}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="game-illustration absolute inset-0 h-full w-full object-contain"
          />
          {!art.hasOwnArt && (
            <span className="relative">
              <DecreeUniqueIcon
                decreeId={decree.id}
                size={large ? 40 : 30}
                color={DECREE_ICON_COLORS[decree.rarity]}
              />
            </span>
          )}
        </span>
      )
    }
    case 'Tile':
      return (
        <span className={`flex items-center justify-center ${size}`}>
          <TileImage tile={offering.item as Tile} size="small" showTooltip={false} />
        </span>
      )
    default: {
      const kind =
        offering.itemType === 'FateSeal'
          ? 'seals'
          : offering.itemType === 'CelestialOrb'
            ? 'orbs'
            : offering.itemType === 'VoidScript'
              ? 'scripts'
              : offering.itemType === 'BlessingPack'
                ? 'packs'
                : 'charters'
      const id =
        offering.itemType === 'BlessingPack'
          ? (offering.item as BlessingPack).type
          : offering.item.id
      return (
        <img
          src={getItemArt(kind, id).src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`game-illustration object-contain ${size}`}
        />
      )
    }
  }
}

export function ShopOfferCard({
  offering,
  canAfford,
  unavailableReason,
  onBuy,
  onOfferFlower,
}: ShopOfferCardProps) {
  const { t, i18n } = useTranslation()
  const text = useOfferText(offering)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [keyboardOpened, setKeyboardOpened] = useState(false)
  const pinned = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buying = useRef(false)
  const canBuy =
    canAfford && !unavailableReason && !offering.isLocked && !offering.isPurchased
  const rarityColor = RARITY_COLORS[text.rarity] ?? '#A0A0A0'
  const price = offering.finalCost.toLocaleString(i18n.resolvedLanguage)
  const fullPrice = offering.baseCost + offering.editionCost

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])
  const close = useCallback(() => {
    cancelClose()
    pinned.current = false
    setKeyboardOpened(false)
    setOpen(false)
  }, [cancelClose])
  const scheduleClose = useCallback(() => {
    if (pinned.current) return
    cancelClose()
    closeTimer.current = setTimeout(close, 150)
  }, [cancelClose, close])
  useEffect(() => cancelClose, [cancelClose])

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-shop-offer={offering.id}
        data-shop-offer-type={offering.itemType}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('shop.offerLabel', { name: text.name, price })}
        onPointerEnter={(event) => {
          if (
            event.pointerType !== 'mouse' ||
            !window.matchMedia?.('(any-hover: hover)').matches
          )
            return
          cancelClose()
          setOpen(true)
        }}
        onPointerLeave={scheduleClose}
        onClick={(event) => {
          cancelClose()
          if (event.detail === 0) {
            pinned.current = true
            setKeyboardOpened(true)
            setOpen(true)
            return
          }
          if (open && !pinned.current) {
            pinned.current = true
            return
          }
          if (open) close()
          else {
            pinned.current = true
            setOpen(true)
          }
        }}
        className="shop-offer-card group relative flex shrink-0 flex-col items-center overflow-hidden rounded-xl border-2 bg-[var(--color-dark-forest)]/95 p-1.5 text-center shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)]"
        style={{
          borderColor: rarityColor,
          boxShadow: `0 0 14px ${rarityColor}35`,
        }}
      >
        <span className="shop-offer-art flex w-full items-center justify-center">
          <OfferArt offering={offering} />
        </span>
        <span className="mt-1 line-clamp-2 min-h-[2.1rem] w-full break-words text-[11px] font-semibold leading-[1.05rem] text-[var(--color-beige-white)]">
          {text.name}
        </span>
        <span
          data-shop-offer-price
          className={`mt-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black tabular-nums ${
            canAfford
              ? 'bg-amber-400/20 text-[var(--color-golden-yellow)]'
              : 'bg-black/40 text-[var(--color-beige-white)]/50'
          }`}
        >
          <GoldIcon className="h-3.5 w-3.5" />
          {price}
        </span>
      </button>
      <AnchoredPopover
        open={open}
        anchorRef={anchorRef}
        id={panelId}
        title={text.name}
        onClose={close}
        focusOnOpen={keyboardOpened}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
      >
        <div data-shop-offer-details={offering.id} className="space-y-2 text-sm [overflow-wrap:anywhere]">
          <div className="flex items-start gap-3">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center">
              <OfferArt offering={offering} large />
            </span>
            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: rarityColor }}
              >
                {text.kind}
              </p>
              <p className="mt-1 leading-relaxed">{text.description}</p>
            </div>
          </div>
          {text.extra && (
            <p className="rounded-lg bg-black/25 p-2 text-xs text-[var(--color-beige-white)]/80">
              {text.extra}
            </p>
          )}
          {offering.itemType === 'Decree' && (
            <DecreeModifierDetails
              decree={{
                ...(offering.item as Decree),
                edition: (offering.item as Decree).edition ?? offering.edition,
              }}
            />
          )}
          {unavailableReason && (
            <p data-purchase-blocked className="text-xs text-amber-200">
              {unavailableReason}
            </p>
          )}
          <button
            type="button"
            data-shop-buy={offering.id}
            disabled={!canBuy}
            onClick={() => {
              if (buying.current || !canBuy) return
              buying.current = true
              try {
                onBuy()
              } finally {
                buying.current = false
                close()
              }
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-4 font-bold text-white shadow disabled:cursor-not-allowed disabled:border-gray-500 disabled:bg-gray-600 disabled:text-gray-300"
          >
            {t('shop.buyFor', { price })}
            {fullPrice > offering.finalCost && (
              <span className="text-xs line-through opacity-70">
                {fullPrice.toLocaleString(i18n.resolvedLanguage)}
              </span>
            )}
          </button>
          {onOfferFlower && (
            <button
              type="button"
              data-offer-flower
              onClick={() => {
                close()
                onOfferFlower()
              }}
              disabled={offering.isPurchased || offering.isLocked}
              className="min-h-11 w-full rounded-lg border border-[var(--color-metallic-gold)] px-3 text-sm disabled:opacity-40"
            >
              {t('shop.catalyst.offer')}
            </button>
          )}
        </div>
      </AnchoredPopover>
    </>
  )
}

export default ShopOfferCard
