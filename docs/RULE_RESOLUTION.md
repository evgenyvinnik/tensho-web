# Remaining rules: implementation authority and decisions

On October 7, 2026, the user explicitly authorized choosing, documenting and
implementing coherent rules where the design documents conflict or leave gaps.
Unanswered older questions are no longer a requirement to stop for individual
approval. They are not retroactively treated as answered: new decisions must be
recorded here, implemented through the actual loop, and verified.

## Previously confirmed choices to preserve

- Cerulean Bell retains only the most recently forced tile.
- Whispering Merchant exchanges one chosen rack tile for a river tile, once per
  round; it does not require an empty rack slot.
- Final defeat charges Rental, with interest and round-end income remaining
  win-only.

## Decisions made under delegated authority

### Copied powers pay physical costs; limited actions share their budget

An active copy carries the source's costs, paid by the copier. Permanent rescue
takes priority; a consuming Phoenix copy is spent before the original, in physical
inventory order. Eternal owners cannot provide a consuming rescue for free.
Immortal retains the existing nonstacking ×0.5 run penalty. Active Glass Cannon
copies shatter on final Boss defeat unless protected by Eternal; native liability
retains its prior suppression-independent behavior. Destruction is snapshotted
before removals so neighbors cannot shift midway through settlement. Binary
permissions share the resolver, but once-per-round actions keep one shared budget,
not an additional charge per copy. No recursive copying or new RNG is introduced.
[Contract and verification](COPIED_LIFECYCLES_IMPLEMENTATION.md).

### Doppelganger target timing

Choose a seeded physical non-copy target on acquisition and each round start,
before resource initialization. Exclude already-debuffed candidates; suppression,
sale, reordering, preview and reload never secretly reroll a chosen target. Empty
candidate lists wait for the first eligible acquisition. Each physical copier
selects independently, using a dedicated saved RNG stream. Existing one-level
effects/costs apply, not source editions or recursive copies. Legacy saves preserve
their old target for the current round, then adopt the new rule. The target and
inactive states are explained in the illustrated hover/tap details.
[Rules, implementation and evidence](DOPPELGANGER_IMPLEMENTATION.md).

### Fate Seal lifetime and Negative tile ownership

Fate Seals permanently change selected physical tiles for this run, including
future rounds and save/reload. New runs start fresh. Destruction removes the tile;
Transmutation copies its face/modifiers but retains the target's ID. This selects
deck-building investment over the hand-only draft; targeting/use limits remain.

Every owned non-bonus Negative tile grants one Decree slot, counted once by physical
ID in the persistent wall. Drawing, discarding, debuffing and Frostbite do not toggle
capacity. Destruction or edition replacement removes the bonus; copying to another
physical tile adds another. Negative Decrees and other slot sources remain separate.
Losing capacity keeps existing Decrees and their normal rules; new acquisitions
must fit the resulting capacity.

This chooses the gameplay document's promised tile effect over the item table's
old N/A entry. Capacity is derived on restore rather than serialized into base
slots, so old saves receive the effect without reload multiplication.
[Implementation, artwork and verification](RUN_OWNERSHIP_IMPLEMENTATION.md).

### Orb progression: upgrade on use

Using an Orb immediately raises its family one level, capped at 10. Level 1 has
no Orb bonus. The Chips/Mult bonus applies when that family actually scores.
Black Hole raises each uncapped family, not a separate thirteenth scoring family.
Scored occurrences drive the ledger and Star Chart targeting, not passive XP.
Explicit level-changing item/Mandate effects remain separate.

This deliberately selects the item-library/current-save rule over the old
trigger-to-level draft. A visible upgrade on use is easier to understand and
does not make progression depend on grinding rare full hands before receiving
any purchase payoff. It is a design choice, not evidence that balance or fun is
solved. The unused XP thresholds and misleading source comments are removed.
Repeated-trigger and cap tests supplement the existing use/forecast/payment/
save/browser coverage. No saved levels or scoring values are migrated.

### Drought: suppress Flower empowerment, preserve owned Decree rules

Drought removes both direct Flower score bonuses and the +10%-per-Flower
empowerment of Decree bonuses. It does not delete the collection, remove earned
slots/shop access, or disable a Decree whose own condition counts collected
Flowers. For example, Flower Friend still grants its authored 10 Chips per
collected Flower, but no extra Flower empowerment while suppressed.

