# Tensho (天翔) — Mahjong Roguelike

> *"Heavenly Ascent"* — A single-player roguelike that reinterprets Riichi Mahjong as a scoring-driven optimization game.

---

## Five-Layer System Model

The game is built on five internally consistent layers:

| Layer | System | Role | Scope |
|-------|--------|------|-------|
| **Material** | Tiles | Physical components of play | Hand/Round |
| **Grammar** | Yaku | Scoring language and patterns | Hand |
| **Growth** | Flowers | Persistent scaling modifiers | Run-wide |
| **Time** | Seasons | Temporal pressure and mutation | Round |
| **Law** | Decrees | Rule authority and exceptions | Run-wide |

```
┌─────────────────────────────────────────┐
│  HEAVEN (天)  │  Seasons   │  Time      │  ← Highest authority, temporary
├─────────────────────────────────────────┤
│  COURT (廷)   │  Decrees   │  Law       │  ← Persistent rule modifications
├─────────────────────────────────────────┤
│  NATURE (自然) │  Flowers   │  Growth    │  ← Passive scaling
├─────────────────────────────────────────┤
│  TABLE (卓)   │  Tiles     │  Material  │  ← Physical components
├─────────────────────────────────────────┤
│  GRAMMAR (文法) │  Yaku     │  Language  │  ← Scoring patterns
└─────────────────────────────────────────┘
```

This hierarchy governs **conflict resolution** and **effect stacking order**.

---

## Documentation

| Document | Description |
|----------|-------------|
| **[GAME_SYSTEMS.md](docs/GAME_SYSTEMS.md)** | Core systems: Tiles, Yaku, Scoring, Decrees, Flowers, Seasons, Consumables |
| **[GAME_MECHANICS.md](docs/GAME_MECHANICS.md)** | Detailed mechanics: Scoring formula, Economy, Stakes, Shop, Glossary |
| **[UI_DESIGN.md](docs/UI_DESIGN.md)** | Visual design: Color palette, Typography, Layout, Table Styles |
| **[IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)** | Implementation phases and system status |
| **[ITEM_LIBRARIES.md](ITEM_LIBRARIES.md)** | Complete item lists for all game systems |

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Framework** | React 19 + TypeScript (Strict Mode) |
| **Build** | Vite 6 + Bun |
| **Platforms** | Web (PWA), iOS, Android (installable) |
| **Rendering** | 2D (Canvas/DOM, tile-based) |
| **Orientation** | Portrait-first (mobile), Responsive (desktop) |
| **State** | Zustand (18 stores) |
| **Animations** | React Spring |
| **Testing** | Vitest + Playwright |
| **i18n** | i18next (13 locales) |

**Core Concept:** Replace multiplayer opposition with systemic pressure, rule mutation, and probabilistic risk management while preserving Mahjong's combinatorial depth.

### Design Pillars

1. **Mahjong-first authenticity** — Traditional terminology, no card-game abstractions
2. **Roguelike structure** — Run-based progression with meta-unlocks
3. **Rule-bending through authority** — Decrees alter rules explicitly, not randomly
4. **Mobile clarity** — Progressive disclosure, touch-first, iconography over text

---

## Technical Architecture

### React/TypeScript Project Structure

