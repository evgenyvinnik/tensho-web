/**
 * GameplayScreen Component
 *
 * Main gameplay screen that connects to the GameOrchestrator via useGameController.
 * This is the interactive gameplay interface for Tensho Mahjong Roguelike.
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game'
import { useResponsiveTileSize } from '../../hooks/useResponsiveTileSize'
import { useProgressiveTutorial } from '../../hooks/useProgressiveTutorial'
import { Button } from '../ui/Button'
import { TablePattern } from '../ui/TablePattern'
import { PlaySurface } from '../gameplay/PlaySurface'
import { ScorePopup } from '../effects/ScorePopup'
import { YakuReveal } from '../effects/YakuReveal'
import { ProgressiveHintOverlay } from '../ui/ProgressiveHint'
import { ConfirmPopup } from '../ui/Popup'
import { getProgressiveHints } from '../../config/progressiveTutorialHints'
import { Tile, TileSuit } from '../../core/Tile'
import { TileImage } from '../tiles/TileImage'
import { DecreeRarity, OwnedDecree } from '../../systems/types'
import { FlowerVariant, SeasonVariant } from '../../systems/types'
import { SEASON_BASE_EFFECTS } from '../../systems/SeasonSystem'
import { GlowEffect } from '../effects/GlowEffect'
import { getCurrentLanguage } from '../../i18n'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'

/** Check if current language uses CJK characters */
function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
}

/**
 * Score popup state
 */
interface ScorePopupState {
  id: number
  score: number
  multiplier?: number
  variant: 'default' | 'bonus' | 'critical'
}

/**
 * Yaku reveal state
 */
interface YakuRevealState {
  id: string
  japaneseName: string
  multiplier: number
  tier: 1 | 2 | 3 | 4
}

/**
 * Round type configuration
 */
type RoundType = 'Small' | 'Large' | 'Boss'

interface RoundTypeConfig {
  japaneseName: string
  color: string
  bgColor: string
  borderColor: string
}

const ROUND_TYPE_CONFIG: Record<RoundType, RoundTypeConfig> = {
  Small: {
    japaneseName: '小局',
    color: 'text-green-400',
    bgColor: 'bg-green-900/40',
    borderColor: 'border-green-500',
  },
  Large: {
    japaneseName: '大局',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/40',
    borderColor: 'border-blue-500',
  },
  Boss: {
    japaneseName: '親局',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/40',
    borderColor: 'border-purple-500',
  },
}

/**
 * Decree rarity colors
 */
const DECREE_RARITY_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: 'border-gray-400',
  RegionalMandate: 'border-green-500',
  ImperialDecree: 'border-blue-500',
  HeavenlyOrdinance: 'border-purple-500',
}

/**
 * Decree rarity icon colors for unique icons
 */
const DECREE_ICON_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: '#9CA3AF', // gray-400
  RegionalMandate: '#22C55E', // green-500
  ImperialDecree: '#3B82F6', // blue-500
  HeavenlyOrdinance: '#A855F7', // purple-500
}

/**
 * Flower display data with tile rank and effect description
 */
const FLOWER_DATA: Record<FlowerVariant, { rank: number; effect: string; color: string }> = {
  Plum: { rank: 1, effect: '+5% per sequence', color: 'from-pink-400 to-pink-600' },
  Orchid: { rank: 2, effect: '+5% per honor', color: 'from-purple-400 to-purple-600' },
  Chrysanthemum: { rank: 3, effect: '+5% per concealed', color: 'from-yellow-400 to-yellow-600' },
  Bamboo: { rank: 4, effect: '+5% per terminal', color: 'from-green-400 to-green-600' },
}

/**
 * Season display data
 */
const SEASON_DATA: Record<SeasonVariant, { emoji: string; japanese: string; color: string }> = {
  Spring: { emoji: '🌱', japanese: '春', color: 'text-green-400' },
  Summer: { emoji: '☀️', japanese: '夏', color: 'text-yellow-400' },
  Autumn: { emoji: '🍂', japanese: '秋', color: 'text-orange-400' },
  Winter: { emoji: '❄️', japanese: '冬', color: 'text-blue-400' },
}