Active Eternal Garden protection overrides suppression. Mandate-disabled or
inactive protection does not. The same resolved flag feeds the inspector,
Flower–Season interactions, forecast and committed score. Copies receive the
same rule. Frostbite independently scales the remaining Decree contribution.
See [Drought verification](DROUGHT_EMPOWERMENT.md).

### Spring: bounded extra rack spaces

Each normal Spring adds two rack spaces until the round ends. Activation fills
new spaces from the live wall when possible; ordinary refills maintain that
capacity. Multiple Springs stack without accumulating extra tiles every play.
Serpent keeps its fixed replacement count, and corrupted Spring has no normal
bonus. This makes “extra draws” a usable selection advantage, rather than extra
scoring actions or an unbounded rack. [Implementation](SPRING_IMPLEMENTATION.md).

### Autumn: grant additional discard actions

Each normal Autumn drawn grants one discard action for the current round,
alongside its existing Yaku modifier. Repeated draws stack; corrupted Autumn
does not grant the bonus. Loading does not grant actions, and spending them is
still reflected in discard-dependent Decrees. This resolves “discard pool grows”
as a larger action budget, replacing the unused percentage helper. It does not
resolve or replace Plum's separate river recursion.
[Implementation and evidence](AUTUMN_IMPLEMENTATION.md).

## Work still required, not removed from scope

Winter resolution is now published and verified; see below. Remaining
gaps are not removed by choosing the rule.

- The base Flower–Season interactions are now connected: Plum/Autumn is published and verified in v1.0.261007-12, Orchid/Spring in v1.0.261007-11, and Bamboo/Summer in v1.0.261007-8. The separate input/layout follow-up is verified in v1.0.261007-10 with all 20 hosted journeys passing. Advanced mutations remain separate work below.
- The four advanced Flower mutations, acquisition/unlock path and catalyst
  payments are published and verified below. Yakuman Succession is also
  published in v1.0.261008-2 with independent CI and hosted verification.
- Fractional/binary Frostbite rules and Treasure Hunter timing are published
  and verified in v1.0.261008-3. Finish
  other copied-resource lifecycles. Fate Seal lifetime/Negative tiles now have
  ownership rules above; release verification is tracked separately.
- Reconcile remaining Charter/item wording against actual acquisition/use.
- Continue organic-run strategy and newcomer evaluation. A legal engine run or
  a green browser test alone does not demonstrate engaging play.

These items can now proceed with documented decisions instead of waiting for
answers to each old question. This document is not a completion declaration or
an approval to alter the three confirmed choices above.

### Frostbite: fractional repeat rewards, not fractional rules

Each Frostbite retains half of the remaining Decree-created scoring and gold
contribution. Retrigger counts remain whole instructions: resolve a physical
tile once, repeat its reward, then retain `0.5 ** frostbiteCount` of the added
reward. Do not round an extra repeat down to zero. Tile points, additive modifier
bonuses, red-five chips, gold and the extra tile-multiplier product follow this
rule; final score/gold settlement supplies rounding. Structure and Yaku identities
are not retriggered. Copies and Echo Dimension combine before attenuation.

Native Red Seal repeats the tile's face/red-five and modifier rewards, and is not
a Decree penalty target. Native Glass/Polychrome multiplier products must reach
the real paid score. Lucky and Glass resolve once per physical played tile;
repeats reuse the resolved reward rather than rolling again. Glass is removed
after its score, so shattering cannot make payment lower than its forecast.
Preview uses guaranteed Lucky outcomes and never rolls or shatters.

Frostbite does not alter rule permissions, acquisition gates, slots/capacities,
hand/discard budgets, rescue charges or costs. These are stable discrete run
rules, not fractional scoring rewards. Avoid random disabling or removing a rack
slot mid-action. Mandate suppression and original costs still apply. This resolves
the old “all effects” wording explicitly rather than calling untouched binary
powers half-effective. Other copied-effect lifecycle gaps remain separate work.

### Treasure Hunter: win-only suits left in the rack

At ordinary round-win settlement, award one raw Decree gold per distinct physical
suit remaining in the rack, before refills or next-round draws. Manzu, Pinzu,
Souzu, Winds and Dragons are five possible families; bonuses are not suits.
Repeated faces or debuffed tiles do not change that physical counting rule.
Played, virtual or temporarily transmuted tiles do not count as held tiles.

Copies sum normally, disabled sources contribute nothing, and Frostbite/gold
amplification use the existing shared settlement. Preview, discards, skips,
rescues and final defeats do not earn this round-win income. Rental remains
charged on final defeat. Legacy stored Treasure Hunter effects missing the suit
condition are interpreted on read (including copies), not rewritten on load.

