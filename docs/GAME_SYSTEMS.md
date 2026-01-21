# Game Systems

> Core game systems and mechanics for Tensho Mahjong Roguelike.

**Related Documents:**
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Project overview and technical architecture
- [GAME_MECHANICS.md](GAME_MECHANICS.md) — Detailed scoring and economy mechanics
- [UI_DESIGN.md](UI_DESIGN.md) — Visual design guide
- [ITEM_LIBRARIES.md](../ITEM_LIBRARIES.md) — Complete item lists

---

## 1. Tile System

**Data Model (TypeScript):**
```typescript
// Standard Tiles (136 total: 34 unique × 4 copies)
interface Tile {
  suit: TileSuit  // Manzu | Pinzu | Souzu | Wind | Dragon | Flower | Season
  rank: number    // 1-9 (suited) | 1-4 (winds) | 1-3 (dragons) | 1-4 (bonus)
  isRed: boolean  // for red fives
  id: string      // unique identifier
}

class Wall {
  tiles: Tile[]       // shuffled array (144 total)
  drawIndex: number   // current position
  deadWall: Tile[]    // reserved tiles for replacements
}

class DeadPool {
  discards: Tile[]    // tiles that cannot be redrawn
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

## 1b. Bonus Tiles System

The game includes **8 bonus tiles** that exist outside normal hand play but trigger systemic effects.

**Bonus Tile Set:**

| Type | Tiles | Japanese | Count |
|------|-------|----------|-------|
| **Flowers** | Plum, Orchid, Chrysanthemum, Bamboo | 梅, 兰, 菊, 竹 | 4 |
| **Seasons** | Spring, Summer, Autumn, Winter | 春, 夏, 秋, 冬 | 4 |

**Data Model (TypeScript):**
```typescript
interface BonusTile {
  type: 'Flower' | 'Season'
  name: string
  id: string
}

