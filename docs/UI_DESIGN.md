# UI Design Guide

> Visual design system for Tensho Mahjong Roguelike.

**Related Documents:**
- [ARCHITECTURE.MD](../ARCHITECTURE.MD) — Project overview and technical architecture
- [GAME_SYSTEMS.md](GAME_SYSTEMS.md) — Core game systems
- [GAME_MECHANICS.md](GAME_MECHANICS.md) — Detailed scoring and economy mechanics

---

## Design Philosophy

The visual identity follows **Traditional Chinese Mahjong — Premium Feel** aesthetics with a rich forest green base accented by vibrant oranges and golds.

### UI Philosophy (Mobile-First)

- Portrait orientation as default
- Bottom-aligned hand area
- Drag-to-discard interaction
- Collapsible panels for Decrees and modifiers
- Icons + numbers instead of text blocks
- Tap-to-expand for deep explanations
- Safe area support for notched devices

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Forest Green** | `#2D5F4A` | Primary background, game table, card bases |
| **Vibrant Orange** | `#FF5722` | Primary UI elements, buttons, call-to-action |
| **Golden Yellow** | `#FFD54F` | Accents, highlights, score displays |
| **Deep Orange** | `#D84315` | Shadows, pressed states, secondary emphasis |
| **Dark Forest** | `#1C3A2E` | Dark accents, borders, overlay backgrounds |
| **Beige White** | `#F5F5DC` | Tile backgrounds, readable text |
| **Saddle Brown** | `#8B4513` | Tile edges, wood textures, depth |
| **Metallic Gold** | `#C8B273` | Decorative borders, premium accents |

### Semantic Colors

| Purpose | Color | Description |
|---------|-------|-------------|
| **Background** | Forest Green | Main game surface |
| **Primary** | Vibrant Orange | Interactive elements |
| **Primary Dark** | Deep Orange | Pressed/active states |
| **Accent** | Golden Yellow | Highlights and rewards |
| **Text Primary** | Beige White | Main readable text |
| **Text Secondary** | Metallic Gold | Subtitles, labels |
| **Dark Accent** | Dark Forest | Borders, overlays |
| **Border** | Saddle Brown | Tile and card edges |

### Rarity Colors

| Rarity | Color | Usage |
|--------|-------|-------|
| **Common** | `#A0A0A0` (Gray) | Basic decrees |
| **Uncommon** | `#4CAF50` (Green) | Standard unlocks |
| **Rare** | `#2196F3` (Blue) | Special items |
| **Epic** | `#9C27B0` (Purple) | Powerful modifiers |
| **Legendary** | `#FFD700` (Gold) | Ultimate rewards |

---

## Visual Hierarchy

### Design Elements

1. **Borders:** Traditional Chinese geometric patterns with layered borders
2. **Shadows:** Multi-layered shadows for depth (primary + accent shadow)
3. **Gradients:** Subtle gradient overlays for premium feel
4. **Corners:** Rounded corners (8-12px) for modern touch

---

## Layout Guidelines

### Desktop (Landscape)

- Centered game board
- Side panels for decrees/flowers
- Bottom-aligned controls
- Hover states for all interactive elements

### Mobile (Portrait)

- Hand area at bottom (thumb-friendly)
- Minimum touch target: **44×44 pixels**
- Swipe gestures for navigation
- Collapsible top panels
- Safe area padding for notched devices

---

## Typography

| Element | Style | Font Recommendation |
|---------|-------|---------------------|
| **Headers** | Bold sans-serif | System default or Noto Sans CJK |
| **UI Text** | Clean sans-serif | System default |
| **Tile Characters** | Traditional Chinese | LongCang or similar brush font |
| **Numbers** | Tabular figures | Monospace for score alignment |

---

## Implementation Reference

Color constants are defined in `src/styles/theme.ts`:

```typescript
// Primary palette (Tailwind CSS classes)
const colors = {
  forestGreen: '#2D5F4A',
  vibrantOrange: '#FF5722',
  goldenYellow: '#FFD54F',
  deepOrange: '#D84315',
  darkForest: '#1C3A2E',
  beigeWhite: '#F5F5DC',
  saddleBrown: '#8B4513',
  metallicGold: '#C8B273',
}
```

---

## Table Styles System

Analogous to Balatro's deck backs ("shirts"), **Table Styles** are unlockable visual themes that also provide unique starting conditions or passive modifiers for runs.

### Design Philosophy

- Each table represents a different "house" or "parlor" with its own customs
- Visual distinction: table cloth color/pattern, tile back designs, UI accents
- Mechanical distinction: starting bonuses, modified rules, or trade-offs

### Data Model (TypeScript)

```typescript
interface TableStyle {
  id: string
  displayName: string
  description: string
  themeColor: string  // CSS color
  tileBackImage: string
  tableClothImage: string
  startingModifier: TableModifier
  unlockCondition: UnlockRequirement
}
```

### Base Table Styles

| Table | Theme | Starting Modifier |
|-------|-------|-------------------|
| **Green Felt (默认)** | Classic | None (default) |
| **Red Lacquer (朱漆)** | Auspicious | +1 starting Decree slot |
| **Bamboo Mat (竹席)** | Natural | Flowers appear 25% more often |
| **Imperial Gold (金殿)** | Royal | Start with 1 random Regional Mandate |
| **Night Market (夜市)** | Street | Shop prices −20%, but −1 Decree slot |
| **Temple Stone (石庙)** | Austere | No Flowers, but +50% base score |
| **Ghost Parlor (幽亭)** | Haunted | Corrupted Seasons can appear from Act I |
| **Dragon's Den (龙窟)** | Mythic | Yakuman multipliers +1.0×, but higher targets |

### Unlockable Table Styles

| Table | Unlock Condition |
|-------|------------------|
| **Red Lacquer** | Complete Act 3 |
| **Bamboo Mat** | Collect all 4 Flowers in a single run |
| **Imperial Gold** | Win a run with 5+ Decrees |
| **Night Market** | Purchase 20 Decrees across all runs |
| **Temple Stone** | Win without collecting any Flowers |
| **Ghost Parlor** | Survive 3 Corrupted Seasons in one run |
| **Dragon's Den** | Score a Yakuman |

### Visual Theming per Table

| Element | Customized |
|---------|------------|
| Table cloth/mat | Color and pattern |
| Tile backs | Design and color |
| UI accent colors | Buttons, panels, text highlights |
| Ambient effects | Subtle particles, lighting mood |
| Audio theme | Background music variation |

Each playable table has a dedicated 16:9 environment illustration in
`public/assets/illustrations/tables`. The same artwork appears in the run setup
card, selected-table preview, and at low contrast beneath the gameplay surface
so a table choice remains visually recognizable throughout the run.

---

## Design Risks to Monitor

| Risk | Mitigation |
|------|------------|
| Yakuman inflation | Cap frequency/stacking tightly |
| Decree combinatorics | Test interactions exhaustively |
| Shanten forgiveness abuse | Keep as rare decree only |
| Seven Pairs dominance | Balance multiplier carefully |
| Cognitive overload | Progressive disclosure essential |

---

## Why Riichi Mahjong?

- Yaku are already orthogonal scoring units
- Hand legality is rigid (ideal for rule-breaking)
- Shanten is formally defined
- Yakuman are naturally "mythic tier"
- Rich cultural vocabulary for authority/rules