These are delegated design decisions, published in **v1.0.261008-3**. Local and
independent CI pass 2,027 tests; native/production/hosted EN/ES desktop/touch
journeys each pass 4/4. [Evidence and limits](FROSTBITE_RETRIGGERS_IMPLEMENTATION.md)
do not infer balance or enjoyment from automated verification.

### Winter: one missing rank per same-suit sequence

A normal Winter permits 1–2–4 or 1–3–4 and their shifted equivalents, in both
tactical selections and complete hands. It never permits two missing ranks,
wrapping 9 to 1, Honor sequences or mixing suits. Repeated Winters do not widen
the gap; each still contributes its existing ×0.75 score factor. Corrupted
Winter grants no normal legality. Chrysanthemum's existing concealed-hand
exception and effective Drought suppression stay unchanged. Legality expires
with the Season stack and derives from saved Seasons without a new save field.

Broken Stair Edict has the same authored permission. Its tactical parser and
coach now receive the same active rule as its full-hand validator, including
Mandate disabling. The normal hand-size/resource/forced-tile restrictions still
apply. Suggestions never read concealed faces and previews do not mutate tiles.

Scoring shapes are not fabricated identities: identical-sequence Yaku compare
every actual rank; matching gapped triples can qualify. Ittsu still needs actual
1–2–3 / 4–5–6 / 7–8–9. Pinfu retains ordinary consecutive sequences, rather than
interpreting an exotic gapped wait as an ordinary two-sided no-points hand.
This is a chosen roguelike rule, not a claim about standard Mahjong.
[Implementation and verification](WINTER_LEGALITY_IMPLEMENTATION.md).

### Bamboo + Summer: earn round-long wall protection

Playing at least four physical terminal tiles (suited 1s/9s) while Bamboo is
unsuppressed and a normal Summer is active earns wall protection for the round.
The threshold follows the existing helper; this decision supplies its missing
timing and persistence. Full and tactical plays qualify; virtual completions,
temporary scoring transmutations and repeated triggers do not supply extra
physical terminals. Previewing/staging does not earn it or consume anything.

After scoring, before refill, all Summer-reserved physical tiles return to the
live wall's tail in their stored reservation order. No tile is invented and no
RNG stream is advanced by restoration. Subsequent Summers retain their score
benefit but cannot shrink the wall again that round. The reward expires on round
cleanup; old saves do not retroactively earn it. A later Drought does not revoke
an already-earned reward or rewind draws. Effective Drought blocks earning it;
an enabled Eternal Garden overrides suppression as in other Flower effects.

The UI identifies earned protection without adding a new control or an upfront
combo recipe, preserving the design's emergent-discovery requirement.
[Implementation and evidence](BAMBOO_SUMMER_IMPLEMENTATION.md).

### Orchid + Spring: extra physical dead-wall draws, without recursion

Each ordinary Wind or Dragon draw earns one extra dead-wall draw while an
unsuppressed Orchid and at least one normal Spring are already active. This
includes ordinary bonus-tile replacements and the filling of new Spring slots.
Honors drawn earlier in a batch are not retroactively credited by a later
Orchid/Spring. Duplicate Flowers/Seasons do not multiply this interaction.

Resolve earned draws after the ordinary deal/refill, before the single Mandate
reaction and before redraw returns tiles to circulation. The original Honor
stays held. Extra tiles may exceed ordinary rack capacity, but do not permanently
increase it; later ordinary refills still use that capacity. Extra Honors do not
earn more draws. Extra Flowers/Seasons collect and replace normally, including
filling new Spring spaces, but that entire bonus cascade is non-chaining.

No dead-wall tiles means no invented replacement and no credit carried into the
next action. Normal replenishment, Monsoon sampling and tile modifiers remain
authoritative. Drought blocks earning unless active Eternal Garden protects the
Flower; a later Drought does not undo credits already earned in the same batch.
Starting deals, explicit draws, play/discard refills, redraw and Dead Wall Writ
use the same accounting. Merchant river swaps are not draws. Saves restore
actual physical tiles without replaying rewards or needing a new schema field.

The optional Flora inspector illustrates Orchid and explains the last experienced
bloom, not an upfront combo recipe. That transient explanation clears on load
and the next round; the drawn tiles themselves are saved. This is a documented
design resolution, not proof that the interaction is balanced or engaging.
[Implementation and evidence](ORCHID_SPRING_IMPLEMENTATION.md).

