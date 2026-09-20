# Three-Flower Decree unlock

September 12, 2026. Implements the `GAME_SYSTEMS.md` set reward: any three
collected Flower types unlock Flower-triggered Decrees in the shop.

## Catalog and authoritative paths

“Flower-triggered” is mapped to the existing catalog's effects that scale by
`flower_count`, including secondary effects. The affected items are Flower
Friend, Garden Keeper, Blossom Storm, Flower Emperor, Nature Bond, Eternal Garden
and World Tree. This adds no invented Decrees or new scoring bonuses.

The shared `FLOWER_DECREE_UNLOCK_COUNT` defines both the collection's set bonus
and the adapter's three-Flower acquisition requirement. The separate existing
two-Flower requirement on **Celestial Wildcard** is unchanged. The documented
Yakuman Succession catalyst is not the name of that live item and is not claimed
implemented by this patch.

- Shop candidate generation checks Flower requirements before rarity selection
  and fallback. The live orchestrator passes the collected count into each visit.
- Rerolls and guaranteed/edition Decree offers use that same eligible pool.
- Omen preflight uses the identical Flower-aware pool. An impossible Rare+
  guarantee remains pending without charging its fee; a later eligible visit can
  consume it and deliver the reward.
- Decree packs filter the same requirements, including exhausted-catalog and
  duplicate fallbacks. They cannot offer an item the acquisition path rejects.
- Existing `canAcquireDecree`/shop transaction checks enforce the requirement at
  settlement, in addition to offer generation. Generated consumable rewards now
  choose only grantable items, preventing a spent Wraith from granting nothing.
- Tea House serialization retains the visit count for restored rerolls. Older
  serialized visits without the field default to zero for new generation;
  already serialized offers are not rewritten. This is not a new Classic save
  system or a claim of deployed save migration coverage.
- Clearing/resetting the Tea House clears the visit count. A new visit receives
  a fresh count; the unlock is run-owned, not permanent meta-progression.

The inspector's set-bonus description is updated in all 13 locales. Native-speaker
review remains outstanding. Duplicate Flower types do not increment collection
count. Starting gifts still follow their existing starting-pool rules; this
change does not rewrite owned gifts or reinterpret their scoring retroactively.

## Evidence and retained failures

The first focused run passed 140/141: a new test imported a nonexistent
`YAKUMAN_SUCCESSION` constant instead of checking the actual Celestial Wildcard
requirement. Correcting the test preserved the existing two-Flower rule.

The first full run passed 802/803 and exposed a real issue: Script of the Wraith
could choose a newly gated Decree, consume its penalty, and fail acquisition.
The generated-reward selector now filters grantable items before choosing. The
existing failing regression passes without changing its expectation.

Final unit suite: **803/803 across 73 files**, one thread worker, 30.99 seconds.
The 12 new cases cover collection thresholds 0–4, duplicate types, all seven
catalog IDs, separate requirements, rarity/guarantee/reroll fallback, restored
visits, Decree packs and a real third-Flower draw followed by a deferred Omen fee
and successful paid purchase. The catalog-exhaustion fixture is deliberately
synthetic, not evidence of normal rarity or collection frequency.

Browser/build evidence is recorded in the current implementation checkpoint.
Remaining mutations, catalysts and Flower–Season combinations are separate open
requirements. No commit, push or live deployment was performed.
