# Tenshō Complete Item Libraries

> 📚 This appendix contains complete item lists for all game systems, providing specific details for implementation reference.
> 
> **See also:** [ARCHITECTURE.MD](ARCHITECTURE.MD) for system design and game mechanics.

---

## 📜 A1) Complete Fate Seal Library (運命符)

| Seal | Japanese | Effect | Mahjong Twist |
|------|----------|--------|---------------|
| **Seal of the Fool** | 愚者の印 | Creates the last Fate Seal or Celestial Orb used this run (never a Fool); a copied Seal is used at once | Mirrors The Fool |
| **Seal of the Alchemist** | 錬金術師の印 | Enhances 2 selected tiles with Lucky Mark | Tiles shimmer with fortune |
| **Seal of the Oracle** | 巫女の印 | Creates up to 2 random Celestial Orbs (if room) | Commune with stars |
| **Seal of the Empress** | 女帝の印 | Enhances 2 selected tiles with Score Bonus Mark | Imperial blessing |
| **Seal of the Emperor** | 皇帝の印 | Creates 2 random Fate Seals, each used at once (never an Emperor or a Fool) | Royal decree |
| **Seal of the Sage** | 賢者の印 | Enhances 2 selected tiles with Bonus Chip Mark | Ancient wisdom |
| **Seal of Harmony** | 和の印 | Converts 1 tile to Wild (counts as any suit) | Balance of elements |
| **Seal of Fortitude** | 剛の印 | Enhances 1 tile to Steel Mark (+×1.5 Mult when held) | Unbreakable resolve |
| **Seal of Glass** | 硝子の印 | Enhances 1 tile to Glass Mark (×2 Mult, may shatter) | Beautiful but fragile |
| **Seal of the Hermit** | 隠者の印 | Doubles gold (max +¥20) | Wisdom through solitude |
| **Seal of Fortune** | 運命の印 | 1 in 4 chance to add Foil/Holo/Prismatic to random Decree | Wheel of fate spins |
| **Seal of Strength** | 力の印 | Increases rank of up to 2 tiles by 1 (max 9) | Growth through struggle |
| **Seal of Release** | 解放の印 | Destroys up to 2 selected tiles permanently | Let go of the past |
| **Seal of Transmutation** | 変容の印 | Select 2 tiles, left becomes copy of right | Death and rebirth |
| **Seal of Balance** | 均衡の印 | Gives total sell value of all Decrees (max ¥50) | Equilibrium restored |
| **Seal of Wealth** | 富の印 | Enhances 1 tile to Gold Mark (¥3 if held at round end) | Prosperity granted |
| **Seal of Stone** | 石の印 | Enhances 1 tile to Stone Mark (+100 Chips, always scores) | Immutable foundation |
| **Seal of Characters** | 萬子の印 | Converts up to 3 tiles to Characters | Way of Characters |
| **Seal of Circles** | 筒子の印 | Converts up to 3 tiles to Circles | Way of Circles |
| **Seal of Bamboo** | 索子の印 | Converts up to 3 tiles to Bamboo | Way of Bamboo |
| **Seal of Judgment** | 審判の印 | Creates a random Decree (if room) | Court decides |
| **Seal of Unity** | 統一の印 | Converts up to 3 suited tiles to Winds: ranks 1/5/9 → East, 2/6 → South, 3/7 → West, 4/8 → North | Path of honors; keeps tile modifiers, removes red-five status |

Physical suit/rank transformations retain a tile's enhancement, Seal, and
edition. Red-five (aka-dora) status is retained only while the tile remains a
suited five; it is not the Red Seal retrigger modifier. Creating an ordinary
five through a rank change does not make it red. This applies to Strength and
Ouija rank changes as well as Unity's conversion to Winds.

### Secret Fate Seals (Rare)

| Seal | Effect | Unlock Condition |
|------|--------|------------------|
| **Seal of the Immortal** | Creates a Mythic Decree (if room) | Score a Yakuman |
| **Seal of the Void** | Upgrades every Yaku by 1 level | Play all Yaku types in one run |

---

## 🌟 A2) Complete Celestial Orb Library (天球)

Each Orb is named after the upgrade family it raises; its planet is a flavor
subtitle. All share a jade-and-gold shell showing that family's tile motif.
Using one raises the family by 1 level for the run (maximum 10); each level
above 1 adds the bonus below to every play that scores the family.
"Works with" lists what scores each family (`upgradeFamilies.*.covers`).