### Plum + Autumn: recover one existing river tile per paid sequence

Each sequence in the paid parse reserves the most recently discarded tile whose
physical suit and rank match one of its members. Only the river as it existed
before payment is eligible; this play cannot immediately return its own tiles.
Resolve groups in parser order, without reusing a reserved identity. A sequence
with no matching river tile earns nothing. No copies, random choices or future
credits are created. Modifiers stay on the exact recovered tile.

The sequence must consist of real selected tiles with the same faces as the
scored group. Virtual completions or temporary Honor/Wild face substitutions do
not qualify that group. Legal physical Winter/Broken Stair gapped sequences do.
Count the actual paid decomposition, not overlapping possible sequences. One
normal Autumn and an unsuppressed Plum suffice; duplicates do not multiply the
reward. Effective Drought blocks earning unless active Eternal Garden protects
Flowers. Acquisition or suppression during later draws is not retroactive.

Pay the score first. If the round continues, perform normal refill and Orchid
extras, then move the reserved tiles from river to rack before the draw cycle's
single Mandate reaction. They add temporary selection options above normal rack
capacity, not permanent spaces. Recovery is public movement, not a draw: no
Orchid credit, hidden-draw flag or additional Mandate reaction. Hook/Bell may
still act on recovered tiles as members of the resulting rack. No ordinary draw
means no draw reaction. Serpent retains its three ordinary replacement draws.

Round-ending wins, losses and rescues do not refill or recover; recovery cannot
increase held-Gold settlement. Save/load preserves the actual moved identities
without replaying any reward. An optional localized inspector explains the last
experienced recovery, not an upfront recipe. This bounded advantage is a design
decision, not a claim that the interaction's balance or enjoyment is proven.
[Published implementation and verification](PLUM_AUTUMN_IMPLEMENTATION.md).

### Flower mutations: four-type unlock, then rebloom within each run

Collecting all four distinct Flower types unlocks rebloom. The existing Bamboo
Mat achievement already persists exactly this condition, so it also supplies
eligibility for new runs without a duplicate progression currency or grind.
Eligibility is captured at run start and saved; later profile changes cannot
rewrite a resumed run. An old save with all four Flowers can rebloom on its next
actual duplicate, but loading never awakens anything by itself.

Once eligible, drawing an already owned Flower awakens that type for the run.
The first copy is ordinary; the fourth distinct Flower unlocks eligibility but
is not itself a duplicate. Further duplicates do not stack awakenings or slots.
Bonus replacement still happens normally. Ownership/awakening is not suppressed
by Drought, but every mutation's gameplay benefit is, unless active Eternal
Garden protects it. Starting another run retains eligibility, not awakenings.

- **Plum:** once per play, two sequences may share exactly one physical tile.
  No sharing with a pair/triplet, no two shared tiles, and no third sequence
  using the same tile. Tactical 1–2–3–4–5 can score two sequences. A complete
  four-meld-plus-pair hand may use 13 unique tiles; False Eye can reduce that to
  11 under its existing pair-role rule. Score physical tiles once, remove each
  once, and count both genuine sequence structures. Compatible Winter/Bamboo
  sequence shapes can overlap under the same single-bridge limit.
- **Orchid:** Dragons count as two Honors for the Orchid percentage, Honor-count
  Decree scaling, and numerical Honor gates. Winds remain one. This does not
  double tile points, retrigger counts, gold, physical identities, draw events,
  or the number of tiles required for a Yaku/Dragon triplet.
- **Chrysanthemum:** a concealed play replaces this Flower's linear bonus with
  ×1.2 per concealed non-pair meld. With all four Flowers, effectiveness raises
  the step to ×1.4. Other Flower bonuses still apply separately. Pairs and loose
  tiles do not add exponent steps; an open play retains only the ordinary
  concealed-meld bonus. This is per-play structure, not a persistent streak.
- **Bamboo:** a suited 1 or 9 may anchor two adjacent ranks in a sequence, such
  as 1–5–6 or 4–5–9. Neither two arbitrary ranks nor wrapping is allowed. Winter
  and anchoring are alternative permissions, not cumulative gap widening.
  Harmonizer can still override suit restrictions. Faces, tile points and
  ordinary rank-specific Yaku remain physical; no arbitrary rank substitution
  or free retrigger is created.

