/**
 * GameplayScreen Component
 *
 * Main gameplay screen that connects to the GameOrchestrator via useGameController.
 * This is the interactive gameplay interface for Tensho Mahjong Roguelike.
 */

import { useEffect, useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game'
import { useResponsiveTileSize } from '../../hooks/useResponsiveTileSize'
import { Button } from '../ui/Button'
import { TablePattern } from '../ui/TablePattern'
import { HandWithDiscardZone } from '../hand/AnimatedHand'
import { PlaySurface } from '../gameplay/PlaySurface'
import { ScorePopup } from '../effects/ScorePopup'
import { YakuReveal } from '../effects/YakuReveal'
import { GameTutorial, useGameTutorial } from '../ui/GameTutorial'
import { getGameplayTutorialSteps } from '../../config/gameplayTutorialSteps'
import { Tile } from '../../core/Tile'
import { DecreeRarity, OwnedDecree } from '../../systems/types'
import { FlowerVariant, SeasonVariant } from '../../systems/types'
import { GlowEffect } from '../effects/GlowEffect'

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
 * Flower display data
 */
const FLOWER_DATA: Record<FlowerVariant, { emoji: string; color: string }> = {
  Plum: { emoji: '🌸', color: 'from-pink-400 to-pink-600' },
  Orchid: { emoji: '🌺', color: 'from-purple-400 to-purple-600' },
  Chrysanthemum: { emoji: '🌼', color: 'from-yellow-400 to-yellow-600' },
  Bamboo: { emoji: '🎋', color: 'from-green-400 to-green-600' },
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
      {/* Icon based on category */}
      <div className="flex items-center justify-center h-full">
        <span className="text-2xl">
          {decree.category === 'Structural' && '🏛️'}
          {decree.category === 'TileIdentity' && '🎭'}
          {decree.category === 'YakuDoctrine' && '📖'}
          {decree.category === 'Entropy' && '🎲'}
          {decree.category === 'Scaling' && '📈'}
        </span>
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

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1
        ${config.bgColor} ${config.borderColor}
        border rounded-full
      `}
    >
      <span className={`font-bold ${config.color}`}>{config.japaneseName}</span>
      <span className="text-[var(--color-beige-white)] text-sm">{roundType}</span>
      {mandateName && (
        <span className="text-xs text-red-400 font-medium">| {mandateName}</span>
      )}
    </div>
  )
}

/**
 * ChipsMultDisplay - Balatro-style Chips x Mult scoring visualization
 */
interface ChipsMultDisplayProps {
  chips: number
  mult: number
  isAnimating?: boolean
}

function ChipsMultDisplay({ chips, mult, isAnimating = false }: ChipsMultDisplayProps) {
  const chipsSpring = useSpring({
    value: chips,
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
      {/* Chips */}
      <GlowEffect variant="blue" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-900/60 rounded-lg border border-blue-500">
          <span className="text-xs text-blue-300 font-medium">CHIPS</span>
          <animated.span className="text-lg font-bold text-blue-400 font-mono">
            {chipsSpring.value.to((v) => Math.floor(v).toLocaleString())}
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
          {chipsSpring.value.to((c) => {
            const result = Math.floor(c * mult)
            return result.toLocaleString()
          })}
        </animated.span>
      </GlowEffect>
    </div>
  )
}

/**
 * FloraTrackCompact - Compact flower and season display
 */
interface FloraTrackCompactProps {
  flowers: FlowerVariant[]
  activeSeason?: SeasonVariant | null
  isCorrupted?: boolean
  onExpand?: () => void
}

function FloraTrackCompact({ flowers, activeSeason, isCorrupted, onExpand }: FloraTrackCompactProps) {
  const collectedSet = new Set(flowers)
  const allFlowers: FlowerVariant[] = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-[var(--color-dark-forest)] rounded-lg cursor-pointer hover:bg-[var(--color-forest-green)] transition-colors"
      onClick={onExpand}
    >
      {/* Flowers */}
      <div className="flex items-center gap-1">
        {allFlowers.map((flower) => {
          const isCollected = collectedSet.has(flower)
          const data = FLOWER_DATA[flower]
          return (
            <div
              key={flower}
              className={`
                w-8 h-8 flex items-center justify-center rounded-full
                ${isCollected ? `bg-gradient-to-b ${data.color}` : 'bg-gray-800/50 opacity-40'}
                transition-all duration-300
                min-w-[32px] min-h-[32px]
              `}
              title={flower}
            >
              <span className="text-base">{isCollected ? data.emoji : '?'}</span>
            </div>
          )
        })}
        <span className="text-sm text-[var(--color-golden-yellow)] font-bold ml-1">
          {flowers.length}/4
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--color-metallic-gold)] opacity-30" />

      {/* Active Season */}
      <div className="flex items-center gap-1">
        {activeSeason ? (
          <>
            <span className="text-lg">{SEASON_DATA[activeSeason].emoji}</span>
            <span className={`text-sm font-bold ${isCorrupted ? 'text-red-400' : SEASON_DATA[activeSeason].color}`}>
              {isCorrupted ? '腐' : SEASON_DATA[activeSeason].japanese}
            </span>
          </>
        ) : (
          <span className="text-sm text-[var(--color-beige-white)] opacity-50">No Season</span>
        )}
      </div>

      {/* Expand indicator */}
      <span className="text-[var(--color-beige-white)] opacity-50 text-xs">▼</span>
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

  // Tutorial steps and state
  const tutorialSteps = getGameplayTutorialSteps(t)
  const tutorial = useGameTutorial(tutorialSteps)

  // Local UI state
  const [scorePopups, setScorePopups] = useState<ScorePopupState[]>([])
  const [yakuReveals, setYakuReveals] = useState<YakuRevealState[]>([])
  const [popupIdCounter, setPopupIdCounter] = useState(0)

  // Start new run if not active
  useEffect(() => {
    if (!game.isRunActive && game.phase === 'menu') {
      game.startNewRun()
    }
  }, [game.isRunActive, game.phase, game.startNewRun])

  // Start tutorial for first-time players
  useEffect(() => {
    if (game.isRunActive && !tutorial.hasCompleted && !tutorial.isActive) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        tutorial.start()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [game.isRunActive, tutorial.hasCompleted, tutorial.isActive, tutorial.start])

  // Complete tutorial step when user draws a tile
  useGameEvent('tileDrawn', useCallback(() => {
    tutorial.completeCurrentStep()
  }, [tutorial]))

  // Complete tutorial step when user discards a tile
  useGameEvent('tileDiscarded', useCallback(() => {
    tutorial.completeCurrentStep()
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
    setPopupIdCounter((prev) => {
      const newId = prev + 1
      setScorePopups((popups) => [
        ...popups,
        {
          id: newId,
          score: data.delta,
          variant: data.delta >= 1000 ? 'critical' : data.delta >= 500 ? 'bonus' : 'default',
        },
      ])
      return newId
    })
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

  // Draw tile handler
  const handleDraw = useCallback(() => {
    game.draw()
  }, [game])

  // Play hand handler
  const handlePlayHand = useCallback(() => {
    if (game.selectedTileIds.length > 0) {
      game.playHand()
    } else {
      // Select all and play
      game.selectAllTiles()
      game.playHand()
    }
  }, [game])

  // Settings navigation
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

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

  // Calculate chips and mult for display
  const [currentChips, setCurrentChips] = useState(0)
  const [currentMult, setCurrentMult] = useState(1)
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)

  // Track score for chips/mult display
  useGameEvent('handPlayed', useCallback((data) => {
    // Estimate chips based on tile values
    const baseChips = data.score / (currentMult || 1)
    setCurrentChips(baseChips)
    setIsScoreAnimating(true)
    setTimeout(() => setIsScoreAnimating(false), 1500)
  }, [currentMult]))

  // Update mult when yaku is scored
  useGameEvent('yakuScored', useCallback((data) => {
    setCurrentMult((prev) => prev * data.multiplier)
  }, []))

  // Reset chips/mult on round start
  useGameEvent('roundStart', useCallback(() => {
    setCurrentChips(0)
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

        {/* Flora track and consumables row */}
        <div className="flex items-center justify-between px-4 py-2 gap-2">
          <FloraTrackCompact
            flowers={collectedFlowers}
            activeSeason={seasonState.activeSeason}
            isCorrupted={seasonState.isCorrupted}
            onExpand={() => setIsFloraExpanded(!isFloraExpanded)}
          />
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

          {/* Chips x Mult display */}
          <div className="my-3">
            <ChipsMultDisplay
              chips={currentChips || game.score}
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
            <p className="text-[var(--color-beige-white)] opacity-50 text-center px-4">
              Select tiles to play
            </p>
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

        {/* Play Surface - Unified hand, staging, and discard area */}
        <div data-tutorial="hand" className="flex-1 mx-2 mb-2 min-h-[340px]">
          <PlaySurface
            handTiles={game.handTiles}
            tileSize={tileSize}
            selectedIds={new Set(game.selectedTileIds)}
            onTileSelect={handleTileClick}
            onTileDiscard={handleTileDiscard}
            disabled={false}
            shantenDisplay={shantenDisplay}
            handsRemaining={game.handsRemaining}
            discardsRemaining={game.discardsRemaining}
            t={t}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
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

      {/* In-game tutorial overlay */}
      <GameTutorial
        isActive={tutorial.isActive}
        currentStep={tutorial.currentStep}
        steps={tutorialSteps}
        onStepComplete={tutorial.nextStep}
        onSkip={tutorial.skip}
        onComplete={tutorial.complete}
      />
    </TablePattern>
  )
}