| Orb | Planet | Bonus per Level | Works with |
|-----|--------|-----------------|------------|
| **Pairs Orb** | Pluto (冥王星) | +10 base points, +1 Mult | Pair, Two Pairs, Three Pairs (not Seven Pairs) |
| **All Simples Orb** | Mercury (水星) | +15 base points, +1 Mult | Any play forming a group from 2–8 tiles only; All Simples hand |
| **Honors Orb** | Uranus (天王星) | +20 base points, +1 Mult | Any play with a Wind or Dragon group; Value Tiles hand |
| **Sequences Orb** | Venus (金星) | +20 base points, +2 Mult | Sequence, Sequence + Pair, Two Sequences; All Sequences hand |
| **Straights Orb** | Saturn (土星) | +30 base points, +3 Mult | Straights of Four and Five, Straight + Pair; 1–9 Straight hand |
| **Half Flush Orb** | Jupiter (木星) | +15 base points, +2 Mult | Half Flush hand |
| **Sets Orb** | Earth (地球) | +25 base points, +2 Mult | Any Triplet or Quad pattern; All Triplets hand |
| **Full Flush Orb** | Mars (火星) | +30 base points, +3 Mult | Full Flush hand |
| **Mixed Triple Orb** | Neptune (海王星) | +40 base points, +4 Mult | Mixed Triple Sequence hand |

### Secret Celestial Orbs

| Orb | Planet | Bonus per Level | Works with | Unlock Condition |
|-----|--------|-----------------|------------|------------------|
| **Seven Pairs Orb** | Planet X (惑星X) | +35 base points, +3 Mult | Seven Pairs hand | Play Seven Pairs |
| **Outside Hand Orb** | Ceres (ケレス) | +40 base points, +4 Mult | Outside Hand and Pure Outside Hand | Score an Outside Hand |
| **Thirteen Orphans Orb** | Eris (エリス) | +50 base points, +3 Mult | Thirteen Orphans hand | Score Thirteen Orphans |

### Mythic Orb

| Orb | Planet | Effect | Unlock |
|-----|--------|--------|--------|
| **Every Family Orb** | Black Hole (ブラックホール) | Raises all 12 families by 1 level (each capped at 10) | Discover all 12 orbs |

---

## 👻 A3) Complete Void Script Library (虚無書)

| Script | Japanese | Effect | Penalty |
|--------|----------|--------|---------|
| **Script of Kinship** | 眷属の書 | Destroy 1 random tile, add 3 random Enhanced Face tiles (Winds/Dragons) | Lose a tile |
| **Script of the Grave** | 墓場の書 | Destroy 1 random tile, add 2 random Enhanced Terminal tiles | Lose a tile |
| **Script of Incantation** | 呪文の書 | Destroy 1 random tile, add 4 random Enhanced Number tiles | Lose a tile |
| **Script of the Gold Seal** | 金印の書 | Add Gold Seal to 1 selected tile | None (rare find) |
| **Script of Aura** | 光輪の書 | Add Foil/Holo/Prismatic to 1 selected tile | None (rare) |
| **Script of the Wraith** | 亡霊の書 | Creates a random Rare Decree | Gold set to ¥0 |
| **Script of the Sigil** | 印形の書 | Converts ALL tiles in hand to a single random suit | Massive commitment |
| **Script of the Ouija** | 降霊の書 | Converts ALL tiles in hand to a single random rank | −1 Hand Size permanently |
| **Script of Ectoplasm** | 霊質の書 | Add Negative to a random Decree (+1 Decree slot) | −1 Hand Size permanently |
| **Script of Immolation** | 焚焼の書 | Destroys 5 random tiles from hand | Gain ¥20 |
| **Script of the Ankh** | 命の書 | Copy a random Decree, destroy all other Decrees | High risk |
| **Script of Déjà Vu** | 既視感の書 | Add Red Seal to 1 selected tile (retrigger) | None |
| **Script of the Hex** | 呪詛の書 | Add Prismatic to random Decree, destroy all others | Nuclear option |
| **Script of the Trance** | 恍惚の書 | Add Blue Seal to 1 tile (creates Orb for final hand) | None |
| **Script of the Medium** | 霊媒の書 | Add Purple Seal to 1 tile (creates Seal on discard) | None |
| **Script of the Cryptid** | 異形の書 | Create 2 copies of 1 selected tile in hand | Duplicates in deck |
| **Script of the Soul** | 魂の書 | Creates a Legendary (Heavenly Ordinance) Decree | Secret, 0.3% chance |
| **Script of the Singularity** | 特異点の書 | Upgrade every Yaku by 1 level | Secret, 0.3% chance |

---

## 📋 A4) Complete Imperial Charter Library (皇勅)