These are delegated design choices, not balance conclusions. The implementation
is published and verified in v1.0.261007-13, including saved acquisition,
illustrated previews, coaching and real desktop/touch journeys.
[Evidence and remaining project work](FLOWER_MUTATIONS_IMPLEMENTATION.md).
Flower-paid Decree catalysts are the separate follow-up below.

### Flower-paid Yaku Decree catalysts

Under the user's delegated rules authority, catalyst payment is an optional
alternative to gold for a direct shop offer that changes Yaku rules or their
multipliers/tiers. The original catalyst release contains Tanyao Dispensation,
Yaku Amplifier and Yaku Nexus; the Succession checkpoint below adds a fourth.
Determine eligibility from actual effects, not the
presentational YakuDoctrine label, which also includes ordinary chip bonuses.
Yaku Nexus is not renamed to the distinct Yakuman Succession, whose two-Flower
activation is implemented in the separate checkpoint below.

The player explicitly chooses one owned Flower and confirms its consumption.
Any type may pay; no random sacrifice or automatic fallback from a gold purchase.
Gold payment remains unchanged. A Flower purchase costs zero gold, counts as one
purchase, adds no gold-spending progression, and grants a zero-resale Decree.
Editions, stickers and actual effects are retained; Rental still has its normal
future costs. Drought suppresses powers, not the ability to offer an owned Flower.

After payment, the Flower's powers and its contribution to held-Flower set
bonuses stop. Four-to-three loses doubled effectiveness, three-to-two relocks
Flower-powered acquisition, and two-to-one loses the bonus Decree slot.
Preflight the resulting inventory including the acquired Negative edition; if
it does not fit, refuse the entire transaction and ask the player to make room.
Never delete an owned Decree to force the purchase through. Existing stock stays
fixed, but current Flower requirements are checked again at settlement. Future
stock uses the reduced count, and an already-generated pack with no eligible
Flower-gated choice cannot be sold. Mixed pack choices show their actual failure.

Run-earned awakenings and rebloom eligibility are retained, not consumed.
Recollecting a sacrificed awakened type restores its powers. Historical distinct
types count toward the four-type achievement even if not held simultaneously;
optional saved history preserves that fact after consumption while legacy saves
without it round-trip unchanged. A new run still begins without awakenings.
Previously earned physical draws or Bamboo/Summer protection are not revoked.

Implementation is published and verified in **v1.0.261008-1**. Native,
built-production and hosted EN/ES desktop/touch journeys pass 4/4 each;
independent CI passes all 1,957 tests, build and deployment. These remain
delegated design choices, not conclusions from organic balance or fun testing.
[Rules, verification and remaining scope](FLOWER_CATALYSTS_IMPLEMENTATION.md).

### Yakuman Succession: advanced patterns ascend while two Flowers are held

This distinct mythic Decree costs 12G and requires two held Flowers both for
acquisition and activation. The five native advanced-tier patterns—Honitsu,
Chinitsu, Ryanpeikou, Junchan and Seven Pairs—become tier-four Yakuman with a
base ×4 multiplier each. Existing Yaku exclusions still apply; ascension never
invents a pattern. Physical pattern IDs and matching Orb families stay unchanged.

Mandate filtering and tier reductions apply first. A removed or lowered pattern
cannot ascend, and Yaku Nexus cannot make a lower-tier pattern eligible. Multiple
Succession copies, including copied effects, grant the same permission without
stacking. Disabled/debuffed sources do not grant it. Natural Yakuman remain
unchanged; table Yakuman bonuses apply to newly ascended patterns too.

Frostbite scales the numeric Decree-created multiplier gain above the ordinary
Yaku baseline, while the discrete ascended identity remains Yakuman. It can
qualify for Yakuman-gated Decrees and paid-play achievements. Preview grants no
progress. Drought follows the existing ownership rule: it suppresses Flower
empowerment, not the two-owned-Flower condition. Dropping below two Flowers
suspends ascension until collection recovers; it does not delete the Decree.

The existing catalyst payment path is allowed only if at least two Flowers remain
after payment, so buying it for a Flower needs three held beforehand. This is
not a second sacrifice on activation. The new portrait and all-locale description
make it distinct from Yaku Nexus. These are delegated design decisions; balance
is not yet established. Published in **v1.0.261008-2** with 1,991 passing local
and independent CI tests and native/production/hosted EN/ES desktop/touch
journeys passing 4/4 each. [Evidence and limitations](YAKUMAN_SUCCESSION_IMPLEMENTATION.md).
