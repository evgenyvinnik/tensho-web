# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tensho (天翔) Mahjong Roguelike** — A web-based React game reinterpreting Riichi Mahjong as a scoring optimization roguelike (inspired by Balatro).

- **Framework:** React 19 (with experimental React Compiler)
- **Language:** TypeScript (strict mode)
- **Build:** Vite 6
- **Runtime:** Bun
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Animations:** React Spring
- **Data Fetching:** TanStack Query
- **PWA:** vite-plugin-pwa (offline support, installable)

See [ARCHITECTURE.MD](ARCHITECTURE.MD) for detailed game design and [ITEM_LIBRARIES.md](ITEM_LIBRARIES.md) for complete item/effect lists.

## Build & Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Start development server (Vite)
bun run build        # TypeScript check + production build
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
bun run preview      # Preview production build locally
```

## Code Architecture

### Directory Structure

```
src/
├── core/           # Tile, Hand, Meld, Wall, DeadPool - game primitives
├── rules/          # HandValidator, ShantenCalculator, YakuDetector, ScoringEngine
├── systems/        # Decree, Flower, Season, Shop, RoundManager
├── stores/         # Zustand stores (gameStore, handStore, wallStore, decreeStore, floraStore)
├── components/     # React components (tiles/, ui/)
├── hooks/          # Custom React hooks (useAudio)
├── styles/         # Theme configuration
└── utils/          # Helpers and asset paths
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

### State Management (`src/stores/`)

Zustand stores with flat, action-based patterns:

- **`gameStore.ts`** — Session state: act, round, score, gold, phase (`menu` | `gameplay` | `shop` | `gameOver`)
- **`handStore.ts`** — Current hand tiles and melds
- **`wallStore.ts`** — Wall and dead wall state
- **`decreeStore.ts`** — Active decrees
- **`floraStore.ts`** — Collected flowers and active seasons
- **`settingsStore.ts`** — User preferences

### TypeScript Configuration

- **Strict mode enabled** with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target: ES2020
- Module: ESNext with bundler resolution
- React JSX transform enabled

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