| Base Charter | Cost | Effect | Upgraded Charter | Upgrade Effect | Unlock Condition |
|--------------|------|--------|------------------|----------------|------------------|
| **Overstock Edict** | ¥10 | +1 shop slot (to 3) | **Surplus Decree** | +1 more shop slot (to 4) | Spend ¥2500 total |
| **Discount Seal** | ¥10 | All shop items 25% off | **Liquidation Order** | All shop items 50% off | Redeem 10 Charters in one run |
| **Refinement Edict** | ¥10 | Foil/Holo/Prismatic appear 2× more | **Radiance Decree** | Appear 4× more | Have 5 enhanced Decrees |
| **Reroll Subsidy** | ¥10 | Rerolls cost ¥2 less | **Reroll Grant** | Cost ¥2 less again | Reroll shop 100 times total |
| **Crystal Sphere** | ¥10 | Arcana Packs offer +1 choice | **Omen Globe** | Void Scripts may appear in Fate Seal packs | Use 25 Fate Seals from packs |
| **Star Chart** | ¥10 | Celestial Packs always contain Orb for most-played Yaku | **Observatory License** | Each held Orb gives ×1.5 Mult when its Yaku family scores, once per Orb per play; Black Hole matches any scored Yaku | Use 25 Orbs from packs |
| **Extra Hand Writ** | ¥10 | +1 hand per round | **Dual Hand Decree** | +1 more hand per round | Play 2500 tiles total |
| **Discard Permit** | ¥10 | +1 discard per round | **Recycle Order** | +1 more discard per round | Discard 2500 tiles total |
| **Seal Merchant** | ¥10 | Fate Seals appear 2× more in shop | **Seal Tycoon** | Appear 4× more | Buy 50 Seals from shop |
| **Orb Merchant** | ¥10 | Celestial Orbs appear 2× more in shop | **Orb Tycoon** | Appear 4× more | Buy 50 Orbs from shop |
| **Seed Fund** | ¥10 | Interest cap raised to ¥10 | **Money Tree** | Interest cap raised to ¥20 | Max interest 10 rounds in a row |
| **Blank Scroll** | ¥10 | Does nothing? | **Antimatter Seal** | +1 Decree slot | Redeem Blank 10 times total |
| **Tile Bazaar** | ¥10 | Special tiles can be purchased from shop | **Illusion Market** | Shop tiles may have Marks/Editions | Buy 20 tiles from shop |
| **Hieroglyph Tablet** | ¥10 | −1 Ante, −1 hand each round | **Petroglyph Tablet** | −1 Ante again, −1 discard each round | Reach Ante 12 |
| **Court Reroll** | ¥10 | Reroll Boss Mandate 1×/Ante (¥10) | **Full Retcon** | Reroll unlimited times | Discover 25 Mandates |
| **Expanded Hand** | ¥10 | +1 hand size | **Master Grip** | +1 hand size again | Reduce hand to 5 tiles |

---

## 🎨 A5) Complete Tile Mark Library (牌印)

A tile holds **one** modifier: a Mark, a Seal or an Edition. Applying a new one
replaces whatever the tile carried (a Lucky tile given a Stone Mark is just
Stone). Saves from before this rule keep the rarest: Edition, then Mark, then
Seal.

### Enhancements (Marks)

| Mark | Japanese | Effect |
|------|----------|--------|
| **Bonus Mark** | 加点印 | +30 Chips when scored |
| **Mult Mark** | 倍点印 | +4 Mult when scored |
| **Wild Mark** | 万能印 | Counts as every suit simultaneously |
| **Glass Mark** | 硝子印 | ×2 Mult when scored; 1/4 chance to shatter after |
| **Steel Mark** | 鋼印 | ×1.5 Mult while held in hand (not played) |
| **Stone Mark** | 石印 | +100 Chips, always scores, no rank/suit |
| **Gold Mark** | 金印 | ¥3 if held at end of round |
| **Lucky Mark** | 幸運印 | 1/5 chance for +20 Mult; 1/15 chance for ¥20 |

### Seals (replace a Mark or Edition)

| Seal | Japanese | Effect |
|------|----------|--------|
| **Gold Seal** | 金封 | Earn ¥3 when played and scores |
| **Red Seal** | 赤封 | Retrigger this tile 1 time |
| **Blue Seal** | 青封 | Creates Celestial Orb for final Yaku if held |
| **Purple Seal** | 紫封 | Creates a Fate Seal when discarded |

### Editions (one per tile or Decree, rarest)

| Edition | Japanese | Effect on Tile | Effect on Decree |
|---------|----------|----------------|------------------|
| **Base** | 通常 | No effect | No effect |
| **Foil** | 箔押し | +50 Chips | +50 Chips |
| **Holographic** | 光沢 | +10 Mult | +10 Mult |
| **Prismatic** | 虹彩 | ×1.5 Mult | ×1.5 Mult |
| **Negative** | 負極 | +1 Decree slot while this physical tile remains in the run wall | +1 Decree slot while owned |

