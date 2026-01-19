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

### Current State

This project is in early development. The `src/` directory currently contains only the basic React entry point (`main.tsx`, `App.tsx`).

### Planned Directory Structure

When implementing, follow this structure:

```
src/
├── core/           # Tile, Hand, Meld, Wall, DeadPool
├── rules/          # HandValidator, ShantenCalculator, YakuDetector, ScoringEngine
├── systems/        # Decree, Flower, Season, Shop systems
├── stores/         # Zustand stores for game state
├── components/     # React components
│   ├── tiles/      # Tile display and interaction
│   ├── hand/       # Hand display
│   ├── screens/    # MainMenu, Gameplay, Shop, GameOver
│   └── ui/         # Shared UI components
├── hooks/          # Custom React hooks
└── utils/          # Helpers and constants
```

### TypeScript Configuration

- **Strict mode enabled** with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Target: ES2020
- Module: ESNext with bundler resolution
- React JSX transform enabled

## Game Domain

### Five-Layer System Model

| Layer | System | Role |
|-------|--------|------|
| **Material** | Tiles | Physical components of play |
| **Grammar** | Yaku | Scoring language and patterns |
| **Growth** | Flowers | Persistent scaling modifiers (run-wide) |
| **Time** | Seasons | Temporal pressure and mutation (round-scoped) |
| **Law** | Decrees | Rule authority and exceptions (run-wide) |

### Hierarchy of Authority

```
Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles) > Grammar (Yaku)
```

This hierarchy governs conflict resolution and effect stacking order.

### Domain Terminology

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

### Tile Set

Standard Riichi Mahjong (136 tiles + 8 bonus):
- **Suited:** Manzu, Pinzu, Souzu (1-9 × 4 each)
- **Honors:** Winds (E/S/W/N × 4), Dragons (White/Green/Red × 4)
- **Bonus:** Flowers (4), Seasons (4)

### Scoring Formula

```
Final Score = (Base Points + Additive Bonuses) × Multiplicative Multipliers
```

Base points come from tiles and hand structure. Multipliers stack from Yaku, Decrees, Celestial Orbs, and Seasonal effects.

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