```
src/
├── core/                    # Game primitives
│   ├── Tile.ts              # Tile class with factory methods
│   ├── Hand.ts              # Hand class and ParsedHand interface
│   ├── Meld.ts              # Meld representations (sequence, triplet, quad)
│   ├── Wall.ts              # Wall management with dead wall
│   ├── DeadPool.ts          # Discard management
│   ├── TileModifier.ts      # Tile mark types (Enhancement, Seal, Edition)
│   └── types.ts             # Core enums: TileSuit, DragonType, WindType
│
├── rules/                   # Game rules and scoring
│   ├── HandValidator.ts     # Legal hand validation
│   ├── ShantenCalculator.ts # Distance-to-tenpai computation
│   ├── YakuDefinition.ts    # 21 yaku definitions with tiers
│   ├── YakuDetector.ts      # Pattern matching for yaku detection
│   └── ScoringEngine.ts     # Score calculation with multipliers
│
├── systems/                 # Game systems (27 files)
│   ├── DecreeSystem.ts      # Rule-bending modifiers
│   ├── FlowerSystem.ts      # Persistent run-wide scaling
│   ├── SeasonSystem.ts      # Round-scoped effects
│   ├── RoundManager.ts      # Act/Round progression
│   ├── TeaHouseSystem.ts    # Shop generation and logic
│   ├── ShopGenerator.ts     # Item generation for shop
│   ├── PricingCalculator.ts # Cost formulas with discounts
│   ├── FateSealSystem.ts    # Tarot-equivalent (22 seals)
│   ├── CelestialOrbSystem.ts # Planet-equivalent (13 orbs)
│   ├── VoidScriptSystem.ts  # Spectral-equivalent (20 scripts)
│   ├── CharterSystem.ts     # Voucher-equivalent (32 charters)
│   ├── BlessingPackSystem.ts # Booster pack system
│   ├── OmenTagSystem.ts     # Skip rewards (23 omens)
│   ├── TableStakeSystem.ts  # 8-tier difficulty system
│   ├── MandateEffectSystem.ts # Boss mandate restrictions
│   ├── TileModifierSystem.ts # Tile mark application
│   ├── StickerSystem.ts     # Eternal, Perishable, Rental
│   ├── ConsumableSystem.ts  # Consumable management
│   ├── TableStyleSystem.ts  # Deck variants (8 styles)
│   ├── RedFiveSystem.ts     # Red five tile variants
│   ├── ArchiveSystem.ts     # Collection tracking (352+ items)
│   ├── MetaProgressionSystem.ts # Persistent unlocks
│   ├── AudioSystem.ts       # Audio playback
│   ├── VFXSystem.ts         # Visual effects
│   └── types.ts             # Shared system types
│
├── stores/                  # Zustand state management (18 stores)
│   ├── gameStore.ts         # Session state: act, round, score, gold
│   ├── handStore.ts         # Current hand tiles and melds
│   ├── wallStore.ts         # Wall and dead wall state
│   ├── decreeStore.ts       # Active decrees
│   ├── floraStore.ts        # Flowers and seasons
│   ├── settingsStore.ts     # User preferences
│   ├── achievementStore.ts  # Achievement tracking
│   ├── tileMarkStore.ts     # Tile modifications
│   ├── charterStore.ts      # Owned charters
│   ├── omenStore.ts         # Active omen tags
│   ├── packStore.ts         # Pack state
│   ├── shopStore.ts         # Shop state
│   ├── stakeStore.ts        # Difficulty tier
│   ├── consumableStore.ts   # Consumable inventory
│   ├── tableStyleStore.ts   # Selected table style
│   ├── archiveStore.ts      # Collection discovery
│   ├── progressionStore.ts  # Meta-progression
│   └── index.ts             # Store exports
│
├── config/                  # Game content definitions
│   ├── decreeDefinitions.ts # 155 decree definitions
│   ├── charterDefinitions.ts # 32 charter definitions
│   ├── mandateDefinitions.ts # 27 mandate definitions
│   ├── omenDefinitions.ts   # 23 omen definitions
│   ├── stakeDefinitions.ts  # 8 stake tier definitions
│   ├── packDefinitions.ts   # Blessing pack types
│   ├── tableStyleDefinitions.ts # 8 table style definitions
│   ├── audioDefinitions.ts  # Audio asset mappings
│   ├── archiveDefinitions.ts # Collection items
│   └── unlockDefinitions.ts # Meta-progression unlocks
│
├── game/                    # Game orchestration
│   ├── GameOrchestrator.ts  # Main game controller
│   ├── EventBus.ts          # Event system
│   ├── DebuffSystem.ts      # Debuff management
│   └── index.ts             # Game exports
│
├── components/              # React components
│   ├── screens/             # Full-page screens
│   │   ├── MenuScreen.tsx   # Main menu with floating tiles
│   │   ├── GameplayScreen.tsx # Core gameplay UI
│   │   ├── ShopScreen.tsx   # Tea House shop
│   │   ├── SettingsScreen.tsx # User preferences
│   │   ├── GameOverScreen.tsx # End-of-run screen
│   │   ├── TutorialScreen.tsx # Tutorial flow
│   │   ├── AchievementsScreen.tsx # Heavenly Accolades
│   │   └── CollectionScreen.tsx # Archive of Hands
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx       # Animated button with variants
│   │   ├── BackButton.tsx   # Navigation back button
│   │   ├── IconButton.tsx   # Icon-only button
│   │   ├── Slider.tsx       # Volume/value slider
│   │   ├── Toggle.tsx       # Switch toggle
│   │   ├── Popup.tsx        # Modal dialogs (Alert, Confirm)
│   │   ├── DecreeCard.tsx   # Decree display card
│   │   ├── FlowerTrack.tsx  # Flower collection display
│   │   ├── Codex.tsx        # Game encyclopedia
│   │   ├── Tutorial.tsx     # Tutorial overlay
│   │   ├── Icons.tsx        # SVG icon components
│   │   └── ErrorBoundary.tsx # Error handling
│   ├── tiles/               # Tile rendering
│   │   ├── TileImage.tsx    # Static tile display
│   │   └── AnimatedTile.tsx # Animated tile with springs
│   ├── hand/                # Hand display
│   │   └── AnimatedHand.tsx # Hand with drag-and-drop
│   ├── shop/                # Shop components
│   │   ├── ShopHeader.tsx   # Gold, reroll, settings
│   │   ├── ShopItemCard.tsx # Item purchase card
│   │   ├── PackCard.tsx     # Blessing pack card
│   │   ├── CharterCard.tsx  # Imperial charter card
│   │   └── PackOpeningModal.tsx # Pack opening animation
│   ├── effects/             # Visual effects
│   │   ├── GlowEffect.tsx   # Glowing highlights
│   │   ├── ParticleEffect.tsx # Particle systems
│   │   ├── ScorePopup.tsx   # Score animations
│   │   ├── YakuReveal.tsx   # Yaku announcement
│   │   ├── ScreenFlash.tsx  # Screen flash effect
│   │   └── AnimatedBackground.tsx # Background effects
│   ├── menu/                # Menu-specific components
│   │   ├── TableStyleButton.tsx
│   │   ├── TableStyleCard.tsx
│   │   └── TableStyleModal.tsx
│   ├── collection/          # Collection components
│   │   ├── ItemCard.tsx     # Archive item display
│   │   ├── ItemGrid.tsx     # Grid layout
│   │   ├── CategoryTabs.tsx # Category navigation
│   │   └── ItemDetailModal.tsx # Item details
│   └── gameplay/            # Gameplay components
│       └── PlaySurface.tsx  # Game table surface
│
├── hooks/                   # Custom React hooks
│   ├── useAudio.ts          # Audio playback hook
│   ├── useVFX.tsx           # Visual effects hook
│   └── index.ts             # Hook exports
│
├── animations/              # Animation utilities
│   └── springs.ts           # React Spring configurations
│
├── router/                  # Navigation
│   └── index.tsx            # React Router setup
│
├── i18n/                    # Internationalization
│   ├── index.ts             # i18next configuration
│   └── locales/             # 13 language files
│       ├── en.json          # English
│       ├── ja.json          # Japanese
│       ├── zh-Hans.json     # Simplified Chinese
│       ├── zh-Hant.json     # Traditional Chinese
│       ├── ko.json          # Korean
│       ├── es.json          # Spanish
│       ├── fr.json          # French
│       ├── it.json          # Italian
│       ├── ru.json          # Russian
│       ├── th.json          # Thai
│       ├── id.json          # Indonesian
│       ├── tr.json          # Turkish
│       └── tl.json          # Tagalog
│
├── styles/                  # Styling
│   └── theme.ts             # Color palette and theme
│
├── utils/                   # Utilities
│   └── assets.ts            # Asset path helpers
│
├── types/                   # TypeScript types
│   └── index.ts             # Shared type definitions
│
├── test/                    # Test utilities
│   └── setup.ts             # Vitest setup
│
├── App.tsx                  # Root React component
├── main.tsx                 # Application entry point
└── index.css                # Global styles with Tailwind
```