Fate Seal tile changes persist for the current run, including future rounds and
save/reload. New runs start fresh. A Seal is never held: one bought in the Tea
House or chosen from an Arcana Pack is used at once, the player picking its
targets from every tile of the run's wall (Flowers and Seasons excluded), and
Seals that take no tiles act immediately. A Seal the run makes (a redrawn Purple
tile, the Emperor, the Fool) is used the same way as it is made, at the table or
in the Tea House: one that takes tiles opens the wall picker at once, with no
cancel, and only a Seal that can work then is made. Negative tile capacity follows ownership, not
draws or scoring; destruction or edition replacement removes its slot without
deleting owned Decrees. See [resolved ownership rules](docs/RUN_OWNERSHIP_IMPLEMENTATION.md).

### Stickers (Decrees only, from higher Stakes)

| Sticker | Japanese | Effect |
|---------|----------|--------|
| **Eternal** | 永久 | Cannot be sold |
| **Perishable** | 消耗 | Debuffed after 5 rounds |
| **Rental** | 賃貸 | −¥3 per round |

---

## 📦 A6) Blessing Pack Appearance Weights (祝福袋)

| Pack Type | Normal | Jumbo | Mega |
|-----------|--------|-------|------|
| Standard | 17.8% | 8.9% | 2.2% |
| Arcana | 17.8% | 8.9% | 2.2% |
| Celestial | 17.8% | 8.9% | 2.2% |
| Buffoon | 5.4% | 2.7% | 0.7% |
| Spectral | 2.7% | 1.3% | 0.3% |

---

## 🏷️ A7) Complete Omen Tag Library (兆標)

| Tag | Japanese | Effect | Notes |
|-----|----------|--------|-------|
| **Uncommon Omen** | 珍品の兆 | Next shop has free Uncommon Decree | Generated extra |
| **Rare Omen** | 稀少の兆 | Next shop has free Rare Decree | Unlock: Discover Blueprint Decree |
| **Negative Omen** | 負極の兆 | Next base Decree becomes Negative and free | +1 Decree slot |
| **Foil Omen** | 箔の兆 | Next base Decree becomes Foil and free | +50 Chips |
| **Holographic Omen** | 光沢の兆 | Next base Decree becomes Holographic and free | +10 Mult |
| **Prismatic Omen** | 虹彩の兆 | Next base Decree becomes Prismatic and free | ×1.5 Mult |
| **Investment Omen** | 投資の兆 | Gain ¥25 after defeating next Boss Mandate | Stackable |
| **Charter Omen** | 許可の兆 | Adds an Imperial Charter to next shop | Can stack |
| **Boss Omen** | 親分の兆 | Rerolls the next Boss Mandate | Free reroll |
| **Standard Omen** | 標準の兆 | Open free Mega Standard Pack immediately | Instant |
| **Charm Omen** | 魅力の兆 | Open free Mega Arcana Pack immediately | Instant |
| **Meteor Omen** | 流星の兆 | Open free Mega Celestial Pack immediately | Instant |
| **Buffoon Omen** | 道化の兆 | Open free Mega Buffoon Pack immediately | Instant |
| **Handy Omen** | 巧手の兆 | Gain ¥1 per hand played this run | Economy scaling |
| **Garbage Omen** | 不用の兆 | Gain ¥1 per unused discard this run | Economy scaling |
| **Ethereal Omen** | 幽玄の兆 | Open free Spectral Pack immediately | Note: Not Mega |
| **Coupon Omen** | 割引の兆 | Next shop: all initial items free | One-time |
| **Double Omen** | 双子の兆 | Copies the next non-Double Omen earned by skipping | Consecutive Doubles bank one copy each; no recursive copying |
| **Juggle Omen** | 手捌の兆 | +3 Hand Size for next round only | Temporary |
| **D6 Omen** | 骰子の兆 | Next shop: Rerolls start at ¥0 | Still increases |
| **Top-up Omen** | 補充の兆 | Create up to 2 Common Decrees (if room) | Instant |
| **Speed Omen** | 疾走の兆 | Gain ¥5 per skipped Mandate this run | Minimum ¥5 |
| **Orbital Omen** | 軌道の兆 | Upgrades a random Yaku by 3 levels | Powerful |
| **Economy Omen** | 経済の兆 | Doubles your gold (max +¥40) | Instant |

---

## 🎯 A8) Complete Boss Mandate Library (親衛令)

