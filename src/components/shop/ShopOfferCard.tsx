/**
 * ShopOfferCard: one thing for sale in the Tea House.
 *
 * Every offer — a Decree, an Orb, a Seal, a Script, a tile, a Blessing Pack,
 * an Imperial Charter — is the same size: its picture and its price. Its name
 * is read out with the card and heads its details. Tap it (or hover with a
 * mouse, or focus it) to see what it is; the details panel holds the Buy
 * button, so looking never buys by accident.
 *
 * @module components/shop/ShopOfferCard
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { Decree } from '../../systems/types'
import { RARITY_COLORS, useOfferText } from './useOfferText'
import { OfferArt } from './OfferArt'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { DecreeModifierDetails } from '../ui/DecreeModifierDetails'
import { GoldIcon } from '../ui/GoldIcon'

export interface ShopOfferCardProps {
  offering: TeaHouseOffering
  canAfford: boolean
  /** Why the engine would refuse this purchase now, if it would. */
  unavailableReason?: string
  onBuy: () => void
  /** Decrees that accept a Flower as payment. */
  onOfferFlower?: () => void
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
          <OfferArt
            offering={offering}
            tileSize="large"
            emblemSize={44}
            showStickers
          />
        </span>
        <span
          data-shop-offer-price
          className={`mt-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-black tabular-nums ${
            canAfford
              ? 'bg-amber-400/20 text-[var(--color-golden-yellow)]'
              : 'bg-black/40 text-[var(--color-beige-white)]/50'
          }`}
        >
          <GoldIcon className="h-4 w-4" />
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
          {text.cost && (
            <p className="rounded-lg border border-red-400/35 bg-red-950/45 p-2 text-xs text-red-100">
              {t('consumableUse.cost')}: {text.cost}
            </p>
          )}
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
