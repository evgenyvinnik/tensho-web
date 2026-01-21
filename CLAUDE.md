# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tensho (天翔) Mahjong Roguelike** — A web-based React game reinterpreting Riichi Mahjong as a scoring optimization roguelike (inspired by Balatro).

- **Framework:** React 19
- **Language:** TypeScript (strict mode)
- **Build:** Vite 6
- **Runtime:** Bun
- **Styling:** Tailwind CSS v4
- **State:** Zustand + GameOrchestrator pattern
- **Animations:** React Spring
- **Routing:** React Router v7
- **i18n:** i18next (13 languages)
- **PWA:** vite-plugin-pwa

See [ARCHITECTURE.MD](ARCHITECTURE.MD) for detailed game design and [ITEM_LIBRARIES.md](ITEM_LIBRARIES.md) for complete item/effect lists.

## Build & Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Start development server (Vite)
bun run build        # TypeScript check + production build
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
bun run preview      # Preview production build locally
bun run sloc         # Count source lines of code
```

## Testing

### Unit Tests (Vitest)

```bash
bun run test              # Run tests in watch mode
bun run test:run          # Run tests once
bun run test:ui           # Run tests with Vitest UI
bun run test:coverage     # Run tests with coverage report

# Run a single test file
bun run test src/core/Tile.test.ts

# Run tests matching a pattern
bun run test -- --grep "Tile"
```

### E2E Tests (Playwright)

```bash
bun run test:e2e          # Run E2E tests headless
bun run test:e2e:ui       # Run with Playwright UI
bun run test:e2e:headed   # Run in visible browser

# Run a single E2E test file
bunx playwright test e2e/app.spec.ts

# Skip auto-starting dev server (if already running)
SKIP_WEB_SERVER=1 bun run test:e2e
```

Test files: Unit tests use `*.test.ts` in `src/`, E2E tests use `*.spec.ts` in `e2e/`.

## Code Architecture

### Directory Structure

```
src/
├── core/           # Tile, Hand, Meld, Wall, DeadPool, TileModifier - game primitives
├── rules/          # HandValidator, ShantenCalculator, YakuDetector, ScoringEngine
├── systems/        # 26 game systems (Decree, Flower, Season, Shop, Stakes, Mandates, etc.)
├── config/         # Definition files (charters, mandates, omens, packs, stakes)
├── game/           # GameOrchestrator, ActionProcessor, EventBus, DebuffSystem
├── stores/         # 17 Zustand stores (game, hand, wall, decree, flora, shop, stake, etc.)
├── components/     # React components (tiles/, ui/, effects/, screens/, hand/)
├── animations/     # React Spring animation hooks
├── hooks/          # Custom React hooks
├── router/         # React Router with i18n language-prefixed routes
├── i18n/           # Internationalization configuration
├── styles/         # Theme configuration
└── utils/          # Helpers and asset paths
```

### Import Patterns

Prefer direct imports from individual files over barrel exports (`index.ts` files). Direct imports improve tree-shaking, reduce circular dependency issues, and make the codebase easier to navigate:

```typescript
// Preferred - import from individual files
import { Tile } from './core/Tile'
import { Meld } from './core/Meld'
import { useGameStore } from './stores/gameStore'
import { DecreeSystem } from './systems/DecreeSystem'