| Mandate | Japanese | Effect | Min Ante |
|---------|----------|--------|----------|
| **The Hook** | 鉤 | Discards 2 random tiles from hand after each play | 1 |
| **The Ox** | 牛 | Names your most-played hand type as the round starts; playing it sets gold to ¥0 | 6 |
| **The House** | 家 | First hand drawn face-down | 2 |
| **The Wall** | 壁 | 4× base score requirement | 2 |
| **The Wheel** | 輪 | 1/7 tiles drawn face-down | 2 |
| **The Arm** | 腕 | Each play lowers every Orb family it levels by 1 (never below level 1) before it scores | 2 |
| **The Club** | 棍 | All Bamboo tiles debuffed | 1 |
| **The Fish** | 魚 | Tiles drawn face-down after each hand | 2 |
| **The Psychic** | 霊能者 | Must play exactly 5 tiles per hand | 1 |
| **The Goad** | 突棒 | All Circles debuffed | 1 |
| **The Water** | 水 | Start with 0 discards | 2 |
| **The Window** | 窓 | All Characters debuffed | 1 |
| **The Manacle** | 枷 | −1 Hand Size | 1 |
| **The Eye** | 目 | Each hand type scores once this round; a repeat scores 0 | 3 |
| **The Mouth** | 口 | Your first play sets this round’s hand type; any other hand scores 0 | 2 |
| **The Plant** | 草 | All Honor tiles debuffed | 4 |
| **The Serpent** | 蛇 | After play/discard, always draw 3 tiles | 5 |
| **The Pillar** | 柱 | Tiles played earlier this Ante are debuffed | 1 |
| **The Needle** | 針 | Play only 1 hand (precision required) | 2 |
| **The Head** | 頭 | All Dragon tiles debuffed | 1 |
| **The Tooth** | 歯 | Lose ¥1 per tile played | 3 |
| **The Flint** | 火打石 | Every play scores half | 2 |
| **The Mark** | 印 | All Honor tiles drawn face-down | 2 |

### Showdown Mandates (Ante 8, 16, 24...)

| Mandate | Japanese | Effect |
|---------|----------|--------|
| **Amber Acorn** | 琥珀の実 | Flips and shuffles all Decrees |
| **Verdant Leaf** | 翠緑の葉 | All tiles debuffed until 1 Decree sold |
| **Violet Vessel** | 紫水瓶 | 6× base score requirement |
| **Crimson Heart** | 深紅の心 | One random Decree disabled each hand |
| **Cerulean Bell** | 青藍の鈴 | Forces 1 tile to always be selected |

---

## 📊 A9) Score Requirements by Ante

| Ante | Base Requirement | House Jade (Stake 2) | House Ember (Stake 3) |
|------|------------------|----------------------|-----------------------|
| 1 | 300 | 300 | 300 |
| 2 | 800 | 900 | 1,000 |
| 3 | 2,000 | 2,600 | 3,200 |
| 4 | 5,000 | 8,000 | 9,000 |
| 5 | 11,000 | 20,000 | 25,000 |
| 6 | 20,000 | 36,000 | 60,000 |
| 7 | 35,000 | 60,000 | 110,000 |
| 8 | 50,000 | 100,000 | 200,000 |

---

## 🔗 A10) System Interaction Matrix

| System A | + System B | Interaction |
|----------|-----------|-------------|
| Flowers | Decrees | +10% Decree effect per Flower |
| Seasons | Decrees | Seasons temporarily override Decree effects |
| Celestial Orbs | Yaku | Permanent +Mult/+Chips per level |
| Tile Marks | Scoring | Multiplicative with Yaku multipliers |
| Omen Tags | Shop | Modify next shop generation |
| Mandates | Round | Define score targets and penalties |
| Charters | Run | Permanent slot/economy modifications |

---

## 📜 A11) Complete Decree Library (法令)

