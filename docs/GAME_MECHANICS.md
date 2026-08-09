# Core Game Mechanics

> Detailed scoring, economy, and gameplay mechanics for Tensho Mahjong Roguelike.

**Related Documents:**
- [ARCHITECTURE.MD](../ARCHITECTURE.MD) — Project overview and technical architecture
- [GAME_SYSTEMS.md](GAME_SYSTEMS.md) — Core systems (Tile, Decree, Flowers)
- [UI_DESIGN.md](UI_DESIGN.md) — Visual design guide
- [ITEM_LIBRARIES.md](../ITEM_LIBRARIES.md) — Complete item lists

---

## 1. Scoring Formula: Base Points × Multipliers

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

## 2. Activation Types (効果発動)

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

## 3. Discards and Hand Management (河管理)

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

## 4. Economy: Gold and Interest (経済)

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

## 5. Negative Effects (負効果)

**Theme:** Debuffs and restrictions that add challenge and strategic complexity.

### 5a. Debuffed Tiles (封印牌)

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

### 5b. Debuffed Decrees (法令封印)

When a Decree is debuffed (via Corrupted Seasons or Mandates):
- Decree effect is completely disabled
- Edition bonuses on Decree (if any) are disabled
- Still counts for "number of Decrees" effects
- Still provides sell value for economy calculations

### 5c. Face-Down Tiles (伏牌)

Some Mandates cause tiles to be drawn face-down:
- Player cannot see rank or suit
- Tiles sort correctly when auto-arranged (revealing hints)
- Playing face-down tiles shows "???" for hand type
- Using a targeted consumable reveals the tile for the rest of the current hand

**Face-Down Sources:**

| Source | Effect |
|--------|--------|
| **The House** | The opening hand is face-down |
| **The Wheel** | 1 in 7 tiles drawn is face-down |
| **The Fish** | Replacement tiles drawn after playing are face-down |
| **The Mark** | Honor tiles are face-down |

### 5d. Locked Tiles (拘束牌)

A locked tile cannot be discarded or redrawn:
- Must be included in any played hand
- Disrupts optimal hand formation
- Can only be removed by destroying the tile
- Displays a cyan lock marker while held

---

## 6. Stickers (貼付)

**Theme:** Persistent modifiers attached to Decrees that add constraints or benefits.

Stickers appear on Decrees at higher Table Stakes (difficulty tiers), adding additional considerations.

### 6a. Eternal Sticker (永劫貼)

- Decree cannot be sold or destroyed
- Becomes a permanent fixture of the build
- Synergy: Decrees that self-destruct become risk-free with Eternal
- **Appears at:** Table Stake Tier 4+
- **Probability:** 30% of shop Decrees

**Cannot receive Eternal:**
- Decrees with "sell this Decree" effects
- Decrees that naturally decay

### 6b. Perishable Sticker (腐朽貼)

- Decree becomes debuffed after 5 rounds
- Debuffed Decree loses all effects but keeps passive interactions
- **Appears at:** Table Stake Tier 6+
- **Probability:** 30% of shop Decrees

**Cannot receive Perishable:**
- Scaling Decrees that start at 0 and build up
- Already-Eternal Decrees

### 6c. Rental Sticker (租借貼)

- Decree costs only 1 Gold to purchase
- Deducts 3 Gold at the END of every round
- Can put player into debt
- **Appears at:** Table Stake Tier 8 (Gold Stake)
- **Probability:** 30% of shop Decrees

**Strategy:**
- Buy Rental Decrees for immediate effect, sell before round ends
- Pair with Decrees that generate value on purchase/activation

### 6d. Combined Odds at High Stakes

At Gold Stake (Tier 8):
- 28% chance of a Decree having no stickers
- Decrees can have Rental + Eternal or Rental + Perishable (not both Eternal and Perishable)

---

## 7. Skipping Rounds and Omens (局飛ばし)

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

## 8. Mandates (Blinds/Antes Analog)

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

## 9. Act Score Requirements (Ante Scaling)

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

## 10. Retriggers (再発動)

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

## 11. Tile Editions (牌版)

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

## 12. Table Stakes (場代) — Difficulty System

