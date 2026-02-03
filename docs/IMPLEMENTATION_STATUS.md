# Implementation Status

> Current implementation status and roadmap for Tensho Mahjong Roguelike.

**Related Documents:**
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Project overview and technical architecture
- [GAME_SYSTEMS.md](GAME_SYSTEMS.md) — Core game systems
- [GAME_MECHANICS.md](GAME_MECHANICS.md) — Detailed scoring and economy mechanics

---

## Implementation Phases

> **Note:** This project was migrated from Unity to React/TypeScript. Status reflects the current web codebase.

### Phase 1: Core Prototype (MVP) ✅

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P0** | Tile Engine | 136-tile Riichi set, Wall, Dead Pool | ✅ Complete |
| **P0** | Hand Detection | Meld recognition, legal hand validation | ✅ Complete |
| **P0** | Shanten Calculator | Distance-to-tenpai computation | ✅ Complete |
| **P0** | Basic Yaku System | Tier 1 yaku detection with multipliers | ✅ Complete |
| **P0** | Scoring Engine | Base score × yaku multipliers | ✅ Complete |
| **P0** | Round Loop | Draw/discard cycle, round completion | ✅ Complete |
| **P0** | Basic UI | Hand display, wall, discard area | ✅ Complete |

### Phase 2: Roguelike Structure ✅

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P1** | Run/Act/Round Structure | Session progression with score targets | ✅ Complete |
| **P1** | Full Yaku System | All 4 tiers including yakuman | ✅ Complete |
| **P1** | Decree System (Basic) | 3-5 starter decrees for rule-bending | ✅ Complete |
| **P1** | Shop System | Between-round decree acquisition | ✅ Complete |
| **P1** | Difficulty Scaling | Increasing score requirements per act | ✅ Complete |

### Phase 3: Full Systems ✅

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P2** | Flowers System | Persistent run-wide modifiers | ✅ Complete |
| **P2** | Seasons System | Round-scoped rule mutations | ✅ Complete |
| **P2** | Full Decree Library | All 155 decree definitions | ✅ Complete |
| **P2** | Tile Marks System | Card modifiers (Enhancements/Seals/Editions) | ✅ Complete |
| **P2** | Consumables | Fate Seals (22), Celestial Orbs (13), Void Scripts (20) | ✅ Complete |
| **P2** | Tea House Shop | Shop generation, pricing, rerolls | ✅ Complete |
| **P2** | Imperial Charters | 32 voucher-style permanent upgrades | ✅ Complete |
| **P2** | Blessing Packs | Booster pack system | ✅ Complete |
| **P2** | Omen Tags | Skip rewards (23 omens) | ✅ Complete |
| **P2** | Boss Mandates | 27 mandate effects (22 standard + 5 showdown) | ✅ Complete |
| **P2** | Table Stakes | 8-tier difficulty system with stickers | ✅ Complete |

### Phase 4: Meta & Polish ⚠️ Partial

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P3** | Meta-Progression | Persistent unlocks across runs | ✅ Complete |
| **P3** | Table Styles/Walls | Unlockable deck variants | ✅ Complete |
| **P3** | Red Fives | Optional tile variants | ✅ Complete |
| **P3** | Tutorial System | Progressive complexity disclosure | ✅ Complete |
| **P3** | Audio/VFX Polish | Feedback and juice | ⚠️ Music complete, **SFX assets missing** |
| **P3** | Archive of Hands | Collection/discovery system | ✅ Complete |

### Phase 5: Platform & Localization ✅

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P4** | PWA Support | Offline-first Progressive Web App | ✅ Complete |
| **P4** | Localization Framework | 13 languages (i18next) | ✅ Complete |
| **P4** | Achievement System | Progress tracking and unlocks | ✅ Complete |

---

## Core Systems Status

| System | Location | Status |
|--------|----------|--------|
| Tile Engine | `src/core/Tile.ts` | ✅ Complete |
| Hand/Meld System | `src/core/Hand.ts`, `src/core/Meld.ts` | ✅ Complete |
| Wall System | `src/core/Wall.ts` | ✅ Complete |
| Shanten Calculator | `src/rules/ShantenCalculator.ts` | ✅ Complete |
| Yaku Detection | `src/rules/YakuDetector.ts` | ✅ Complete |
| Scoring Engine | `src/rules/ScoringEngine.ts` | ✅ Complete |
| Game Orchestrator | `src/game/GameOrchestrator.ts` | ✅ Complete |
| Round Manager | `src/systems/RoundManager.ts` | ✅ Complete |
| Decree System (Basic) | `src/systems/DecreeSystem.ts` | ✅ Complete |
| Flower System | `src/systems/FlowerSystem.ts` | ✅ Complete |
| Season System | `src/systems/SeasonSystem.ts` | ✅ Complete |
| Debuff System | `src/game/DebuffSystem.ts` | ✅ Complete |
| Event Bus | `src/game/EventBus.ts` | ✅ Complete |

