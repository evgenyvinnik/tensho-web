/**
 * TutorialScreen Component
 *
 * Full-page tutorial/codex experience with:
 * - Category sidebar (desktop) / tabs (mobile)
 * - Step-by-step content with animations
 * - Progress tracking
 * - Tile examples and visual aids
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { useSettingsStore } from '../../stores/settingsStore'
import { getTileImagePath } from '../../utils/assets'
import { TileSuit } from '../../core/Tile'
import { Button } from '../ui/Button'

const AnimatedDiv = animated('div')

/**
 * Tutorial step configuration
 * Defines the content and metadata for a single tutorial step
 */
export interface TutorialStep {
  /** Unique identifier for the step */
  id: string
  /** Display title shown in the header */
  title: string
  /** React content to render in the main area */
  content: React.ReactNode
  /** Optional image URL to display */
  image?: string
  /** Optional array of tiles to display as examples */
  showTiles?: Array<{ suit: TileSuit; rank: number }>
  /** Category grouping for navigation sidebar */
  category?: string
}

/**
 * Category visual configuration
 * Maps category names to their display icons and Tailwind color classes
 */
interface CategoryConfig {
  /** Unique identifier for the category */
  id: string
  /** Emoji or icon character to display */
  icon: string
  /** Tailwind CSS color class for the icon */
  color: string
  /** Human-readable category label */
  label: string
}

/**
 * Predefined category configurations for tutorial sections
 * Each category has an icon and color theme for visual distinction
 */

const CATEGORY_CONFIG: Record<string, Omit<CategoryConfig, 'id' | 'label'>> = {
  Introduction: { icon: '🏯', color: 'text-amber-400' },
  Tiles: { icon: '🀄', color: 'text-blue-400' },
  'Hand Building': { icon: '🤲', color: 'text-green-400' },
  'How to Play': { icon: '🎮', color: 'text-purple-400' },
  Scoring: { icon: '📊', color: 'text-yellow-400' },
  Progression: { icon: '📈', color: 'text-orange-400' },
  Decrees: { icon: '📜', color: 'text-indigo-400' },
  Flora: { icon: '🌸', color: 'text-pink-400' },
  Economy: { icon: '💰', color: 'text-emerald-400' },
  Strategy: { icon: '🧠', color: 'text-cyan-400' },
  'Ready!': { icon: '🎯', color: 'text-red-400' },
}

/**
 * Highlight - Inline text styling component for emphasis
 * Used to draw attention to key terms and values in tutorial content
 *
 * @param children - Text content to highlight
 * @param color - Color theme: 'golden' (default), 'orange', or 'green'
 */
function Highlight({ children, color = 'golden' }: { children: React.ReactNode; color?: 'golden' | 'orange' | 'green' }) {
  const colors = {
    golden: 'text-[var(--color-golden-yellow)]',
    orange: 'text-[var(--color-vibrant-orange)]',
    green: 'text-green-400',
  }
  return <span className={`font-bold ${colors[color]}`}>{children}</span>
}

/**
 * InfoBox - Callout box for tips, information, and warnings
 * Displays content with an icon and colored border based on type
 *
 * @param children - Content to display inside the box
 * @param type - Box variant: 'info' (blue), 'tip' (green), or 'warning' (orange)
 */
function InfoBox({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'tip' | 'warning' }) {
  const styles = {
    info: 'bg-blue-900/30 border-blue-400/50',
    tip: 'bg-green-900/30 border-green-400/50',
    warning: 'bg-orange-900/30 border-orange-400/50',
  }
  const icons = { info: 'ℹ️', tip: '💡', warning: '⚠️' }
  return (
    <div className={`p-3 rounded-lg border ${styles[type]} mt-2`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  )
}

/**
 * Formula - Styled container for displaying mathematical formulas
 * Renders content in a monospace font with a gold border
 *
 * @param children - Formula content to display
 */
function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono bg-[var(--color-forest-green)] p-3 rounded text-center text-lg border border-[var(--color-metallic-gold)]">
      {children}
    </div>
  )
}

/**
 * DataTable - Renders a styled HTML table for data presentation
 * Used to display structured information like tile counts, scoring values, etc.
 *
 * @param headers - Array of column header strings
 * @param rows - 2D array of cell contents (strings or React nodes)
 */
function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | React.ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm mt-2 border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-[var(--color-metallic-gold)]/30 p-2 bg-[var(--color-forest-green)] text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-[var(--color-metallic-gold)]/30 p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * TileDisplay - Animated display of mahjong tile examples
 * Shows tiles with a slide-up animation, respects reduced motion settings
 *
 * @param tiles - Array of tile definitions with suit and rank
 */
function TileDisplay({ tiles }: { tiles: Array<{ suit: TileSuit; rank: number }> }) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const spring = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: { tension: 200, friction: 20 },
    delay: 200,
    immediate: reducedMotion,
  })

  return (
    <AnimatedDiv
      className="flex justify-center gap-2 py-4 flex-wrap"
      style={{
        opacity: spring.opacity,
        transform: spring.y.to((y) => `translateY(${y}px)`),
      }}
    >
      {tiles.map((tile, index) => (
        <img
          key={index}
          src={getTileImagePath(tile.suit, tile.rank)}
          alt=""
          className="w-12 h-16 md:w-14 md:h-20 object-contain drop-shadow-lg hover:scale-110 transition-transform"
          draggable={false}
        />
      ))}
    </AnimatedDiv>
  )
}

/**
 * ProgressBar - Visual progress indicator for tutorial completion
 * Shows current step position and overall percentage complete
 *
 * @param current - Current step index (0-based)
 * @param total - Total number of steps
 * @param categoryProgress - Optional category-specific progress text
 */
