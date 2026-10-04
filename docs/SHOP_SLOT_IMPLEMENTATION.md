# Immediate stock-Charter offers

October 4, 2026 local time; initial reproductions and artwork began October 3.
This completes the current-shop part of the documented Abundant Stock and
Plentiful Stock slot effects, not every Charter or progression requirement.

## Behavior

Previously, buying either stock Charter changed capacity but supplied no new
ordinary offer until a reroll or later visit. An accepted purchase now generates
one additional eligible offer immediately. It does not reroll existing items,
replace purchased receipts, overwrite one-shot Omen overflow, regenerate pack
contents or charge a reroll. The new offer uses the existing eligibility rules,
owned-Decree exclusions, stake modifiers and Charter/visit discounts.

The extra offer receives a fresh identity and an unused slot index after any Omen
overflow. A later reroll returns to the newly increased ordinary capacity. If the
selected category has no eligible candidates, the generator still returns no
offer; this does not introduce an unrelated fallback reward or change rarity.

Unaffordable and duplicate purchases do not change stock or random state. Normal
restoration and route reopening do not generate another item. Existing historical
saves are not retroactively filled on resume; their next reroll uses the recorded
increased capacity. New purchases and their generated offers restore exactly.

## Orb-price follow-up

The new-offer tests reproduced an inconsistent Celestial Orb quote: the shop
charged the fixed 3 Gold base, but metadata recorded the catalog's 4 Gold cost.
That also made subsequent percentage repricing use the wrong base. New Orb offers
now record the canonical shop base, and the existing pure discount repair uses
that base for both Seals and Orbs. Old unpurchased overpriced Orb quotes repair
through the same atomic claim used by the earlier pricing release.

Catalog item definitions and owned resale values remain unchanged by this repair.
Purchased receipts, free offers and existing lower quotes retain their prices.
The [pricing ledger](CHARTER_PRICING_IMPLEMENTATION.md) documents the broader
paid-price resale and save-write guarantees.

## Artwork

Abundant Stock now has its own generated three-compartment scroll portrait,
shared by the shop and discovered Archive card/details. Unknown IDs retain the
category image, and prototype-property names cannot resolve as portraits.
Undiscovered entries remain concealed. Text and rules remain localized HTML.
[Exact prompt, original and final asset provenance](CHARTER_ART.md#abundant-stock-portrait).

## Verification

Evidence root: `/tmp/tensho-stock-expansion-HOXB1G`.

- All four initial actual-purchase tests failed before implementation: both
  upgrades, with and without extra Omen offers (`before.log`).
- The first implementation pass had 43 passes and one pricing assertion failure.
  This exposed the Orb base-cost discrepancy rather than a fixture error. Its
  separate new regression also failed before the metadata correction
  (`focused.log`, `orb-before.log`).
- Focused suite: **87/87 across seven files**. Three additional visit-discount
  cases then pass, including a 100% discount and owned-Decree exclusion;
  the stock-expansion file passes **7/7**. Full snapshots, strict parsing,
  no-mutation rejection, extra-item identity, pack preservation and exact restore
  remain asserted.
- TypeScript, targeted lint and whitespace checks pass before the final browser
  run; final full-suite/build gates are recorded below when complete.
- Initial native browser batch stopped after a diagnosed ambiguous image selector
  matched the Charter portrait and gold icon: **12 passed, four failed, one
  interrupted, seven not run**. It is retained, not counted as a pass. The test
  now selects the accessible portrait image; no app behavior or deadline changed.
- Corrected browser batch: **24/24**, 5.1 minutes, one worker, no retries.
  English/Spanish desktop and 320px touch cover both upgrades, cancellation,
  payment, unchanged stock/packs, immediate extra-item purchase, reroll to the new
  capacity, reload and next-round play. Discount and sold-out-shop regressions
  also pass. Spanish desktop and phone Charter screenshots were inspected.

Fixtures use controlled low targets, budget and upgraded-Charter eligibility,
then real winning plays, generated shops and purchases. This establishes the
transaction and UI paths, not organic achievement reachability or human fun.

The initial full-unit run recorded **1,625 passes, one balance-command subprocess
timeout and one failed UI worker startup**, 974.37 seconds. The affected two files
then passed **41/41** unchanged, in 4.12 seconds. The failure's cause is not proven;
the original log is retained. A final fresh full suite passes **1,641/1,641 across
140 files**, 35.73 seconds (`full-final.log`). No assertion or timeout was relaxed.

The final Pages-base production build and **13/13 release checks** pass. PWA output
is 413 entries / 69,601.75 KiB. The new portrait adds 61,080 bytes; the overall
offline payload remains large and is not presented as a performance improvement.

All **12 built-production journeys pass**, with zero page errors: English/Spanish
desktop/320px touch, fresh base-Charter purchase, current upgraded stock and legacy
overpriced Orb quotes. The base purchase verifies cancellation, actual fee,
unchanged prior stock/packs and the generated extra offer. Every journey purchases
the extra item, rerolls to the new capacity, continues with a real next-round play
and checks exact saved snapshots across reload. Portrait responses decode at
512px and match the checked-in SHA-256. Evidence: `production.log` and captures.
Actual upgraded purchase is covered in the native batch; built-production uses
an already-owned upgrade rather than bypassing a hosted profile prerequisite.

Final targeted lint and whitespace checks also pass. Publication is pending.
