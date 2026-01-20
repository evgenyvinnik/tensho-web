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

### Linting & Formatting

```bash
bun run lint
bun run format
```

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **React Spring** — Animations
- **Zustand** — State management
- **TanStack Query** — Data fetching
- **ESLint + Prettier** — Code quality

## Code Statistics

Run `bun run sloc` to calculate source lines of code.

| Extension | Lines |
|-----------|-------|
| .ts       | 15,364 |
| .tsx      | 9,391 |
| .js       | 4,645 |
| .json     | 3,182 |
| .md       | 2,075 |
| .css      | 397 |
| .mjs      | 108 |
| .html     | 25 |
| **Total** | **35,187** |

## Documentation

- [ARCHITECTURE.MD](ARCHITECTURE.MD) — Game design, systems, and mechanics
- [ITEM_LIBRARIES.md](ITEM_LIBRARIES.md) — Complete item lists (Decrees, Seals, Orbs, etc.)
- [CLAUDE.md](CLAUDE.md) — Development guidance for Claude Code
