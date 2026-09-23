# Tensho (天翔) — Mahjong Roguelike

> *"Heavenly Ascent"* — A single-player roguelike that reinterprets Riichi Mahjong as a scoring-driven optimization game, inspired by Balatro.

## About

Tensho is a web-based React game that combines the depth of Riichi Mahjong with roguelike progression mechanics. Build your hand, collect Decrees (rule-bending modifiers), and chase high scores across escalating Acts.

## Setup

This project uses [Bun](https://bun.sh) as the JavaScript runtime and package manager.

### Prerequisites

- Node 22, at least 22.18.0 (`.nvmrc` selects the major version).
- Bun 1.3.3, pinned in `package.json`; CI reads the same pin.

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Testing

```bash
# Unit tests with Vitest
bun run test           # Watch mode
bun run test:run       # Single run

# Release workflow regressions (isolated local Git fixtures)
bun run test:release

# E2E tests with Playwright
bun run test:e2e       # Headless
bun run test:e2e:headed # With browser UI
```

### Linting & Formatting

```bash
bun run lint
bun run format
```

## Tech Stack

- **React 19** — UI framework with experimental React Compiler
- **TypeScript** — Strict mode type safety
- **Vite 6** — Build tool with HMR
- **Tailwind CSS v4** — Utility-first styling
- **React Spring** — Physics-based animations
- **Zustand** — Lightweight state management
- **TanStack Query** — Data fetching & caching
- **i18next** — Internationalization (13 locales)
- **Vitest** — Unit testing framework
- **Playwright** — E2E browser testing
- **PWA** — Offline support, installable app

## Code Statistics

Run `bun run sloc` to calculate source lines of code.

| Extension | Lines |
|-----------|-------|
| .ts       | 48,379 |
| .tsx      | 21,611 |
| .js/.mjs  | 5,242 |
| .json     | 3,112 |
| .md       | 686 |
| .css      | 470 |
| .html     | 109 |
| **Total** | **79,609** |

### Project Structure

| Category | Count |
|----------|-------|
| Zustand Stores | 18 |
| Game Systems | 27 |
| React Components | 59 |
| Unit Test Files | 68 (739 tests passing) |
| E2E Scenarios | 99 (198/198 desktop/mobile checks passing without retries) |
| Supported Locales | 13 |

### Implemented Systems

| System | Items |
|--------|-------|
| Fate Seals | 22 |
| Celestial Orbs | 13 |
| Void Scripts | 20 |
| Imperial Charters | 32 |
| Omen Tags | 24 |
| Boss Mandates | 27 |
| Table Stakes | 8 tiers |
| Decrees | 164 (150 from the authored library + 14 rule-bending) |

## Features

- **Table Loop (experiment)** — A second three-round core loop where every group you play stays on the table, patterns pay before the table is finished, and each score resolves as a readable chain; playable end to end with the keyboard, opening on an authored practice deal, with an optional offers-row variant
- **Tutorial System** — Dismissible contextual guidance that never blocks gameplay
- **Drag & Drop** — Intuitive tile arrangement with touch support
- **Responsive Design** — Mobile-first portrait layout
- **PWA Support** — Install on any device, works offline
- **Localization** — 13 languages supported
- **Accessibility** — Keyboard navigation, screen reader support

## Documentation

- [Monsoon draw implementation](docs/MONSOON_IMPLEMENTATION.md) — Seeded live/bonus draws, non-mutating redraw previews, and remaining Season requirements
- [Summer wall tradeoff](docs/SUMMER_IMPLEMENTATION.md) — Round-only wall reduction, physical tile restoration, and the unfinished Bamboo exception
- [Three-Flower shop unlock](docs/FLOWER_SHOP_IMPLEMENTATION.md) — Eligible offers, packs, Omen guarantees and generated rewards
- [SEO strategy and public guides](docs/SEO_STRATEGY.md) — Search intent, static About/how-to-play/FAQ pages, localization roadmap, and release checks
- [New public-page and scroll illustrations](docs/PUBLIC_SITE_ART.md) — Saved assets, exact generation prompts, and provenance
- [Flora inspector and Season effects](docs/FLORA_IMPLEMENTATION.md) — Localized full-stack details, real Decay discards, Flower protection, safe touch activation, and explicit remaining mechanics gaps
- [Earned Omens and Season lifecycle](docs/OMEN_LIFECYCLE.md) — Real skip acquisition, once-only shop fees, round cleanup, and locked-draw stacking
- [Double Omen and pending rewards](docs/DOUBLE_OMEN_IMPLEMENTATION.md) — Earned copies, immediate/delayed settlement, optional localized disclosure, and new artwork
- [Omen costs and live durations](docs/OMEN_EFFECTS_IMPLEMENTATION.md) — Visible shop fees, effect expiry through skips, Season-lock safety, and release verification
- [Charter progression](docs/CHARTER_PROGRESSION_IMPLEMENTATION.md) — Actual maximum-interest streaks, durable unlocks, and remaining upgrade eligibility requirements
- [Table Loop scroll artwork](docs/TABLE_LOOP_ART.md) — All ten individual generated scrolls, prompts, provenance, and readable rule popups
- [Table Loop release preparation](docs/TABLE_LOOP_RELEASE.md) — Merchant swaps, save compatibility, real-run verification, and remaining release work
- [On-demand screens and offline verification](docs/ROUTE_LOADING_IMPLEMENTATION.md) — Measured first-screen code reductions, accessible loading, failed-download recovery, and retained regression evidence
- [Chrysanthemum/Winter scoring](docs/WINTER_FLOWER_IMPLEMENTATION.md) — Authoritative concealed-play protection, stacked Seasons, and suppression rules
- [Responsive score UI](docs/FORECAST_UI_IMPLEMENTATION.md) — Localized large scores, touch/keyboard exact-value disclosure, mobile actions, and motion-safe counters
- [Settled score display](docs/SCORE_SETTLEMENT_IMPLEMENTATION.md) — Atomic last-play equations, exact penalties/bonuses, independent consecutive plays, and verified zero-score presentation
- [In-flow tutorial guidance](docs/TUTORIAL_CARD_IMPLEMENTATION.md) — Collapsible, untimed lessons, first-move priority, persistent opt-out, and playable open-hint layouts
- [Illustrated beginner guide](docs/BEGINNER_GUIDE_IMPLEMENTATION.md) — Engine-backed shape bonuses, localized explanations, responsive tile examples, and generated guidebook artwork
- [Frostbite scoring](docs/FROSTBITE_IMPLEMENTATION.md) — Decree-only flat-point penalties, stacking, fractional subtotals, and remaining effect semantics
- [Frostbite gold settlement](docs/FROSTBITE_GOLD_IMPLEMENTATION.md) — shared reward calculation, disabled effects, fractional receipts, and remaining economy gaps
- [Decree economy and artwork](docs/DECREE_ECONOMY_IMPLEMENTATION.md) — Wealth Engine scaling, copied gold effects, physical copier positions and the generated portrait
- [Secondary Decree scoring](docs/SECONDARY_SCORING_IMPLEMENTATION.md) — Frostbite's Yaku contribution, disabled powers, copied retrigger amplification and remaining rule choices
- [Decree copying](docs/DECREE_COPY_IMPLEMENTATION.md) — physical copy targets, copied resource benefits/costs and paid shop-to-play verification
- [Imperial Charter artwork](docs/CHARTER_ART.md) — Generated scroll asset, exact prompt, provenance, and responsive card integration
- [Consumable-aware progression comparison](docs/CLASSIC_CONSUMABLE_BALANCE.md) — Real item use, conservative target/cost decisions, 400 matched-seed rows, and the remaining full-hand/Yaku gap
- [Classic balance comparison](docs/CLASSIC_BALANCE_AUDIT.md) — Resource-aware and one-away policies, 600 stored simulation rows, reproducible commands, and interpretation limits
- [Redraw and discard rules](docs/RESOURCE_CYCLING_IMPLEMENTATION.md) — Returned-tile circulation, bonus replacement legality, Purple Seal rewards, and desktop/mobile controls
- [Coordinated progress reset](docs/PROGRESS_RESET_IMPLEMENTATION.md) — Explicit all-store/run reset, preserved preferences, storage failure recovery, and reload verification
- [Confirmation dialogs and exit lifecycle](docs/DIALOG_IMPLEMENTATION.md) — Native modality, safe keyboard focus, localized small-screen layout, and the hidden-new-run exit fix

- [Run results and animation continuity](docs/RUN_RESULTS_IMPLEMENTATION.md) — Localized result layouts, verified victory/Endless transitions, and a screen-shake state-loss fix
- [Release versioning and provenance](docs/RELEASE_IMPLEMENTATION.md) — Atomic version publication, runtime pins, artifact identity, and outstanding live deployment checks
- [Consumable targeting and confirmation](docs/CONSUMABLE_IMPLEMENTATION.md) — Explicit item/target confirmation, ordered copies, range validation, localized penalties, and desktop/mobile verification
- [Play validation and interaction audit](docs/PLAY_VALIDATION.md) — Shared boss legality, Omen forecasts, concealed-rack policy, bounded tile details, and media-error safeguards
- [Shop implementation](docs/SHOP_IMPLEMENTATION.md) — Run-owned purchases, once-only pack settlement, mobile reward selection, and corrected progression measurements
- [Audio implementation](docs/AUDIO_IMPLEMENTATION.md) — Original sound recipes, playback controls, and regression evidence
- [Playable table rules](docs/TABLE_STYLE_RULES.md) — Classic modifiers, unlock conditions, save compatibility, and verification
- [Implementation wrap-up](docs/IMPLEMENTATION_WRAP_UP.md) — Current implementation changes, verification evidence, and the remaining completion audit
- [Gameplay experiments and wild ideas](docs/GAMEPLAY_EXPERIMENTS.md) — Start with the two-minute overview, then explore 118 experiments: persistent hands, combo engines, living tiles, puzzle bosses, avalanche boards, and stranger alternate modes. Includes tradeoffs, prototype priorities, session pitches, subtraction tests, a playtest plan, and a concrete fun-first prototype brief; proposals are distinguished from implementation history.
- [Implementation status](docs/IMPLEMENTATION_STATUS.md) — What is actually connected to a playable loop
- [ARCHITECTURE.MD](ARCHITECTURE.MD) — Game design, systems, and mechanics
- [ITEM_LIBRARIES.md](ITEM_LIBRARIES.md) — Complete item lists (Decrees, Seals, Orbs, etc.)
- [CLAUDE.md](CLAUDE.md) — Development guidance for Claude Code
