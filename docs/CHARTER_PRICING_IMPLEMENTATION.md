# Charter discounts and paid-price resale

October 3, 2026 local time. Scope: the documented Discount Sale / Liquidation
Sale shop discounts and ordinary purchased-item resale, not a complete Charter audit.

## Corrected behavior

Buying a discount Charter now immediately reprices all unpurchased ordinary
offers, packs and the available Charter from their original base plus edition
cost. The existing 25% / 50% rules and rounding are unchanged. Visit discounts
apply afterward. Existing cheaper quotes, free Omen offers and purchased receipts
never increase or change. Repricing does not regenerate stock, pack contents,
identities or random state. The Charter itself is charged its pre-purchase quote.

Fate Seal offers now record the shop's fixed 3 Gold base rather than an unrelated
catalog cost. The same canonical base repairs legacy unpurchased Seal quotes.

New ordinary Decree and consumable purchases carry a runtime resale value of
`floor(actual paid quote / 2)`, including edition costs, discounts and zero-cost
Omens. Immutable catalog `cost` and effect definitions remain unchanged; strict
saved-run validation is not relaxed. Tiles retain their class instances. Pack
rewards retain their separate grant path; the pack price is not attributed to
each reward. Previously owned items are not retroactively repriced because their
historical paid quote cannot be reliably reconstructed.

The shared pure repair runs on direct Tea House restoration and in the existing
atomic saved-run claim. Reading a save does not mutate storage. A failed claim
write preserves the exact old raw save. No save-format bump is needed; purchased
and pending-pack receipts remain intact.

## Evidence

Local evidence root: `/tmp/tensho-charter-prices-c6wovB`.

- Initial six pricing regressions: five failed, one passed (`failing-first.log`).
  Seed 7's existing 8 Gold Decree did not become 6 after buying Discount Sale;
  upgrading similarly left current stock stale.
- Initial paid-price tests also exposed catalog-based resale. An attempted change
  to catalog `cost` was rejected by the strict Fate Seal save validator
  (`prices-final-focused.log`). Only runtime resale value is now changed.
- Final focused tests: **124/124 across eight files**.
- Full unit suite: **1,626/1,626 across 138 files**, 233.64 seconds.
- The first build caught a readonly assignment in a test fixture (`build.log`).
  Its type-safe fixture correction passes TypeScript and **23/23** affected tests;
  application code is unchanged from the full unit run.
- Targeted lint, whitespace check, Pages-base production build and **13/13 release
  checks** pass. PWA output: 412 entries / 69,541.74 KiB.
- New native browser tests: **8/8**, English/Spanish, desktop/320px touch, both
  discount levels. Existing shop/build/availability/Omen regressions: **8/8**.
  No retries. Actual cancellation, Charter charge, immediate affordability,
  current/legacy reload, pending paid pack restoration, reward selection and
  next-round play are covered.
- Built-production browser journeys: **28/28**, English/Spanish, desktop/320px
  touch, fresh/current/legacy saves and ordinary Decree purchase/sale. Full saved
  snapshots survive reload, and each journey continues with a real tactical play.
  Zero page errors. The Spanish phone sale dialog was visually inspected: the
  complete name, actual 1 Gold resale, cancellation and confirmation fit.

Browser fixtures win three real rounds using controlled low targets and a chosen
boss. The upgraded Charter fixture explicitly enables its unlock. These checks
do not establish organic progression through every Charter unlock. Fresh upgraded
purchase is covered locally; the built-production matrix uses already-owned
upgraded saves rather than inventing a hosted profile unlock.

No new artwork is necessary for this mechanics correction. Existing generated
shop, pack and Decree illustrations remain connected. Human enjoyment, physical
device review and the remaining ambiguous mechanics still need separate work.

## Publication

Local verification complete; deployment and hosted verification are pending.
