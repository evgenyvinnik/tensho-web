/**
 * ShopScreen Component (Tea House / 茶寮)
 *
 * Full Tea House shop interface for Tensho Mahjong Roguelike.
 * Features:
 * - Item Slots (2-4 slots): Random items (Decrees, Fate Seals, Celestial Orbs)
 * - Blessing Packs (2 packs): Booster packs with random contents
 * - Imperial Charter (1 slot): Voucher-style permanent upgrade (after boss rounds)
 * - Reroll Button: Refresh item slots (5 gold base, +1 per reroll)
 * - Gold Display: Current gold amount
 * - Next Round Button: Proceed to next round
 *
 * Uses the run-owned ShopSession for purchases and pack settlement.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game/useGameController'
import { useProgressiveTutorial } from '../../hooks/useProgressiveTutorial'
import { getProgressiveHints } from '../../config/progressiveTutorialHints'
import { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { ShopResult } from '../../game/ShopSession'
import type { Decree, FlowerVariant } from '../../systems/types'
import { Button } from '../ui/Button'
import { ShopHeader } from '../shop/ShopHeader'
import { ShopOfferCard } from '../shop/ShopOfferCard'
import { DecreeReveal } from '../effects/DecreeReveal'
import { RoundCashOutBanner } from '../shop/RoundCashOutBanner'
import { PackOpeningModal } from '../shop/PackOpeningModal'
import { ProgressiveHintCard } from '../ui/ProgressiveHint'
import { YakuUpgradeLedger } from '../gameplay/YakuUpgradeLedger'
import { backgroundAssets } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'
import { ClassicSaveNotice } from '../gameplay/ClassicSaveNotice'
import { ShopBuildPanel } from '../shop/ShopBuildPanel'
import { FlowerCatalystDialog } from '../shop/FlowerCatalystDialog'
import { acceptsFlowerCatalyst } from '../../systems/flowerCatalysts'

// =============================================================================
// MAIN SHOP SCREEN COMPONENT
// =============================================================================

/**
 * ShopScreen - Tea House between-round shop
 */