> Decrees are run-wide rule modifiers (equivalent to Balatro's Jokers).
> See `src/config/decreeDefinitions.ts` for the full implementation.

### Rarity Distribution

| Rarity | Count | Engine Tier | Tea House Weight | Base Cost |
|--------|-------|-------------|------------------|-----------|
| Common | 39 | Local Edict | 70% | ¥4 |
| Uncommon | 39 | Regional Mandate | 25% | ¥6 |
| Rare | 33 | Imperial Decree | 5% | ¥8 |
| Legendary | 24 | Heavenly Ordinance | — (special sources) | ¥10 |
| Mythic | 15 | Heavenly Ordinance | — (special sources) | ¥15 |
| **Total** | **150** | — | — | — |

The 15 rule-bending Decrees in `src/systems/DecreeSystem.ts` share these tiers
(165 in all). The Tea House gives Heavenly Ordinance weight 0, so these
Decrees come from a Blessing Pack's legendary roll, Script of the Soul, Seal of
the Immortal, or a Rare+ Omen once no Rare is left. See
[docs/LEGENDARY_DECREE_TIER.md](docs/LEGENDARY_DECREE_TIER.md).

### Common Decrees (Tier 1)

Basic, reliable effects with no conditions.

| Decree | Japanese | Effect |
|--------|----------|--------|
| Half Suited | 半着 | +20 Chips |
| Misty Jade | 霧玉 | +30 Chips |
| Bamboo Scroll | 竹巻 | +40 Chips |
| Jade Tablet | 玉板 | +50 Chips |
| Polished Stone | 磨石 | +60 Chips |
| Gentle Breeze | 微風 | +2 Mult |
| Rising Sun | 朝日 | +3 Mult |
| Lunar Glow | 月光 | +4 Mult |
| Crimson Banner | 紅旗 | +5 Mult |
| Golden Seal | 金印 | +6 Mult |
| Master of Characters | 萬子師 | +3 Mult if the play includes a Characters tile |
| Perfectionist of Circles | 筒子匠 | +3 Mult if the play includes a Circles tile |
| Scholar of Bamboo | 索子学 | +3 Mult if the play includes a Bamboo tile |
| Wind Walker | 風歩者 | +4 Mult if the play includes a Wind |
| Dragon Disciple | 竜弟子 | +4 Mult if the play includes a Dragon |
| Edge Runner | 端走者 | +20 Points per Terminal (a 1 or 9) played |
| Middle Way | 中道 | +10 Points per Simple (a 2–8 tile) played |
| Green Fortune | 緑運 | +15 Points per all-green tile played: 2, 3, 4, 6 and 8 of Bamboo, and the Green Dragon |
| Coin Collector | 銭集 | +1 Gold at the end of each round |
| Merchant's Favor | 商人恩 | +2 Gold at the end of each round |
| Lucky Coin | 幸運銭 | +3 Gold at the end of each round |
| Pair Lover | 対好者 | +30 Points if the play includes a pair |
| Sequence Seeker | 順子求 | +30 Points if the play includes a sequence |
| Triplet Tracker | 刻子追 | +40 Points if the play includes a triplet |
| Flower Friend | 花友 | +10 Chips per collected Flower |
| Seasonal Blessing | 季福 | +2 Mult per active Season |
| Wide Grip | 広握 | +1 rack space |
| Second Chance | 再機会 | +1 free redraw per round |
| Balanced Path | 均衡道 | +15 Chips and +2 Mult |
| Modest Fortune | 謙運 | +20 Points, and +1 Gold at the end of each round |
| Humble Power | 謙力 | +2 Mult, and +1 Gold at the end of each round |
| One Mastery | 壱極 | +25 Points per numbered 1 played |
| Nine Mastery | 九極 | +25 Points per numbered 9 played |
| Five Blessing | 五福 | +35 Points per numbered 5 played |
| Spark | 火花 | ×1.2 Mult |
| Ember | 残火 | ×1.3 Mult |
| Riichi Devotee | 立直信者 | +3 Mult when scoring Riichi |
| Simples Tactician | 断么戦術家 | +3 Mult when you score All Simples: a complete hand of only 2–8 tiles, with no 1s, 9s, Winds or Dragons |
| Sequence Purist | 平和純粋者 | +3 Mult when you score All Sequences: a complete hand of four sequences plus a pair that is not Dragons or East Wind |

### Uncommon Decrees (Tier 2)

Conditional effects with stronger bonuses.

| Decree | Japanese | Effect |
|--------|----------|--------|
| Emperor of Characters | 萬子皇帝 | +8 Mult if at least half the played tiles are Characters |
| Princess of Circles | 筒子姫 | +8 Mult if at least half the played tiles are Circles |
| Sage of Bamboo | 索子賢者 | +8 Mult if at least half the played tiles are Bamboo |
| Flush Fever | 一色熱 | ×1.5 Mult if every numbered tile played is from one suit (Winds and Dragons allowed) |
| Honor Guard | 字牌守護 | ×1.5 Mult if the play includes 3 or more Honors (Winds or Dragons) |
| Terminal Tide | 端牌潮流 | ×1.5 Mult if the play includes 4 or more Terminals (1s or 9s) |
| Straight Arrow | 直矢 | +80 Points if the play includes 3 or more sequences |
| Run Master | 連続師 | +6 Mult per sequence played |
| Triple Threat | 三重脅威 | +80 Points if the play includes 2 or more triplets |
| Triplet Thunder | 刻子雷 | +8 Mult per triplet played |
| Echo Stone | 反響石 | The first scoring tile scores twice |
| Mirror Shard | 鏡片 | The last scoring tile scores twice |
| Dragon Echo | 竜響 | Every Dragon played scores twice |
| Wind Echo | 風響 | Every Wind played scores twice |
| Golden Ratio | 黄金比 | +1 Mult per 5 Gold you hold (max +10) |
| Treasure Hunter | 宝探し | When you win a round, +1 Gold for each different suit left on your rack. Winds and Dragons count as separate suits. |
| Tax Collector | 徴税官 | +4 Gold at the end of each round |
| Garden Keeper | 庭師 | +4 Mult per Flower |
| Blossom Storm | 花嵐 | ×1.2 Mult per collected Flower |
| Seasonal Wind | 季節風 | +50 Chips per Season |
| Slow Burn | 遅火 | +2 Mult per round completed this run |
| Momentum | 勢い | +15 Points for each earlier play this round |
| Crescendo | 漸強 | ×1.1 Mult for each earlier play this round |
| Waste Not | 無駄無 | +5 Mult if no discards used |
| Recycler | 再利用者 | +20 Chips per discard used |
| Value Zealot | 役牌狂信者 | ×1.5 Mult when you score Value Tiles: a complete hand with a triplet or quad of Dragons or East Wind |
| Triplet Titan | 対々巨人 | ×1.5 Mult when you score All Triplets: a complete hand of four triplets or quads plus a pair |
| Ninefold Initiate | 一通入門 | ×1.5 Mult when you score a 1–9 Straight: a complete hand holding 1-2-3, 4-5-6 and 7-8-9 of one suit |
| Full Flush Champion | 清一色王者 | ×2 Mult when you score a Full Flush: a complete hand of one suit only, with no Winds or Dragons |
| Veteran | 古参 | +30 Points per completed Act |
| Experience | 経験 | ×1.1 Mult per completed Act |
| Greater Jade | 大玉 | +80 Chips |
| Blazing Banner | 烈火旗 | +10 Mult |
| Flame | 炎 | ×1.5 Mult |
| Wind and Dragon | 風竜 | +5 Mult if the play includes both a Wind and a Dragon |
| All Suits | 三色揃 | +8 Mult if the play includes Characters, Circles and Bamboo |
| Bookends | 端揃 | +60 Points if the play includes both a 1 and a 9 |
| Expansive Grip | 拡張握 | +2 rack spaces |
| Careful Player | 慎重者 | +2 free redraws per round |

### Rare Decrees (Tier 3)

Powerful effects with significant impact.

| Decree | Japanese | Effect |
|--------|----------|--------|
| Inferno | 業火 | ×2 Mult |
| Supernova | 超新星 | ×2.5 Mult if this play brings the round score to at least twice the target, before Supernova/Perfectionist bonuses |
| Perfectionist | 完璧主義 | ×3.0 Mult if the first play clears the round, before Supernova/Perfectionist bonuses |
| Compound Interest | 複利 | +2 Mult per 10 Gold you hold |
| Wealth Engine | 富の機関 | +1 Gold per Decree owned at the end of each round |
| Perpetual Motion | 永久機関 | +2 Mult for each earlier play this run |
| Triple Echo | 三重響 | Every scoring tile scores twice |
| Terminal Resonance | 端牌共鳴 | Every Terminal (1 or 9) played scores three times |
| Honor Resonance | 字牌共鳴 | Every Honor (Wind or Dragon) played scores three times |
| Monarch of Characters | 萬子王 | ×2 Mult if every played tile is Characters |
| Potentate of Circles | 筒子君主 | ×2 Mult if every played tile is Circles |
| Sovereign of Bamboo | 索子主権 | ×2 Mult if every played tile is Bamboo |
| Flower Emperor | 花帝 | ×1.5 Mult per collected Flower |
| Season Lord | 季節主 | +10 Mult per Season |
| Nature Bond | 自然絆 | +3 Mult/Flower, +30 Chips/Season |
| Half Flush Herald | 混一色先駆 | ×2 Mult when you score a Half Flush: a complete hand of one suit plus Winds or Dragons |
| Triple Sequence Sage | 三色賢者 | ×2 Mult when you score a Mixed Triple Sequence: a complete hand with the same sequence in all three suits |
| Outside Hand Champion | 全帯幺王者 | ×2 Mult when you score an Outside Hand: a complete hand with at least one sequence, where every group and the pair includes a 1, 9, Wind or Dragon. A Pure Outside Hand (the same, but with no Winds or Dragons, so every group and the pair includes a 1 or 9) also counts. |
| Mandate Breaker | 令破壊者 | During Boss rounds: +15 Mult and ×1.5 Mult |
| Boss Slayer | 親衛殺し | ×2 Mult during Boss rounds |
| Fortune and Glory | 運と栄光 | +60 Points and +8 Mult, and +3 Gold at the end of each round |
| Emperor's Blessing | 皇帝祝福 | +100 Chips and +10 Mult |
| Golden Age | 黄金時代 | +8 Gold at the end of each round |
| Blueprint | 設計図 | Copies the effect of the Decree to its right |
| Photograph | 写真 | The first scoring tile scores twice |
| Ancient Scroll | 古代巻物 | +150 Points; −2 rack spaces |
| Sacrifice | 犠牲 | ×3 Mult; −1 Turn per round |
| Transmuter | 変成者 | Played 2–8 tiles score as Terminals (1s and 9s) |
| Harmonizer | 調和者 | Sequences may mix suits (for example, 1 of Characters, 2 of Circles, 3 of Bamboo) |
| Final Act | 終幕 | ×1.5 Mult per Act past Act 4 |
| Endless Journey | 無限旅 | ×1.2 Mult per completed Act |
| Master Grip | 達人握 | +3 rack spaces |
| Infinite Patience | 無限忍耐 | +3 free redraws per round |

### Legendary Decrees (Tier 4)

Very powerful, often unique effects.

| Decree | Japanese | Effect |
|--------|----------|--------|
| Divine Flame | 神炎 | ×3 Mult |
| Heaven's Wrath | 天罰 | ×4 Mult if the play has no 2–8 tiles (only 1s, 9s, Winds and Dragons) |
| Void Blessing | 虚空祝福 | ×5 Mult if every played tile is a Wind or Dragon |
| Eternal Echo | 永遠響 | Every scoring tile scores three times |
| Dragon King | 竜王 | Every Dragon played scores four times |
| Yaku Amplifier | 役増幅器 | When a complete hand scores Yaku, its combined Yaku multiplier is multiplied by 1.5 |
| Yakuman Seeker | 役満求道者 | ×5 Mult when you score a Yakuman, a top-tier hand such as Big Three Dragons or Thirteen Orphans |
| Four Seasons Master | 四季達人 | ×2 Mult per active Season |
| Eternal Garden | 永遠庭園 | +10 Mult per Flower. Drought cannot suppress your Flowers. |
| Midas Touch | 黄金の手 | +10 Gold at the end of each round |
| Infinite Wealth | 無限財宝 | ×1.1 Mult per 10 Gold you hold |
| Brainstorm | 脳嵐 | Copies the effect of your leftmost Decree |
| Doppelganger | 分身 | Copies a seeded random non-copy Decree on acquisition and each round start; target stays fixed for the round. See [target rules](docs/DOPPELGANGER_IMPLEMENTATION.md). |
| God of Characters | 萬子神 | ×3 Mult if every played tile is Characters |
| God of Circles | 筒子神 | ×3 Mult if every played tile is Circles |
| God of Bamboo | 索子神 | ×3 Mult if every played tile is Bamboo |
| Glass Cannon | 硝子砲 | ×6 Mult. Destroyed if you lose a Boss round. |
| Phoenix | 鳳凰 | If you would lose a round, you clear it instead. This Decree is then destroyed. |
| Time Lord | 時の主 | +1 extra hand per round |
| Exponential | 指数的 | ×1.3 Mult per 100 base Points in the play |
| Chain Reaction | 連鎖反応 | ×1.5 Mult per Yaku in the scored hand |
| Cosmic Jade | 宇宙玉 | +200 Points and ×1.5 Mult |
| Solar Banner | 太陽旗 | +25 Mult and ×2 Mult |
| Universal Grip | 万能握 | +4 rack spaces |

### Mythic Decrees (Tier 5)

Game-changing, run-defining effects.

| Decree | Japanese | Effect | Unlock |
|--------|----------|--------|--------|
| Heavenly Ordinance | 天命 | ×5.0 Mult | Score Yakuman |
| Celestial Throne | 天座 | ×10.0 Mult, −2 Hand, −1 Discard | — |
| Void Emperor | 虚帝 | ×8.0 Mult if last hand was 0 | — |
| Infinite Loop | 無限回廊 | Retrigger all tiles 3 times | — |
| Echo Dimension | 響次元 | All retriggers trigger twice | — |
| Clone Army | 複製軍 | Copies effects of all Decrees | Win on Gold Stake |
| World Tree | 世界樹 | ×2.0/Flower, ×1.5/Season | — |
| Philosopher's Stone | 賢者の石 | Double all gold gained | — |
| Dragon Hoard | 竜の宝庫 | ×1.2 Mult per ¥10 | — |
| Yaku Nexus | 役結節 | All Yaku score at +1 tier | — |
| Yakuman Blessing | 役満祝福 | ×10.0 Mult on Yakuman | 3 Yakuman in one run |
| Reality Warp | 現実歪曲 | All tiles are wild | — |
| Time Master | 時の支配者 | +2 extra hands per round | — |
| Immortal Decree | 不死勅令 | Cannot lose (halves score) | — |
| Omega | 終極 | +500 Chips, +50 Mult, ×2.0 | Complete Act 8 in optional Endless |