/**
 * DecreeCardCompact - Compact decree card for the decree bar
 */
interface DecreeCardCompactProps {
  decree: OwnedDecree
  onTap?: () => void
}

function DecreeCardCompact({ decree, onTap }: DecreeCardCompactProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className={`
        relative flex-shrink-0 w-16 h-20
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 ${DECREE_RARITY_COLORS[decree.rarity]}
        ${decree.isDebuffed ? 'opacity-50 grayscale' : ''}
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-lg
        min-w-[44px] min-h-[44px]
      `}
      onClick={() => {
        setShowTooltip(!showTooltip)
        onTap?.()
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Unique decree icon */}
      <div className="flex items-center justify-center h-full">
        <DecreeUniqueIcon
          decreeId={decree.id}
          size={36}
          color={DECREE_ICON_COLORS[decree.rarity]}
        />
      </div>

      {/* Sticker indicator */}
      {decree.sticker && (
        <div className="absolute top-0.5 right-0.5">
          <span className="text-xs">
            {decree.sticker.type === 'Eternal' && '🔒'}
            {decree.sticker.type === 'Perishable' && '⏳'}
            {decree.sticker.type === 'Rental' && '💰'}
          </span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] rounded-lg shadow-xl">
          <p className="text-sm font-bold text-[var(--color-beige-white)]">{decree.name}</p>
          <p className="text-xs text-[var(--color-beige-white)] opacity-70 mt-1">{decree.description}</p>
        </div>
      )}

      {/* Debuff overlay */}
      {decree.isDebuffed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <span className="text-xl">🚫</span>
        </div>
      )}
    </div>
  )
}

/**
 * DecreeSlotEmpty - Empty decree slot indicator
 */
interface DecreeSlotEmptyProps {
  isLocked?: boolean
}

function DecreeSlotEmpty({ isLocked = false }: DecreeSlotEmptyProps) {
  return (
    <div
      className={`
        flex-shrink-0 w-16 h-20
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 border-dashed
        ${isLocked ? 'border-gray-600 opacity-40' : 'border-[var(--color-metallic-gold)] opacity-60'}
        flex items-center justify-center
        min-w-[44px] min-h-[44px]
      `}
    >
      {isLocked ? (
        <span className="text-xl text-gray-500">🔒</span>
      ) : (
        <span className="text-2xl text-[var(--color-metallic-gold)]">+</span>
      )}
    </div>
  )
}

/**
 * RoundTypeIndicator - Shows current round type with Japanese name
 */
interface RoundTypeIndicatorProps {
  roundType: RoundType
  mandateName?: string
}