### Architecture Goals

- **Data-driven rules** — TypeScript definition files for all game content
- **Deterministic RNG** — Seeded random for reproducibility
- **Separation of concerns** — Rules engine completely independent from UI
- **Modular systems** — Each system (Decree/Flower/Season) pluggable
- **Platform abstraction** — Monetization behind interfaces for easy swapping

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
   - And 13 more specialized stores...

The orchestrator is the source of truth for game logic; stores may reflect orchestrator state for UI binding.

### Event Bus Pattern

Decoupled communication between game systems:

```typescript
import { eventBus } from './game/EventBus'

eventBus.on('roundStart', (data) => { ... })
eventBus.emit('roundStart', { roundNumber: 1 })
eventBus.once('gameOver', (data) => { ... })
```

Key events: `runStart`, `roundStart`, `roundEnd`, `handPlayed`, `tileDrawn`, `scoreUpdate`, `yakuScored`, `decreeAcquired`, `phaseChanged`, `shopEntered`, `gameOver`.

---

## Domain Terminology (Balatro → Tensho)

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

See [GAME_MECHANICS.md](docs/GAME_MECHANICS.md) for complete glossary.

---

## Quick Reference

### Scoring Formula

```
Final Score = (Base Points + Additive Bonuses) × Multiplicative Multipliers
```

### Round Structure

Each Act has 3 rounds: Small (1.0×), Large (1.5×), Boss (2.0×). Boss rounds have mandates (special restrictions).

### System Hierarchy

```
Heaven  → Seasons    (highest authority, temporary)
Court   → Decrees    (persistent rule modifications)
Nature  → Flowers    (passive scaling)
Table   → Tiles      (material components)
Grammar → Yaku       (scoring language)
```

---

## UI Philosophy (Mobile-First)

- Portrait orientation as default
- Bottom-aligned hand area
- Drag-to-discard interaction
- Collapsible panels for Decrees and modifiers
- Icons + numbers instead of text blocks
- Tap-to-expand for deep explanations
- Safe area support for notched devices

See [UI_DESIGN.md](docs/UI_DESIGN.md) for color palette and visual guidelines.