**Theme:** Progressive difficulty modifiers that stack cumulatively, unlocking new challenges and rewards.

Table Stakes are 8 ascending difficulty tiers that represent mastery levels. Each stake adds ALL modifiers from previous stakes, creating exponential challenge.

### Stake Progression

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

### Cumulative Stacking Example

At Gold Stake (Tier 8), a run includes ALL of the following:
- ❌ No Small Round rewards
- 📈 Faster score scaling
- ♾️ 30% Eternal stickers on shop Decrees
- ➖ -1 Redraw
- 📈📈 Even faster score scaling
- ⏳ 30% Perishable stickers on shop Decrees
- 💰 30% Rental stickers on shop Decrees

### Stake Stickers (Victory Markers)

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

### Per-Wall Progression

Each Wall (deck variant) has its own stake progression:
- Must complete current stake to unlock next stake for that specific Wall
- Progress is tracked independently (completing Gold on Red Wall doesn't unlock Red Stake on Blue Wall)
- Challenge Runs can only be played on White Stake

---

## 13. The Tea House (茶寮) — Shop System

**Theme:** The between-round marketplace where players acquire Decrees, consumables, and upgrades.

The Tea House appears after every Round (except final rounds in an Act).

### Shop Layout

| Slot | Contents | Base Count |
|------|----------|------------|
| **Item Slots** | Random items (Decrees, Fate Seals, Celestial Orbs) | 2 slots |
| **Blessing Packs** | Booster packs with random contents | 2 packs |
| **Imperial Charter** | Voucher-style permanent upgrade | 1 charter |

### Item Weights (Base Probabilities)

| Item Type | Weight | Probability |
|-----------|--------|-------------|
| Decree | 20 | 71.4% |
| Fate Seal | 4 | 14.3% |
| Celestial Orb | 4 | 14.3% |

### Decree Rarity Weights

| Rarity | Probability | Base Cost |
|--------|-------------|-----------|
| Common | 70% | 1-6 Gold |
| Uncommon | 25% | 4-8 Gold |
| Rare | 5% | 7-10 Gold |
| Legendary | — | 20 Gold (special sources only) |

### Other Item Costs

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

### Reroll Mechanics

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

### Pricing Formula

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

## 14. Blessing Packs (祝福袋) — Booster System

**Theme:** Randomized item bundles that provide choices from themed pools.

Two Blessing Packs appear in each Tea House visit. Players open packs immediately upon purchase.

### Pack Types

| Pack | Japanese | Contents | Use |
|------|----------|----------|-----|
| **Arcana Pack** | 秘術袋 | Fate Seals (Tarot-style) | Immediate use |
| **Celestial Pack** | 天球袋 | Celestial Orbs (upgrades) | Immediate use |
| **Tile Pack** | 牌袋 | Tiles with modifiers | Added to Wall |
| **Decree Pack** | 法令袋 | Decree cards | Added to slots |
| **Void Pack** | 虚空袋 | Void Scripts | Immediate use |

### Pack Sizes

| Size | Cost | Choices | Selection |
|------|------|---------|-----------|
| Normal | 4 Gold | 3 options | Choose 1 |
| Jumbo | 6 Gold | 5 options | Choose 1 |
| Mega | 8 Gold | 5 options | Choose up to 2 |

### Pack Appearance Rates

| Pack Type | Normal | Jumbo | Mega |
|-----------|--------|-------|------|
| Tile Pack | 17.84% | 8.92% | 2.23% |
| Arcana Pack | 17.84% | 8.92% | 2.23% |
| Celestial Pack | 17.84% | 8.92% | 2.23% |
| Decree Pack | 5.35% | 2.68% | 0.67% |
| Void Pack | 2.68% | 1.34% | 0.31% |

### Skipping Packs

Players may skip selecting from a pack without penalty:
- Skipping a Mega pack after selecting 1 option is allowed
- The "Skip" action synergizes with certain Decrees (e.g., Patient Observer gains +3 Mult per skip)

---

## 15. Imperial Charters (皇勅) — Voucher System

**Theme:** Permanent upgrades purchased after defeating Boss Mandates that enhance the run.

Imperial Charters are offered in the Tea House:
- Refresh after each Boss Mandate victory
- Only one Charter appears per shop
- Cannot be rerolled
- Cost: 10 Gold (base)

### Charter Pairs

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

## 16. Archive of Hands (手牌録) — Collection System

**Theme:** A comprehensive catalog of all discovered items, tracking mastery and unlocks.

The Archive tracks every item the player has encountered or unlocked across all runs.

### Archive Categories

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

### Discovery Mechanics

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

### Unlock vs Discovery

Some items have **unlock conditions** before they can appear:
- Upgraded Charters require base Charter purchased
- Legendary Decrees require specific achievements
- Special Walls unlock from collection completion or stake victories

**Full Unlock Option:**
Players can choose to unlock all items instantly, but this disables achievement tracking for that profile.

---

## 17. Heavenly Accolades (天賞) — Achievement System

**Theme:** Recognition milestones that reward mastery and creative play.

Accolades are permanent badges earned by meeting specific conditions. Some unlock new items.

### Progression Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **First Steps** | 初歩 | Reach Act 4 | Stage Master Decree |
| **Ascending** | 昇進 | Reach Act 8 | Flower Pot Decree |
| **Victory** | 勝利 | Win a Run | Blueprint Decree |
| **Red Path** | 赤道 | Win on Red Stake+ | Crimson Wall |
| **Black Path** | 黒道 | Win on Black Stake+ | Obsidian Wall |
| **Golden Path** | 金道 | Win on Gold Stake | — |

### Cumulative Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Tile Master** | 牌師 | Play 2500 tiles | Swift Hand Charter |
| **Discard Artist** | 捨牌芸者 | Discard 2500 tiles | Wasteful Plenty Charter |
| **Fortune Built** | 富豪 | Have 400+ Gold in one run | Satellite Decree |

### Skill Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Wild Flush** | 万能清一色 | Complete Honitsu with all Wild tiles | — |
| **Speed Run** | 疾走 | Win in 12 or fewer rounds | Swift Andy Decree |
| **Charter Collector** | 皇勅収集 | Buy 5 Charters by Act 4 | — |
| **Shattered** | 粉砕 | Break 2 Glass tiles in one hand | — |
| **Royal Hand** | 帝王手 | Complete a Yakuman | — |
| **Retrograde** | 逆行 | Get any yaku to level 10 | — |

### Scoring Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **10K** | 万点 | Score 10,000 points in one hand | Lucky Sixes Decree |
| **1,000K** | 百万点 | Score 1,000,000 points in one hand | The Idol Decree |
| **100,000K** | 億点 | Score 100,000,000 points in one hand | Stuntman Decree |

### Collection Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Seal Scholar** | 符学者 | Discover every Fate Seal | Cartomancer Decree |
| **Star Gazer** | 星読み | Discover every Celestial Orb | Astronomer Decree |
| **Void Walker** | 虚空歩者 | Discover every Void Script | — |
| **Charter Complete** | 皇勅全取 | Discover every Imperial Charter | — |
| **Archive Complete** | 全録達成 | Discover 100% of collection | — |

### Mastery Accolades

| Accolade | Japanese | Condition | Unlocks |
|----------|----------|-----------|---------|
| **Archive Complete+** | 全録達成・極 | Win with every Wall on Gold Stake | — |
| **Archive Complete++** | 全録達成・究 | Earn Gold Sticker on every Decree | — |

### Challenge Accolades

| Accolade | Japanese | Condition |
|----------|----------|-----------|
| **Rule Bender** | 曲法者 | Complete any Challenge Run |
| **Rule Breaker** | 破法者 | Complete every Challenge Run |
| **Deck Minimalist** | 極小山 | Thin Wall to 20 or fewer tiles |
| **Deck Maximalist** | 極大山 | Have 80+ tiles in Wall |
| **Purist** | 無転 | Win without rerolling the shop |

### Notes

- Accolades cannot be earned during Challenge Runs (except Rule Bender/Breaker)
- Accolades can be earned after winning a run (continue playing to reach score targets)
- Some accolades share unlock conditions with specific items

---

## Glossary: Balatro → Tensho Term Mapping

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