// Avoid - importing from barrel files (index.ts)
import { Tile, Meld, Hand, Wall } from './core'
```

### Game Loop Architecture: GameOrchestrator

The game uses a dual-state pattern:

1. **GameOrchestrator** (`src/game/GameOrchestrator.ts`) — Central game loop controller that owns:
   - Complete game state (`OrchestratorState`)
   - Action validation and execution via `ActionProcessor`
   - System integration (DecreeSystem, FlowerSystem, SeasonSystem, RoundManager)
   - Wall/hand management and scoring

2. **Zustand Stores** (`src/stores/`) — UI-focused state slices:
   - `gameStore` — Session state (act, round, score, gold, phase)
   - `handStore` — Current hand tiles and melds
   - `wallStore` — Wall and dead wall state
   - `decreeStore` — Active decrees
   - `floraStore` — Collected flowers and active seasons
   - `settingsStore` — User preferences (persisted)
   - `achievementStore` — Achievement tracking (persisted)
   - `tileMarkStore` — Tile modifiers (enhancements, seals, editions)
   - `charterStore` — Imperial Charters (permanent upgrades)
   - `omenStore` — Omen Tags from skipping rounds
   - `packStore` — Blessing Pack opening state
   - `shopStore` — Tea House shop state
   - `stakeStore` — Table Stakes difficulty progression (persisted)
   - `consumableStore` — Fate Seals, Celestial Orbs, Void Scripts
   - `progressionStore` — Meta-progression tracking
   - `tableStyleStore` — Table/wall style selection
   - `archiveStore` — Hand archive/collection

The orchestrator is the source of truth for game logic; stores may reflect orchestrator state for UI binding.

```typescript
import { gameOrchestrator } from './game/GameOrchestrator'

// Start a new run
gameOrchestrator.startNewRun(seed, stake)

// Process player actions
const result = gameOrchestrator.processAction({ type: 'play', tileIds: [...] })

// Get current state
const state = gameOrchestrator.getState()
```

### Core Layers

**Core Layer (`src/core/`)** — Foundation primitives:
- `Tile` class with factory methods for all tile types (suited, honors, bonus)
- `Meld` class for sequences, triplets, quads, pairs
- `Hand` class and `ParsedHand` interface for validated winning hands
- `Wall` class managing draw pile with dead wall

**Rules Layer (`src/rules/`)** — Scoring and validation:
- `YakuDetector` — Pattern matching for 21 yaku definitions
- `ShantenCalculator` — Distance-to-tenpai computation
- `HandValidator` — Legal hand validation
- `ScoringEngine` — Implements the formula: `Final = (Base + Additive) × Multipliers`

**Config Layer (`src/config/`)** — Game content definitions:
- `charterDefinitions` — 32 Imperial Charter definitions (base + upgraded pairs)
- `mandateDefinitions` — 27 Boss Mandate effects and restrictions
- `omenDefinitions` — 23 Omen Tag rewards for skipping rounds
- `packDefinitions` — Blessing Pack types, sizes, and appearance rates
- `stakeDefinitions` — 8 Table Stake tiers with cumulative modifiers

**Systems Layer (`src/systems/`)** — Rule modifiers and roguelike mechanics:
- `RoundManager` — Act/Round progression, boss mandates, score targets
- `DecreeSystem` — Rule-bending modifiers (Joker equivalent)
- `FlowerSystem` — Run-wide persistent scaling modifiers
- `SeasonSystem` — Round-scoped temporal effects
- `ShopSystem` — Between-round acquisition (legacy)
- `TeaHouseSystem` — Full shop with item generation, pricing, rerolls
- `ShopGenerator` — Shop item and pack generation with weighted randomization
- `PricingCalculator` — Cost formulas with rarity and edition modifiers
- `TileModifierSystem` — Enhancements, Seals, Editions on tiles
- `FateSealSystem` — 22 Tarot-style consumables
- `CelestialOrbSystem` — 13 Planet-style yaku upgrades
- `VoidScriptSystem` — 20 Spectral-style powerful effects with downsides
- `ConsumableSystem` — Base consumable inventory management
- `CharterSystem` — 32 Imperial Charters (voucher-style permanent upgrades)
- `BlessingPackSystem` — Booster pack opening mechanics
- `OmenTagSystem` — 23 skip rewards (one-time triggers)
- `TableStakeSystem` — 8-tier difficulty progression
- `StickerSystem` — Eternal/Perishable/Rental decree modifiers
- `MandateEffectSystem` — 27 Boss Mandate restrictions
- `RedFiveSystem` — Red five tile variants
- `TableStyleSystem` — Deck/table style variants
- `MetaProgressionSystem` — Persistent unlock tracking
- `AudioSystem` — Sound effects and music
- `VFXSystem` — Visual effects
- `ArchiveSystem` — Hand collection/discovery

### Event Bus Pattern

Decoupled communication between game systems:

```typescript
import { eventBus } from './game/EventBus'

