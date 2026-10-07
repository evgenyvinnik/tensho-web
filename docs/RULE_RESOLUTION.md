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

## Work still required, not removed from scope

- Resolve and connect Autumn discard-pool growth and Winter loosened legality,
  and finish the remaining Flower–Season interactions including Orchid/Spring.
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