export function ShopScreen() {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const { navigateTo } = useAppNavigation()
  const game = useGameController()
  const tutorialHints = useMemo(() => getProgressiveHints(t), [t])
  const tutorial = useProgressiveTutorial(tutorialHints)
  const { triggerHints } = tutorial

  const shop = game.shop

  // Local state
  const [catalystReceipt, setCatalystReceipt] = useState<{
    decree: Decree
    flower: FlowerVariant
  } | null>(null)
  const [catalystOffering, setCatalystOffering] =
    useState<TeaHouseOffering | null>(null)
  const currentPackOffering = shop.pendingPack
  const [shopError, setShopError] = useState<string | null>(null)

  useEffect(() => {
    triggerHints('shopEntered')
  }, [triggerHints])

  useGameEvent(
    'decreeAcquired',
    useCallback(() => tutorial.triggerHints('decreeAcquired'), [tutorial])
  )

  // Idempotent across rerenders and route changes; the run owns this visit.
  useEffect(() => {
    shop.open()
  }, [shop, game.phase])

  const shopState = shop.state
  const availableItems = shopState.itemOfferings.filter((o) => !o.isPurchased)
  const availablePacks = shopState.packOfferings.filter((o) => !o.isPurchased)
  const availableCharter = shopState.charterOffering?.isPurchased
    ? null
    : shopState.charterOffering
  const rerollCost = shopState.currentRerollCost
  const roundSummary = game.state.lastRoundSummary
  const interestCap =
    game.state.charterSystem.calculateEffects().interestCap +
    game.state.omenSystem.getInterestCapBonus()

  const offers: TeaHouseOffering[] = [
    ...availableItems,
    ...availablePacks,
    ...(availableCharter ? [availableCharter] : []),
  ]

  /** The engine's own refusal, in words, before the player tries to buy. */
  const unavailableReasonFor = (offering: TeaHouseOffering) => {
    const check = shop.validatePurchase(offering.id)
    if (check.success) return undefined
    switch (check.reason) {
      case 'notEnoughGold':
        return t('shop.cantAfford')
      case 'flowerRequirement':
        return t('shop.availability.flowerCount', {
          required: (
            (offering.item as Decree).flowerRequirement ?? 0
          ).toLocaleString(i18n.resolvedLanguage),
          current: game.state.flowerSystem
            .getFlowerCount()
            .toLocaleString(i18n.resolvedLanguage),
        })
      case 'inventoryFull':
        return t(
          offering.itemType === 'Decree'
            ? 'shop.availability.decreeSpace'
            : 'shop.availability.unavailable'
        )
      default:
        return t('shop.availability.unavailable')
    }
  }

  const showResult = useCallback(
    (result: ShopResult) => {
      if (result.success) {
        setShopError(null)
      } else {
        const key =
          result.reason === 'notEnoughGold'
            ? 'shop.cantAfford'
            : result.reason === 'flowerRequirement'
              ? 'shop.availability.flowers'
              : result.reason === 'inventoryFull'
                ? 'shop.inventoryFull'
                : 'shop.purchaseFailed'
        setShopError(t(key))
      }
    },
    [t]
  )

  const handleItemPurchase = useCallback(
    (offering: TeaHouseOffering) => {
      const result = shop.purchase(offering.id)
      showResult(result)
    },
    [shop, showResult]
  )

  const handlePackConfirm = useCallback(
    (indices: number[]) => {
      showResult(shop.confirmPack(indices))
    },
    [shop, showResult]
  )

  const handlePackSkip = useCallback(() => {
    showResult(shop.skipPack())
  }, [shop, showResult])

  const handleReroll = useCallback(() => {
    showResult(shop.reroll())
  }, [shop, showResult])

  const handleNextRound = useCallback(() => {
    if (shop.pendingPack) return
    game.exitShop()
    navigateTo(ROUTES.PLAY)
  }, [shop, game, navigateTo])

  // Handle settings
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  return (
    <div className="viewport-full relative isolate flex flex-col overflow-hidden bg-[var(--color-forest-green)]">
      <div
        aria-hidden="true"
        className="immersive-background absolute inset-0"
        style={{ backgroundImage: `url("${backgroundAssets.shop}")` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-dark-forest)]/45"
      />

      {/* Header with gold, reroll, settings */}
      <ShopHeader
        interestCap={interestCap}
        gold={game.gold}
        rerollCost={rerollCost}
        canAffordReroll={game.gold >= rerollCost}
        onReroll={handleReroll}
        onSettings={handleSettings}
        rerollCount={shopState.rerollsThisVisit}
        status={<ClassicSaveNotice inline />}
      />

      {/* Content area */}
      <div
        data-shop-scroll
        className="relative z-10 min-h-0 flex-1 overflow-y-auto"
      >
        <div className="screen-canvas pb-4">
          <ClassicSaveNotice errorsOnly />
          {/* Round payoff and next challenge — informative, never modal. */}
          {roundSummary ? (
            <RoundCashOutBanner
              summary={roundSummary}
              currentGold={game.gold}
              nextActNumber={game.nextActNumber}
              interestCap={interestCap}
              interestBlocked={game.state.omenSystem.isInterestBlocked()}
            />
          ) : (
            <div className="mx-3 mt-3 rounded-xl border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] p-4 text-center sm:mx-5 sm:mt-4">
              <p className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
                {t('shop.title', 'Tea House')}
              </p>
              <p className="mt-1 text-sm text-[var(--color-beige-white)]/65">
                {t('shop.ui.subtitle')}
              </p>
            </div>
          )}

          <ProgressiveHintCard
            initiallyCollapsed
            hint={tutorial.currentHint}
            onDismiss={tutorial.dismissHint}
            onDisableHints={tutorial.disableHints}
            queueCount={tutorial.hintQueue.length}
          />

          <ShopBuildPanel
            compact
            yakuHistory={game.state}
            completeConcealedHandsPlayed={
              game.state.completeConcealedHandsPlayed
            }
            decrees={game.state.decreeSystem.getOwnedDecrees()}
            maxSlots={game.state.decreeSystem.getMaxSlots()}
            onSell={(id) => {
              const result = game.sellDecree(id)
              if (result.success) setShopError(null)
              return result
            }}
            aside={<YakuUpgradeLedger upgrades={game.yakuUpgrades} compact />}
          />

          {/* One row: items, Blessing Packs and the Imperial Charter alike. */}
          <section data-shop-row className="mt-3 min-w-0">
            <h2 className="sr-only">{t('shop.ui.forSale', 'For sale')}</h2>
            <div className="scroll-rail flex min-w-0 gap-2 overflow-x-auto px-3 py-2 sm:flex-wrap sm:justify-center sm:gap-3 sm:px-5">
              {offers.map((offering) => (
                <ShopOfferCard
                  key={offering.id}
                  offering={offering}
                  canAfford={game.gold >= offering.finalCost}
                  unavailableReason={unavailableReasonFor(offering)}
                  onBuy={() => handleItemPurchase(offering)}
                  onOfferFlower={
                    offering.itemType === 'Decree' &&
                    acceptsFlowerCatalyst(offering.item as Decree)
                      ? () => {
                          setShopError(null)
                          setCatalystOffering(offering)
                        }
                      : undefined
                  }
                />
              ))}
              {offers.length === 0 && (
                <p className="w-full py-6 text-center text-[var(--color-beige-white)] opacity-50">
                  {t('shop.ui.allPurchased')}
                </p>
              )}
            </div>
          </section>

          {/* Spacer for bottom padding */}
          <div className="h-4" />
        </div>
      </div>

      {/* Bottom action bar */}
      {shopError && !catalystOffering && (
        <div
          role="alert"
          className="screen-canvas relative z-10 mb-2 rounded-lg border border-red-400/60 bg-red-950/70 px-3 py-2 text-center text-sm text-red-100"
        >
          {shopError}
        </div>
      )}

      {catalystReceipt && !shopError && (
        <p
          role="status"
          data-catalyst-receipt
          className="screen-canvas relative z-10 mb-2 rounded-lg border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] px-3 py-2 text-center text-sm text-[var(--color-beige-white)]"
        >
          {t('shop.catalyst.paid', {
            name: itemText.name('decrees', catalystReceipt.decree),
            flower: t('flora.' + catalystReceipt.flower.toLowerCase()),
          })}
        </p>
      )}

      <div className="relative z-10 flex-shrink-0 border-t-2 border-[var(--color-saddle-brown)] bg-[var(--color-dark-forest)] safe-area-bottom">
        <div className="screen-canvas px-3 py-3 sm:px-5 sm:py-4">
          <Button
            data-shop-continue
            variant="primary"
            onClick={handleNextRound}
            className="w-full text-lg"
          >
            {t('shop.ui.nextRound')}
          </Button>
        </div>
      </div>

      {/* Pack opening modal */}
      {catalystOffering && (
        <FlowerCatalystDialog
          key={catalystOffering.id}
          offering={catalystOffering}
          flowers={game.state.flowerSystem.getCollection()}
          slots={game.state.decreeSystem.getMaxSlots()}
          ownedDecrees={game.state.decreeSystem.getOwnedDecrees().length}
          validate={(flowerId) =>
            shop.validatePurchase(catalystOffering.id, {
              type: 'flower',
              flowerId,
            })
          }
          onClose={() => {
            setCatalystOffering(null)
            setShopError(null)
          }}
          onConfirm={(flowerId) => {
            const flower = game.state.flowerSystem
              .getFlowers()
              .find((flower) => flower.id === flowerId)
            const result = shop.purchase(catalystOffering.id, {
              type: 'flower',
              flowerId,
            })
            showResult(result)
            if (result.success) {
              if (flower)
                setCatalystReceipt({
                  decree: catalystOffering.item as Decree,
                  flower: flower.type,
                })
              setCatalystOffering(null)
            }
          }}
          error={shopError}
        />
      )}
      <DecreeReveal />
      <PackOpeningModal
        isOpen={currentPackOffering !== null}
        packOffering={currentPackOffering}
        onConfirm={handlePackConfirm}
        onSkip={handlePackSkip}
        canConfirmSelection={(indices) =>
          shop.validatePackSelection(indices).success
        }
        selectionError={(indices) => {
          const result = shop.validatePackSelection(indices)
          return !result.success && result.reason === 'flowerRequirement'
            ? t('shop.availability.flowers')
            : null
        }}
        error={shopError}
      />
    </div>
  )
}

export default ShopScreen