function RoundTypeIndicator({ roundType, mandateName }: RoundTypeIndicatorProps) {
  const config = ROUND_TYPE_CONFIG[roundType]
  const showCJK = isCJKLanguage()

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1
        ${config.bgColor} ${config.borderColor}
        border rounded-full
      `}
    >
      {showCJK && (
        <span className={`font-bold ${config.color}`}>{config.japaneseName}</span>
      )}
      <span className="text-[var(--color-beige-white)] text-sm">{roundType}</span>
      {mandateName && (
        <span className="text-xs text-red-400 font-medium">| {mandateName}</span>
      )}
    </div>
  )
}

/**
 * PointsMultDisplay - Points x Mult scoring visualization
 */
interface PointsMultDisplayProps {
  points: number
  mult: number
  isAnimating?: boolean
}

function PointsMultDisplay({ points, mult, isAnimating = false }: PointsMultDisplayProps) {
  const pointsSpring = useSpring({
    value: points,
    from: { value: 0 },
    config: { tension: 120, friction: 14 },
  })

  const multSpring = useSpring({
    value: mult,
    from: { value: 1 },
    config: { tension: 120, friction: 14 },
  })

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Points */}
      <GlowEffect variant="blue" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-900/60 rounded-lg border border-blue-500">
          <span className="text-xs text-blue-300 font-medium">POINTS</span>
          <animated.span className="text-lg font-bold text-blue-400 font-mono">
            {pointsSpring.value.to((v) => Math.floor(v).toLocaleString())}
          </animated.span>
        </div>
      </GlowEffect>

      {/* X symbol */}
      <span className="text-2xl font-bold text-[var(--color-golden-yellow)]">×</span>

      {/* Mult */}
      <GlowEffect variant="red" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 px-3 py-1 bg-red-900/60 rounded-lg border border-red-500">
          <span className="text-xs text-red-300 font-medium">MULT</span>
          <animated.span className="text-lg font-bold text-red-400 font-mono">
            {multSpring.value.to((v) => v.toFixed(2))}
          </animated.span>
        </div>
      </GlowEffect>

      {/* Equals */}
      <span className="text-2xl font-bold text-[var(--color-golden-yellow)]">=</span>

      {/* Result */}
      <GlowEffect variant="gold" intensity={isAnimating ? 1 : 0.4} pulsing={isAnimating}>
        <animated.span className="text-xl font-bold text-[var(--color-golden-yellow)] font-mono">
          {pointsSpring.value.to((p) => {
            const result = Math.floor(p * mult)
            return result.toLocaleString()
          })}
        </animated.span>
      </GlowEffect>
    </div>
  )
}

/**
 * FloraTrackCompact - Compact flower and season display using actual tile images
 */
interface FloraTrackCompactProps {
  flowers: FlowerVariant[]
  activeSeason?: SeasonVariant | null
  isCorrupted?: boolean
  onExpand?: () => void
}

function FloraTrackCompact({ flowers, activeSeason, isCorrupted, onExpand }: FloraTrackCompactProps) {
  const [showTooltip, setShowTooltip] = useState<FlowerVariant | null>(null)
  const collectedSet = new Set(flowers)
  const allFlowers: FlowerVariant[] = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']

  return (
    <div
      className="flex flex-col gap-1 p-2 bg-[var(--color-dark-forest)] rounded-lg"
      onClick={onExpand}
    >
      {/* Flowers using actual tile images */}
      <div className="flex flex-col gap-1">
        {allFlowers.map((flower) => {
          const isCollected = collectedSet.has(flower)
          const data = FLOWER_DATA[flower]
          const flowerTile = Tile.create(TileSuit.Flower, data.rank)

          return (
            <div
              key={flower}
              className="relative flex items-center gap-2"
              onMouseEnter={() => setShowTooltip(flower)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              {/* Tile image */}
              <div
                className={`
                  transition-all duration-300
                  ${!isCollected ? 'opacity-30 grayscale' : ''}
                `}
              >
                <TileImage
                  tile={flowerTile}
                  size="small"
                  disabled={!isCollected}
                  showTooltip={false}
                />
              </div>

              {/* Effect text (only show for collected flowers) */}
              {isCollected && (
                <span className="text-xs text-[var(--color-golden-yellow)] font-medium whitespace-nowrap">
                  {data.effect}
                </span>
              )}

              {/* Tooltip for uncollected */}
              {showTooltip === flower && !isCollected && (
                <div className="absolute left-full ml-2 z-50 px-2 py-1 bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] rounded text-xs text-[var(--color-beige-white)] whitespace-nowrap">
                  {flower}: {data.effect}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Set bonus indicator */}
      {flowers.length >= 2 && (
        <div className="text-xs text-green-400 text-center mt-1">
          {flowers.length >= 4 ? 'x2 All Effects!' : flowers.length >= 3 ? 'Special Decrees' : '+1 Decree Slot'}
        </div>
      )}

      {/* Active Season */}
      {activeSeason && (
        <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-[var(--color-metallic-gold)]/30">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-[var(--color-beige-white)] opacity-60">Season:</span>
            <span className="text-sm">{SEASON_DATA[activeSeason].emoji}</span>
            <span className={`text-xs font-bold ${isCorrupted ? 'text-red-400' : SEASON_DATA[activeSeason].color}`}>
              {isCorrupted ? 'Corrupted' : activeSeason}
            </span>
          </div>
          <p className={`text-[10px] text-center ${isCorrupted ? 'text-red-300' : 'text-[var(--color-beige-white)]'} opacity-70`}>
            {SEASON_BASE_EFFECTS[activeSeason].description}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * ConsumablesBar - Quick access bar for consumables
 */
interface ConsumablesBarProps {
  fateSeals: number
  celestialOrbs: number
  voidScripts: number
  onUseFateSeal?: () => void
  onUseCelestialOrb?: () => void
  onUseVoidScript?: () => void
}

function ConsumablesBar({
  fateSeals,
  celestialOrbs,
  voidScripts,
  onUseFateSeal,
  onUseCelestialOrb,
  onUseVoidScript,
}: ConsumablesBarProps) {
  const consumables = [
    { name: 'Fate Seal', japanese: '運命', count: fateSeals, emoji: '🎴', color: 'border-purple-500', onUse: onUseFateSeal },
    { name: 'Celestial Orb', japanese: '天球', count: celestialOrbs, emoji: '🔮', color: 'border-blue-500', onUse: onUseCelestialOrb },
    { name: 'Void Script', japanese: '虚空', count: voidScripts, emoji: '📜', color: 'border-gray-500', onUse: onUseVoidScript },
  ]

  return (
    <div className="flex gap-2">
      {consumables.map((item) => (
        <button
          key={item.name}
          onClick={item.onUse}
          disabled={item.count === 0}
          className={`
            flex items-center gap-1 px-2 py-1
            bg-[var(--color-dark-forest)] rounded-lg
            border ${item.color}
            ${item.count > 0 ? 'opacity-100 hover:bg-[var(--color-forest-green)]' : 'opacity-40'}
            transition-all min-w-[44px] min-h-[44px]
          `}
          title={item.name}
        >
          <span className="text-lg">{item.emoji}</span>
          <span className="text-sm text-[var(--color-beige-white)] font-mono">×{item.count}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * GameplayScreen - Main gameplay interface
 */
export function GameplayScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()

  // Get game controller
  const game = useGameController()

  // Responsive tile size
  const tileSize = useResponsiveTileSize()

  // Progressive tutorial hints
  const progressiveHints = useMemo(() => getProgressiveHints(t), [t])
  const tutorial = useProgressiveTutorial(progressiveHints)

  // Track if we've triggered initial hints and specific actions
  const hasTriggeredGameStart = useRef(false)
  const hasTriggeredFirstDraw = useRef(false)
  const hasTriggeredFirstDiscard = useRef(false)
  const hasTriggeredFirstHand = useRef(false)
  const hasTriggeredRoundComplete = useRef(false)
  const hasTriggeredBossRound = useRef(false)

  // Local UI state
  const [scorePopups, setScorePopups] = useState<ScorePopupState[]>([])
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [stagedTileIds, setStagedTileIds] = useState<string[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const popupIdCounterRef = useRef(0)

  // Start new run if not active
  useEffect(() => {
    if (!game.isRunActive && game.phase === 'menu') {
      game.startNewRun()
    }
  }, [game.isRunActive, game.phase, game.startNewRun])

  // Trigger gameStart hints when run becomes active
  useEffect(() => {
    if (game.isRunActive && !hasTriggeredGameStart.current) {
      hasTriggeredGameStart.current = true
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        tutorial.triggerHints('gameStart')
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, tutorial])

  // Reset trigger refs when starting a new run
  useEffect(() => {
    if (!game.isRunActive) {
      hasTriggeredGameStart.current = false
      hasTriggeredFirstDraw.current = false
      hasTriggeredFirstDiscard.current = false
      hasTriggeredFirstHand.current = false
      hasTriggeredRoundComplete.current = false
      hasTriggeredBossRound.current = false
    }
  }, [game.isRunActive])

  // Trigger firstDraw hints before first draw
  useEffect(() => {
    if (game.isRunActive && !hasTriggeredFirstDraw.current && game.handTiles.length > 0) {
      // Trigger after game start hints have had a chance to show
      const timer = setTimeout(() => {
        if (!hasTriggeredFirstDraw.current) {
          hasTriggeredFirstDraw.current = true
          tutorial.triggerHints('firstDraw')
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, game.handTiles.length, tutorial])

  // Trigger firstDiscard hints after first draw action
  useGameEvent('tileDrawn', useCallback(() => {
    if (!hasTriggeredFirstDiscard.current) {
      hasTriggeredFirstDiscard.current = true
      // Small delay after draw action
      setTimeout(() => {
        tutorial.triggerHints('firstDiscard')
      }, 500)
    }
  }, [tutorial]))

  // Trigger firstHandPlayed hints after playing first hand
  useGameEvent('handPlayed', useCallback(() => {
    if (!hasTriggeredFirstHand.current) {
      hasTriggeredFirstHand.current = true
      setTimeout(() => {
        tutorial.triggerHints('firstHandPlayed')
      }, 1000)
    }
  }, [tutorial]))

  // Trigger roundComplete hints after completing a round
  useGameEvent('roundEnd', useCallback(() => {
    if (!hasTriggeredRoundComplete.current) {
      hasTriggeredRoundComplete.current = true
      tutorial.triggerHints('roundComplete')
    }
  }, [tutorial]))

  // Trigger bossRound hints when entering boss round
  useEffect(() => {
    if (game.currentRound === 3 && !hasTriggeredBossRound.current) {
      hasTriggeredBossRound.current = true
      tutorial.triggerHints('bossRound')
    }
  }, [game.currentRound, tutorial])

  // Trigger flowerDrawn hints when a flower is collected
  useGameEvent('flowerCollected', useCallback(() => {
    tutorial.triggerHints('flowerDrawn')
  }, [tutorial]))

  // Navigate to shop when phase changes
  useEffect(() => {
    if (game.phase === 'shop') {
      navigateTo(ROUTES.SHOP)
    } else if (game.phase === 'gameOver') {
      navigateTo(ROUTES.GAME_OVER)
    }
  }, [game.phase, navigateTo])

  // Listen for score updates to show popups
  useGameEvent('scoreUpdate', useCallback((data) => {
    popupIdCounterRef.current += 1
    const newId = popupIdCounterRef.current
    setScorePopups((popups) => [
      ...popups,
      {
        id: newId,
        score: data.delta,
        variant: data.delta >= 1000 ? 'critical' : data.delta >= 500 ? 'bonus' : 'default',
      },
    ])
  }, []))

  // Listen for yaku scored events
  useGameEvent('yakuScored', useCallback((data) => {
    const tier = data.multiplier >= 4 ? 4 : data.multiplier >= 2 ? 3 : data.multiplier >= 1.5 ? 2 : 1
    setYakuReveals((reveals) => [
      ...reveals,
      {
        id: data.yakuId,
        japaneseName: data.yakuName,
        multiplier: data.multiplier,
        tier: tier as 1 | 2 | 3 | 4,
      },
    ])
  }, []))

  // Clear popups after animation
  const handlePopupComplete = useCallback((id: number) => {
    setScorePopups((popups) => popups.filter((p) => p.id !== id))
  }, [])

  const handleYakuComplete = useCallback((id: string) => {
    setYakuReveals((reveals) => reveals.filter((r) => r.id !== id))
  }, [])

  // Tile click handler
  const handleTileClick = useCallback((tile: Tile) => {
    game.toggleTileSelection(tile.id)
  }, [game])

  // Tile discard handler
  const handleTileDiscard = useCallback((tile: Tile) => {
    game.discard(tile.id)
  }, [game])

  // Handler for when tiles are staged in PlaySurface
  const handleTilesStaged = useCallback((tiles: Tile[]) => {
    setStagedTileIds(tiles.map(t => t.id))
  }, [])

  // Draw tile handler
  const handleDraw = useCallback(() => {
    game.draw()
  }, [game])

  // Play hand handler
  const handlePlayHand = useCallback(() => {
    let result
    let tileIds: string[] = []

    // Priority: staged tiles > selected tiles > all tiles
    if (stagedTileIds.length > 0) {
      tileIds = stagedTileIds
      console.log('[PlayHand] Using staged tiles:', tileIds)
    } else if (game.selectedTileIds.length > 0) {
      tileIds = Array.from(game.selectedTileIds)
      console.log('[PlayHand] Using selected tiles:', tileIds)
    } else {
      tileIds = game.handTiles.map(t => t.id)
      console.log('[PlayHand] Using all hand tiles:', tileIds)
    }

    if (tileIds.length === 0) {
      console.warn('[PlayHand] No tiles to play')
      return
    }

    console.log('[PlayHand] Calling game.playHand with:', tileIds.length, 'tiles')
    console.log('[PlayHand] Hand tiles available:', game.handTiles.map(t => t.id))
    console.log('[PlayHand] Hands remaining:', game.handsRemaining)

    result = game.playHand(tileIds)
    console.log('[PlayHand] Result:', result)

    if (result?.success) {
      // Clear staged/selected tiles after successful play
      if (stagedTileIds.length > 0) {
        setStagedTileIds([])
      } else if (game.selectedTileIds.length > 0) {
        game.clearSelection()
      }
    } else if (result?.errors) {
      console.warn('[PlayHand] Failed:', result.errors)
    }
  }, [game, stagedTileIds])

  // Settings navigation
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  // Exit game handler
  const handleExitGame = useCallback(() => {
    game.endRun()
    navigateTo(ROUTES.MENU)
  }, [game, navigateTo])

  // Skip round handler
  const handleSkip = useCallback(() => {
    game.skipRound()
  }, [game])

  // Calculate shanten display (simplified)
  const tilesNeeded = 14 - game.handTiles.length
  const shantenDisplay = game.handTiles.length >= 13
    ? t('gameplay.tenpai')
    : t('gameplay.shanten', { count: tilesNeeded })

  // Get owned decrees from the game state
  const ownedDecrees = useMemo(() => {
    return game.state.decreeSystem.getOwnedDecrees()
  }, [game.state.decreeSystem])

  const maxDecreeSlots = useMemo(() => {
    const baseSlots = 5
    const bonusSlots = game.state.flowerSystem.getBonusDecreeSlots()
    return baseSlots + bonusSlots
  }, [game.state.flowerSystem])

  // Get collected flower types
  const collectedFlowers = useMemo<FlowerVariant[]>(() => {
    const flowers = game.state.flowerSystem.getFlowers()
    return flowers.map((f) => f.type)
  }, [game.state.flowerSystem])

  // Get active season
  const seasonState = useMemo(() => {
    const state = game.state.seasonSystem.getState()
    return {
      activeSeason: state.activeSeason?.type as SeasonVariant | null,
      isCorrupted: state.isCorruptedRound,
    }
  }, [game.state.seasonSystem])

  // Get round type based on round number
  const roundType: RoundType = useMemo(() => {
    switch (game.currentRound) {
      case 1:
        return 'Small'
      case 2:
        return 'Large'
      case 3:
        return 'Boss'
      default:
        return 'Small'
    }
  }, [game.currentRound])

  // Get boss mandate if applicable
  const bossMandate = useMemo(() => {
    if (roundType === 'Boss') {
      const roundState = game.state.roundManager.getCurrentRound()
      return roundState?.bossMandate?.name
    }
    return undefined
  }, [roundType, game.state.roundManager])

  // Calculate points and mult for display
  const [currentPoints, setCurrentPoints] = useState(0)
  const [currentMult, setCurrentMult] = useState(1)
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)

  // Track score for points/mult display
  useGameEvent('handPlayed', useCallback((data) => {
    // Estimate points based on tile values
    const basePoints = data.score / (currentMult || 1)
    setCurrentPoints(basePoints)
    setIsScoreAnimating(true)
    setTimeout(() => setIsScoreAnimating(false), 1500)
  }, [currentMult]))

  // Update mult when yaku is scored
  useGameEvent('yakuScored', useCallback((data) => {
    setCurrentMult((prev) => prev * data.multiplier)
  }, []))

  // Reset points/mult on round start
  useGameEvent('roundStart', useCallback(() => {
    setCurrentPoints(0)
    setCurrentMult(1)
  }, []))

  // Consumables state (placeholder - would connect to actual store)
  const [consumables] = useState({
    fateSeals: 0,
    celestialOrbs: 0,
    voidScripts: 0,
  })

  // Flora panel expanded state
  const [isFloraExpanded, setIsFloraExpanded] = useState(false)

  return (
    <TablePattern
      showOrnaments={true}
      animated={false}
      patternScale={1}
      className="viewport-full"
    >
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
          {/* Gold display with glow */}
          <GlowEffect variant="gold" intensity={0.4} pulsing={false}>
            <span data-tutorial="gold" className="text-lg font-bold text-[var(--color-golden-yellow)]">
              ¥{game.gold}
            </span>
          </GlowEffect>

          {/* Act/Round with Round Type indicator */}
          <div data-tutorial="act-round" className="flex items-center gap-2">
            <span className="text-lg">
              {t('gameplay.act')} {game.currentAct}
            </span>
            <RoundTypeIndicator roundType={roundType} mandateName={bossMandate} />
          </div>

          <div className="flex items-center gap-2">
            {/* Exit button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-300"
              aria-label={t('common.exit', 'Exit')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Settings button */}
            <button
              onClick={handleSettings}
              className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={t('menu.settings')}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Decree bar - connected to actual store */}
        <div data-tutorial="decrees" className="flex gap-2 px-4 py-2 overflow-x-auto">
          {/* Render owned decrees */}
          {ownedDecrees.map((decree) => (
            <DecreeCardCompact key={decree.id} decree={decree} />
          ))}

          {/* Render empty slots */}
          {Array.from({ length: Math.max(0, maxDecreeSlots - ownedDecrees.length) }).map((_, i) => (
            <DecreeSlotEmpty key={`empty-${i}`} isLocked={i >= maxDecreeSlots - ownedDecrees.length} />
          ))}
        </div>

        {/* Consumables row (flora moved to hand area) */}
        <div className="flex items-center justify-end px-4 py-2 gap-2">
          <ConsumablesBar
            fateSeals={consumables.fateSeals}
            celestialOrbs={consumables.celestialOrbs}
            voidScripts={consumables.voidScripts}
          />
        </div>

        {/* Round target and score with Chips x Mult display */}
        <div className="flex-shrink-0 mx-4 my-2 p-4 bg-[var(--color-dark-forest)] rounded-lg text-center relative">
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-1">
            {t('gameplay.target').toUpperCase()}
          </p>
          <GlowEffect variant="gold" intensity={game.score >= game.targetScore ? 0.8 : 0.4} pulsing={game.score >= game.targetScore}>
            <p data-tutorial="score-target" className="text-3xl font-bold text-[var(--color-golden-yellow)]">
              {game.targetScore.toLocaleString()}
            </p>
          </GlowEffect>

          {/* Points x Mult display */}
          <div className="my-3">
            <PointsMultDisplay
              points={currentPoints || game.score}
              mult={currentMult}
              isAnimating={isScoreAnimating}
            />
          </div>

          <p data-tutorial="current-score" className="text-lg text-[var(--color-beige-white)]">
            {t('gameplay.score').toUpperCase()}: <span className="font-bold text-[var(--color-golden-yellow)]">{game.score.toLocaleString()}</span>
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                game.score >= game.targetScore ? 'bg-green-500' : 'bg-[var(--color-vibrant-orange)]'
              }`}
              style={{ width: `${Math.min(100, (game.score / game.targetScore) * 100)}%` }}
            />
          </div>

          {/* Score popups */}
          {scorePopups.map((popup) => (
            <ScorePopup
              key={popup.id}
              points={popup.score}
              variant={popup.variant}
              position={{ x: 50, y: 20 }}
              onComplete={() => handlePopupComplete(popup.id)}
            />
          ))}
        </div>

        {/* Play area / Meld display */}
        <div data-tutorial="yaku-display" className="flex-1 mx-4 mb-2 bg-[var(--color-dark-forest)] bg-opacity-50 rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex flex-col items-center justify-center p-4 min-h-[100px]">
          {game.selectedTileIds.length > 0 ? (
            <div className="text-center">
              <p className="text-[var(--color-beige-white)] mb-2">
                {game.selectedTileIds.length} tiles selected
              </p>
              <p className="text-[var(--color-golden-yellow)] text-sm">
                Tap "Play Hand" to score
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[var(--color-beige-white)] opacity-50 px-4">
                Tap tiles to select, or play all
              </p>
              <p className="text-[var(--color-golden-yellow)] opacity-70 text-sm mt-1">
                Press "Play Hand" to score your hand
              </p>
            </div>
          )}

          {/* Yaku reveals */}
          {yakuReveals.map((yaku) => (
            <YakuReveal
              key={yaku.id}
              japaneseName={yaku.japaneseName}
              multiplier={yaku.multiplier}
              tier={yaku.tier}
              onComplete={() => handleYakuComplete(yaku.id)}
            />
          ))}
        </div>

        {/* Play Surface with Flora panel on left */}
        <div className="flex-1 flex mx-2 mb-2 min-h-[340px] gap-2">
          {/* Flora panel on left side of hand area */}
          <div data-tutorial="flora" className="flex-shrink-0">
            <FloraTrackCompact
              flowers={collectedFlowers}
              activeSeason={seasonState.activeSeason}
              isCorrupted={seasonState.isCorrupted}
              onExpand={() => setIsFloraExpanded(!isFloraExpanded)}
            />
          </div>

          {/* Play Surface - Unified hand, staging, and discard area */}
          <div data-tutorial="hand" className="flex-1">
            <PlaySurface
              handTiles={game.handTiles}
              tileSize={tileSize}
              selectedIds={new Set(game.selectedTileIds)}
              onTileSelect={handleTileClick}
              onTileDiscard={handleTileDiscard}
              onTilesStaged={handleTilesStaged}
              disabled={false}
              shantenDisplay={shantenDisplay}
              handsRemaining={game.handsRemaining}
              discardsRemaining={game.discardsRemaining}
              t={t}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center items-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
          {/* Wall remaining indicator */}
          <span data-tutorial="wall" className="flex items-center gap-1 text-[var(--color-beige-white)] text-sm">
            <span className="text-gray-400">📦</span> {game.wallRemaining}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkip}
            disabled={game.currentRound === 3} // Can't skip boss rounds
          >
            SKIP
          </Button>
          <div data-tutorial="draw-button">
            <Button variant="secondary" size="sm" onClick={handleDraw} disabled={game.handTiles.length >= 14}>
              {t('gameplay.draw').toUpperCase()}
            </Button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePlayHand}
            disabled={game.handsRemaining <= 0}
          >
            PLAY HAND
          </Button>
        </div>
      </div>

      {/* Progressive tutorial hint overlay */}
      <ProgressiveHintOverlay
        hint={tutorial.currentHint}
        onDismiss={tutorial.dismissHint}
        onDisableHints={tutorial.disableHints}
        queueCount={tutorial.hintQueue.length}
      />

      {/* Exit confirmation popup */}
      <ConfirmPopup
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitGame}
        title={t('gameplay.exitGame', 'Exit Game')}
        message={t('gameplay.exitConfirm', 'Are you sure you want to exit? Your current run progress will be lost.')}
        confirmText={t('common.exit', 'Exit')}
        cancelText={t('common.cancel', 'Cancel')}
      />
    </TablePattern>
  )
}
