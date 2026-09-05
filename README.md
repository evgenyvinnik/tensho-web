# Tensho (天翔) — Mahjong Roguelike

> *"Heavenly Ascent"* — A single-player roguelike that reinterprets Riichi Mahjong as a scoring-driven optimization game, inspired by Balatro.

## About

Tensho is a web-based React game that combines the depth of Riichi Mahjong with roguelike progression mechanics. Build your hand, collect Decrees (rule-bending modifiers), and chase high scores across escalating Acts.

## Setup

This project uses [Bun](https://bun.sh) as the JavaScript runtime and package manager.

### Prerequisites

- Install Bun: `curl -fsSL https://bun.sh/install | bash`

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
| Unit Test Files | 30 (329 tests) |
| E2E Scenarios | 30 (60 desktop/mobile checks) |
| Supported Locales | 13 |

### Implemented Systems

| System | Items |
|--------|-------|
| Fate Seals | 22 |
| Celestial Orbs | 13 |
| Void Scripts | 20 |
| Imperial Charters | 32 |
| Omen Tags | 23 |
| Boss Mandates | 27 |
| Table Stakes | 8 tiers |
| Decrees | 164 (150 from the authored library + 14 rule-bending) |

## Features

- **Table Loop (experiment)** — A second three-round core loop where every group you play stays on the table, patterns pay before the table is finished, and each score resolves as a readable chain; playable end to end with the keyboard, with an optional offers-row variant
- **Tutorial System** — Dismissible contextual guidance that never blocks gameplay
- **Drag & Drop** — Intuitive tile arrangement with touch support
- **Responsive Design** — Mobile-first portrait layout
- **PWA Support** — Install on any device, works offline
- **Localization** — 13 languages supported
- **Accessibility** — Keyboard navigation, screen reader support

## Documentation

- [Gameplay experiments and wild ideas](docs/GAMEPLAY_EXPERIMENTS.md) — Design diagnosis, the built Table Loop prototype, 64 experiments, and a playtest plan
- [Implementation status](docs/IMPLEMENTATION_STATUS.md) — What is actually connected to a playable loop
- [ARCHITECTURE.MD](ARCHITECTURE.MD) — Game design, systems, and mechanics
- [ITEM_LIBRARIES.md](ITEM_LIBRARIES.md) — Complete item lists (Decrees, Seals, Orbs, etc.)
- [CLAUDE.md](CLAUDE.md) — Development guidance for Claude Code