---

## Roguelike Systems Status

| Balatro Equivalent | Tensho System | Location | Status |
|--------------------|---------------|----------|--------|
| Card Modifiers | **Tile Marks** (Enhancements, Seals, Editions) | `src/systems/TileModifierSystem.ts`, `src/core/TileModifier.ts` | ✅ Complete |
| Tarot Cards | **Fate Seals** | `src/systems/FateSealSystem.ts` (22 seals) | ✅ Complete |
| Planet Cards | **Celestial Orbs** | `src/systems/CelestialOrbSystem.ts` (13 orbs) | ✅ Complete |
| Spectral Cards | **Void Scripts** | `src/systems/VoidScriptSystem.ts` (20 scripts) | ✅ Complete |
| Vouchers | **Imperial Charters** | `src/systems/CharterSystem.ts`, `src/config/charterDefinitions.ts` (32 charters) | ✅ Complete |
| Booster Packs | **Blessing Packs** | `src/systems/BlessingPackSystem.ts`, `src/config/packDefinitions.ts` | ✅ Complete |
| Tags | **Omen Tags** | `src/systems/OmenTagSystem.ts`, `src/config/omenDefinitions.ts` (23 omens) | ✅ Complete |
| Stakes | **Table Stakes** | `src/systems/TableStakeSystem.ts`, `src/config/stakeDefinitions.ts` (8 tiers) | ✅ Complete |
| Boss Blind Effects | **Boss Mandate Effects** | `src/systems/MandateEffectSystem.ts`, `src/config/mandateDefinitions.ts` (27 mandates) | ✅ Complete |
| The Shop | **Tea House** | `src/systems/TeaHouseSystem.ts`, `src/systems/ShopGenerator.ts`, `src/systems/PricingCalculator.ts` | ✅ Complete |
| Stickers | **Stickers** | `src/systems/StickerSystem.ts` (Eternal, Perishable, Rental) | ✅ Complete |
| Consumables | **Consumable System** | `src/systems/ConsumableSystem.ts` | ✅ Complete |
| Decks | **Walls/Table Styles** | `src/systems/TableStyleSystem.ts`, `src/config/tableStyleDefinitions.ts` (8 styles) | ✅ Complete |
| Collection | **Archive of Hands** | `src/systems/ArchiveSystem.ts`, `src/stores/archiveStore.ts` (352+ items) | ✅ Complete |
| Red Fives | **Red Fives** | `src/systems/RedFiveSystem.ts` (+50 chips per red five) | ✅ Complete |
| Meta-Progression | **Meta-Progression** | `src/systems/MetaProgressionSystem.ts`, `src/config/unlockDefinitions.ts` | ✅ Complete |
| Audio/SFX | **Audio System** | `src/systems/AudioSystem.ts`, `src/config/audioDefinitions.ts` | ⚠️ Music complete (4 tracks), SFX assets missing |
| VFX/Juice | **VFX System** | `src/systems/VFXSystem.ts`, `src/hooks/useVFX.tsx` | ✅ Complete |

---

## UI/Screens Status

| Component | Status |
|-----------|--------|
| Gameplay Screen | ✅ Implemented |
| Menu Screen | ✅ Implemented |
| Shop Screen | ✅ Implemented |
| Settings Screen | ✅ Implemented |
| Tutorial System | ✅ Implemented |
| Tile Components | ✅ Implemented |
| Hand Display | ✅ Implemented |
| Consumables UI | ✅ Implemented |

---

## State Management Status

| Store | Location | Status |
|-------|----------|--------|
| Game Store | `src/stores/gameStore.ts` | ✅ Complete |
| Hand Store | `src/stores/handStore.ts` | ✅ Complete |
| Wall Store | `src/stores/wallStore.ts` | ✅ Complete |
| Decree Store | `src/stores/decreeStore.ts` | ✅ Complete |
| Flora Store | `src/stores/floraStore.ts` | ✅ Complete |
| Settings Store | `src/stores/settingsStore.ts` | ✅ Complete |
| Achievement Store | `src/stores/achievementStore.ts` | ✅ Complete |
| Tile Mark Store | `src/stores/tileMarkStore.ts` | ✅ Complete |
| Charter Store | `src/stores/charterStore.ts` | ✅ Complete |
| Omen Store | `src/stores/omenStore.ts` | ✅ Complete |
| Pack Store | `src/stores/packStore.ts` | ✅ Complete |
| Shop Store | `src/stores/shopStore.ts` | ✅ Complete |
| Stake Store | `src/stores/stakeStore.ts` | ✅ Complete |
| Consumable Store | `src/stores/consumableStore.ts` | ✅ Complete |
| Table Style Store | `src/stores/tableStyleStore.ts` | ✅ Complete |
| Archive Store | `src/stores/archiveStore.ts` | ✅ Complete |
| Progression Store | `src/stores/progressionStore.ts` | ✅ Complete |

