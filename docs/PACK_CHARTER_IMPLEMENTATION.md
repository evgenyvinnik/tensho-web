# Pack Charters acquired during a shop visit

October 4, 2026. This closes a purchase-to-effect gap for Star Chart and Omen Lens,
not the remaining Season/Flower rules or the whole implementation audit.

## Authoritative behavior

The [Charter rules](GAME_MECHANICS.md#15-imperial-charters-皇勅--voucher-system)
promise favored-Yaku Orbs in Celestial Packs and possible Void Scripts in Arcana
Packs. Shop contents were generated before buying the Charter, so these effects
only influenced later visits. A real same-visit paid acquisition now updates the
eligible unopened shelf packs inside the existing atomic purchase transaction.

- Star Chart leaves an already-present favored Orb intact. Otherwise it replaces
  only the first choice with the most-played Yaku's Orb. It preserves every other
  choice and consumes no random rolls. With no recorded Yaku, it invents no
  preference. This uses the same favored-Orb lookup as normal pack generation.
- Omen Lens applies the existing 20% Script chance to each remaining Fate Seal
  choice in unopened Arcana packs. Successful substitutions use the pack size's
  existing rarity weights and Script catalog/fallback/exclusion rules. Failed
  rolls leave the exact old reward intact. It does not guarantee a Script.
- Pack IDs, types, sizes, prices, selection counts and choice keys do not change.
  Other pack families, opened/resolved packs and owned rewards stay intact.
- Only a successful new acquisition calls this path. Validation, cancellation,
  rejection, reroll, route revisit and restoration do not replay it. Charter
  uniqueness prevents a second purchase from rerolling rewards.
- New choices are persisted with the ordinary shop snapshot. Reload preserves
  exact reward identities, and later claims grant the actual selected instance
  with pack provenance. Existing saves are not probabilistically regenerated:
  the absence of a Script cannot prove whether its chance was previously applied.
  Already-saved historical contents remain preserved; this is not a retroactive
  repair of every purchase made by older releases.

Newly generated consumables intentionally use timestamped, monotonic identities.
Replaying a purchase from an earlier checkpoint in the same process preserves
reward outcomes and random cursors, not those newly allocated identities. Loading
an already-settled snapshot does preserve its identities exactly.

## Illustration

Star Chart now has a distinct gold/navy celestial scroll shared by the shop and
discovered Archive. Hidden entries still conceal its portrait. The generated
512px transparent WebP is 81,866 bytes; existing assets are unchanged. See
[the complete prompt and provenance](CHARTER_ART.md#star-chart-portrait).

## Verification ledger

Evidence directory: `/tmp/tensho-pack-charters-F4W4nF`.

- Initial transaction regressions: three fail, one passes (`before.log`), proving
  the missing same-visit favored Orb and Script chance. First implementation:
  42 focused tests pass (`focused.log`).
- Expanded run: 46 pass, two new replay assertions fail because they incorrectly
  required newly allocated timestamped IDs to repeat. These assertions now
  compare all other fields, retain unchanged IDs, and check fresh uniqueness.
  Exact post-settlement restoration remains required. Fixture type errors
  (union narrowing and readonly gold assignment) were also corrected.
- Final focused checks: **48/48**. Full suite: **1,667/1,667 in 143 files**.
  TypeScript and production build pass; lint has zero errors / 211 existing
  warnings. All thirteen release-workflow checks pass.
- Initial native set: **23/24**, no retries. All eight new English/Spanish
  desktop/touch Charter journeys pass, alongside pack-use progression. One
  existing desktop stock test times out before its fixture runs, waiting for
  initial save readiness. Its trace spans 35,180.319 to 699,892.705 ms in that
  assertion; the cause of the elapsed gap is not established. The unchanged
  scenario passes all three isolated repetitions (13.8 seconds total).
- **8/8 built-production journeys pass**: both Charters, English/Spanish,
  desktop/320px touch, cancellation, actual payment, seeded expected contents,
  reward claim, exact reload, and continuation. The Omen Lens fixture supplies
  earned upgrade eligibility and a seeded chance-success branch; it is not
  organic progression/balance evidence. No runtime code is injected into the
  production page. Screenshots include the Spanish phone portrait/rules/price.

Final native browser rerun: **24/24** in 1.2 minutes, no retries and unchanged
deadlines (`browser-final.log`). The earlier 23/24 run remains a failed run.
Publication evidence is recorded below when complete.
The large complete-offline precache remains (414 entries / 69,702.40 KiB); the
new portrait does not resolve the broader performance and physical-device gaps.
