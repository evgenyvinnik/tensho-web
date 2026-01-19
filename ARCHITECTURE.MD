# Tensho (天翔) — Mahjong Roguelike

> *"Heavenly Ascent"* — A single-player roguelike that reinterprets Riichi Mahjong as a scoring-driven optimization game.

---

## 🎴 Five-Layer System Model

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

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Implementation Priorities](#-implementation-priorities)
3. [Core Systems to Build](#-core-systems-to-build)
4. [Game Rules & Mechanics](#-game-rules--mechanics)
5. [Technical Architecture](#-technical-architecture)
6. [UI Design Guide](#ui-design-guide)
7. [Design Reference](#-design-reference)
8. [Mahjong-First Analog Systems](#-mahjong-first-analog-systems-balatro-inspired-original)
9. [Progression & Meta Systems](#-progression--meta-systems-mahjong-themed-original)
10. [Core Game Mechanics](#-core-game-mechanics)
11. [Meta Systems](#-meta-systems)

**📚 Related Documents:**
- [ITEM_LIBRARIES.md](ITEM_LIBRARIES.md) — Complete item lists for all game systems

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Engine** | Unity 6 (6000.0.23f1+) |
| **Platforms** | iOS, iPadOS, Android, Steam (Windows/macOS/Linux) |
| **Rendering** | 2D (UI-heavy, tile-based) |
| **Orientation** | Portrait-first (mobile), Landscape (desktop) |

**Core Concept:** Replace multiplayer opposition with systemic pressure, rule mutation, and probabilistic risk management while preserving Mahjong's combinatorial depth.

### Design Pillars

1. **Mahjong-first authenticity** — Traditional terminology, no card-game abstractions
2. **Roguelike structure** — Run-based progression with meta-unlocks
3. **Rule-bending through authority** — Decrees alter rules explicitly, not randomly
4. **Mobile clarity** — Progressive disclosure, touch-first, iconography over text

---

## 🎯 Implementation Priorities

### Phase 1: Core Prototype (MVP)

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P0** | Tile Engine | 136-tile Riichi set, Wall, Dead Pool | ✅ Complete |
| **P0** | Hand Detection | Meld recognition, legal hand validation | ✅ Complete |
| **P0** | Shanten Calculator | Distance-to-tenpai computation | ✅ Complete |
| **P0** | Basic Yaku System | Tier 1 yaku detection with multipliers | ✅ Complete |
| **P0** | Scoring Engine | Base score × yaku multipliers | ✅ Complete |
| **P0** | Round Loop | Draw/discard cycle, round completion | ✅ Complete |
| **P0** | Basic UI | Hand display, wall, discard area | ✅ Complete |

### Phase 2: Roguelike Structure

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P1** | Run/Act/Round Structure | Session progression with score targets | ✅ Complete |
| **P1** | Full Yaku System | All 4 tiers including yakuman | ✅ Complete |
| **P1** | Decree System (Basic) | 3-5 starter decrees for rule-bending | ✅ Complete |
| **P1** | Shop System | Between-round decree acquisition | ✅ Complete |
| **P1** | Difficulty Scaling | Increasing score requirements per act | ✅ Complete |

### Phase 3: Full Systems

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P2** | Flowers System | Persistent run-wide modifiers | ✅ Complete |
| **P2** | Seasons System | Round-scoped rule mutations | ✅ Complete |
| **P2** | Full Decree Library | All 5 decree categories | ✅ Complete |
| **P2** | Corrupted Seasons | Late-game negative modifiers | ✅ Complete |
| **P2** | Flower-Decree Interactions | Cross-system synergies | ✅ Complete |

### Phase 4: Meta & Polish

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P3** | Meta-Progression | Persistent unlocks across runs | ✅ Complete |
| **P3** | Table Styles | Unlockable table themes with starting modifiers | ✅ Complete |
| **P3** | Red Fives | Optional tile variants | ⬜ Not Started |
| **P3** | Advanced Decrees | Rare/Mythic tier decrees | ✅ Complete |
| **P3** | Tutorial System | Progressive complexity disclosure | ✅ Complete |
| **P3** | Audio/VFX Polish | Feedback and juice | ✅ Complete |

### Phase 5: Monetization & Localization

| Priority | System | Description | Status |
|----------|--------|-------------|--------|
| **P4** | Unity Ads Integration | Interstitial ads after each Act | ✅ Complete |
| **P4** | IAP System | Remove ads purchase ($1.99) | ✅ Complete |
| **P4** | Localization Framework | Multi-language support | ✅ Complete |
| **P4** | Achievement System | Progress tracking and unlocks | ✅ Complete |

---

## 🔧 Core Systems to Build

### 1. Tile System (P0)

**Data Model:**
```csharp
// Standard Tiles (136 total: 34 unique × 4 copies)
Tile {
  Suit: Manzu | Pinzu | Souzu | Honor
  Rank: 1-9 (suited) | Wind/Dragon (honors)
  IsRed: bool (for red fives)
  Id: unique identifier
}

Wall {
  Tiles[144]: shuffled array (136 standard + 8 bonus)
  DrawIndex: current position
  DeadWall[14]: reserved tiles for replacements
}

DeadPool {
  Discards[]: tiles that cannot be redrawn
}
```

**Tile Composition:**

| Category | Tiles | Count |
|----------|-------|-------|
| **Manzu (Characters)** | 1-9 × 4 copies | 36 |
| **Pinzu (Circles)** | 1-9 × 4 copies | 36 |
| **Souzu (Bamboo)** | 1-9 × 4 copies | 36 |
| **Winds** | East, South, West, North × 4 | 16 |
| **Dragons** | White, Green, Red × 4 | 12 |
| **Flowers** | Plum, Orchid, Chrysanthemum, Bamboo | 4 |
| **Seasons** | Spring, Summer, Autumn, Winter | 4 |
| **Total** | | **144** |

**Key Operations:**
- Initialize 144-tile set (136 standard + 8 bonus)
- Shuffle with deterministic RNG (seeded)
- Draw from wall
- Discard to dead pool
- Handle bonus tile replacement draws

---

### 1b. Bonus Tiles System (P2)

The game includes **8 bonus tiles** that exist outside normal hand play but trigger systemic effects.

**Bonus Tile Set:**

| Type | Tiles | Japanese | Count |
|------|-------|----------|-------|
| **Flowers** | Plum, Orchid, Chrysanthemum, Bamboo | 梅, 兰, 菊, 竹 | 4 |
| **Seasons** | Spring, Summer, Autumn, Winter | 春, 夏, 秋, 冬 | 4 |

**Data Model:**
```csharp
BonusTile {
  Type: Flower | Season
  Name: string
  Id: unique identifier
}

FloraTrack {
  Flowers[]: collected flower tiles (run-wide)
  Seasons[]: active season tiles (round-scoped)
}
```

**Acquisition Rules:**
1. Bonus tiles are shuffled into the Wall (total: 136 + 8 = 144 tiles)
2. When drawn, they are **immediately revealed**
3. Tile is added to the **Flora Track** (not the hand)
4. Player draws a **replacement tile** from the dead wall
5. Bonus tiles **do not count** toward the 13-tile hand

**Behavior Difference:**

| Aspect | Flowers | Seasons |
|--------|---------|---------|
| **Scope** | Run-wide (persistent) | Round-scoped (temporary) |
| **Duration** | Entire session | Cleared after round |
| **Stacking** | Accumulate across rounds | Stack within current round |
| **Effect Type** | Passive scaling bonuses | Global rule modifications |

**Integration:**
- Flowers feed into the **Flowers System** (see Section 6)
- Seasons feed into the **Seasons System** (see Section 7)
- Both can interact with **Decrees** for synergy effects

---

### 2. Hand & Meld System (P0)

**Hand Structure:**
```csharp
Hand {
  Tiles[13-14]: current tiles
  Melds[]: declared melds (open)
  ConcealedMelds[]: for scoring only
}

Meld {
  Type: Sequence | Triplet | Quad | Pair
  Tiles[3-4]: component tiles
  IsConcealed: bool
}
```

**Required Algorithms:**
- **Hand Parser:** Decompose 14 tiles into valid meld combinations
- **Shanten Calculator:** Minimum tiles needed to reach tenpai
- **Tenpai Detector:** Identify waiting tiles
- **Legal Hand Validator:** Confirm 4 melds + 1 pair (or special forms)

---

### 3. Yaku Detection System (P0/P1)

**Yaku as ScriptableObjects:**
```csharp
YakuDefinition {
  Id: string
  DisplayName: string
  Tier: 1-4
  Multiplier: float
  Conditions: YakuCondition[]
  RequiresConcealed: bool
}
```

**Yaku Multiplier Table:**

| Tier | Yaku | Multiplier |
|------|------|------------|
| 1 | Riichi | ×1.2 |
| 1 | Tanyao | ×1.3 |
| 1 | Pinfu | ×1.3 |
| 1 | Yakuhai | ×1.2 |
| 1 | Menzen Tsumo | ×1.3 |
| 2 | Iipeikou | ×1.6 |
| 2 | Sanshoku Doujun | ×1.8 |
| 2 | Ittsu | ×2.0 |
| 2 | Toitoi | ×2.0 |
| 2 | Chanta | ×1.8 |
| 2 | Honroutou | ×2.2 |
| 3 | Honitsu | ×2.5 |
| 3 | Chinitsu | ×3.0 |
| 3 | Ryanpeikou | ×3.2 |
| 3 | Junchan | ×2.8 |
| 3 | Seven Pairs | ×2.6 |
| 4 | Kokushi Musou | +×5.0 |
| 4 | Suu Ankou | +×4.5 |
| 4 | Dai San Gen | +×4.0 |
| 4 | Chinroutou | +×4.2 |
| 4 | Chuuren Poutou | +×5.5 |

---

### 4. Scoring Engine (P0)

**Formula:**
```
Final Score = Base Score 
            × Π(Yaku Multipliers) 
            × Π(Decree Modifiers) 
            × Flower Scaling 
            × Seasonal Effects
```

**Base Score:**
- Standard: `100 × number of melds`
- Special hands (Seven Pairs, Kokushi) override base calculation

---

### 5. Decree System (P1/P2)

#### Core Concept: Decrees (役令 / 法令)

**Decrees** represent overriding rule mandates issued by the "table," "heavens," or "court."

They:
- **Persist across rounds** within a run
- **Rewrite legality or scoring** semantics
- **Stack under controlled constraints**

Conceptually: a Decree is not a tile, but a **binding rule of play**.

> *"Mahjong does not break rules with clowns; it bends them with authority."*

This is the cleanest semantic replacement for the "Joker" concept—grounded in Mahjong's cultural vocabulary for rule authority.

**Decree as ScriptableObject:**
```csharp
DecreeDefinition {
  Id: string
  DisplayName: string
  Category: Structural | TileIdentity | YakuDoctrine | Entropy | Scaling
  Rarity: LocalEdict | RegionalMandate | ImperialDecree | HeavenlyOrdinance
  Effect: DecreeEffect (scriptable behavior)
  FlowerRequirement: int (optional)
}
```

---

#### 5a. Taxonomy of Decrees

##### A. Structural Decrees (形法令)

Alter what constitutes a legal hand. These mirror "illegal hands made legal," which is culturally coherent.

| Decree | Effect |
|--------|--------|
| **Broken Chow Edict** | Sequences may skip one rank |
| **False Eye Mandate** | One meld may serve as the pair |
| **Compressed Kong Ordinance** | Kongs resolve as pungs |
| **Open Hand Tolerance** | Menzen-only yaku allowed while open |

##### B. Tile Identity Decrees (变牌法令)

Alter what tiles represent. Maps directly to traditional "heaven tile" mythology.

| Decree | Effect |
|--------|--------|
| **Honor Transmutation** | Honors may count as suited tiles |
| **Phantom Terminal** | One terminal per hand is assumed present |
| **Celestial Wildcard** | One tile may impersonate another |
| **Suit Bleed** | Honors count as any suit |

##### C. Yaku Doctrine Decrees (役变法令)

Alter yaku definition or hierarchy. Reframes rule-breaking as doctrinal reinterpretations, not cheats.

| Decree | Effect |
|--------|--------|
| **Corrupted Pinfu Canon** | Pinfu scores higher with pungs |
| **Tanyao Dispensation** | Terminals allowed in Tanyao |
| **Yakuman Succession** | Certain yaku may ascend to yakuman |
| **Inverted Scoring** | Low-tier yaku gain bonus multipliers |

##### D. Entropy & Fate Decrees (天运法令)

Alter probability flow and tempo. Aligns with "Heaven, Earth, Man" fortune concepts.

| Decree | Effect |
|--------|--------|
| **Dead Wall Writ** | One draw per hand may come from discards |
| **Extended Hand Grant** | +3 draws before failure |
| **Shanten Clemency** | Hands may score at 1-shanten |
| **Fate Reweaving** | Redraw up to 3 tiles once per round |

##### E. Scaling & Discipline Decrees (修行法令)

Reward commitment and repetition. These feel like training vows, not card-game tricks.

| Decree | Effect |
|--------|--------|
| **Pure Suit Asceticism** | Dominant suit tiles scale multiplicatively |
| **Closed-Hand Austerity** | Concealed hands gain exponential growth |
| **Yaku Repetition Charter** | Identical yaku across rounds compound |
| **Terminal Devotion** | Each terminal adds +5% to final score |

---

#### 5b. Rarity Bands

Thematic consistency mirrors Mahjong's cultural framing of authority:

| Tier | Name | Narrative Role | Power Level |
|------|------|----------------|-------------|
| Common | **Local Edicts** | Minor table customs | Small bonuses |
| Uncommon | **Regional Mandates** | House rules | Moderate effects |
| Rare | **Imperial Decrees** | Court-sanctioned exceptions | Strong rule-bending |
| Mythic | **Heavenly Ordinances** | Cosmological lawbreaking | Run-defining |

---

#### 5c. Integration with Other Systems

**Hierarchy of Authority:**
```
Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles)
```

**Cross-System Interactions:**

| Interaction | Effect |
|-------------|--------|
| Flowers empower Decrees | +10% Decree effect per Flower collected |
| Seasons temporarily override Decrees | Season effects take precedence |
| Certain Decrees require Flowers | e.g., Yakuman Succession needs 2+ Flowers |
| Corrupted Seasons suspend Decrees | Frostbite halves all Decree effects |

**Player Mental Model:**

| Balatro Term | Tensho Term |
|--------------|-------------|
| Joker | Decree |
| Blind | Round Mandate |
| Ante | Act Pressure |
| Deck | Wall |
| Run | Session |

The player understands they are operating under **evolving rules**, not stacking random effects.

---

#### 5d. Decree Library (v1)

For a full, expanded list of Decrees with triggers, rarity, and design notes, see
[decrees.md](decrees.md).

**Featured Decrees (sample):**

| Decree | Category | Rarity | Effect (summary) |
|--------|----------|--------|------------------|
| **Broken Stair Edict** | Structural | Uncommon | Sequences may skip one rank. |
| **False Eye Mandate** | Structural | Rare | One meld may act as the pair. |
| **Honor Transmutation** | Tile Identity | Rare | Honors may count as a chosen suit. |
| **Celestial Wildcard** | Tile Identity | Mythic | One tile per hand may impersonate any tile. |
| **Tanyao Dispensation** | Yaku Doctrine | Uncommon | Terminals allowed in Tanyao. |
| **Yakuman Succession** | Yaku Doctrine | Mythic | Certain yaku may ascend to yakuman. |
| **Dead Wall Writ** | Entropy & Fate | Uncommon | One draw per hand may come from the Dead Pool. |
| **Extended Hand Grant** | Entropy & Fate | Common | +3 draws before failure each round. |
| **Pure Suit Asceticism** | Scaling | Rare | Dominant suit tiles scale multiplicatively. |
| **Closed-Hand Austerity** | Scaling | Rare | Concealed hands gain exponential scaling. |
| **River Tax** | Entropy & Fate | Common | Each discard yields small gold. |
| **Moonlit Seal** | Scaling | Uncommon | Honor tiles add a stacking multiplier. |

### 6. Flowers & Seasons System (P2)

#### Design Rationale

In classical Mahjong, Flowers and Seasons:
- Do not participate in hand structure
- Provide flat bonus value
- Are resolved immediately on draw

**In a roguelike, this is wasteful.** We reinterpret them as a strategic axis:

| System | Role |
|--------|------|
| **Tiles** | Combinatorial optimization |
| **Yaku** | Scoring grammar |
| **Decrees** | Rule-breaking |
| **Flowers** | Persistent scaling |
| **Seasons** | Temporal pressure |

Drawing bonus tiles is always beneficial, but *how* they benefit depends on build state.

#### Structural Split

| Type | Scope | Duration | Function |
|------|-------|----------|----------|
| **Flowers** | Run-wide | Persistent | Scaling, identity, economy |
| **Seasons** | Round-wide | Temporary | Tempo, pressure, distortion |

This asymmetry is critical for strategic texture.

---

### 6a. Flowers: Persistent Modifiers (Meta-Scaling)

Flowers accumulate over the run and stack multiplicatively or conditionally.

**Base Flower Effects:**

| Flower | Japanese | Effect |
|--------|----------|--------|
| **Plum** | 梅 | +5% score per completed sequence |
| **Orchid** | 兰 | +5% score per honor tile used |
| **Chrysanthemum** | 菊 | +5% score per concealed meld |
| **Bamboo** | 竹 | +5% score per terminal used |

*These are intentionally low magnitude but high-frequency.*

**Flower Set Synergies:**

Collecting multiple flowers unlocks latent passives:

| Set | Bonus |
|-----|-------|
| Any 2 Flowers | +1 Decree slot |
| Any 3 Flowers | Unlock Flower-triggered Decrees in shop |
| All 4 Flowers | All Flowers gain double effectiveness |

This creates a parallel collection game orthogonal to tile efficiency.

**Advanced Flower Mutations (Unlockable):**

Later unlocks transform flowers into identity-altering systems:

| Flower | Mutation Effect |
|--------|-----------------|
| **Plum** | Sequences may overlap by one tile |
| **Orchid** | Dragons count as double honors |
| **Chrysanthemum** | Concealed hands gain exponential scaling |
| **Bamboo** | Terminals act as wild adjacency anchors |

These are run-defining when combined with Decrees.

**Flowers as Decree Catalysts:**

Flowers do not break rules directly—but they empower Decrees:

| Interaction | Effect |
|-------------|--------|
| Structural Decrees | +10% effect per Flower collected |
| Yaku Mutation Decrees | May consume a Flower instead of gold |
| Yakuman Succession | Requires at least 2 Flowers to activate |

This prevents Decree dominance while encouraging cross-system builds.

---

### 6b. Seasons: Temporal Rule Mutations

Seasons affect only the current round, acting like global modifiers.

**Base Season Effects:**

| Season | Japanese | Effect |
|--------|----------|--------|
| **Spring** | 春 | +2 draws per hand |
| **Summer** | 夏 | Base score +30%, wall size −20% |
| **Autumn** | 秋 | Yaku multipliers +20%, discard pool grows |
| **Winter** | 冬 | Hand legality loosened, but score −25% |

*These introduce tempo-risk tradeoffs, not raw power.*

**Seasonal Stack Behavior:**
- Seasons stack if multiple are drawn
- Order matters (first drawn applies first)
- Seasonal effects are cleared after the round

This creates intentional volatility, analogous to escalating pressure.

**Corrupted Seasons (Act II+):**

From Act II onward, Corrupted Seasons may appear as environmental threats:

| Corrupted Season | Effect |
|------------------|--------|
| **Drought** | Flowers are suppressed this round |
| **Monsoon** | Draw order is randomized |
| **Frostbite** | Decree effects are halved |
| **Decay** | Each discard reduces score floor |

These replace multiplayer threat with environmental hostility.

---

### 6c. Flower–Season Interactions

Certain combinations produce emergent effects (not listed explicitly in UI):

| Combination | Emergent Effect |
|-------------|-----------------|
| Chrysanthemum + Winter | Concealed hands ignore Winter's score penalty |
| Bamboo + Summer | Terminal-heavy hands negate wall shrinkage |
| Plum + Autumn | Sequences generate discard-pool recursion |
| Orchid + Spring | Honor draws grant additional replacement draw |

This rewards system literacy rather than rote optimization.

---

## 🎮 Game Rules & Mechanics

### Core Game Loop

```
START RUN
│
├── ACT 1
│   ├── Round 1 → Score Target: 500
│   ├── Round 2 → Score Target: 750
│   ├── Round 3 → Score Target: 1000
│   └── [SHOP] Acquire Decrees
│
├── ACT 2
│   ├── Round 1 → Score Target: 1500
│   ├── ...
│   └── [SHOP]
│
└── ... (escalating difficulty)
│
END RUN (failure to meet target OR victory)
```

### Round Flow

1. **Setup:** Wall initialized, draw 13 tiles
2. **Play Loop:**
   - Draw tile from wall
   - (Optional) Declare meld
   - Discard tile to Dead Pool
   - Check for tenpai/win
3. **Resolution:**
   - If legal hand formed → Calculate score
   - If wall exhausted → Round failed
4. **Evaluation:**
   - Score ≥ Target → Proceed
   - Score < Target → Run ends

### System Hierarchy

```
Heaven  → Seasons    (highest authority, temporary)
Court   → Decrees    (persistent rule modifications)
Nature  → Flowers    (passive scaling)
Table   → Tiles      (material components)
Grammar → Yaku       (scoring language)
```

This hierarchy governs conflict resolution and effect stacking order.

### Difficulty Scaling Mechanisms

- Higher score targets per act
- Reduced wall size
- Forced tile pollution
- Decree slot pressure
- Negative Decrees (e.g., "All hands must include an honor")
- Corrupted Seasons

---

## 🏗 Technical Architecture

### Unity Project Structure

```
Assets/
├── Scripts/
│   ├── Core/
│   │   ├── Tile.cs
│   │   ├── Wall.cs
│   │   ├── Hand.cs
│   │   ├── Meld.cs
│   │   └── DeadPool.cs
│   ├── Rules/
│   │   ├── HandValidator.cs
│   │   ├── ShantenCalculator.cs
│   │   ├── YakuDefinition.cs
│   │   ├── YakuDetector.cs
│   │   └── ScoringEngine.cs
│   ├── Systems/
│   │   ├── DecreeDefinition.cs
│   │   ├── FlowerDefinition.cs
│   │   ├── FlowerSystem.cs
│   │   ├── SeasonDefinition.cs
│   │   ├── SeasonSystem.cs
│   │   └── Shop/
│   │       ├── ShopManager.cs
│   │       ├── ShopOffer.cs
│   │       └── DecreeInventory.cs
│   ├── GameFlow/
│   │   ├── GameManager.cs
│   │   ├── GameState.cs
│   │   └── RoundManager.cs
│   ├── UI/
│   │   ├── TileDisplay.cs
│   │   ├── HandDisplay.cs
│   │   ├── TileSpriteMapping.cs
│   │   ├── Screens/
│   │   │   ├── SplashScreenUI.cs
│   │   │   ├── MainMenuUI.cs
│   │   │   ├── GameplayUI.cs
│   │   │   ├── ShopUI.cs
│   │   │   ├── GameOverUI.cs
│   │   │   ├── PauseMenuUI.cs
│   │   │   └── SettingsUI.cs
│   │   └── Components/
│   │       ├── DecreeCardUI.cs
│   │       ├── FlowerTrackUI.cs
│   │       ├── SeasonIndicatorUI.cs
│   │       ├── ScoreDisplayUI.cs
│   │       └── YakuListUI.cs
│   ├── Audio/
│   │   ├── AudioManager.cs
│   │   └── UIButtonSFX.cs
│   ├── VFX/
│   │   ├── TileAnimator.cs
│   │   ├── ScorePopupAnimator.cs
│   │   ├── YakuRevealAnimator.cs
│   │   ├── UIFeedbackEffects.cs
│   │   └── ScreenTransitions.cs
│   ├── Tutorial/
│   │   ├── TutorialManager.cs
│   │   ├── TutorialStep.cs
│   │   ├── TutorialOverlay.cs
│   │   ├── TutorialFlow.cs
│   │   ├── TutorialFlowStep.cs
│   │   ├── TutorialFlowController.cs
│   │   ├── TileDescriptor.cs
│   │   └── TutorialRunConfig.cs
│   ├── Localization/
│   │   ├── LocalizationManager.cs
│   │   └── LocalizedTextBinder.cs
│   ├── Monetization/
│   │   ├── AdManager.cs
│   │   └── IAPManager.cs
│   ├── Meta/
│   │   ├── AchievementDefinition.cs
│   │   ├── AchievementManager.cs
│   │   ├── MetaProgressionManager.cs
│   │   ├── TableStyleDefinition.cs
│   │   └── SaveManager.cs
│   └── Editor/
│       └── ScriptableObjectGenerator.cs
├── ScriptableObjects/
│   ├── Yaku/           (21 yaku definitions)
│   ├── Decrees/        (20+ decree definitions)
│   ├── Flowers/        (4 flower definitions)
│   ├── Seasons/        (8 season definitions)
│   ├── TableStyles/    (8 table style definitions)
│   └── Achievements/   (15+ achievement definitions)
└── Prefabs/
    ├── Tiles/
    └── UI/
```

### Architecture Goals

- **Data-driven rules** — ScriptableObjects for all game content
- **Deterministic RNG** — Seeded random for reproducibility
- **Separation of concerns** — Rules engine completely independent from UI
- **Modular systems** — Each system (Decree/Flower/Season) pluggable
- **Platform abstraction** — Monetization behind interfaces for easy swapping

### UI Philosophy (Mobile-First)

- Portrait orientation as default
- Bottom-aligned hand area
- Drag-to-discard interaction
- Collapsible panels for Decrees and modifiers
- Icons + numbers instead of text blocks
- Tap-to-expand for deep explanations
- Safe area support for notched devices

### UI Design Guide

The visual identity follows **Traditional Chinese Mahjong — Premium Feel** aesthetics with a rich forest green base accented by vibrant oranges and golds.

#### Color Palette

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

#### Semantic Colors

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

#### Rarity Colors

| Rarity | Color | Usage |
|--------|-------|-------|
| **Common** | `#A0A0A0` (Gray) | Basic decrees |
| **Uncommon** | `#4CAF50` (Green) | Standard unlocks |
| **Rare** | `#2196F3` (Blue) | Special items |
| **Epic** | `#9C27B0` (Purple) | Powerful modifiers |
| **Legendary** | `#FFD700` (Gold) | Ultimate rewards |

#### Visual Hierarchy

1. **Borders:** Traditional Chinese geometric patterns with layered borders
2. **Shadows:** Multi-layered shadows for depth (primary + accent shadow)
3. **Gradients:** Subtle gradient overlays for premium feel
4. **Corners:** Rounded corners (8-12px) for modern touch

#### Layout Guidelines

**Desktop (Landscape):**
- Centered game board
- Side panels for decrees/flowers
- Bottom-aligned controls
- Hover states for all interactive elements

**Mobile (Portrait):**
- Hand area at bottom (thumb-friendly)
- Minimum touch target: **44×44 pixels**
- Swipe gestures for navigation
- Collapsible top panels
- Safe area padding for notched devices

#### Typography

| Element | Style | Font Recommendation |
|---------|-------|---------------------|
| **Headers** | Bold sans-serif | System default or Noto Sans CJK |
| **UI Text** | Clean sans-serif | System default |
| **Tile Characters** | Traditional Chinese | LongCang or similar brush font |
| **Numbers** | Tabular figures | Monospace for score alignment |

#### Implementation Reference

Color constants are defined in `Assets/Scripts/UI/UITheme.cs`:

```csharp
// Primary palette
public static readonly Color ForestGreen = HexToColor("#2D5F4A");
public static readonly Color VibrantOrange = HexToColor("#FF5722");
public static readonly Color GoldenYellow = HexToColor("#FFD54F");
public static readonly Color DeepOrange = HexToColor("#D84315");
public static readonly Color DarkForest = HexToColor("#1C3A2E");
public static readonly Color BeigeWhite = HexToColor("#F5F5DC");
public static readonly Color SaddleBrown = HexToColor("#8B4513");
public static readonly Color MetallicGold = HexToColor("#C8B273");
```

---

## 📚 Design Reference

### Terminology Mapping

| Balatro Term | Tensho Term |
|--------------|-------------|
| Joker | Decree |
| Blind | Round Mandate |
| Ante | Act Pressure |
| Deck | Wall |
| Deck Back/Shirt | Table Style |
| Run | Session |

---

### Table Styles System (P3)

Analogous to Balatro's deck backs ("shirts"), **Table Styles** are unlockable visual themes that also provide unique starting conditions or passive modifiers for runs.

**Design Philosophy:**
- Each table represents a different "house" or "parlor" with its own customs
- Visual distinction: table cloth color/pattern, tile back designs, UI accents
- Mechanical distinction: starting bonuses, modified rules, or trade-offs

**Data Model:**
```csharp
TableStyle {
  Id: string
  DisplayName: string
  Description: string
  ThemeColor: Color
  TileBackSprite: Sprite
  TableClothSprite: Sprite
  StartingModifier: TableModifier
  UnlockCondition: UnlockRequirement
}
```

**Base Table Styles:**

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

**Unlockable Table Styles:**

| Table | Unlock Condition |
|-------|------------------|
| **Red Lacquer** | Complete Act 3 |
| **Bamboo Mat** | Collect all 4 Flowers in a single run |
| **Imperial Gold** | Win a run with 5+ Decrees |
| **Night Market** | Purchase 20 Decrees across all runs |
| **Temple Stone** | Win without collecting any Flowers |
| **Ghost Parlor** | Survive 3 Corrupted Seasons in one run |
| **Dragon's Den** | Score a Yakuman |

**Visual Theming per Table:**

| Element | Customized |
|---------|------------|
| Table cloth/mat | Color and pattern |
| Tile backs | Design and color |
| UI accent colors | Buttons, panels, text highlights |
| Ambient effects | Subtle particles, lighting mood |
| Audio theme | Background music variation |

---

### Design Risks to Monitor

| Risk | Mitigation |
|------|------------|
| Yakuman inflation | Cap frequency/stacking tightly |
| Decree combinatorics | Test interactions exhaustively |
| Shanten forgiveness abuse | Keep as rare decree only |
| Seven Pairs dominance | Balance multiplier carefully |
| Cognitive overload | Progressive disclosure essential |

### Why Riichi Mahjong?

- Yaku are already orthogonal scoring units
- Hand legality is rigid (ideal for rule-breaking)
- Shanten is formally defined
- Yakuman are naturally "mythic tier"
- Rich cultural vocabulary for authority/rules

---

## 📌 Next Steps

1. ⬜ Implement Tile and Wall systems
2. ⬜ Build Hand parsing and validation
3. ⬜ Create Shanten calculator
4. ⬜ Implement Tier 1 Yaku detection
5. ⬜ Build basic scoring engine
6. ⬜ Create minimal playable round loop
7. ⬜ Design basic UI for hand/wall/discard

---

## 🧭 Mahjong-First Analog Systems (Balatro-Inspired, Original)

This section defines original, mahjong-themed analogs to several Balatro mechanics. These are designed to fit Tenshō’s authority hierarchy and tile grammar, without copying Balatro content.

### 1) Fate Seals (Tarot analog)
**Theme:** Ritual seals that alter a single hand or a single decision.

**Core Rules:**
- One seal can be used per round by default.
- Seals are “Heaven” authority: they override most table rules.
- Using a seal never changes the wall composition, only the current hand state.

**Mahjong Twist:** Seals are keyed to hand structure (melds, waits, pairs).

**Example Effects (Original):**
- **Seal of Harmony:** Convert one isolated tile into a sequence fit by shifting its rank by ±1.
- **Seal of Balance:** Swap ranks of two suited tiles in hand.
- **Seal of Stillness:** One chosen tile cannot be discarded this round.

### 2) Celestial Orbs (Planet analog)
**Theme:** Constellations that permanently empower yaku families.

**Core Rules:**
- Orbs apply run-wide, stacking with Flowers/Decrees.
- Orbs “attune” to a yaku category and grow with repeated triggers.

**Mahjong Twist:** Orbs level up only when their attuned yaku is scored.

**Example Effects (Original):**
- **Dragon Star:** +X% multiplier to dragon-based yaku.
- **Wind Star:** +X% multiplier to wind-based yaku.
- **Sequence Star:** +X% multiplier to sequence-heavy hands.

### 3) Void Scripts (Spectral analog)
**Theme:** Forbidden scripts that bend rules at a cost.

**Core Rules:**
- Each script has a downside (corruption, lost slot, penalty).
- Scripts can only be used once per round.

**Mahjong Twist:** Scripts can corrupt Seasons or weaken Decrees temporarily.

**Example Effects (Original):**
- **Script of Eclipse:** Score at 1-shanten, lose a Decree slot next round.
- **Script of Mirrors:** Duplicate one tile, but lock a random tile in Dead Pool.
- **Script of Silence:** Ignore one invalid meld, but halve base score.

### 4) Imperial Charters (Voucher analog)
**Theme:** Court-issued permanent upgrades.

**Core Rules:**
- Purchased only after Acts, not mid-round.
- Each charter is unique and non-repeatable in a run.

**Mahjong Twist:** Charters carry a “Court tax” (minor trade-offs).

**Example Effects (Original):**
- **Charter of Abundance:** +1 shop offer each Act, −5% base score.
- **Charter of Discipline:** +1 Decree slot, −1 hand draw limit per round.
- **Charter of Precision:** +10% to shanten bonuses, −10% to random effects.

### 5) Tile Marks (Card Modifiers analog)
**Theme:** Inscribed marks bound to individual tiles.

**Core Rules:**
- Marks attach to specific tile instances (by Id).
- Marks can decay if discarded or re-shuffled.

**Mahjong Twist:** Marked tiles can change yaku classification for checks only.

**Example Effects (Original):**
- **Lacquered Mark:** +5% per meld containing this tile.
- **Jade Mark:** Counts as honor for yaku checks (still suited for melds).
- **Crimson Mark:** If used in a pair, grant +X flat score.

### 6) Blessing Packs (Booster Packs analog)
**Theme:** Ritual packs containing mixed upgrades.

**Core Rules:**
- Packs contain 2–4 items from different systems.
- Pack content weights adapt to current authority layer.

**Mahjong Twist:** Pack generation favors your dominant yaku style (sequence vs triplet).

**Example Packs (Original):**
- **Ancestor Pack:** 1 Fate Seal + 1 Void Script.
- **Court Pack:** 1 Imperial Charter + 1 Celestial Orb.
- **Table Pack:** 2 Tile Marks + 1 Decree discount.

### 7) Omen Tags (Tags analog)
**Theme:** One-time destiny modifiers.

**Core Rules:**
- Omens trigger once, then vanish.
- Omens can lock the next Season type as a trade-off.

**Mahjong Twist:** Omens are “destined” and affect the next shop or round.

**Example Effects (Original):**
- **Omen of Crescents:** Next shop guarantees a Celestial Orb.
- **Omen of Ash:** Next Void Script has no downside.
- **Omen of Rivers:** Next round starts with +1 discard refund.

### 8) Mandates & Acts (Blinds/Antes analog)
**Theme:** Each Act is a “Mandate” with rule pressure and target score.

**Core Rules:**
- Mandates define bonus rewards and penalties for that Act.
- Mandate modifiers stack with Seasons but are lower authority than Decrees.

**Mahjong Twist:** Mandates include a side condition that can reduce penalties.

**Example Mandates (Original):**
- **Mandate of Purity:** Hands must include a sequence; fail → −20% score.
- **Mandate of Fortune:** Higher targets, but +1 shop reward.
- **Mandate of Restraint:** Fewer draws, but +10% yaku multiplier.

---

## 📦 System Implementation Status (Phase 3)

**ScriptableObjects (Data Models)**
- ✅ Assets/Scripts/Systems/FateSealDefinition.cs
- ✅ Assets/Scripts/Systems/CelestialOrbDefinition.cs
- ✅ Assets/Scripts/Systems/VoidScriptDefinition.cs
- ✅ Assets/Scripts/Systems/ImperialCharterDefinition.cs
- ✅ Assets/Scripts/Systems/TileMarkDefinition.cs
- ✅ Assets/Scripts/Systems/BlessingPackDefinition.cs
- ✅ Assets/Scripts/Systems/OmenTagDefinition.cs
- ✅ Assets/Scripts/Systems/MandateDefinition.cs

**Runtime Systems (Logic)**
- ✅ Assets/Scripts/GameFlow/RunManager.cs (Manages Mandates, Inventory, State)
- ⬜ Assets/Scripts/Systems/FateSealSystem.cs
- ⬜ Assets/Scripts/Systems/CelestialOrbSystem.cs
- ⬜ Assets/Scripts/Systems/VoidScriptSystem.cs
- ⬜ Assets/Scripts/Systems/CharterSystem.cs
- ⬜ Assets/Scripts/Systems/TileMarkSystem.cs
- ⬜ Assets/Scripts/Systems/BlessingPackSystem.cs
- ⬜ Assets/Scripts/Systems/OmenTagSystem.cs

**UI (Presentation)**
- ⬜ Assets/Scripts/UI/Components/FateSealCardUI.cs
- ⬜ Assets/Scripts/UI/Components/CelestialOrbUI.cs
- ⬜ Assets/Scripts/UI/Components/VoidScriptUI.cs
- ⬜ Assets/Scripts/UI/Components/CharterUI.cs
- ⬜ Assets/Scripts/UI/Components/OmenTagUI.cs
- ⬜ Assets/Scripts/UI/Screens/MandateUI.cs

---

## 🪙 Progression & Meta Systems (Mahjong-Themed, Original)

This section adds original, mahjong-first counterparts for Stakes, Shop, Collection, Achievements, and broader game mechanics.

### 9) Stakes → **Table Stakes** (Difficulty Tiers)
**Theme:** Enter higher-stake tables with stricter mandates and richer rewards.

**Core Rules:**
- Table Stakes are selectable difficulty tiers.
- Higher stakes apply global rule modifiers and increase Act targets.
- Stakes also increase drop rates for rare systems (Charters, Orbs, Mythic Decrees).

**Mahjong Twist:** Each stake tier represents a different “house” with its own etiquette and penalties.

**Example Table Stakes (Original):**
- **House Quiet (Tier 1):** Standard targets. +5% gold rewards.
- **House Jade (Tier 2):** +15% targets. +10% yaku multipliers.
- **House Ember (Tier 3):** −2 draws per round. +20% shop rarity.
- **House Storm (Tier 4):** Mandates are harsher. +1 Charter choice after each Act.

### 10) The Shop → **Court Exchange**
**Theme:** A ceremonial market between Acts and rounds.

**Core Rules:**
- Offers Decrees, Fate Seals, Orbs, Scripts, Marks, and Blessing Packs.
- Rarity weights shift based on your active Flowers/Seasons/Decrees.
- Includes a limited “Court Favor” currency earned via objectives.

**Mahjong Twist:** The Court Exchange can “audit” you if you break etiquette (e.g., excessive discards), raising prices temporarily.

**Original Shop Features:**
- **Favor Slots:** A small set of premium offers purchasable only with Court Favor.
- **Mandate Clause:** One offer per Act is tied to the current Mandate’s theme.

### 11) Collection → **Archive of Hands**
**Theme:** A growing compendium of discovered yaku, decrees, seals, orbs, scripts, marks, and table styles.

**Core Rules:**
- Each discovered item is logged with stats and rarity.
- Optional “Lore Notes” unlock after using an item multiple times.

**Mahjong Twist:** Each archived item shows its authority layer (Heaven/Court/Nature/Table/Grammar).

**Collection Categories (Original):**
- Yaku Archive
- Decree Ledger
- Fate Seal Codex
- Celestial Orb Atlas
- Void Script Grimoire
- Tile Mark Registry
- Table Style Gallery

### 12) Achievements → **Heavenly Accolades**
**Theme:** Formal court recognitions tied to play mastery.

**Core Rules:**
- Achievements unlock titles, cosmetics, and sometimes Charters.
- Some accolades unlock new Table Stakes tiers.

**Mahjong Twist:** Accolades are framed as “court titles,” each with a ceremonial name.

**Example Accolades (Original):**
- **Keeper of Winds:** Score 10 wind-based yaku in a run.
- **Master of Silence:** Win 3 rounds without discarding honors.
- **Seal Bearer:** Use 10 Fate Seals across runs.

### 13) Game Mechanics (Original Research Notes)
**Guiding Principles for new mechanics:**
- Must respect the authority hierarchy: Seasons > Decrees > Flowers > Tiles > Yaku.
- Must be explainable via Mahjong terms (no card metaphors).
- Must encourage hand structure choices, not just raw multipliers.

**Candidate Mechanics (Original):**
- **Seat Wind Pressure:** Seat wind changes each Act, affecting wind yaku availability.
- **River Memory:** Discarded tiles influence future shop offerings or mark decay.
- **Dead Wall Mercy:** Once per Act, swap a tile with the dead wall at a cost.
- **Concealment Discipline:** Bonus scaling when you avoid open melds for an entire Act.

---

## 🎰 Core Game Mechanics

This section defines the fundamental game mechanics adapted from roguelike card game design principles, reinterpreted through Mahjong's cultural vocabulary.

### 14) Scoring Formula: Base Points × Multipliers

**Core Concept:**
The final score for each hand is calculated using a two-component system: **Base Points (基点)** and **Multipliers (倍率)**.

**Formula:**
```
Final Score = (Base Points + Additive Bonuses) × Multiplicative Multipliers
```

**Base Points Sources:**
- **Tile Ranks:** Each tile contributes points based on rank
  - Terminals (1, 9): 10 points each
  - Simples (2-8): 5 points each
  - Honor tiles: 15 points each (dragons/winds)
- **Hand Structure:** Base points from the poker-hand-like structure
  - Pair: +10
  - Sequence: +20
  - Triplet: +30
  - Quad: +50

**Additive Bonuses (加点):**
- Tile Marks add flat bonuses when scored
- Certain Decree effects provide +X points
- Flower bonuses are additive by default
- Season effects may add temporary bonuses

**Multiplicative Multipliers (乗算):**
- Yaku multipliers stack multiplicatively
- Decree scaling effects are multiplicative
- Celestial Orb bonuses are multiplicative
- Glass/Steel-equivalent tile marks provide ×Mult

**Activation Order:**
1. Calculate base points from tiles
2. Add all additive bonuses (Flowers, Decrees, Tile Marks)
3. Apply all additive Mult bonuses
4. Apply multiplicative Mult bonuses in order (left-to-right for Decrees)
5. Apply Season modifiers (highest authority)

---

### 15) Activation Types (効果発動)

**Theme:** Different effects trigger at different phases of play.

Decrees, Tile Marks, and other effects have specific **activation types** that determine when they trigger during scoring.

**Activation Type Categories:**

| Type | Japanese | When It Triggers | Example Effects |
|------|----------|------------------|-----------------|
| **On Draw** | 摸牌時 | When a tile is drawn from the wall | Scaling effects, tile transformation |
| **On Discard** | 打牌時 | When a tile is discarded to the river | Gold generation, mark decay |
| **On Scored** | 得点時 | For each tile in the winning hand | Per-tile bonuses, retriggers |
| **On Held** | 手牌時 | For tiles remaining in hand (not scored) | Steel-like ×Mult effects |
| **Independent** | 独立型 | After all tiles scored, based on hand state | Flat bonuses from Decrees |
| **On Round Start** | 局開始時 | When a round begins | Seasonal effects, mandate setup |
| **On Round End** | 局終了時 | After scoring is complete | Economy effects, scaling resets |
| **Passive** | 常時有効 | Always active, no specific trigger | Rule modifications, slot bonuses |

**Strategy Implications:**
- **On Scored** effects benefit from hands with more tiles (e.g., avoiding melds that reduce hand size)
- **On Held** effects reward keeping tiles in hand rather than melding
- **Independent** effects are reliable but don't scale with retriggers
- Stacking multiple **On Scored** effects with retrigger Decrees creates exponential scaling

---

### 16) Discards and Hand Management (河管理)

**Theme:** Managing the discard river and hand draws is a core strategic axis.

**Default Resources per Round:**
- **Draws:** Determined by wall exhaustion (typically 17-18 draws)
- **Redraws:** Default 3 per round (can swap tiles from hand with new draws without discarding)

**Redraw Mechanics:**
- Select up to 3 tiles to return to the wall
- Draw equal number of replacement tiles
- Triggers "On Redraw" effects (e.g., Purple Seal equivalent)
- Does NOT count as a discard for yaku purposes

**Synergies:**
- **Discards that reward:** Certain Decrees scale based on discards made
- **River Memory:** Discarded tiles may influence future offerings
- **River Tax:** Each discard may generate small gold

**Anti-Synergies:**
- **Concealment Discipline:** Rewards minimal discards
- **River Drought:** Some mandates penalize heavy discarding

**Pseudo-Discards:**
If all redraws are used, players may "play through" unwanted tiles by including them in valid but suboptimal hands to cycle cards without formal redraw penalties.

---

### 17) Economy: Gold and Interest (経済)

**Theme:** Gold management with interest-based savings incentives.

**Interest System:**
- At the end of each round, earn **1 Gold interest per 5 Gold held**, capped at **5 Gold** per round
- Saving gold up to 25 Gold maximizes interest (5 Gold/round)

**Interest Modifiers:**

| Source | Effect |
|--------|--------|
| **Seed Money Charter** | Interest cap increased to 10 Gold (requires 50 Gold) |
| **Money Tree Charter** | Interest cap increased to 20 Gold (requires 100 Gold) |
| **Fortune Decree** | +1 Gold interest per 5 Gold held |
| **Temple Stone Table** | No Flowers, but +50% base score |

**Economy Timing:**
- Interest is calculated BEFORE end-of-round payouts
- Gold Cards/Seals that trigger during scoring count toward interest
- Effects that trigger after Cash Out (like Golden Decree) do NOT count for that round's interest

**Economy Decrees (Original):**

| Decree | Effect |
|--------|--------|
| **River Tax** | Gain 1 Gold per tile discarded this round |
| **Offering Bowl** | Sacrifice 1 Flower to gain 15 Gold immediately |
| **Prosperity Seal** | First scoring tile each round grants +5 Gold |
| **Austerity Mandate** | −50% shop prices, but −1 redraw per round |

---

### 18) Negative Effects (負効果)

**Theme:** Debuffs and restrictions that add challenge and strategic complexity.

#### 18a. Debuffed Tiles (封印牌)

A debuffed tile:
- Does NOT contribute its base points
- Does NOT trigger Tile Mark effects
- Does NOT activate "On Scored" effects
- CAN still form valid melds and hands
- CAN still trigger hand-based Decree effects

**Debuff Sources:**

| Source | Effect |
|--------|--------|
| **The Drought** | All simples (2-8) are debuffed |
| **The Frost** | All honor tiles are debuffed |
| **The Blight** | Tiles drawn after redraw are debuffed |
| **Mandate of Restriction** | Specific suit debuffed for this round |

**Removing Debuffs:**
- Using Fate Seals to transform the tile may remove debuffs
- Certain Void Scripts can temporarily ignore debuffs

#### 18b. Debuffed Decrees (法令封印)

When a Decree is debuffed (via Corrupted Seasons or Mandates):
- Decree effect is completely disabled
- Edition bonuses on Decree (if any) are disabled
- Still counts for "number of Decrees" effects
- Still provides sell value for economy calculations

#### 18c. Face-Down Tiles (伏牌)

Some Mandates cause tiles to be drawn face-down:
- Player cannot see rank or suit
- Tiles sort correctly when auto-arranged (revealing hints)
- Playing face-down tiles shows "???" for hand type
- Using consumables briefly reveals the tile

**Face-Down Sources:**

| Source | Effect |
|--------|--------|
| **Blind Draw Mandate** | First 5 tiles drawn are face-down |
| **Fog of War Season** | 1 in 5 tiles drawn are face-down |
| **Shadowfall** | All tiles face-down after first redraw |

#### 18d. Locked Tiles (拘束牌)

A locked tile cannot be discarded or redrawn:
- Must be included in any played hand
- Disrupts optimal hand formation
- Can only be removed by destroying the tile

---

### 19) Stickers (貼付)

**Theme:** Persistent modifiers attached to Decrees that add constraints or benefits.

Stickers appear on Decrees at higher Table Stakes (difficulty tiers), adding additional considerations.

#### 19a. Eternal Sticker (永劫貼)

- Decree cannot be sold or destroyed
- Becomes a permanent fixture of the build
- Synergy: Decrees that self-destruct become risk-free with Eternal
- **Appears at:** Table Stake Tier 4+
- **Probability:** 30% of shop Decrees

**Cannot receive Eternal:**
- Decrees with "sell this Decree" effects
- Decrees that naturally decay

#### 19b. Perishable Sticker (腐朽貼)

- Decree becomes debuffed after 5 rounds
- Debuffed Decree loses all effects but keeps passive interactions
- **Appears at:** Table Stake Tier 6+
- **Probability:** 30% of shop Decrees

**Cannot receive Perishable:**
- Scaling Decrees that start at 0 and build up
- Already-Eternal Decrees

#### 19c. Rental Sticker (租借貼)

- Decree costs only 1 Gold to purchase
- Deducts 3 Gold at the END of every round
- Can put player into debt
- **Appears at:** Table Stake Tier 8 (Gold Stake)
- **Probability:** 30% of shop Decrees

**Strategy:** 
- Buy Rental Decrees for immediate effect, sell before round ends
- Pair with Decrees that generate value on purchase/activation

#### 19d. Combined Odds at High Stakes

At Gold Stake (Tier 8):
- 28% chance of a Decree having no stickers
- Decrees can have Rental + Eternal or Rental + Perishable (not both Eternal and Perishable)

---

### 20) Skipping Rounds and Omens (局飛ばし)

**Theme:** Strategic decision to skip early rounds for special rewards.

**Skip Mechanic:**
- Small Round and Large Round can be skipped before the Boss Round
- Skipping grants an **Omen Tag** (one-time bonus)
- Skipping forfeits: shop access, scoring opportunity, scaling triggers, interest accrual

**When to Skip:**
- Perishable Decrees need preservation
- Specific Omen Tags are extremely valuable
- Build doesn't need additional scaling
- Wall composition is unfavorable

**Synergies:**
- **Throwback Decree:** Gains ×0.25 Mult per skipped round
- **Speed Omen:** Grants 5 Gold per round skipped this run

**Anti-Synergies:**
- High Stakes runs where economy is critical
- Scaling Decrees that need more rounds to build up

---

### 21) Mandates (Blinds/Antes Analog)

**Theme:** Each Act contains multiple Rounds culminating in a Boss Mandate with special restrictions.

**Round Structure per Act:**

| Round | Type | Score Multiplier | Special Effect |
|-------|------|------------------|----------------|
| Small Round | 小局 | 1.0× base | Can be skipped for Omen |
| Large Round | 大局 | 1.5× base | Can be skipped for Omen |
| Boss Round | 親局 | 2.0× base | Cannot skip, has Boss Mandate |

**Boss Mandates (Original):**

| Mandate | Japanese | Effect |
|---------|----------|--------|
| **The Hook** | 鉤 | 2 random tiles discarded from hand after each draw |
| **The Wall** | 壁 | Extra large score requirement (4× instead of 2×) |
| **The Eye** | 目 | No repeat yaku this round (each yaku only scores once) |
| **The Mouth** | 口 | Only one yaku type can be scored this round |
| **The Flint** | 火打石 | Base points and Mult halved for entire round |
| **The Needle** | 針 | Must complete hand in exactly 1 draw cycle |
| **The Pillar** | 柱 | Tiles used in previous rounds this Act are debuffed |
| **The Water** | 水 | Start with 0 redraws this round |
| **The Arm** | 腕 | Yaku tier decreased by 1 for scoring |

**Showdown Mandates (Act 8+):**

| Mandate | Effect |
|---------|--------|
| **Amber Acorn** | All Decrees are shuffled and face-down |
| **Verdant Leaf** | All tiles debuffed until 1 Decree is sold |
| **Violet Vessel** | Extra-extra large target (6× instead of 2×) |
| **Crimson Heart** | One random Decree disabled every hand cycle |
| **Cerulean Bell** | One tile is force-locked every draw |

**Defeating Boss Mandates:**
- Some Decrees can disable Boss Mandate effects
- Certain Void Scripts temporarily ignore mandates
- Rerolling Mandates costs increasing Gold

---

### 22) Act Score Requirements (Ante Scaling)

**Theme:** Score requirements escalate exponentially through the run.

**Base Score Targets by Act:**

| Act | Base Requirement | At Jade Stake+ | At Storm Stake+ |
|-----|------------------|----------------|-----------------|
| 1 | 300 | 300 | 300 |
| 2 | 800 | 900 | 1,000 |
| 3 | 2,000 | 2,600 | 3,200 |
| 4 | 5,000 | 8,000 | 9,000 |
| 5 | 11,000 | 20,000 | 25,000 |
| 6 | 20,000 | 36,000 | 60,000 |
| 7 | 35,000 | 60,000 | 110,000 |
| 8 (Showdown) | 50,000 | 100,000 | 200,000 |

**Endless Mode (Act 9+):**
After defeating Act 8, players enter Endless Mode with rapidly scaling requirements:
- Scaling is faster than exponential (polynomial-exponential growth)
- Showdown Mandates reappear every 8 Acts
- Theoretical limit around Act 39 due to numerical overflow

**Scaling Formula (Endless):**
```
Score Requirement = Act 8 Base × (1.6 + (0.75(Act-8)))^(Act-8 × (1 + 0.2(Act-8)))
```

---

### 23) Retriggers (再発動)

**Theme:** Causing tiles or Decrees to activate multiple times for exponential scaling.

**Retrigger Sources:**

| Source | Effect |
|--------|--------|
| **Crimson Mark** | Tile with this mark activates twice when scored |
| **Ceremonial Decree** | All honor tiles retrigger once |
| **Final Hand Bonus** | On last hand of round, all tiles retrigger |
| **Dragon's Echo** | Dragon tiles retrigger for each dragon type in hand |

**What Retriggers:**
- "On Scored" effects on tiles
- Tile Mark bonuses
- Per-tile Decree effects

**What Doesn't Retrigger:**
- Independent Decree effects (trigger once regardless)
- "On Held" effects (not scoring, just holding)
- Other retrigger effects (no infinite chains)

**Strategy:**
- Stack "On Scored" effects with retrigger sources
- Prioritize hands with high-value tiles that benefit from retriggers
- Pair with multiplicative bonuses for exponential growth

---

### 24) Tile Editions (牌版)

**Theme:** Special visual and mechanical variants of tiles.

Editions are rare modifications that can appear on individual tiles, providing persistent bonuses.

| Edition | Japanese | Effect | Visual |
|---------|----------|--------|--------|
| **Foil** | 箔押 | +50 Base Points when scored | Shimmering silver |
| **Holographic** | 虹彩 | +10 Mult when scored | Rainbow effect |
| **Polychrome** | 極彩 | ×1.5 Mult when scored | Shifting colors |
| **Negative** | 陰 | +1 Decree slot (doesn't take space) | Dark aura |

**Acquiring Editions:**
- Some Tile Marks convert tiles to editions
- Void Scripts can apply editions at a cost
- Certain shop offerings include edition tiles
- Omen Tags can apply editions

**Edition Interactions:**
- Only one edition per tile
- Editions persist until tile is destroyed
- Debuffing a tile suppresses (but doesn't remove) the edition

---

### 25) Table Stakes (場代) — Difficulty System

**Theme:** Progressive difficulty modifiers that stack cumulatively, unlocking new challenges and rewards.

Table Stakes are 8 ascending difficulty tiers that represent mastery levels. Each stake adds ALL modifiers from previous stakes, creating exponential challenge.

#### Stake Progression

| Tier | Name | Japanese | New Modifier | Unlocks |
|------|------|----------|--------------|---------|
| 1 | **White Stake** | 白場 | Base difficulty (no modifiers) | Starting tier |
| 2 | **Red Stake** | 赤場 | Small Round gives no reward Gold | Crimson Wall (deck variant) |
| 3 | **Green Stake** | 緑場 | Required score scales faster per Act | Jade Wall (deck variant) |
| 4 | **Black Stake** | 黒場 | 30% chance for shop Decrees to have Eternal sticker | Obsidian Wall (deck variant) |
| 5 | **Blue Stake** | 青場 | -1 Redraw per round | Azure Wall (deck variant) |
| 6 | **Purple Stake** | 紫場 | Required score scales even faster per Act | — |
| 7 | **Orange Stake** | 橙場 | 30% chance for shop Decrees to have Perishable sticker | Sunset Wall (deck variant) |
| 8 | **Gold Stake** | 金場 | 30% chance for shop Decrees to have Rental sticker | — |

#### Cumulative Stacking Example

At Gold Stake (Tier 8), a run includes ALL of the following:
- ❌ No Small Round rewards
- 📈 Faster score scaling
- ♾️ 30% Eternal stickers on shop Decrees
- ➖ -1 Redraw
- 📈📈 Even faster score scaling
- ⏳ 30% Perishable stickers on shop Decrees
- 💰 30% Rental stickers on shop Decrees

#### Stake Stickers (Victory Markers)

When completing a run at a specific stake:
- The Decrees in your winning hand receive a **stake sticker** matching that tier's color
- The Wall (deck) used also receives a stake marker
- Stake stickers are **cosmetic** and displayed in the Archive

**Sticker Probability at Gold Stake:**
| Sticker Type | Probability |
|--------------|-------------|
| Eternal | 21.6% |
| Perishable | 21.6% |
| Rental | 21.6% |
| None | 28% |
| Multiple | 7.2% (stickers can stack) |

#### Per-Wall Progression

Each Wall (deck variant) has its own stake progression:
- Must complete current stake to unlock next stake for that specific Wall
- Progress is tracked independently (completing Gold on Red Wall doesn't unlock Red Stake on Blue Wall)
- Challenge Runs can only be played on White Stake

---

### 26) The Tea House (茶寮) — Shop System

**Theme:** The between-round marketplace where players acquire Decrees, consumables, and upgrades.

The Tea House appears after every Round (except final rounds in an Act).

#### Shop Layout

| Slot | Contents | Base Count |
|------|----------|------------|
| **Item Slots** | Random items (Decrees, Fate Seals, Celestial Orbs) | 2 slots |
| **Blessing Packs** | Booster packs with random contents | 2 packs |
| **Imperial Charter** | Voucher-style permanent upgrade | 1 charter |

#### Item Weights (Base Probabilities)

| Item Type | Weight | Probability |
|-----------|--------|-------------|
| Decree | 20 | 71.4% |
| Fate Seal | 4 | 14.3% |
| Celestial Orb | 4 | 14.3% |

#### Decree Rarity Weights

| Rarity | Probability | Base Cost |
|--------|-------------|-----------|
| Common | 70% | 1-6 Gold |
| Uncommon | 25% | 4-8 Gold |
| Rare | 5% | 7-10 Gold |
| Legendary | — | 20 Gold (special sources only) |

#### Other Item Costs

| Item Type | Cost |
|-----------|------|
| Fate Seal | 3 Gold |
| Celestial Orb | 3 Gold |
| Void Script | 4 Gold (special conditions) |
| Tiles (with Charter) | 1 Gold |
| Blessing Pack (Normal) | 4 Gold |
| Blessing Pack (Jumbo) | 6 Gold |
| Blessing Pack (Mega) | 8 Gold |
| Imperial Charter | 10 Gold |

#### Reroll Mechanics

Players can pay to refresh the item slots:
- **Base cost:** 5 Gold
- **Increment:** +1 Gold per reroll
- **Reset:** Cost resets to 5 Gold when entering new shop
- Only item slots reroll (Blessing Packs and Charter remain)

**Charter Upgrades:**
| Charter | Effect |
|---------|--------|
| Abundant Stock | +1 item slot (to 3) |
| Plentiful Stock | +1 item slot (to 4) |
| Discount Sale | All items 25% off |
| Liquidation Sale | All items 50% off |
| Reroll Surplus | Rerolls cost 2 Gold less |
| Reroll Abundance | Rerolls cost additional 2 Gold less |

#### Pricing Formula

```
buy_cost = (base_cost + edition_cost) × discount_percent
sell_value = floor(buy_cost / 2)
```

| Edition | Additional Cost |
|---------|-----------------|
| Foil | +2 Gold |
| Holographic | +3 Gold |
| Polychrome | +5 Gold |
| Negative | +5 Gold |

---

### 27) Blessing Packs (祝福袋) — Booster System

**Theme:** Randomized item bundles that provide choices from themed pools.

Two Blessing Packs appear in each Tea House visit. Players open packs immediately upon purchase.

#### Pack Types

| Pack | Japanese | Contents | Use |
|------|----------|----------|-----|
| **Arcana Pack** | 秘術袋 | Fate Seals (Tarot-style) | Immediate use |
| **Celestial Pack** | 天球袋 | Celestial Orbs (upgrades) | Immediate use |
| **Tile Pack** | 牌袋 | Tiles with modifiers | Added to Wall |
| **Decree Pack** | 法令袋 | Decree cards | Added to slots |
| **Void Pack** | 虚空袋 | Void Scripts | Immediate use |

#### Pack Sizes

| Size | Cost | Choices | Selection |
|------|------|---------|-----------|
| Normal | 4 Gold | 3 options | Choose 1 |
| Jumbo | 6 Gold | 5 options | Choose 1 |
| Mega | 8 Gold | 5 options | Choose up to 2 |

#### Pack Appearance Rates

| Pack Type | Normal | Jumbo | Mega |
|-----------|--------|-------|------|
| Tile Pack | 17.84% | 8.92% | 2.23% |
| Arcana Pack | 17.84% | 8.92% | 2.23% |
| Celestial Pack | 17.84% | 8.92% | 2.23% |
| Decree Pack | 5.35% | 2.68% | 0.67% |
| Void Pack | 2.68% | 1.34% | 0.31% |

#### Skipping Packs

Players may skip selecting from a pack without penalty:
- Skipping a Mega pack after selecting 1 option is allowed
- The "Skip" action synergizes with certain Decrees (e.g., Patient Observer gains +3 Mult per skip)

---

### 28) Imperial Charters (皇勅) — Voucher System

**Theme:** Permanent upgrades purchased after defeating Boss Mandates that enhance the run.

Imperial Charters are offered in the Tea House:
- Refresh after each Boss Mandate victory
- Only one Charter appears per shop
- Cannot be rerolled
- Cost: 10 Gold (base)

#### Charter Pairs

Each Charter has a base version and an upgraded version. The upgraded version can only appear after purchasing the base.

| Base Charter | Effect | Upgraded Charter | Effect | Unlock Condition |
|--------------|--------|------------------|--------|------------------|
| **Abundant Stock** | +1 shop slot (to 3) | **Plentiful Stock** | +1 shop slot (to 4) | Spend 2500 Gold total |
| **Discount Sale** | 25% off all shop items | **Liquidation Sale** | 50% off all shop items | Redeem 10 Charters in one run |
| **Sharp Edge** | Editions appear 2× more often | **Radiant Edge** | Editions appear 4× more often | Have 5+ edition Decrees |
| **Reroll Surplus** | Rerolls cost 2 Gold less | **Reroll Abundance** | Rerolls cost 4 Gold less | Reroll 100 times total |
| **Crystal Lens** | +1 consumable slot | **Omen Lens** | Void Scripts may appear in Arcana Packs | Use 25 Fate Seals from packs |
| **Star Chart** | Celestial Packs contain orb for most-used yaku | **Observatory** | Held Celestial Orbs give ×1.5 Mult | Use 25 Celestial Orbs from packs |
| **Steady Hand** | +1 hand per round | **Swift Hand** | +1 additional hand per round | Play 2500 tiles |
| **Frugal Discard** | +1 redraw per round | **Wasteful Plenty** | +1 additional redraw per round | Discard 2500 tiles |
| **Seal Merchant** | Fate Seals appear 2× more often | **Seal Tycoon** | Fate Seals appear 4× more often | Buy 50 Fate Seals from shop |
| **Orb Merchant** | Celestial Orbs appear 2× more often | **Orb Tycoon** | Celestial Orbs appear 4× more often | Buy 50 Celestial Orbs from shop |
| **Seed Pouch** | Interest cap raised to 10 Gold | **Money Tree** | Interest cap raised to 20 Gold | Max interest for 10 consecutive rounds |
| **Empty Scroll** | Does nothing | **Void Matter** | +1 Decree slot | Redeem Empty Scroll 10 times total |
| **Tile Trading** | Tiles can be purchased from shop | **Illusion Tiles** | Shop tiles may have editions/marks | Buy 20 tiles from shop |
| **Ancient Script** | -1 Act, -1 hand per round | **Stone Script** | -1 Act again, -1 redraw per round | Reach Act 12 |
| **Director's Take** | Reroll Boss Mandate 1×/Act (10 Gold) | **Final Cut** | Reroll Boss Mandate unlimited (10 Gold each) | Discover 25 Mandates |
| **Brush Stroke** | +1 hand size | **Full Palette** | +1 hand size again | Reduce hand size to 5 tiles |

---

### 29) Archive of Hands (手牌録) — Collection System

**Theme:** A comprehensive catalog of all discovered items, tracking mastery and unlocks.

The Archive tracks every item the player has encountered or unlocked across all runs.

#### Archive Categories

| Category | Japanese | Items | Notes |
|----------|----------|-------|-------|
| **Decrees** | 法令録 | 150 | All Common through Legendary |
| **Walls** | 山録 | 15 | Deck variants (excluding Challenge) |
| **Imperial Charters** | 皇勅録 | 32 | 16 base + 16 upgraded |
| **Consumables** | 消耗品録 | 52 | Fate Seals, Orbs, Void Scripts |
| **Tile Marks** | 牌印録 | 8 | Enhancement types |
| **Seals** | 封印録 | 4 | Gold, Red, Blue, Purple |
| **Editions** | 版録 | 5 | Base, Foil, Holo, Poly, Negative |
| **Blessing Packs** | 祝福袋録 | 32 | All pack variants |
| **Omen Tags** | 兆符録 | 24 | Skip reward markers |
| **Mandates** | 局法録 | 30 | Round restrictions |

**Total Collection:** 352 unique items

#### Discovery Mechanics

Items are discovered by:
- **Purchasing** from the Tea House (Decrees, Charters, consumables)
- **Opening** Blessing Packs
- **Encountering** Boss Mandates (discovered upon defeat)
- **Skipping** with specific Omen Tags
- **Winning** with specific Walls/stakes

**Pre-Discovered Items:**
When starting a new profile, these are already discovered:
- The base "Joker" Decree
- Red Wall (starting deck)
- All Tile Marks
- All Seals

#### Unlock vs Discovery

Some items have **unlock conditions** before they can appear:
- Upgraded Charters require base Charter purchased
- Legendary Decrees require specific achievements
- Special Walls unlock from collection completion or stake victories

**Full Unlock Option:**
Players can choose to unlock all items instantly, but this disables achievement tracking for that profile.

---

### 30) Heavenly Accolades (天賞) — Achievement System

**Theme:** Recognition milestones that reward mastery and creative play.

Accolades are permanent badges earned by meeting specific conditions. Some unlock new items.

#### Progression Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **First Steps** | 初歩 | Reach Act 4 | Stage Master Decree |
| **Ascending** | 昇進 | Reach Act 8 | Flower Pot Decree |
| **Victory** | 勝利 | Win a Run | Blueprint Decree |
| **Red Path** | 赤道 | Win on Red Stake+ | Crimson Wall |
| **Black Path** | 黒道 | Win on Black Stake+ | Obsidian Wall |
| **Golden Path** | 金道 | Win on Gold Stake | — |

#### Cumulative Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Tile Master** | 牌師 | Play 2500 tiles | Swift Hand Charter |
| **Discard Artist** | 捨牌芸者 | Discard 2500 tiles | Wasteful Plenty Charter |
| **Fortune Built** | 富豪 | Have 400+ Gold in one run | Satellite Decree |

#### Skill Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Wild Flush** | 万能清一色 | Complete Honitsu with all Wild tiles | — |
| **Speed Run** | 疾走 | Win in 12 or fewer rounds | Swift Andy Decree |
| **Charter Collector** | 皇勅収集 | Buy 5 Charters by Act 4 | — |
| **Shattered** | 粉砕 | Break 2 Glass tiles in one hand | — |
| **Royal Hand** | 帝王手 | Complete a Yakuman | — |
| **Retrograde** | 逆行 | Get any yaku to level 10 | — |

#### Scoring Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **10K** | 万点 | Score 10,000 points in one hand | Lucky Sixes Decree |
| **1,000K** | 百万点 | Score 1,000,000 points in one hand | The Idol Decree |
| **100,000K** | 億点 | Score 100,000,000 points in one hand | Stuntman Decree |

#### Collection Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Seal Scholar** | 符学者 | Discover every Fate Seal | Cartomancer Decree |
| **Star Gazer** | 星読み | Discover every Celestial Orb | Astronomer Decree |
| **Void Walker** | 虚空歩者 | Discover every Void Script | — |
| **Charter Complete** | 皇勅全取 | Discover every Imperial Charter | — |
| **Archive Complete** | 全録達成 | Discover 100% of collection | — |

#### Mastery Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Archive Complete+** | 全録達成・極 | Win with every Wall on Gold Stake | — |
| **Archive Complete++** | 全録達成・究 | Earn Gold Sticker on every Decree | — |

#### Challenge Accolades

| Accolade | Japanese | Condition |
|----------|----------|-----------|
| **Rule Bender** | 曲法者 | Complete any Challenge Run |
| **Rule Breaker** | 破法者 | Complete every Challenge Run |
| **Deck Minimalist** | 極小山 | Thin Wall to 20 or fewer tiles |
| **Deck Maximalist** | 極大山 | Have 80+ tiles in Wall |
| **Purist** | 無転 | Win without rerolling the shop |

#### Notes

- Accolades cannot be earned during Challenge Runs (except Rule Bender/Breaker)
- Accolades can be earned after winning a run (continue playing to reach score targets)
- Some accolades share unlock conditions with specific items

---

## 📦 Meta Implementation Status (Phase 4)

**ScriptableObjects**
- ✅ Assets/Scripts/Systems/TableStakeDefinition.cs
- ✅ Assets/Scripts/Systems/CourtExchangeDefinition.cs
- ⬜ Assets/Scripts/Systems/ArchiveEntryDefinition.cs

**Runtime Systems**
- ⬜ Assets/Scripts/Systems/TableStakeSystem.cs
- ✅ Assets/Scripts/Systems/Shop/CourtExchangeSystem.cs
- ⬜ Assets/Scripts/Systems/ArchiveSystem.cs
- ⬜ Assets/Scripts/Meta/AccoladeManager.cs

**UI**
- ⬜ Assets/Scripts/UI/Screens/TableStakeSelectUI.cs
- ⬜ Assets/Scripts/UI/Screens/CourtExchangeUI.cs
- ⬜ Assets/Scripts/UI/Screens/ArchiveUI.cs
- ⬜ Assets/Scripts/UI/Components/ArchiveItemUI.cs

---

## 📦 Core Mechanics Implementation Status (Phase 5)

**ScriptableObjects (Data Models)**
- ⬜ Assets/Scripts/Core/TileEditionDefinition.cs
- ⬜ Assets/Scripts/Systems/StickerDefinition.cs
- ⬜ Assets/Scripts/Systems/MandateDefinition.cs (Boss Blinds)
- ⬜ Assets/Scripts/Systems/NegativeEffectDefinition.cs

**Runtime Systems (Logic)**
- ⬜ Assets/Scripts/Rules/ScoringFormulaEngine.cs
- ⬜ Assets/Scripts/Rules/ActivationSequencer.cs
- ⬜ Assets/Scripts/Rules/RetriggerSystem.cs
- ⬜ Assets/Scripts/Systems/DiscardManager.cs
- ⬜ Assets/Scripts/Systems/InterestCalculator.cs
- ⬜ Assets/Scripts/Systems/NegativeEffectSystem.cs
- ⬜ Assets/Scripts/Systems/StickerSystem.cs
- ⬜ Assets/Scripts/Systems/SkipRoundSystem.cs
- ⬜ Assets/Scripts/Systems/MandateSystem.cs
- ⬜ Assets/Scripts/Systems/TileEditionSystem.cs

**UI (Presentation)**
- ⬜ Assets/Scripts/UI/Components/StickerDisplayUI.cs
- ⬜ Assets/Scripts/UI/Components/EditionDisplayUI.cs
- ⬜ Assets/Scripts/UI/Components/NegativeEffectOverlay.cs
- ⬜ Assets/Scripts/UI/Components/MandateDisplayUI.cs
- ⬜ Assets/Scripts/UI/Screens/SkipRoundUI.cs

---

## 📦 Meta Systems Implementation Status (Phase 6)

**ScriptableObjects (Data Models)**
- ⬜ Assets/Scripts/Systems/ImperialCharterDefinition.cs
- ⬜ Assets/Scripts/Systems/BlessingPackDefinition.cs
- ⬜ Assets/Scripts/Systems/AccoladeDefinition.cs
- ⬜ Assets/Scripts/Systems/ArchiveCategoryDefinition.cs

**Runtime Systems (Logic)**
- ⬜ Assets/Scripts/Systems/Shop/TeaHouseManager.cs
- ⬜ Assets/Scripts/Systems/Shop/RerollSystem.cs
- ⬜ Assets/Scripts/Systems/Shop/PricingCalculator.cs
- ⬜ Assets/Scripts/Systems/Shop/ItemWeightSystem.cs
- ⬜ Assets/Scripts/Systems/BlessingPackSystem.cs
- ⬜ Assets/Scripts/Systems/ImperialCharterSystem.cs
- ⬜ Assets/Scripts/Meta/ArchiveManager.cs
- ⬜ Assets/Scripts/Meta/AccoladeTracker.cs
- ⬜ Assets/Scripts/Meta/DiscoverySystem.cs
- ⬜ Assets/Scripts/Meta/UnlockConditionEvaluator.cs
- ⬜ Assets/Scripts/Meta/StakeProgressionSystem.cs

**UI (Presentation)**
- ⬜ Assets/Scripts/UI/Screens/TeaHouseUI.cs
- ⬜ Assets/Scripts/UI/Screens/BlessingPackUI.cs
- ⬜ Assets/Scripts/UI/Screens/ImperialCharterUI.cs
- ⬜ Assets/Scripts/UI/Screens/ArchiveUI.cs
- ⬜ Assets/Scripts/UI/Screens/AccoladeUI.cs
- ⬜ Assets/Scripts/UI/Screens/StakeSelectUI.cs
- ⬜ Assets/Scripts/UI/Components/ShopItemUI.cs
- ⬜ Assets/Scripts/UI/Components/PackContentsUI.cs
- ⬜ Assets/Scripts/UI/Components/CharterDisplayUI.cs
- ⬜ Assets/Scripts/UI/Components/ArchiveEntryUI.cs
- ⬜ Assets/Scripts/UI/Components/AccoladeBadgeUI.cs
- ⬜ Assets/Scripts/UI/Components/StakeProgressUI.cs

---

## 🎲 Glossary: Balatro → Tensho Term Mapping

Complete reference for all adapted terminology:

| Balatro Term | Tensho Term | Japanese | Description |
|--------------|-------------|----------|-------------|
| Chips | Base Points | 基点 | Raw scoring value from tiles |
| Mult | Multiplier | 倍率 | Score multiplication factor |
| Additive Mult | Additive Bonus | 加算 | +X added to multiplier |
| Multiplicative Mult | Scaling Mult | 乗算 | ×X applied to total |
| Joker | Decree | 法令 | Persistent rule-modifying effect |
| Tarot Card | Fate Seal | 運命符 | Single-use hand manipulation |
| Planet Card | Celestial Orb | 天球 | Yaku family permanent upgrade |
| Spectral Card | Void Script | 虚空巻 | Powerful effect with downside |
| Voucher | Imperial Charter | 皇勅 | Post-Act permanent upgrade |
| Card Modifier | Tile Mark | 牌印 | Effect bound to specific tile |
| Booster Pack | Blessing Pack | 祝福袋 | Mixed item container |
| Tag | Omen Tag | 兆符 | Skip reward, one-time trigger |
| Blind | Round Mandate | 局法 | Score requirement with rules |
| Boss Blind | Boss Mandate | 親法 | Special restriction round |
| Ante | Act | 幕 | Major progression unit |
| Deck | Wall | 山 | Tile supply |
| Hand | Winning Hand | 和了形 | Valid scoring configuration |
| Deck Back | Table Style | 卓風 | Visual + mechanical preset |
| Stake | Table Stake | 場代 | Difficulty tier |
| Sticker | Sticker | 貼付 | Decree modifier (Eternal/Perishable/Rental) |
| Edition | Edition | 版 | Tile variant (Foil/Holo/Poly/Negative) |
| Debuffed | Sealed | 封印 | Disabled/suppressed state |
| Face-down | Hidden | 伏牌 | Unknown tile state |
| Discard | Redraw | 入替 | Hand cycling action |
| Interest | Interest | 利子 | Gold earned from savings |
| Retrigger | Retrigger | 再発動 | Effect activates multiple times |
| Skip | Skip | 飛ばし | Bypass round for Omen |
| Endless Mode | Endless Ascent | 無限上昇 | Post-victory continuation |
| Collection | Archive of Hands | 手牌録 | Discovery compendium |
| Achievements | Heavenly Accolades | 天賞 | Mastery recognition |
| The Shop | Tea House | 茶寮 | Between-round marketplace |
| Reroll | Reroll | 転がし | Refresh shop item slots |
| White Stake | White Stake | 白場 | Base difficulty tier |
| Red Stake | Red Stake | 赤場 | Tier 2 difficulty |
| Green Stake | Green Stake | 緑場 | Tier 3 difficulty |
| Black Stake | Black Stake | 黒場 | Tier 4 difficulty |
| Blue Stake | Blue Stake | 青場 | Tier 5 difficulty |
| Purple Stake | Purple Stake | 紫場 | Tier 6 difficulty |
| Orange Stake | Orange Stake | 橙場 | Tier 7 difficulty |
| Gold Stake | Gold Stake | 金場 | Tier 8 (max) difficulty |
| Arcana Pack | Arcana Pack | 秘術袋 | Fate Seal booster pack |
| Celestial Pack | Celestial Pack | 天球袋 | Celestial Orb booster pack |
| Standard Pack | Tile Pack | 牌袋 | Tile booster pack |
| Buffoon Pack | Decree Pack | 法令袋 | Decree booster pack |
| Spectral Pack | Void Pack | 虚空袋 | Void Script booster pack |
| Normal Pack | Normal | 通常 | 3 choices, pick 1 |
| Jumbo Pack | Jumbo | 大型 | 5 choices, pick 1 |
| Mega Pack | Mega | 特大 | 5 choices, pick up to 2 |