function ProgressBar({ current, total, categoryProgress }: { current: number; total: number; categoryProgress?: string }) {
  const percentage = ((current + 1) / total) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[var(--color-metallic-gold)] mb-1">
        <span>{categoryProgress || `Step ${current + 1} of ${total}`}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <div className="w-full h-2 bg-[var(--color-dark-forest)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * CategoryItem - Sidebar navigation item for a tutorial category
 * Shows category icon, name, step count, and completion status
 *
 * @param category - Category name to display
 * @param isActive - Whether this category is currently selected
 * @param stepCount - Total number of steps in this category
 * @param completedCount - Number of steps the user has visited
 * @param onClick - Handler called when the item is clicked
 */
function CategoryItem({
  category,
  isActive,
  stepCount,
  completedCount,
  onClick,
}: {
  category: string
  isActive: boolean
  stepCount: number
  completedCount: number
  onClick: () => void
}) {
  const config = CATEGORY_CONFIG[category] || { icon: '📖', color: 'text-gray-400' }
  const isComplete = completedCount >= stepCount

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left
        ${isActive
          ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)]'
          : 'bg-[var(--color-dark-forest)] hover:bg-[var(--color-forest-green)] text-[var(--color-beige-white)]'
        }`}
    >
      <span className={`text-xl ${!isActive ? config.color : ''}`}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{category}</p>
        <p className="text-xs opacity-70">
          {completedCount}/{stepCount} steps
        </p>
      </div>
      {isComplete && <span className="text-green-400">✓</span>}
    </button>
  )
}

/**
 * CategoryTabs - Horizontal scrollable category navigation for mobile
 * Displays all categories as compact pill buttons
 *
 * @param categories - Array of category names
 * @param currentCategory - Currently active category name
 * @param onCategoryClick - Handler called when a category is selected
 */
function CategoryTabs({
  categories,
  currentCategory,
  onCategoryClick,
}: {
  categories: string[]
  currentCategory: string
  onCategoryClick: (category: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const config = CATEGORY_CONFIG[cat] || { icon: '📖', color: 'text-gray-400' }
        const isActive = cat === currentCategory

        return (
          <button
            key={cat}
            onClick={() => onCategoryClick(cat)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
              ${isActive
                ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)]'
                : 'bg-[var(--color-dark-forest)] text-[var(--color-beige-white)] hover:bg-[var(--color-forest-green)]'
              }`}
          >
            <span className={!isActive ? config.color : ''}>{config.icon}</span>
            <span className="whitespace-nowrap">{cat}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * StepContent - Animated container for tutorial step content
 * Renders the step's text content, optional tiles, and images with slide-in animation
 *
 * @param step - The tutorial step data to render
 */
function StepContent({ step }: { step: TutorialStep }) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const spring = useSpring({
    from: { opacity: 0, x: 20 },
    to: { opacity: 1, x: 0 },
    config: { tension: 200, friction: 20 },
    reset: true,
    immediate: reducedMotion,
  })

  return (
    <AnimatedDiv
      className="space-y-4"
      style={{
        opacity: spring.opacity,
        transform: spring.x.to((x) => `translateX(${x}px)`),
      }}
    >
      <div className="text-base leading-relaxed">{step.content}</div>

      {step.showTiles && step.showTiles.length > 0 && <TileDisplay tiles={step.showTiles} />}

      {step.image && (
        <div className="flex justify-center py-4">
          <img src={step.image} alt="" className="max-w-full max-h-48 object-contain rounded-lg" draggable={false} />
        </div>
      )}
    </AnimatedDiv>
  )
}

/**
 * useTutorialSteps - Hook that generates all tutorial step content
 *
 * Creates a memoized array of 40+ tutorial steps organized into 11 categories,
 * covering everything from basic tile knowledge to advanced strategy.
 * Content is internationalized using react-i18next.
 *
 * @returns Array of TutorialStep objects with localized content
 */
