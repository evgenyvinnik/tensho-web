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

- Finish the remaining Flower–Season interactions. Orchid/Spring is now in local implementation and verification; Plum/Autumn remains open. Bamboo/Summer is published in v1.0.261007-8; the separate input/layout follow-up is verified in v1.0.261007-10 with all 20 hosted journeys passing.
- Specify the four advanced Flower mutations, acquisition/unlock path and
  catalyst payments. An unused helper or catalog description is not completion.
- Finish fractional/binary Frostbite effects, Treasure Hunter timing, remaining
  copied resource effects, and reconcile Fate Seal lifetime/Negative tiles.
- Reconcile remaining Charter/item wording against actual acquisition/use.
- Continue organic-run strategy and newcomer evaluation. A legal engine run or
  a green browser test alone does not demonstrate engaging play.

These items can now proceed with documented decisions instead of waiting for
answers to each old question. This document is not a completion declaration or
an approval to alter the three confirmed choices above.

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
