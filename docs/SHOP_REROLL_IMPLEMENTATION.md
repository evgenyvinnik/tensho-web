# Replenish sold-out item slots on reroll

October 3, 2026 local time. The documented Tea House reroll refreshes ordinary
item slots; packs and the Charter remain. The old implementation instead carried
every purchased offer into the new stock. After buying both ordinary offers,
paying to reroll could therefore leave no visible ordinary items at all.

## Implementation

Every accepted reroll now generates fresh offers for the shop's ordinary capacity,
including previously purchased slots. Owned Decrees are excluded through the
existing eligibility path. Catalog eligibility can still leave a slot empty if
its selected category has no candidates; this patch does not invent fallback
rewards. Current stake, editions, discounts and Charter slot counts use the
existing generator. One-shot Omen overflow is not recreated by a reroll.

Purchased rewards remain owned. Shop spending and purchase totals remain intact;
only the accepted reroll fee is added. Old offer IDs cannot be purchased again.
Packs, generated pack contents, pending-choice protection and the Charter do not
reroll. The existing free-reroll and escalating-cost rules are unchanged.

Existing saves are not rewritten on read or resume. Their next deliberate reroll
replenishes sold-out slots. Exact current stock and RNG restoration remain
supported. Generating the newly replenished slots necessarily consumes new random
draws after that action; pre-fix outcomes after sold-slot rerolls are not claimed
to be seed-identical. This changes no target scores, payout amounts or item powers.

## Verification ledger

Evidence root: `/tmp/tensho-reroll-refill-FFuPCW`.

- Five new regressions all fail before the fix (`before.log`): actual one/two-item
  purchases through ShopSession, and ordinary capacities two/three/four with
  discounts, a free reroll and Omen overflow.
- Focused suite passes **45/45** after the fix. New integration assertions retain
  full engine state except the exact fee, unchanged packs/Charter, purchase
  totals, stale-ID rejection, strict saved-run parsing and exact restoration.
- Initial full suite: **1,626 passed / five failed across 139 files**, 380.10s.
  One serialization test expected the old sold-slot behavior; its assertion now
  requires fresh unpurchased IDs while retaining the exact resumed RNG comparison.
  Four UI tests exceeded their existing five-second deadlines. The six-file
  affected/new recheck passes **49/49**, 16.27s, without timeout increases.
  The original full-run failures remain in `full-unit.log`; the recheck is not
  represented as a clean full-suite pass.
- Initial browser batch: **four passed / ten failed**. Two Omen cases expected
  one visible offer after reroll instead of two. Eight new cases incorrectly
  read a derived reroll price from serialized state, producing NaN expectations.
  Assertions now use the documented 5/6 Gold fees; application code is unchanged.
- Corrected browser batch: **14/14**, 2.2 minutes, one worker, no retries. English
  and Spanish on desktop/320px touch cover partial/full sell-out, two successive
  rerolls, ownership/accounting, reload, buying a replacement and next-round play.
  Existing illustrated build-management and stacked Omen cases also pass.
- TypeScript, targeted lint and whitespace checks pass. Pages-base build and
  **13/13 release checks** pass; PWA output: 412 entries / 69,541.64 KiB.
- The first production preview failed before app startup: the local preview
  server omitted `/tensho-web/`, returning 404 for the built entry bundle. The
  fixture initializer also accessed storage on an opaque initial document. The
  server base and HTTP(S)-only fixture initialization were corrected; the app
  build and assertion deadlines were not changed. Failure trace/log retained.

Browser fixtures use controlled budget and target, then real winning play,
generated stock, purchases and rerolls. They establish transaction behavior, not
organic economic balance or human enjoyment. No new bitmap is needed for this
core-loop correction; the generated shop/pack/Decree illustrations are preserved.

## Publication

All **eight built-production journeys pass**: English/Spanish, desktop/320px
touch, one/two bought slots, two rerolls, exact fees and saved snapshots, purchase
of a replacement, next-round play and exact reload. Zero page errors. The Spanish
phone screenshot shows the replenished illustrated offer, complete rules and
purchase control within the available scroll area. Evidence is
`production-final.log` and `production-final-*.png`.

Publication is pending.