---

## Implementation Roadmap (Legacy Reference)

> The following systems were previously in the roadmap but are now fully implemented.

### Priority 1: Tile Marks System (Card Modifiers) ✅

**Files created:**
- `src/core/TileModifiers.ts` — Types for Enhancement, Seal, Edition
- `src/systems/TileMarkSystem.ts` — Apply/remove marks, scoring integration
- `src/components/tiles/MarkedTile.tsx` — Visual display of marked tiles

### Priority 2: Consumables (Fate Seals, Celestial Orbs, Void Scripts) ✅

**Files created:**
- `src/systems/ConsumableSystem.ts` — Base consumable management
- `src/systems/FateSealSystem.ts` — Tarot-equivalent effects
- `src/systems/CelestialOrbSystem.ts` — Planet-equivalent yaku upgrades
- `src/systems/VoidScriptSystem.ts` — Spectral-equivalent risky effects
- `src/stores/consumableStore.ts` — Consumable inventory state
- `src/components/ui/ConsumableCard.tsx` — UI for consumables

### Priority 3: Shop System (Tea House) ✅

**Files created:**
- `src/systems/TeaHouseSystem.ts` — Item generation, pricing, rerolls
- `src/systems/PricingCalculator.ts` — Cost formulas with discounts
- `src/stores/shopStore.ts` — Shop state management
- `src/components/screens/ShopScreen.tsx` — Full shop UI

### Priority 4: Imperial Charters (Vouchers) ✅

**Files created:**
- `src/systems/CharterSystem.ts` — Permanent upgrade management
- `src/stores/charterStore.ts` — Owned charters state

### Priority 5: Blessing Packs (Booster Packs) ✅

**Files created:**
- `src/systems/BlessingPackSystem.ts` — Pack generation and opening
- `src/components/ui/PackOpening.tsx` — Pack opening UI/animation

### Priority 6: Omen Tags ✅

**Files created:**
- `src/systems/OmenTagSystem.ts` — Tag rewards for skipping
- `src/stores/omenStore.ts` — Active tags state

### Priority 7: Table Stakes (Difficulty Tiers) ✅

**Files created:**
- `src/systems/TableStakeSystem.ts` — Stake modifiers and unlocks
- Extended `RoundManager.ts` with stake-based scaling

### Priority 8: Boss Mandate Effects ✅

**Files created:**
- `src/systems/MandateEffectSystem.ts` — Apply mandate restrictions
- Integrated with `GameOrchestrator.ts` round flow

---

## Known Integration Gaps

> Most critical integration gaps have been resolved. Remaining items are polish/enhancement issues.

### Resolved ✅

| Issue | Resolution |
|-------|------------|
| Consumable actions not executable | Added `useSeal` and `useScript` cases to `GameOrchestrator.executeAction()` |
| Shop uses placeholder consumables | `TeaHouseSystem.ts` now imports real types from `FateSealSystem` and `CelestialOrbSystem` |
| Pack system uses hardcoded items | `BlessingPackSystem.ts` now imports from real `FateSealSystem`, `CelestialOrbSystem`, `VoidScriptSystem` |
| Gameplay consumables placeholder | `GameplayScreen.tsx` now uses real consumable data from `useGameController()` |
| Consumables UI not connected | Added consumable selection panel with use functionality |
| Shop purchase handler missing consumables | `ShopScreen.tsx` `handleItemPurchase()` now adds FateSeal, CelestialOrb, VoidScript to `consumableStore` |
| Pack opening missing non-Decree content | `ShopScreen.tsx` `handlePackConfirm()` now adds consumables from packs to inventory |

### Remaining (Low Priority)

| Issue | Location | Description |
|-------|----------|-------------|
| SFX assets missing | `public/assets/sfx/` | Directory doesn't exist; `SOUND_EFFECT_CONFIG` has placeholder paths. Music (4 tracks) works. |
| ActionProcessor validation incomplete | `src/game/ActionProcessor.ts:404-443` | `validateUseSeal` and `validateUseScript` only check ID exists, not ownership/targets |

### To Fix

1. Add SFX assets to `public/assets/sfx/` or implement graceful silent fallback
2. Complete ActionProcessor validation for consumable actions (optional - basic validation works)
