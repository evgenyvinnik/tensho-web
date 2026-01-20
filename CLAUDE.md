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

## Code Architecture

### Directory Structure

```
src/
├── core/           # Tile, Hand, Meld, Wall, DeadPool - game primitives
├── rules/          # HandValidator, ShantenCalculator, YakuDetector, ScoringEngine
├── systems/        # Decree, Flower, Season, Shop, RoundManager, TableStake
├── game/           # GameOrchestrator, ActionProcessor, EventBus, DebuffSystem
├── stores/         # Zustand stores (gameStore, handStore, wallStore, etc.)
├── components/     # React components (tiles/, ui/, effects/, screens/, hand/)
├── animations/     # React Spring animation hooks
├── hooks/          # Custom React hooks
├── router/         # React Router with i18n language-prefixed routes
├── i18n/           # Internationalization configuration
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

**Systems Layer (`src/systems/`)** — Rule modifiers:
- `RoundManager` — Act/Round progression, boss mandates, score targets
- `DecreeSystem` — Rule-bending modifiers (Joker equivalent)
- `FlowerSystem` — Run-wide persistent scaling modifiers
- `SeasonSystem` — Round-scoped temporal effects
- `ShopSystem` — Between-round acquisition

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