eventBus.on('roundStart', (data) => { ... })
eventBus.emit('roundStart', { roundNumber: 1 })
eventBus.once('gameOver', (data) => { ... })
```

Key events: `runStart`, `roundStart`, `roundEnd`, `handPlayed`, `tileDrawn`, `scoreUpdate`, `yakuScored`, `decreeAcquired`, `phaseChanged`, `shopEntered`, `gameOver`.

### Routing

Language-prefixed routes using React Router:
- Pattern: `/:lang/[route]` (e.g., `/en/play`, `/ja/shop`)
- `useAppNavigation()` provides language-aware navigation
- `buildPath(route, lang?)` constructs full paths
- Routes: menu, play, shop, game-over, tutorial, collection, settings, achievements

### Internationalization

- **13 languages:** en, ja, ko, zh-Hans, zh-Hant, es, fr, it, ru, tr, id, th, tl
- Translation files in `src/i18n/locales/`
- `useTranslation()` hook for translated strings
- `changeLanguage(lang)` updates both i18n and URL

### TypeScript Configuration

Strict mode with enhanced linting:
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`
- Target: ES2020
- Module: ESNext with bundler resolution

## Key Game Patterns

### Scoring Formula

```
Final Score = (Base Points + Additive Bonuses) × Multiplicative Multipliers
```

Base points: Terminals (1,9) = 10, Simples (2-8) = 5, Honors = 15
Structure: Pair +10, Sequence +20, Triplet +30, Quad +50

### Five-Layer Authority Hierarchy

```
Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles) > Grammar (Yaku)
```

Higher layers override lower in conflict resolution.

### Round Structure

Each Act has 3 rounds: Small (1.0×), Large (1.5×), Boss (2.0×). Boss rounds have mandates (special restrictions). Acts 1-8 have defined targets; Act 9+ uses endless mode scaling.

## Domain Terminology

| Balatro | Tensho |
|---------|--------|
| Joker | Decree |
| Blind | Round Mandate |
| Ante | Act |
| Deck | Wall |
| Run | Session |
| Tarot | Fate Seal |
| Planet | Celestial Orb |
| Spectral | Void Script |
| Voucher | Imperial Charter |

## UI Design

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Forest Green | `#2D5F4A` | Primary background, game table |
| Vibrant Orange | `#FF5722` | Buttons, call-to-action |
| Golden Yellow | `#FFD54F` | Accents, score displays |
| Beige White | `#F5F5DC` | Tile backgrounds, text |
| Dark Forest | `#1C3A2E` | Borders, overlays |

### Layout Principles

- **Mobile-first (portrait):** 1080×1920 reference resolution
- **Touch targets:** Minimum 44×44 pixels
- **Hand area:** Bottom-aligned for thumb accessibility
- **Tile sizing:** 70×98px base, dynamic overlap for large hands

## PWA

Fully installable Progressive Web App with offline support via service worker (workbox). Assets cached with CacheFirst strategy. See `vite.config.ts` for PWA configuration.

## SEO

### Meta Tags

The app includes comprehensive SEO meta tags in `index.html`:
- Primary meta tags (title, description, keywords, author)
- Open Graph tags for Facebook/LinkedIn sharing
- Twitter Card tags for Twitter sharing
- Structured data (JSON-LD VideoGame schema)
- Multi-language alternate links

### Dynamic SEO

Use the `usePageSEO` hook for route-specific meta tags:

```typescript
import { usePageSEO, getLocalizedSEO } from './utils/seo'

function PlayPage() {
  const { i18n } = useTranslation()

  usePageSEO(getLocalizedSEO('play', i18n.language))
  // Sets title to "Play | Tensho", updates canonical, OG tags, etc.

  return <div>...</div>
}
```

### SEO Files

- `public/robots.txt` — Crawler instructions
- `public/sitemap.xml` — URL sitemap with hreflang for 13 languages
- `public/browserconfig.xml` — Windows tile configuration
- `public/og-image.png` — Open Graph image (1200×630) [needs creation]
- `public/screenshot-wide.png` — PWA screenshot landscape [needs creation]
- `public/screenshot-narrow.png` — PWA screenshot portrait [needs creation]