function useTutorialSteps(): TutorialStep[] {
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        id: 'welcome',
        category: 'Introduction',
        title: t('tutorial.welcome.title', 'Welcome to Tensho!'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Tensho (天翔)</Highlight> means "Heavenly Ascent" in Japanese. This is a{' '}
              <Highlight color="orange">roguelike game</Highlight> built around the classic tile game of{' '}
              <Highlight>Riichi Mahjong</Highlight>.
            </p>
            <p>
              Your goal is simple: <Highlight color="orange">build scoring hands</Highlight> and reach the target score
              each round. Fail to reach the target, and your run ends.
            </p>
            <InfoBox type="tip">
              Don't worry if you've never played Mahjong before! This tutorial will teach you everything you need to
              know, step by step.
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'game-concept',
        category: 'Introduction',
        title: t('tutorial.concept.title', 'The Core Concept'),
        content: (
          <div className="space-y-3">
            <p>
              Unlike traditional Mahjong which is played against opponents, Tensho is a{' '}
              <Highlight>single-player puzzle game</Highlight>. You're racing against the score target, not other
              players.
            </p>
            <p>
              Each run consists of multiple <Highlight color="orange">Acts</Highlight>, and each Act has{' '}
              <Highlight>3 Rounds</Highlight>. The score targets increase as you progress.
            </p>
            <p>
              Between rounds, you'll visit the <Highlight>Tea House</Highlight> (shop) to acquire powerful{' '}
              <Highlight color="orange">Decrees</Highlight> that modify the rules and boost your scoring potential.
            </p>
          </div>
        ),
      },
      {
        id: 'tiles-overview',
        category: 'Tiles',
        title: t('tutorial.tilesOverview.title', 'Understanding Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              The game uses <Highlight>144 tiles</Highlight> in total:
            </p>
            <DataTable
              headers={['Category', 'Types', 'Count']}
              rows={[
                ['Numbered Suits', '3 suits × 9 ranks × 4 copies', '108'],
                ['Wind Tiles', '4 winds × 4 copies', '16'],
                ['Dragon Tiles', '3 dragons × 4 copies', '12'],
                ['Bonus Tiles', '4 flowers + 4 seasons', '8'],
              ]}
            />
            <InfoBox type="info">
              Each standard tile appears <Highlight>4 times</Highlight> in the game. This is important for planning
              your hand!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'numbered-suits',
        category: 'Tiles',
        title: t('tutorial.suits.title', 'The Three Numbered Suits'),
        content: (
          <div className="space-y-3">
            <p>
              There are <Highlight>three numbered suits</Highlight>, each with tiles ranked 1-9:
            </p>
            <div className="space-y-2">
              <p>
                <Highlight color="orange">Characters (萬子 / Manzu)</Highlight> — Feature Chinese numerals with the
                character 萬 (wan, meaning "ten thousand")
              </p>
              <p>
                <Highlight color="orange">Circles (筒子 / Pinzu)</Highlight> — Show circular patterns representing coins
                or dots
              </p>
              <p>
                <Highlight color="orange">Bamboo (索子 / Souzu)</Highlight> — Depict bamboo sticks (the 1 of Bamboo
                shows a bird instead)
              </p>
            </div>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Manzu, rank: 1 },
          { suit: TileSuit.Manzu, rank: 5 },
          { suit: TileSuit.Manzu, rank: 9 },
          { suit: TileSuit.Pinzu, rank: 1 },
          { suit: TileSuit.Pinzu, rank: 5 },
          { suit: TileSuit.Pinzu, rank: 9 },
          { suit: TileSuit.Souzu, rank: 1 },
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 9 },
        ],
      },
      {
        id: 'terminals-simples',
        category: 'Tiles',
        title: t('tutorial.terminals.title', 'Terminals vs Simples'),
        content: (
          <div className="space-y-3">
            <p>Numbered tiles are divided into two important categories:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-[var(--color-golden-yellow)]">
                <p className="font-bold text-[var(--color-golden-yellow)] mb-2">Terminals (端牌)</p>
                <p className="text-sm">
                  Tiles ranked <Highlight>1 or 9</Highlight>
                </p>
                <p className="text-sm mt-1">
                  Worth <Highlight color="orange">10 points</Highlight> each
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-[var(--color-metallic-gold)]">
                <p className="font-bold text-[var(--color-metallic-gold)] mb-2">Simples (中張牌)</p>
                <p className="text-sm">
                  Tiles ranked <Highlight>2 through 8</Highlight>
                </p>
                <p className="text-sm mt-1">
                  Worth <Highlight color="orange">5 points</Highlight> each
                </p>
              </div>
            </div>
            <InfoBox type="tip">
              Terminals are worth double the points of simples! Many yaku also specifically require or exclude
              terminals.
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Pinzu, rank: 1 },
          { suit: TileSuit.Pinzu, rank: 9 },
          { suit: TileSuit.Souzu, rank: 2 },
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 8 },
        ],
      },
      {
        id: 'wind-tiles',
        category: 'Tiles',
        title: t('tutorial.winds.title', 'Wind Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              There are <Highlight>four Wind tiles</Highlight>, representing the cardinal directions:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <Highlight color="orange">東 (East)</Highlight> — The most prestigious wind
              </div>
              <div>
                <Highlight color="orange">南 (South)</Highlight> — Second in order
              </div>
              <div>
                <Highlight color="orange">西 (West)</Highlight> — Third in order
              </div>
              <div>
                <Highlight color="orange">北 (North)</Highlight> — Fourth in order
              </div>
            </div>
            <p>
              Wind tiles are <Highlight>Honor tiles</Highlight> and are worth{' '}
              <Highlight color="orange">15 points</Highlight> each — the highest base value!
            </p>
            <InfoBox type="info">Winds cannot form sequences. They can only form triplets or pairs.</InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Wind, rank: 1 },
          { suit: TileSuit.Wind, rank: 2 },
          { suit: TileSuit.Wind, rank: 3 },
          { suit: TileSuit.Wind, rank: 4 },
        ],
      },
      {
        id: 'dragon-tiles',
        category: 'Tiles',
        title: t('tutorial.dragons.title', 'Dragon Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              There are <Highlight>three Dragon tiles</Highlight>:
            </p>
            <div className="space-y-2">
              <p>
                <Highlight color="orange">白 (White Dragon / Haku)</Highlight> — A blank or framed tile, representing
                purity or emptiness
              </p>
              <p>
                <Highlight color="green">發 (Green Dragon / Hatsu)</Highlight> — The character 發 in green, meaning
                "prosperity" or "to emit"
              </p>
              <p>
                <Highlight color="orange">中 (Red Dragon / Chun)</Highlight> — The character 中 in red, meaning "center"
                or "middle"
              </p>
            </div>
            <p>
              Like Winds, Dragons are <Highlight>Honor tiles</Highlight> worth{' '}
              <Highlight color="orange">15 points</Highlight> and cannot form sequences.
            </p>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'bonus-tiles',
        category: 'Tiles',
        title: t('tutorial.bonus.title', 'Bonus Tiles: Flowers & Seasons'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Bonus tiles</Highlight> are special tiles that don't form part of your hand:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg">
                <p className="font-bold text-pink-400 mb-2">🌸 Flowers</p>
                <p className="text-sm">Plum, Orchid, Chrysanthemum, Bamboo</p>
                <p className="text-xs text-[var(--color-metallic-gold)] mt-1">Persist across your entire run</p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg">
                <p className="font-bold text-cyan-400 mb-2">🍂 Seasons</p>
                <p className="text-sm">Spring, Summer, Autumn, Winter</p>
                <p className="text-xs text-[var(--color-metallic-gold)] mt-1">Active only for the current round</p>
              </div>
            </div>
            <InfoBox type="info">
              When you draw a bonus tile, it's immediately revealed and you draw a replacement tile. Flowers and
              Seasons provide scaling bonuses and effects!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'melds-overview',
        category: 'Hand Building',
        title: t('tutorial.meldsOverview.title', 'What is a Meld?'),
        content: (
          <div className="space-y-3">
            <p>
              A <Highlight>meld</Highlight> (also called a "group" or "set") is a specific combination of tiles:
            </p>
            <DataTable
              headers={['Meld Type', 'Description', 'Points']}
              rows={[
                [<Highlight color="orange">Sequence</Highlight>, '3 consecutive tiles of same suit', '+20'],
                [<Highlight color="orange">Triplet</Highlight>, '3 identical tiles', '+30'],
                [<Highlight color="orange">Quad</Highlight>, '4 identical tiles', '+50'],
                [<Highlight color="orange">Pair</Highlight>, '2 identical tiles', '+10'],
              ]}
            />
            <p>
              Understanding melds is <Highlight>essential</Highlight> — your winning hand is made up of these building
              blocks!
            </p>
          </div>
        ),
      },
      {
        id: 'sequences',
        category: 'Hand Building',
        title: t('tutorial.sequences.title', 'Sequences (順子 / Shuntsu)'),
        content: (
          <div className="space-y-3">
            <p>
              A <Highlight>sequence</Highlight> is <Highlight color="orange">3 consecutive tiles of the same suit</Highlight>.
            </p>
            <p>Examples of valid sequences:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>1-2-3 of Circles</li>
              <li>4-5-6 of Characters</li>
              <li>7-8-9 of Bamboo</li>
            </ul>
            <InfoBox type="warning">
              <strong>Important rules:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>
                  Sequences must be in the <Highlight>same suit</Highlight>
                </li>
                <li>
                  They <Highlight color="orange">cannot wrap around</Highlight> (no 9-1-2)
                </li>
                <li>
                  Honor tiles <Highlight color="orange">cannot form sequences</Highlight>
                </li>
              </ul>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Pinzu, rank: 2 },
          { suit: TileSuit.Pinzu, rank: 3 },
          { suit: TileSuit.Pinzu, rank: 4 },
        ],
      },
      {
        id: 'triplets',
        category: 'Hand Building',
        title: t('tutorial.triplets.title', 'Triplets (刻子 / Koutsu)'),
        content: (
          <div className="space-y-3">
            <p>
              A <Highlight>triplet</Highlight> is <Highlight color="orange">3 identical tiles</Highlight>.
            </p>
            <p>Examples of valid triplets:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Three 5s of Bamboo</li>
              <li>Three East Winds</li>
              <li>Three Red Dragons</li>
            </ul>
            <InfoBox type="tip">
              Triplets are worth <Highlight>+30 points</Highlight> — more than sequences (+20)! However, they're harder
              to complete since you need 3 of the same tile, and each tile only appears 4 times in the game.
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 5 },
        ],
      },
      {
        id: 'quads',
        category: 'Hand Building',
        title: t('tutorial.quads.title', 'Quads (槓子 / Kantsu)'),
        content: (
          <div className="space-y-3">
            <p>
              A <Highlight>quad</Highlight> (also called "kong" or "kan") is{' '}
              <Highlight color="orange">4 identical tiles</Highlight>.
            </p>
            <p>Quads are the rarest meld type since you need all 4 copies of a tile!</p>
            <InfoBox type="info">
              <strong>Quad mechanics:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>
                  Worth <Highlight>+50 points</Highlight> — the most of any meld
                </li>
                <li>Counts as a single meld despite having 4 tiles</li>
                <li>When declared, you draw a replacement tile</li>
              </ul>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Manzu, rank: 7 },
          { suit: TileSuit.Manzu, rank: 7 },
          { suit: TileSuit.Manzu, rank: 7 },
          { suit: TileSuit.Manzu, rank: 7 },
        ],
      },
      {
        id: 'pairs',
        category: 'Hand Building',
        title: t('tutorial.pairs.title', 'Pairs (雀頭 / Jantou)'),
        content: (
          <div className="space-y-3">
            <p>
              A <Highlight>pair</Highlight> is simply <Highlight color="orange">2 identical tiles</Highlight>.
            </p>
            <p>
              Every standard winning hand requires <Highlight>exactly one pair</Highlight>. This is sometimes called
              the "head" (雀頭) of the hand.
            </p>
            <InfoBox type="tip">
              The pair is worth <Highlight>+10 points</Highlight>. Any tile can form a pair — numbered tiles, winds, or
              dragons.
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 3 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'winning-hand',
        category: 'Hand Building',
        title: t('tutorial.winningHand.title', 'The Winning Hand Structure'),
        content: (
          <div className="space-y-3">
            <p>A standard winning hand consists of:</p>
            <Formula>
              <Highlight>4 Melds</Highlight> + <Highlight color="orange">1 Pair</Highlight> ={' '}
              <Highlight color="green">14 Tiles</Highlight>
            </Formula>
            <p className="mt-3">
              The 4 melds can be any combination of sequences, triplets, or quads. Here's an example:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>1-2-3 Circles (sequence)</li>
              <li>5-5-5 Bamboo (triplet)</li>
              <li>6-7-8 Characters (sequence)</li>
              <li>East-East-East (triplet)</li>
              <li>Red Dragon pair</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'special-hands',
        category: 'Hand Building',
        title: t('tutorial.specialHands.title', 'Special Winning Forms'),
        content: (
          <div className="space-y-3">
            <p>Two special hand structures don't follow the 4 melds + 1 pair rule:</p>
            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-purple-400/50">
                <p className="font-bold text-purple-400">Seven Pairs (七対子 / Chiitoitsu)</p>
                <p className="text-sm mt-1">
                  Exactly <Highlight>7 different pairs</Highlight>. No melds, just pairs!
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-red-400/50">
                <p className="font-bold text-red-400">Thirteen Orphans (国士無双 / Kokushi)</p>
                <p className="text-sm mt-1">
                  One of each terminal and honor (13 unique tiles) plus one duplicate. A legendary{' '}
                  <Highlight color="orange">Yakuman</Highlight>!
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'gameplay-overview',
        category: 'How to Play',
        title: t('tutorial.gameplayOverview.title', 'How a Round Works'),
        content: (
          <div className="space-y-3">
            <p>Each round follows a simple cycle:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <Highlight>Start</Highlight> with 13 tiles in your hand
              </li>
              <li>
                <Highlight color="orange">Draw</Highlight> a tile from the wall
              </li>
              <li>
                Check if you can <Highlight color="green">win</Highlight> (valid hand + score target)
              </li>
              <li>
                If not, <Highlight>discard</Highlight> one tile you don't need
              </li>
              <li>Repeat until you win or the wall is empty</li>
            </ol>
            <InfoBox type="warning">
              If the wall empties before you complete a winning hand, the round ends in{' '}
              <Highlight color="orange">failure</Highlight> and your run is over!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'drawing',
        category: 'How to Play',
        title: t('tutorial.drawing.title', 'Drawing Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              At the start of your turn, you <Highlight>draw one tile</Highlight> from the wall. This gives you 14
              tiles temporarily.
            </p>
            <p>
              The <Highlight color="orange">wall</Highlight> starts with 70 drawable tiles (after the dead wall is
              reserved). Watch the remaining tiles counter!
            </p>
            <InfoBox type="tip">
              When you draw a <Highlight>bonus tile</Highlight> (Flower or Season), it's automatically revealed and you
              draw a replacement. This doesn't cost a turn!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'discarding',
        category: 'How to Play',
        title: t('tutorial.discarding.title', 'Discarding Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              After drawing (if you haven't won), you must <Highlight>discard one tile</Highlight> to return to 13
              tiles.
            </p>
            <p>
              <Highlight color="orange">How to discard:</Highlight>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Tap/click</strong> a tile to select it
              </li>
              <li>
                <strong>Drag upward</strong> to the discard zone
              </li>
              <li>
                Discarded tiles go to the <Highlight>Dead Pool</Highlight>
              </li>
            </ul>
            <InfoBox type="warning">
              Discarded tiles are <Highlight color="orange">gone forever</Highlight> — you cannot retrieve them! Choose
              carefully which tiles to discard.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'shanten',
        category: 'How to Play',
        title: t('tutorial.shanten.title', 'Understanding Shanten'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Shanten (向聴)</Highlight> is the number of tiles you need to change to complete a winning
              hand.
            </p>
            <DataTable
              headers={['Shanten', 'Meaning']}
              rows={[
                [<Highlight color="orange">3-shanten</Highlight>, 'Need 3 more useful tiles'],
                [<Highlight color="orange">2-shanten</Highlight>, 'Getting closer!'],
                [<Highlight color="orange">1-shanten</Highlight>, 'Almost there!'],
                [<Highlight color="green">Tenpai (0)</Highlight>, 'Ready to win! Just need the right tile'],
              ]}
            />
            <InfoBox type="tip">
              The game shows your current shanten. Lower is better! Aim to reduce your shanten quickly each turn.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'scoring-overview',
        category: 'Scoring',
        title: t('tutorial.scoringOverview.title', 'How Scoring Works'),
        content: (
          <div className="space-y-3">
            <p>Your score is calculated using this formula:</p>
            <Formula>Score = (Base Points + Bonuses) × Multipliers</Formula>
            <p className="mt-3">There are three components:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <Highlight>Base Points</Highlight> — From your tiles themselves
              </li>
              <li>
                <Highlight color="orange">Structure Points</Highlight> — From your melds and pair
              </li>
              <li>
                <Highlight color="green">Multipliers</Highlight> — From Yaku, Decrees, and effects
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: 'base-points',
        category: 'Scoring',
        title: t('tutorial.basePoints.title', 'Base Points from Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              Every tile in your winning hand contributes <Highlight>base points</Highlight>:
            </p>
            <DataTable
              headers={['Tile Type', 'Points Each']}
              rows={[
                ['Terminals (1, 9)', <Highlight color="orange">10 points</Highlight>],
                ['Simples (2-8)', <Highlight>5 points</Highlight>],
                ['Honor tiles (Winds, Dragons)', <Highlight color="orange">15 points</Highlight>],
              ]}
            />
            <InfoBox type="tip">
              Honor tiles give <Highlight>3× more points</Highlight> than simples! A hand full of honors will have a
              much higher base score.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'structure-points',
        category: 'Scoring',
        title: t('tutorial.structurePoints.title', 'Structure Points from Melds'),
        content: (
          <div className="space-y-3">
            <p>
              Your melds add <Highlight>structure points</Highlight> to your base:
            </p>
            <DataTable
              headers={['Structure', 'Bonus Points']}
              rows={[
                ['Pair', <Highlight>+10</Highlight>],
                ['Sequence', <Highlight>+20</Highlight>],
                ['Triplet', <Highlight color="orange">+30</Highlight>],
                ['Quad', <Highlight color="orange">+50</Highlight>],
              ]}
            />
            <p>
              <strong>Example:</strong> A hand with 2 sequences, 2 triplets, and a pair:
            </p>
            <p className="font-mono text-sm">
              20 + 20 + 30 + 30 + 10 = <Highlight color="green">+110 structure points</Highlight>
            </p>
          </div>
        ),
      },
      {
        id: 'yaku-intro',
        category: 'Scoring',
        title: t('tutorial.yakuIntro.title', 'Yaku — The Scoring Multipliers'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Yaku (役)</Highlight> are special patterns that{' '}
              <Highlight color="orange">multiply your score</Highlight>. This is where the big points come from!
            </p>
            <p>
              There are <Highlight>21 yaku</Highlight> in Tensho, organized into 4 tiers:
            </p>
            <DataTable
              headers={['Tier', 'Multiplier Range', 'Example']}
              rows={[
                ['Tier 1', '×1.2 - ×1.3', 'All Simples, Pinfu'],
                ['Tier 2', '×1.6 - ×2.2', 'All Triplets, Pure Straight'],
                ['Tier 3', '×2.5 - ×3.2', 'Half Flush, Full Flush'],
                ['Tier 4 (Yakuman)', '×4.0 - ×5.5', 'Thirteen Orphans, Nine Gates'],
              ]}
            />
          </div>
        ),
      },
      {
        id: 'yaku-examples',
        category: 'Scoring',
        title: t('tutorial.yakuExamples.title', 'Common Yaku Examples'),
        content: (
          <div className="space-y-3">
            <p>Here are some yaku you'll encounter often:</p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">All Simples (断么九 / Tanyao)</Highlight> — ×1.3
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  Hand contains only tiles 2-8, no terminals or honors
                </p>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">All Triplets (対々和 / Toitoi)</Highlight> — ×2.0
                <p className="text-xs text-[var(--color-metallic-gold)]">All 4 melds are triplets (no sequences)</p>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Full Flush (清一色 / Chinitsu)</Highlight> — ×3.0
                <p className="text-xs text-[var(--color-metallic-gold)]">Hand contains only one suit (no honors)</p>
              </div>
            </div>
            <InfoBox type="tip">
              Yaku <Highlight>stack multiplicatively</Highlight>! A hand with ×1.3 and ×2.0 yaku gets ×2.6 total.
              Build combos for massive scores!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'acts-rounds',
        category: 'Progression',
        title: t('tutorial.actsRounds.title', 'Acts and Rounds'),
        content: (
          <div className="space-y-3">
            <p>
              Your run is divided into <Highlight>Acts</Highlight>, and each Act contains{' '}
              <Highlight color="orange">3 Rounds</Highlight>:
            </p>
            <DataTable
              headers={['Round Type', 'Japanese', 'Score Multiplier']}
              rows={[
                [<Highlight>Small Round</Highlight>, '小局', '×1.0 (base target)'],
                [<Highlight>Large Round</Highlight>, '大局', '×1.5'],
                [<Highlight color="orange">Boss Round</Highlight>, '親局', '×2.0'],
              ]}
            />
            <p>
              Score targets increase with each Act. Act 1 starts easy, but by Act 8 you'll need powerful combos to
              survive!
            </p>
          </div>
        ),
      },
      {
        id: 'boss-mandates',
        category: 'Progression',
        title: t('tutorial.bossMandates.title', 'Boss Mandates'),
        content: (
          <div className="space-y-3">
            <p>
              Every <Highlight color="orange">Boss Round</Highlight> has a special <Highlight>Mandate</Highlight> — a
              restriction or challenge:
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <strong>The Hook (鉤)</strong> — 2 random tiles discarded after each draw
              </div>
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <strong>The Wall (壁)</strong> — Score requirement is ×4 instead of ×2
              </div>
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <strong>The Water (水)</strong> — Start with 0 redraws this round
              </div>
            </div>
            <InfoBox type="tip">
              Some Decrees can help counter specific mandates. Plan your build accordingly!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'skipping',
        category: 'Progression',
        title: t('tutorial.skipping.title', 'Skipping Rounds'),
        content: (
          <div className="space-y-3">
            <p>
              You can <Highlight>skip</Highlight> the Small Round or Large Round before facing the Boss. Why would you
              do this?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2 bg-green-900/30 rounded border border-green-500/50">
                <p className="font-bold text-green-400">Benefits</p>
                <ul className="text-xs list-disc list-inside mt-1">
                  <li>Receive an Omen Tag</li>
                  <li>Save Decrees with timers</li>
                  <li>Avoid unfavorable walls</li>
                </ul>
              </div>
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <p className="font-bold text-red-400">Costs</p>
                <ul className="text-xs list-disc list-inside mt-1">
                  <li>No shop access</li>
                  <li>No gold earned</li>
                  <li>No interest growth</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'decrees-intro',
        category: 'Decrees',
        title: t('tutorial.decreesIntro.title', 'What are Decrees?'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Decrees (法令)</Highlight> are rule-modifying cards that persist throughout your run. Think of
              them as Tensho's equivalent of "Jokers" in Balatro.
            </p>
            <p>Decrees can:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Highlight color="orange">Modify scoring</Highlight> — Add multipliers or flat bonuses
              </li>
              <li>
                <Highlight color="orange">Bend rules</Highlight> — Change what makes a legal hand
              </li>
              <li>
                <Highlight color="orange">Grant abilities</Highlight> — Extra draws, redraws, or effects
              </li>
              <li>
                <Highlight color="orange">Generate gold</Highlight> — Economy boosters
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'decree-categories',
        category: 'Decrees',
        title: t('tutorial.decreeCategories.title', 'Decree Categories'),
        content: (
          <div className="space-y-3">
            <p>
              Decrees are organized into <Highlight>5 categories</Highlight>:
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Structural (形法令)</Highlight> — Alter what makes a legal hand
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Tile Identity (变牌法令)</Highlight> — Change how tiles are classified
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Yaku Doctrine (役变法令)</Highlight> — Modify yaku rules
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Entropy & Fate (天运法令)</Highlight> — Alter draws and tempo
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Scaling (修行法令)</Highlight> — Reward specific playstyles
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'decree-rarities',
        category: 'Decrees',
        title: t('tutorial.decreeRarities.title', 'Decree Rarities'),
        content: (
          <div className="space-y-3">
            <p>
              Decrees come in <Highlight>4 rarity tiers</Highlight>:
            </p>
            <DataTable
              headers={['Rarity', 'Name', 'Power Level']}
              rows={[
                [<span className="text-gray-400">●</span>, 'Local Edict', 'Small bonuses'],
                [<span className="text-green-400">●</span>, 'Regional Mandate', 'Moderate effects'],
                [<span className="text-blue-400">●</span>, 'Imperial Decree', 'Strong rule-bending'],
                [<span className="text-purple-400">●</span>, 'Heavenly Ordinance', 'Run-defining power'],
              ]}
            />
            <InfoBox type="tip">
              Higher rarity decrees are more expensive and rarer in the shop. Build synergies between multiple common
              decrees for powerful combos!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'decree-slots',
        category: 'Decrees',
        title: t('tutorial.decreeSlots.title', 'Managing Decree Slots'),
        content: (
          <div className="space-y-3">
            <p>
              You have a limited number of <Highlight>Decree Slots</Highlight>. You start with{' '}
              <Highlight color="orange">5 slots</Highlight> and can earn more through:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Collecting <Highlight>Flower sets</Highlight> (2+ flowers = +1 slot)
              </li>
              <li>
                Purchasing <Highlight>Imperial Charters</Highlight>
              </li>
              <li>
                Certain <Highlight>Decree effects</Highlight>
              </li>
            </ul>
            <InfoBox type="info">
              You can <Highlight color="orange">sell</Highlight> Decrees for gold. This frees up a slot and gives you
              half the purchase price back.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'flowers-system',
        category: 'Flora',
        title: t('tutorial.flowersSystem.title', 'The Flower System'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Flowers</Highlight> provide <Highlight color="orange">permanent bonuses</Highlight> that last
              your entire run:
            </p>
            <DataTable
              headers={['Flower', 'Japanese', 'Effect']}
              rows={[
                [<span className="text-pink-400">🌸 Plum</span>, '梅', '+5% score per sequence'],
                [<span className="text-purple-400">🌺 Orchid</span>, '兰', '+5% score per honor tile'],
                [<span className="text-yellow-400">🌼 Chrysanthemum</span>, '菊', '+5% score per concealed meld'],
                [<span className="text-green-400">🎋 Bamboo</span>, '竹', '+5% score per terminal'],
              ]}
            />
            <p>
              Collecting multiple flowers unlocks <Highlight>set bonuses</Highlight>: 2 flowers = +1 decree slot, 4
              flowers = double flower effectiveness!
            </p>
          </div>
        ),
      },
      {
        id: 'seasons-system',
        category: 'Flora',
        title: t('tutorial.seasonsSystem.title', 'The Season System'),
        content: (
          <div className="space-y-3">
            <p>
              <Highlight>Seasons</Highlight> are <Highlight color="orange">temporary modifiers</Highlight> that last
              only for the current round:
            </p>
            <DataTable
              headers={['Season', 'Japanese', 'Effect']}
              rows={[
                [<span className="text-green-300">🌱 Spring</span>, '春', '+2 draws per hand'],
                [<span className="text-yellow-300">☀️ Summer</span>, '夏', '+30% base score, -20% wall size'],
                [<span className="text-orange-300">🍂 Autumn</span>, '秋', '+20% yaku multipliers'],
                [<span className="text-blue-300">❄️ Winter</span>, '冬', 'Looser hand rules, -25% score'],
              ]}
            />
            <InfoBox type="warning">
              From Act 2 onward, <Highlight color="orange">Corrupted Seasons</Highlight> can appear with negative
              effects!
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'hierarchy',
        category: 'Flora',
        title: t('tutorial.hierarchy.title', 'The Five-Layer Hierarchy'),
        content: (
          <div className="space-y-3">
            <p>
              When effects conflict, Tensho uses a <Highlight>hierarchy of authority</Highlight>:
            </p>
            <div className="font-mono text-sm bg-[var(--color-forest-green)] p-3 rounded text-center">
              <div className="text-cyan-400">Heaven (Seasons)</div>
              <div>↓</div>
              <div className="text-purple-400">Court (Decrees)</div>
              <div>↓</div>
              <div className="text-pink-400">Nature (Flowers)</div>
              <div>↓</div>
              <div className="text-yellow-400">Table (Tiles)</div>
              <div>↓</div>
              <div className="text-gray-400">Grammar (Yaku)</div>
            </div>
            <p className="text-sm">
              Higher layers <Highlight>override</Highlight> lower layers.
            </p>
          </div>
        ),
      },
      {
        id: 'tea-house',
        category: 'Economy',
        title: t('tutorial.teaHouse.title', 'The Tea House (Shop)'),
        content: (
          <div className="space-y-3">
            <p>
              After each round, you visit the <Highlight>Tea House (茶寮)</Highlight> to spend your gold:
            </p>
            <DataTable
              headers={['Item', 'Typical Cost']}
              rows={[
                ['Decrees', '1-10 gold (by rarity)'],
                ['Fate Seals', '3 gold'],
                ['Celestial Orbs', '3 gold'],
                ['Blessing Packs', '4-8 gold'],
                ['Imperial Charters', '10 gold'],
              ]}
            />
            <InfoBox type="tip">
              You can <Highlight color="orange">reroll</Highlight> the shop offerings for 5 gold. Each reroll costs +1
              more.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gold-economy',
        category: 'Economy',
        title: t('tutorial.goldEconomy.title', 'Earning Gold'),
        content: (
          <div className="space-y-3">
            <p>
              You earn <Highlight>gold</Highlight> in several ways:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Highlight color="orange">Winning rounds</Highlight> — Base payout scales with score
              </li>
              <li>
                <Highlight color="orange">Interest</Highlight> — 1 gold per 5 gold saved (max 5/round)
              </li>
              <li>
                <Highlight color="orange">Selling Decrees</Highlight> — Get half the purchase price
              </li>
              <li>
                <Highlight color="orange">Decree effects</Highlight> — Some generate gold
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'interest',
        category: 'Economy',
        title: t('tutorial.interest.title', 'The Interest System'),
        content: (
          <div className="space-y-3">
            <p>
              At the end of each round, you earn <Highlight>interest</Highlight> on saved gold:
            </p>
            <Formula>+1 gold per 5 gold held (max +5)</Formula>
            <DataTable
              headers={['Gold Held', 'Interest Earned']}
              rows={[
                ['0-4', '+0'],
                ['5-9', '+1'],
                ['10-14', '+2'],
                ['15-19', '+3'],
                ['20-24', '+4'],
                ['25+', '+5 (max)'],
              ]}
            />
            <InfoBox type="tip">
              Holding <Highlight>25+ gold</Highlight> maximizes interest! But spending on good decrees is usually worth
              more.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'tips',
        category: 'Strategy',
        title: t('tutorial.tips.title', 'Tips for Success'),
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🎯</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Focus on shanten</p>
                  <p className="text-xs">Reduce shanten quickly. Don't hold onto tiles hoping for perfect hands.</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🧩</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Build synergies</p>
                  <p className="text-xs">
                    Decrees that work together are stronger than powerful standalone decrees.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>💰</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Balance economy</p>
                  <p className="text-xs">Save for interest early, but invest in strong decrees before Act 4.</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🌸</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Collect flowers</p>
                  <p className="text-xs">Flower bonuses compound. Getting all 4 is extremely powerful.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'more-tips',
        category: 'Strategy',
        title: t('tutorial.moreTips.title', 'Advanced Tips'),
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>📊</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Plan for yaku</p>
                  <p className="text-xs">Know which yaku you're aiming for before the round starts.</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>⚖️</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Tile efficiency</p>
                  <p className="text-xs">
                    Keep tiles that can complete multiple melds. Isolated terminals are often safe to discard.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🎲</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Count remaining tiles</p>
                  <p className="text-xs">If 3 of a tile are in the dead pool, the 4th is rare.</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🎭</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">Read mandates early</p>
                  <p className="text-xs">Check the Boss Mandate before entering an Act.</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'ready',
        category: 'Ready!',
        title: t('tutorial.ready.title', "You're Ready to Play!"),
        content: (
          <div className="space-y-4 text-center">
            <p className="text-xl">
              <Highlight>Congratulations!</Highlight> You now understand the fundamentals of Tensho.
            </p>
            <p>Don't worry about memorizing everything — you'll learn by playing!</p>
            <div className="py-4">
              <p className="text-[var(--color-metallic-gold)]">May the tiles favor you on your heavenly ascent!</p>
            </div>
            <InfoBox type="tip">
              You can always return to this codex from the Settings menu if you need a refresher.
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
    ],
    [t]
  )
}

/**
 * TutorialScreen - Full-page tutorial and codex experience
 *
 * Provides a comprehensive learning interface for Tensho Mahjong with:
 * - Category sidebar (desktop) for navigating between tutorial sections
 * - Horizontal category tabs (mobile) for responsive navigation
 * - Step indicators showing progress within each category
 * - Animated step content with tile examples and visual aids
 * - Progress tracking that persists visited steps
 * - Navigation controls with Previous/Next buttons
 * - "Start Playing" action on final step that marks tutorial complete
 *
 * The tutorial is accessible from the main menu and covers:
 * Introduction, Tiles, Hand Building, How to Play, Scoring,
 * Progression, Decrees, Flora, Economy, Strategy, and a final summary.
 */
export function TutorialScreen() {
  const { t } = useTranslation()
  const { goBack, navigateTo } = useAppNavigation()
  const steps = useTutorialSteps()

  // Current step state
  const [currentStep, setCurrentStep] = useState(0)

  // Track visited steps
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))

  // Mark current step as visited when it changes
  useEffect(() => {
    setVisitedSteps((prev) => {
      const next = new Set(prev)
      next.add(currentStep)
      return next
    })
  }, [currentStep])

  // Derived data
  const categories = useMemo(() => {
    const cats = new Set<string>()
    steps.forEach((step) => step.category && cats.add(step.category))
    return Array.from(cats)
  }, [steps])

  const currentStepData = steps[currentStep]
  const currentCategory = currentStepData.category || ''

  const categorySteps = useMemo(() => {
    const stepsByCategory: Record<string, number[]> = {}
    steps.forEach((step, index) => {
      const cat = step.category || 'Uncategorized'
      if (!stepsByCategory[cat]) stepsByCategory[cat] = []
      stepsByCategory[cat].push(index)
    })
    return stepsByCategory
  }, [steps])

  const currentCategorySteps = categorySteps[currentCategory] || []
  const stepIndexInCategory = currentCategorySteps.indexOf(currentStep)

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, steps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleCategoryClick = useCallback(
    (category: string) => {
      const firstStepIndex = steps.findIndex((s) => s.category === category)
      if (firstStepIndex !== -1) {
        setCurrentStep(firstStepIndex)
      }
    },
    [steps]
  )

  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex)
  }, [])

  const handleStartPlaying = useCallback(() => {
    // Mark tutorial as completed
    if (typeof window !== 'undefined') {
      localStorage.setItem('tensho_tutorial_completed', 'true')
    }
    navigateTo(ROUTES.PLAY)
  }, [navigateTo])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[var(--color-dark-forest)]">
        <button
          onClick={goBack}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-beige-white)]"
          aria-label={t('common.back')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[var(--color-golden-yellow)]">
          {t('tutorial.title', 'Codex')}
        </h1>
        <div className="w-[44px]" />
      </div>

      {/* Mobile category tabs */}
      <div className="lg:hidden px-4 py-3 bg-[var(--color-dark-forest)] border-t border-[var(--color-forest-green)]">
        <CategoryTabs categories={categories} currentCategory={currentCategory} onCategoryClick={handleCategoryClick} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-72 bg-[var(--color-dark-forest)] border-r border-[var(--color-forest-green)] overflow-y-auto p-4 gap-2">
          {categories.map((category) => {
            const catSteps = categorySteps[category] || []
            const completedCount = catSteps.filter((i) => visitedSteps.has(i)).length

            return (
              <CategoryItem
                key={category}
                category={category}
                isActive={category === currentCategory}
                stepCount={catSteps.length}
                completedCount={completedCount}
                onClick={() => handleCategoryClick(category)}
              />
            )
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Step indicators for current category */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-dark-forest)] overflow-x-auto scrollbar-hide">
            {currentCategorySteps.map((stepIndex, i) => {
              const step = steps[stepIndex]
              const isActive = stepIndex === currentStep
              const isVisited = visitedSteps.has(stepIndex)

              return (
                <button
                  key={stepIndex}
                  onClick={() => handleStepClick(stepIndex)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-[var(--color-vibrant-orange)] text-white scale-110'
                      : isVisited
                        ? 'bg-[var(--color-forest-green)] text-[var(--color-golden-yellow)]'
                        : 'bg-[var(--color-dark-forest)] text-[var(--color-beige-white)] opacity-50'
                    }`}
                  title={step.title}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Step title */}
            <div className="mb-6">
              {currentStepData.category && (
                <div className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-[var(--color-dark-forest)] text-[var(--color-metallic-gold)] border border-[var(--color-metallic-gold)]/30 mb-3">
                  <span>{CATEGORY_CONFIG[currentStepData.category]?.icon || '📖'}</span>
                  <span>{currentStepData.category}</span>
                </div>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-golden-yellow)]">
                {currentStepData.title}
              </h2>
            </div>

            {/* Step content */}
            <div className="prose prose-invert max-w-none text-[var(--color-beige-white)]">
              <StepContent key={currentStep} step={currentStepData} />
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="px-4 py-4 bg-[var(--color-dark-forest)] border-t border-[var(--color-forest-green)]">
            {/* Progress bar */}
            <div className="mb-4">
              <ProgressBar
                current={currentStep}
                total={steps.length}
                categoryProgress={`${currentStepData.category}: ${stepIndexInCategory + 1}/${currentCategorySteps.length}`}
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4">
              <Button variant="secondary" onClick={handlePrev} disabled={isFirstStep} className="flex-1 max-w-[150px]">
                ← {t('tutorial.previous', 'Back')}
              </Button>

              {isLastStep ? (
                <Button variant="primary" onClick={handleStartPlaying} className="flex-1 max-w-[200px]">
                  {t('tutorial.finish', 'Start Playing!')}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext} className="flex-1 max-w-[150px]">
                  {t('tutorial.next', 'Next')} →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialScreen
