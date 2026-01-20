# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tensho (天翔) Mahjong Roguelike** — A web-based React game reinterpreting Riichi Mahjong as a scoring optimization roguelike (inspired by Balatro).

- **Framework:** React 19
- **Language:** TypeScript (strict mode)
- **Build:** Vite 6
- **Runtime:** Bun
- **Styling:** Tailwind CSS v4
- **State:** Zustand
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

## Code Architecture

### Directory Structure

```
src/
├── core/           # Tile, Hand, Meld, Wall, DeadPool - game primitives
├── rules/          # HandValidator, ShantenCalculator, YakuDetector, ScoringEngine
├── systems/        # Decree, Flower, Season, Shop, RoundManager, TableStake
├── game/           # ActionProcessor, DebuffSystem, EventBus, BonusTileHandler
├── stores/         # Zustand stores (gameStore, handStore, wallStore, decreeStore, floraStore, etc.)
├── components/     # React components (tiles/, ui/, effects/, screens/, hand/)
├── animations/     # React Spring animation hooks (useTileAnimation, useScoreAnimation, etc.)
├── hooks/          # Custom React hooks (useAudio, useReducedMotion)
├── router/         # React Router configuration with i18n language-prefixed routes
├── i18n/           # Internationalization (i18next) configuration
├── styles/         # Theme configuration
└── utils/          # Helpers and asset paths
```

### Import Patterns

Each major module uses barrel exports via `index.ts`. Import from the directory, not individual files:

```typescript
// Preferred - import from barrel
import { Tile, Meld, Hand, Wall } from './core'
import { useGameStore, useHandStore } from './stores'

// Avoid - importing from individual files
import { Tile } from './core/Tile'
```

### Core Layer (`src/core/`)

The foundation layer defining game primitives:

- **`types.ts`** — Foundational enums and type definitions: `Suit`, `ExtendedSuit`, `WindType`, `DragonType`, `FlowerType`, `SeasonType`, `TileType`. Includes type guards (`isNumberedSuit`, `isHonorSuit`, `isBonusSuit`, `isTerminalRank`).
- **`Tile.ts`** — `Tile` class with factory methods for creating tiles and full 144-tile set generation
- **`Meld.ts`** — `Meld` class representing sequences, triplets, quads, and pairs
- **`Hand.ts`** — `Hand` class and `ParsedHand` interface for validated winning hands
- **`Wall.ts`** — `Wall` class managing the draw pile with dead wall
- **`DeadPool.ts`** — Discard management

### Rules Layer (`src/rules/`)

Game rules and scoring logic:

- **`YakuDefinition.ts`** — All 21 yaku definitions with tiers (1-4) and multipliers
- **`YakuDetector.ts`** — Pattern matching to detect yaku in hands, exports `detectYaku()` and `calculateYakuMultiplier()`
- **`ShantenCalculator.ts`** — Distance-to-tenpai computation
- **`HandValidator.ts`** — Legal hand validation (4 melds + 1 pair or special forms)
- **`ScoringEngine.ts`** — Implements the scoring formula: `Final Score = (Base Points + Additive Bonuses) × Multiplicative Multipliers`

### Systems Layer (`src/systems/`)

Game systems that modify rules and progression:

- **`types.ts`** — Shared types for systems: `RoundState`, `ActState`, `RoundType`, `BossMandate`, `ScoreRequirements`
- **`RoundManager.ts`** — Act/Round progression, boss mandates, skip mechanics, interest calculation
- **`DecreeSystem.ts`** — Rule-bending modifiers (Joker equivalent)
- **`FlowerSystem.ts`** — Run-wide persistent scaling modifiers
- **`SeasonSystem.ts`** — Round-scoped temporal effects
- **`ShopSystem.ts`** — Between-round acquisition (Tea House)
- **`TableStakeSystem.ts`** — Difficulty tier system with cumulative modifiers

### Game Layer (`src/game/`)

Runtime game logic and event handling:

- **`ActionProcessor.ts`** — Processes player actions (draw, discard, meld)
- **`DebuffSystem.ts`** — Manages tile/decree debuff states
- **`EventBus.ts`** — Pub/sub event system for game events
- **`BonusTileHandler.ts`** — Handles bonus tile (Flower/Season) acquisition

### State Management (`src/stores/`)

Zustand stores with flat, action-based patterns:

- **`gameStore.ts`** — Session state: act, round, score, gold, phase (`menu` | `gameplay` | `shop` | `gameOver`)
- **`handStore.ts`** — Current hand tiles and melds
- **`wallStore.ts`** — Wall and dead wall state
- **`decreeStore.ts`** — Active decrees
- **`floraStore.ts`** — Collected flowers and active seasons
- **`settingsStore.ts`** — User preferences
- **`achievementStore.ts`** — Achievement/accolade tracking

### Routing (`src/router/`)

Language-prefixed routes using React Router:

- Routes follow pattern: `/:lang/[route]` (e.g., `/en/play`, `/ja/shop`)
- `useAppNavigation()` hook provides language-aware navigation
- `buildPath(route, lang?)` constructs full paths with language prefix
- Supported routes: menu, play, shop, game-over, tutorial, collection, settings, achievements

### Animations (`src/animations/`)

React Spring animation hooks:

- **`useTileAnimation.ts`** — Tile draw, discard, and selection animations
- **`useScoreAnimation.ts`** — Score counter and popup animations
- **`useScreenTransition.ts`** — Screen transition effects
- **`constants.ts`** — Shared animation timing and easing values

### TypeScript Configuration

- **Strict mode enabled** with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`
- Target: ES2020
- Module: ESNext with bundler resolution
- React JSX transform enabled

### React Compiler

The experimental React Compiler (babel-plugin-react-compiler) is installed but commented out in `vite.config.ts`. To enable:
```ts
// In vite.config.ts, uncomment the babel config in react()
babel: {
  plugins: [['babel-plugin-react-compiler', {}]],
}
```

### Internationalization

Uses i18next with browser language detection:

- **Supported languages:** en, ja, ko, zh-Hans, zh-Hant, es, fr, it, ru, tr, id, th, tl (13 total)
- Translation files in `src/i18n/locales/`
- `useTranslation()` hook for translated strings
- Language persisted in URL path prefix (e.g., `/en/`, `/ja/`)
- `changeLanguage(lang)` updates both i18n and URL

### Event Bus Pattern

The `EventBus` in `src/game/EventBus.ts` provides decoupled communication between game systems:

```ts
import { eventBus } from './game/EventBus'

// Subscribe to events
eventBus.on('roundStart', (data) => { ... })

// Emit events
eventBus.emit('roundStart', { roundNumber: 1 })

// One-time listener
eventBus.once('gameOver', (data) => { ... })
```

Key event categories: game lifecycle (`runStart`, `runEnd`, `gameOver`), round flow (`actStart`, `actComplete`, `roundStart`, `roundEnd`), player actions (`tileDraw`, `tileDiscard`, `meldDeclared`), scoring (`handScored`, `yakuDetected`).

## Key Patterns

### Scoring Formula

```
Final Score = (Base Points + Additive Bonuses) × Multiplicative Multipliers
```

Base points from tiles:
- Terminals (1, 9): 10 points
- Simples (2-8): 5 points
- Honors: 15 points

Structure points: Pair +10, Sequence +20, Triplet +30, Quad +50

### Five-Layer Authority Hierarchy

```
Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles) > Grammar (Yaku)
```

Higher layers override lower layers in conflict resolution.

### Round Structure

Each Act has 3 rounds: Small (1.0×), Large (1.5×), Boss (2.0×). Boss rounds have mandates (special restrictions). Acts 1-8 have defined score targets; Act 9+ uses endless mode scaling.

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

## PWA Features

The app is a fully installable Progressive Web App:

- **Offline Support:** Service worker caches all assets (JS, CSS, images, audio, fonts)
- **Installable:** Can be added to home screen on iOS/Android/Desktop
- **Auto-Update:** Prompts users when new content is available
- **Standalone Mode:** Runs without browser chrome in portrait orientation

### PWA Assets

- `public/icon-192x192.png` — Standard PWA icon
- `public/icon-512x512.png` — Large PWA icon (also maskable)
- `public/apple-touch-icon.png` — iOS home screen icon

### Caching Strategy

- **CacheFirst:** Images, audio, and fonts (30-day expiration)
- **CacheFirst:** Google Fonts (1-year expiration)
- **AutoUpdate:** Service worker updates on new deployments