interface FloraTrack {
  flowers: Tile[]   // collected flower tiles (run-wide)
  seasons: Tile[]   // active season tiles (round-scoped)
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

## 2. Hand & Meld System

**Hand Structure (TypeScript):**
```typescript
interface Hand {
  tiles: Tile[]           // current tiles (13-14)
  melds: Meld[]           // declared melds (open)
  concealedMelds: Meld[]  // for scoring only
}

interface Meld {
  type: 'Sequence' | 'Triplet' | 'Quad' | 'Pair'
  tiles: Tile[]    // component tiles (3-4)
  isConcealed: boolean
}
```

**Required Algorithms:**
- **Hand Parser:** Decompose 14 tiles into valid meld combinations
- **Shanten Calculator:** Minimum tiles needed to reach tenpai
- **Tenpai Detector:** Identify waiting tiles
- **Legal Hand Validator:** Confirm 4 melds + 1 pair (or special forms)

---

## 3. Yaku Detection System

**Yaku Definition (TypeScript):**
```typescript
interface YakuDefinition {
  id: string
  displayName: string
  tier: 1 | 2 | 3 | 4
  multiplier: number
  conditions: YakuCondition[]
  requiresConcealed: boolean
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

## 4. Scoring Engine

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

## 5. Decree System

### Core Concept: Decrees (役令 / 法令)

**Decrees** represent overriding rule mandates issued by the "table," "heavens," or "court."

They:
- **Persist across rounds** within a run
- **Rewrite legality or scoring** semantics
- **Stack under controlled constraints**

Conceptually: a Decree is not a tile, but a **binding rule of play**.

> *"Mahjong does not break rules with clowns; it bends them with authority."*

This is the cleanest semantic replacement for the "Joker" concept—grounded in Mahjong's cultural vocabulary for rule authority.

**Decree Definition (TypeScript):**
```typescript
interface DecreeDefinition {
  id: string
  displayName: string
  category: 'Structural' | 'TileIdentity' | 'YakuDoctrine' | 'Entropy' | 'Scaling'
  rarity: 'LocalEdict' | 'RegionalMandate' | 'ImperialDecree' | 'HeavenlyOrdinance'
  effect: DecreeEffect  // Typed effect configuration
  flowerRequirement?: number
}
```

---

### 5a. Taxonomy of Decrees

#### A. Structural Decrees (形法令)

Alter what constitutes a legal hand. These mirror "illegal hands made legal," which is culturally coherent.

| Decree | Effect |
|--------|--------|
| **Broken Chow Edict** | Sequences may skip one rank |
| **False Eye Mandate** | One meld may serve as the pair |
| **Compressed Kong Ordinance** | Kongs resolve as pungs |
| **Open Hand Tolerance** | Menzen-only yaku allowed while open |

#### B. Tile Identity Decrees (变牌法令)

Alter what tiles represent. Maps directly to traditional "heaven tile" mythology.

| Decree | Effect |
|--------|--------|
| **Honor Transmutation** | Honors may count as suited tiles |
| **Phantom Terminal** | One terminal per hand is assumed present |
| **Celestial Wildcard** | One tile may impersonate another |
| **Suit Bleed** | Honors count as any suit |

#### C. Yaku Doctrine Decrees (役变法令)

Alter yaku definition or hierarchy. Reframes rule-breaking as doctrinal reinterpretations, not cheats.

| Decree | Effect |
|--------|--------|
| **Corrupted Pinfu Canon** | Pinfu scores higher with pungs |
| **Tanyao Dispensation** | Terminals allowed in Tanyao |
| **Yakuman Succession** | Certain yaku may ascend to yakuman |
| **Inverted Scoring** | Low-tier yaku gain bonus multipliers |

#### D. Entropy & Fate Decrees (天运法令)

Alter probability flow and tempo. Aligns with "Heaven, Earth, Man" fortune concepts.

| Decree | Effect |
|--------|--------|
| **Dead Wall Writ** | One draw per hand may come from discards |
| **Extended Hand Grant** | +3 draws before failure |
| **Shanten Clemency** | Hands may score at 1-shanten |
| **Fate Reweaving** | Redraw up to 3 tiles once per round |

#### E. Scaling & Discipline Decrees (修行法令)

Reward commitment and repetition. These feel like training vows, not card-game tricks.

| Decree | Effect |
|--------|--------|
| **Pure Suit Asceticism** | Dominant suit tiles scale multiplicatively |
| **Closed-Hand Austerity** | Concealed hands gain exponential growth |
| **Yaku Repetition Charter** | Identical yaku across rounds compound |
| **Terminal Devotion** | Each terminal adds +5% to final score |

---

### 5b. Rarity Bands

Thematic consistency mirrors Mahjong's cultural framing of authority:

| Tier | Name | Narrative Role | Power Level |
|------|------|----------------|-------------|
| Common | **Local Edicts** | Minor table customs | Small bonuses |
| Uncommon | **Regional Mandates** | House rules | Moderate effects |
| Rare | **Imperial Decrees** | Court-sanctioned exceptions | Strong rule-bending |
| Mythic | **Heavenly Ordinances** | Cosmological lawbreaking | Run-defining |

---

### 5c. Integration with Other Systems

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

### 5d. Decree Library (v1)

For a full, expanded list of Decrees with triggers, rarity, and design notes, see
[ITEM_LIBRARIES.md](../ITEM_LIBRARIES.md).

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

---

## 6. Flowers & Seasons System

### Design Rationale

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

### Structural Split

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

## 7. Mahjong-First Analog Systems

This section defines original, mahjong-themed analogs to several Balatro mechanics. These are designed to fit Tensho's authority hierarchy and tile grammar, without copying Balatro content.

### 7a. Fate Seals (Tarot analog)

**Theme:** Ritual seals that alter a single hand or a single decision.

**Core Rules:**
- One seal can be used per round by default.
- Seals are "Heaven" authority: they override most table rules.
- Using a seal never changes the wall composition, only the current hand state.

**Mahjong Twist:** Seals are keyed to hand structure (melds, waits, pairs).

**Example Effects (Original):**
- **Seal of Harmony:** Convert one isolated tile into a sequence fit by shifting its rank by ±1.
- **Seal of Balance:** Swap ranks of two suited tiles in hand.
- **Seal of Stillness:** One chosen tile cannot be discarded this round.

### 7b. Celestial Orbs (Planet analog)

**Theme:** Constellations that permanently empower yaku families.

**Core Rules:**
- Orbs apply run-wide, stacking with Flowers/Decrees.
- Orbs "attune" to a yaku category and grow with repeated triggers.

**Mahjong Twist:** Orbs level up only when their attuned yaku is scored.

**Example Effects (Original):**
- **Dragon Star:** +X% multiplier to dragon-based yaku.
- **Wind Star:** +X% multiplier to wind-based yaku.
- **Sequence Star:** +X% multiplier to sequence-heavy hands.

### 7c. Void Scripts (Spectral analog)

**Theme:** Forbidden scripts that bend rules at a cost.

**Core Rules:**
- Each script has a downside (corruption, lost slot, penalty).
- Scripts can only be used once per round.

**Mahjong Twist:** Scripts can corrupt Seasons or weaken Decrees temporarily.

**Example Effects (Original):**
- **Script of Eclipse:** Score at 1-shanten, lose a Decree slot next round.
- **Script of Mirrors:** Duplicate one tile, but lock a random tile in Dead Pool.
- **Script of Silence:** Ignore one invalid meld, but halve base score.

### 7d. Imperial Charters (Voucher analog)

**Theme:** Court-issued permanent upgrades.

**Core Rules:**
- Purchased only after Acts, not mid-round.
- Each charter is unique and non-repeatable in a run.

**Mahjong Twist:** Charters carry a "Court tax" (minor trade-offs).

**Example Effects (Original):**
- **Charter of Abundance:** +1 shop offer each Act, −5% base score.
- **Charter of Discipline:** +1 Decree slot, −1 hand draw limit per round.
- **Charter of Precision:** +10% to shanten bonuses, −10% to random effects.

### 7e. Tile Marks (Card Modifiers analog)

**Theme:** Inscribed marks bound to individual tiles.

**Core Rules:**
- Marks attach to specific tile instances (by Id).
- Marks can decay if discarded or re-shuffled.

**Mahjong Twist:** Marked tiles can change yaku classification for checks only.

**Example Effects (Original):**
- **Lacquered Mark:** +5% per meld containing this tile.
- **Jade Mark:** Counts as honor for yaku checks (still suited for melds).
- **Crimson Mark:** If used in a pair, grant +X flat score.

### 7f. Blessing Packs (Booster Packs analog)

**Theme:** Ritual packs containing mixed upgrades.

**Core Rules:**
- Packs contain 2–4 items from different systems.
- Pack content weights adapt to current authority layer.

**Mahjong Twist:** Pack generation favors your dominant yaku style (sequence vs triplet).

**Example Packs (Original):**
- **Ancestor Pack:** 1 Fate Seal + 1 Void Script.
- **Court Pack:** 1 Imperial Charter + 1 Celestial Orb.
- **Table Pack:** 2 Tile Marks + 1 Decree discount.

### 7g. Omen Tags (Tags analog)

**Theme:** One-time destiny modifiers.

**Core Rules:**
- Omens trigger once, then vanish.
- Omens can lock the next Season type as a trade-off.

**Mahjong Twist:** Omens are "destined" and affect the next shop or round.

**Example Effects (Original):**
- **Omen of Crescents:** Next shop guarantees a Celestial Orb.
- **Omen of Ash:** Next Void Script has no downside.
- **Omen of Rivers:** Next round starts with +1 discard refund.

### 7h. Mandates & Acts (Blinds/Antes analog)

**Theme:** Each Act is a "Mandate" with rule pressure and target score.

**Core Rules:**
- Mandates define bonus rewards and penalties for that Act.
- Mandate modifiers stack with Seasons but are lower authority than Decrees.

**Mahjong Twist:** Mandates include a side condition that can reduce penalties.

**Example Mandates (Original):**
- **Mandate of Purity:** Hands must include a sequence; fail → −20% score.
- **Mandate of Fortune:** Higher targets, but +1 shop reward.
- **Mandate of Restraint:** Fewer draws, but +10% yaku multiplier.

---

## 8. Progression & Meta Systems

### 8a. Table Stakes (Difficulty Tiers)

**Theme:** Enter higher-stake tables with stricter mandates and richer rewards.

**Core Rules:**
- Table Stakes are selectable difficulty tiers.
- Higher stakes apply global rule modifiers and increase Act targets.
- Stakes also increase drop rates for rare systems (Charters, Orbs, Mythic Decrees).

**Mahjong Twist:** Each stake tier represents a different "house" with its own etiquette and penalties.

**Example Table Stakes (Original):**
- **House Quiet (Tier 1):** Standard targets. +5% gold rewards.
- **House Jade (Tier 2):** +15% targets. +10% yaku multipliers.
- **House Ember (Tier 3):** −2 draws per round. +20% shop rarity.
- **House Storm (Tier 4):** Mandates are harsher. +1 Charter choice after each Act.

### 8b. Court Exchange (Shop)

**Theme:** A ceremonial market between Acts and rounds.

**Core Rules:**
- Offers Decrees, Fate Seals, Orbs, Scripts, Marks, and Blessing Packs.
- Rarity weights shift based on your active Flowers/Seasons/Decrees.
- Includes a limited "Court Favor" currency earned via objectives.

**Mahjong Twist:** The Court Exchange can "audit" you if you break etiquette (e.g., excessive discards), raising prices temporarily.

**Original Shop Features:**
- **Favor Slots:** A small set of premium offers purchasable only with Court Favor.
- **Mandate Clause:** One offer per Act is tied to the current Mandate's theme.

### 8c. Archive of Hands (Collection)

**Theme:** A growing compendium of discovered yaku, decrees, seals, orbs, scripts, marks, and table styles.

**Core Rules:**
- Each discovered item is logged with stats and rarity.
- Optional "Lore Notes" unlock after using an item multiple times.

**Mahjong Twist:** Each archived item shows its authority layer (Heaven/Court/Nature/Table/Grammar).

**Collection Categories (Original):**
- Yaku Archive
- Decree Ledger
- Fate Seal Codex
- Celestial Orb Atlas
- Void Script Grimoire
- Tile Mark Registry
- Table Style Gallery

### 8d. Heavenly Accolades (Achievements)

**Theme:** Formal court recognitions tied to play mastery.

**Core Rules:**
- Achievements unlock titles, cosmetics, and sometimes Charters.
- Some accolades unlock new Table Stakes tiers.

**Mahjong Twist:** Accolades are framed as "court titles," each with a ceremonial name.

**Example Accolades (Original):**
- **Keeper of Winds:** Score 10 wind-based yaku in a run.
- **Master of Silence:** Win 3 rounds without discarding honors.
- **Seal Bearer:** Use 10 Fate Seals across runs.

### 8e. Game Mechanics Design Principles

**Guiding Principles for new mechanics:**
- Must respect the authority hierarchy: Seasons > Decrees > Flowers > Tiles > Yaku.
- Must be explainable via Mahjong terms (no card metaphors).
- Must encourage hand structure choices, not just raw multipliers.

**Candidate Mechanics (Original):**
- **Seat Wind Pressure:** Seat wind changes each Act, affecting wind yaku availability.
- **River Memory:** Discarded tiles influence future shop offerings or mark decay.
- **Dead Wall Mercy:** Once per Act, swap a tile with the dead wall at a cost.
- **Concealment Discipline:** Bonus scaling when you avoid open melds for an entire Act.
