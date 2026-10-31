/**
 * ShopScreen Component (Tea House / 茶寮)
 *
 * Full Tea House shop interface for Tensho Mahjong Roguelike.
 * Features:
 * - Item Slots (2-4 slots): Random items (Decrees, Fate Seals, Celestial Orbs)
 * - Blessing Packs (2 packs): Booster packs with random contents
 * - Imperial Charter (1 slot): Voucher-style permanent upgrade (after boss rounds)
 * - Gold Display: Current gold amount
 * - Reroll Button: Refresh item slots (5 gold base, +1 per reroll), right
 *   above Next Round; the old item cards fade away and the new ones fade in
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
import type { FateSeal } from '../../systems/FateSealSystem'
import type { Tile } from '../../core/Tile'
import { consumableTargetRange } from '../../gameplay/consumableTargeting'
import {
  previewWallSeal,
  wallAfterSeal,
  type SealedTile,
} from '../../gameplay/wallSeals'
import { consumableMessage } from '../gameplay/consumableMessages'
import { Button } from '../ui/Button'
import { ShopHeader } from '../shop/ShopHeader'
import { ShopRerollButton } from '../shop/ShopRerollButton'
import { ShopOfferCard } from '../shop/ShopOfferCard'
import { DecreeReveal } from '../effects/DecreeReveal'
import { CelestialOrbReveal } from '../effects/CelestialOrbReveal'
import { CashOutToasts } from '../shop/CashOutToasts'
import type { CashOutEntry } from '../shop/cashOutEntries'
import {
  cashOutKey,
  markCashOutShown,
  wasCashOutShown,
} from '../shop/cashOutArrival'
import { PackOpeningModal } from '../shop/PackOpeningModal'
import { ProgressiveHintCard } from '../ui/ProgressiveHint'
import { YakuUpgradeRow } from '../shop/YakuUpgradeRow'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { backgroundAssets } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'
import { ClassicSaveNotice } from '../gameplay/ClassicSaveNotice'
import { ShopBuildPanel } from '../shop/ShopBuildPanel'
import { RunJourney } from '../shop/RunJourney'
import { FlowerCatalystDialog } from '../shop/FlowerCatalystDialog'
import { SealWallDialog } from '../shop/SealWallDialog'
import { SealUsedToast } from '../shop/SealUsedToast'
import { MadeSealPrompt } from '../shop/MadeSealPrompt'
import { useHeaderHeight } from '../../hooks/useHeaderHeight'
import { acceptsFlowerCatalyst } from '../../systems/flowerCatalysts'

/** A Seal that is laid on wall tiles, so buying it first asks which. */
const takesWallTiles = (seal: FateSeal) =>
  consumableTargetRange(seal.effect).max > 0

/** How long a reroll's old item cards take to fade away (CSS matches). */
const REROLL_LEAVE_MS = 180

/** A pack claim waiting on the wall tiles for each of its chosen Seals. */
interface PackSealSteps {
  indices: number[]
  /** Pack indices of the chosen Seals that take tiles, in claim order. */
  seals: number[]
  step: number
  targets: Record<number, string[]>
}

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
  const reducedMotion = useReducedMotion()
  const headerHeight = useHeaderHeight('[data-shop-header]')
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
  // A Seal is used as it is bought; one that takes tiles asks which first.
  const [sealOffering, setSealOffering] = useState<TeaHouseOffering | null>(
    null
  )
  const [packSeals, setPackSeals] = useState<PackSealSteps | null>(null)
  const [sealError, setSealError] = useState<string | null>(null)
  const [sealUsed, setSealUsed] = useState<{
    key: number
    seals: FateSeal[]
    changes: SealedTile[]
  } | null>(null)
  const handleSealToastDone = useCallback(() => setSealUsed(null), [])
  // A reroll swaps the item cards on screen: the ones showing fade away,
  // then the new stock fades in. The engine has restocked already.
  const [leavingItems, setLeavingItems] = useState<
    TeaHouseOffering[] | null
  >(null)
  const [restocked, setRestocked] = useState(false)
  useEffect(() => {
    if (!leavingItems) return
    const timer = setTimeout(() => setLeavingItems(null), REROLL_LEAVE_MS)
    return () => clearTimeout(timer)
  }, [leavingItems])

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

  // The round's pay arrives on screen once: toasts in the corner, coins into
  // the purse, and the balance counting up as each lands. The engine settled
  // it already; `pending` is only what has not landed yet. The count-up
  // starts from the settled balance only while the purse still holds it: a
  // run resumed after spending shows its real balance throughout.
  const arrivalFor = (summary: NonNullable<typeof roundSummary>) => ({
    key: cashOutKey(summary),
    pending: game.gold === summary.goldAfter ? summary.netGoldChange : 0,
  })
  const [arrival, setArrival] = useState<{
    key: string
    pending: number
  } | null>(() => {
    if (!roundSummary) return null
    return wasCashOutShown(cashOutKey(roundSummary))
      ? null
      : arrivalFor(roundSummary)
  })
  useEffect(() => {
    if (arrival) markCashOutShown(arrival.key)
  }, [arrival])
  // A settlement that arrives after mounting (a resumed run still loading)
  // is shown once too; a settlement already shown never replays.
  useEffect(() => {
    if (arrival || !roundSummary) return
    if (wasCashOutShown(cashOutKey(roundSummary))) return
    setArrival(arrivalFor(roundSummary))
    // `arrivalFor` reads the purse once, when the settlement first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival, roundSummary])
  const [purseBump, setPurseBump] = useState(0)
  const handleLanded = useCallback((entry: CashOutEntry) => {
    if (entry.amount === 0) return
    setArrival((current) =>
      current ? { ...current, pending: current.pending - entry.amount } : null
    )
    setPurseBump((count) => count + 1)
  }, [])
  const handleArrivalDone = useCallback(() => setArrival(null), [])
  const displayGold = game.gold - (arrival?.pending ?? 0)

  const shownItems = leavingItems ?? availableItems
  const offers: TeaHouseOffering[] = [
    ...shownItems,
    ...availablePacks,
    ...(availableCharter ? [availableCharter] : []),
  ]
  const itemTransition = (offering: TeaHouseOffering) => {
    const index = shownItems.indexOf(offering)
    if (index < 0 || reducedMotion) return undefined
    if (leavingItems) return { phase: 'leave' as const, index }
    return restocked ? { phase: 'enter' as const, index } : undefined
  }

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
      case 'maxLevel':
        return t('consumableUse.errorMaxLevel')
      case 'sealUnusable':
        return check.detail
          ? consumableMessage(check.detail, t)
          : t('consumableUse.unavailable')
      default:
        return t('shop.availability.unavailable')
    }
  }

  /** A refusal in words, for whichever panel the player is looking at. */
  const messageFor = useCallback(
    (result: Extract<ShopResult, { success: false }>) =>
      result.reason === 'notEnoughGold'
        ? t('shop.cantAfford')
        : result.reason === 'flowerRequirement'
          ? t('shop.availability.flowers')
          : result.reason === 'inventoryFull'
            ? t('shop.inventoryFull')
            : result.reason === 'maxLevel'
              ? t('consumableUse.errorMaxLevel')
              : result.reason === 'sealUnusable'
                ? result.detail
                  ? consumableMessage(result.detail, t)
                  : t('consumableUse.unavailable')
                : t('shop.purchaseFailed'),
    [t]
  )

  const showResult = useCallback(
    (result: ShopResult) => {
      setShopError(result.success ? null : messageFor(result))
    },
    [messageFor]
  )

  /**
   * Announce Seals that have just worked, with what they made of the wall.
   * Seals they made arrive just after them and join the same note.
   */
  const announceSeals = useCallback(
    (used: { seal: FateSeal; changes: SealedTile[] }[]) => {
      if (used.length === 0) return
      setSealUsed((shown) => ({
        key: Date.now(),
        seals: [...(shown?.seals ?? []), ...used.map((entry) => entry.seal)],
        changes: [
          ...(shown?.changes ?? []),
          ...used.flatMap((entry) => entry.changes),
        ],
      }))
    },
    []
  )

  const handleItemPurchase = useCallback(
    (offering: TeaHouseOffering) => {
      if (
        offering.itemType === 'FateSeal' &&
        takesWallTiles(offering.item as FateSeal)
      ) {
        setShopError(null)
        setSealError(null)
        setSealOffering(offering)
        return
      }
      const result = shop.purchase(offering.id)
      showResult(result)
      if (result.success && offering.itemType === 'FateSeal')
        announceSeals([{ seal: offering.item as FateSeal, changes: [] }])
    },
    [shop, showResult, announceSeals]
  )

  const handleSealPurchase = useCallback(
    (targets: string[]) => {
      if (!sealOffering) return
      const seal = sealOffering.item as FateSeal
      const changes = previewWallSeal(seal, game.state.wallTemplate, targets)
      const result = shop.purchase(sealOffering.id, { type: 'gold' }, targets)
      if (!result.success) {
        setSealError(messageFor(result))
        return
      }
      setSealOffering(null)
      setSealError(null)
      setShopError(null)
      announceSeals([{ seal, changes }])
    },
    [sealOffering, game.state.wallTemplate, shop, messageFor, announceSeals]
  )

  /** Claim a pack's choice: each chosen Seal is used on its wall tiles. */
  const claimPack = useCallback(
    (indices: number[], targets: Record<number, string[]> = {}) => {
      const contents = shop.pendingPack?.contents ?? []
      let wall: readonly Tile[] = game.state.wallTemplate
      const used = indices
        .filter((i) => contents[i]?.type === 'FateSeal')
        .map((i) => {
          const seal = contents[i].data as FateSeal
          const changes = previewWallSeal(seal, wall, targets[i] ?? [])
          wall = wallAfterSeal(seal, wall, targets[i] ?? [])
          return { seal, changes }
        })
      const result = shop.confirmPack(indices, targets)
      showResult(result)
      if (result.success) announceSeals(used)
      return result
    },
    [shop, game.state.wallTemplate, showResult, announceSeals]
  )

  const handlePackConfirm = useCallback(
    (indices: number[]) => {
      const contents = shop.pendingPack?.contents ?? []
      const seals = indices.filter(
        (i) =>
          contents[i]?.type === 'FateSeal' &&
          takesWallTiles(contents[i].data as FateSeal)
      )
      if (seals.length === 0) {
        claimPack(indices)
        return
      }
      setSealError(null)
      setPackSeals({ indices, seals, step: 0, targets: {} })
    },
    [shop, claimPack]
  )

  // A pack's later Seal finds the wall its earlier Seals leave.
  const packSealWall =
    packSeals && currentPackOffering
      ? packSeals.seals
          .slice(0, packSeals.step)
          .reduce<
            readonly Tile[]
          >((wall, index) => wallAfterSeal(currentPackOffering.contents[index].data as FateSeal, wall, packSeals.targets[index] ?? []), game.state.wallTemplate)
      : null

  const handlePackSealTargets = useCallback(
    (targets: string[]) => {
      if (!packSeals) return
      const index = packSeals.seals[packSeals.step]
      const next = { ...packSeals.targets, [index]: targets }
      if (packSeals.step + 1 < packSeals.seals.length) {
        setPackSeals({ ...packSeals, step: packSeals.step + 1, targets: next })
        return
      }
      const result = claimPack(packSeals.indices, next)
      if (result.success) {
        setPackSeals(null)
        setSealError(null)
      } else setSealError(messageFor(result))
    },
    [packSeals, claimPack, messageFor]
  )

  const handlePackSkip = useCallback(() => {
    showResult(shop.skipPack())
  }, [shop, showResult])

  // Also offered inside a Decree pack, to make room for its choice.
  const handleSellDecree = useCallback(
    (id: string) => {
      const result = game.sellDecree(id)
      if (result.success) setShopError(null)
      return result
    },
    [game]
  )

  const handleReroll = useCallback(() => {
    const result = shop.reroll()
    showResult(result)
    if (!result.success || reducedMotion) return
    // A reroll while cards are still leaving keeps those cards leaving.
    setLeavingItems((leaving) => leaving ?? shownItems)
    setRestocked(true)
  }, [shop, showResult, reducedMotion, shownItems])

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

      {/* Header with gold and settings */}
      <ShopHeader
        interestCap={interestCap}
        gold={displayGold}
        purseBump={purseBump}
        onSettings={handleSettings}
        status={<ClassicSaveNotice inline />}
      />

      {/* Content area */}
      <div
        data-shop-scroll
        className="relative z-10 min-h-0 flex-1 overflow-y-auto"
      >
        <div className="screen-canvas pb-4">
          <ClassicSaveNotice errorsOnly />
          <RunJourney
            act={game.currentAct}
            round={game.currentRound}
            nextAct={game.nextActNumber}
            hasWonRun={game.hasWonRun}
          />
          <ProgressiveHintCard
            initiallyCollapsed
            hint={tutorial.currentHint}
            onDismiss={tutorial.dismissHint}
            onDisableHints={tutorial.disableHints}
            queueCount={tutorial.hintQueue.length}
          />

          <ShopBuildPanel
            yakuHistory={game.state}
            completeConcealedHandsPlayed={
              game.state.completeConcealedHandsPlayed
            }
            decrees={game.state.decreeSystem.getOwnedDecrees()}
            maxSlots={game.state.decreeSystem.getMaxSlots()}
            onSell={handleSellDecree}
            upgrades={<YakuUpgradeRow upgrades={game.yakuFamilies} />}
          />

          {/* Items, Blessing Packs and the Imperial Charter alike: three to a
              row on a phone, scrolling down with the page, never sideways. */}
          <section data-shop-row className="mt-3 min-w-0">
            <h2 className="sr-only">{t('shop.ui.forSale', 'For sale')}</h2>
            <div className="grid min-w-0 grid-cols-3 gap-2 px-3 py-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3 sm:px-5">
              {offers.map((offering) => (
                <ShopOfferCard
                  key={offering.id}
                  offering={offering}
                  canAfford={game.gold >= offering.finalCost}
                  unavailableReason={unavailableReasonFor(offering)}
                  onBuy={() => handleItemPurchase(offering)}
                  transition={itemTransition(offering)}
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
                <p className="col-span-3 w-full py-6 text-center text-[var(--color-beige-white)] opacity-50">
                  {t('shop.ui.allPurchased')}
                </p>
              )}
            </div>
          </section>

          {/* Spacer for bottom padding */}
          <div className="h-4" />
        </div>
      </div>

      {/* The last round's pay, arriving in the purse. */}
      {arrival && roundSummary && (
        <CashOutToasts
          key={arrival.key}
          summary={roundSummary}
          top={headerHeight + 8}
          onLanded={handleLanded}
          onDone={handleArrivalDone}
          reducedMotion={reducedMotion}
        />
      )}

      {sealUsed && (
        <SealUsedToast
          key={sealUsed.key}
          seals={sealUsed.seals}
          changes={sealUsed.changes}
          top={headerHeight + 8}
          onDone={handleSealToastDone}
        />
      )}

      {/* Bottom action bar */}
      {shopError && !catalystOffering && !sealOffering && !packSeals && (
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
        <div className="screen-canvas flex flex-col gap-2 px-3 py-3 sm:px-5 sm:py-4">
          <ShopRerollButton
            cost={rerollCost}
            canAfford={game.gold >= rerollCost}
            onReroll={handleReroll}
          />
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
      {sealOffering && (
        <SealWallDialog
          key={sealOffering.id}
          seal={sealOffering.item as FateSeal}
          wall={game.state.wallTemplate}
          confirmLabel={t('shop.buyFor', {
            price: sealOffering.finalCost.toLocaleString(i18n.resolvedLanguage),
          })}
          error={sealError}
          onConfirm={handleSealPurchase}
          onClose={() => {
            setSealOffering(null)
            setSealError(null)
          }}
        />
      )}
      {packSeals && currentPackOffering && packSealWall && (
        <SealWallDialog
          key={`${currentPackOffering.pack.id}:${packSeals.step}`}
          seal={
            currentPackOffering.contents[packSeals.seals[packSeals.step]]
              .data as FateSeal
          }
          wall={packSealWall}
          step={{ index: packSeals.step, count: packSeals.seals.length }}
          confirmLabel={t(
            packSeals.step + 1 < packSeals.seals.length
              ? 'common.confirm'
              : 'consumableUse.confirm'
          )}
          error={sealError}
          onConfirm={handlePackSealTargets}
          onClose={() => {
            setPackSeals(null)
            setSealError(null)
          }}
        />
      )}
      <MadeSealPrompt
        seals={game.fateSeals}
        wall={game.state.wallTemplate}
        paused={
          sealOffering !== null ||
          packSeals !== null ||
          currentPackOffering !== null ||
          catalystOffering !== null
        }
        settle={game.settleHeldFateSeal}
        onUsed={announceSeals}
      />
      <DecreeReveal />
      <CelestialOrbReveal />
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
          if (result.success) return null
          if (result.reason === 'flowerRequirement')
            return t('shop.availability.flowers')
          if (result.reason === 'maxLevel')
            return t('consumableUse.errorMaxLevel')
          if (result.reason === 'sealUnusable') return messageFor(result)
          return null
        }}
        error={shopError}
        build={{
          decrees: game.state.decreeSystem.getOwnedDecrees(),
          maxSlots: game.state.decreeSystem.getMaxSlots(),
          onSell: handleSellDecree,
        }}
      />
    </div>
  )
}

export default ShopScreen
