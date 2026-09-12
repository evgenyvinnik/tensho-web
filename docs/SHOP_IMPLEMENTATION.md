# Classic shop acquisition and pack settlement

Updated: September 10, 2026. This records an implementation pass, not overall project completion.

## Authoritative path

[`ShopSession`](../src/game/ShopSession.ts) belongs to each `GameOrchestrator`. Both [`ShopScreen`](../src/components/screens/ShopScreen.tsx) and [`classic-balance.mts`](../scripts/classic-balance.mts) use it. The former UI-local pack singleton and split store/payment/grant handlers no longer own live purchases. `shopStore.ts` remains a legacy module with no runtime consumer; it must not be used to create another purchase path.

The session owns generated offerings, pack contents, pending rewards, reroll costs, Charter shop effects, and per-visit spending totals. Starting or resetting a run resets the session. Reopening an existing visit does not generate new offers, consume another shop Omen, or charge again. Owned canonical Charters are synchronized idempotently before generating each new visit.

### Purchase rules

- Resolve an offering by its actual session ID. Reject missing, purchased, or locked offers, wrong-phase calls, insufficient gold, and negative/non-finite costs before mutation.
- Check inventory capacity and Decree requirements before regular purchases. Temple Stone cannot receive Flower tiles.
- Validate a pack's identity and availability before payment. Two same-type/same-size packs generated in the same millisecond now have distinct IDs.
- Defer event notifications until the synchronous operation has settled. Observers see payment, purchased state, and inventory consistently; reentrant shop actions are rejected while settlement is busy. Event batching is not a generic rollback mechanism for arbitrary throwing code.
- Rerolls use the same phase, pending-pack, affordability, and payment checks. They preserve pack and Charter offerings. `shopExited` reports actual visit spending and purchase counts instead of constant zeros.

### Pack lifecycle

An offering moves from unopened to opened, then to exactly one terminal state: claimed or skipped. Claiming twice cannot duplicate rewards; skipping twice cannot increase skip counters. Invalid, duplicate, fractional, out-of-range, or empty selections do not settle the pack. Terminal state survives `BlessingPackSystem` serialization. Legacy opened pack records without a terminal marker are conservatively treated as resolved because their prior claim status is unknowable.

The **whole selection** must fit before any grant. This includes shared consumable capacity and the sequential slot expansion of Negative Decrees. If two Mega rewards cannot fit, neither is granted and the pack remains pending; the player may select fewer/different rewards or explicitly skip. Selecting fewer than the maximum is allowed, but an empty confirmation is not.

A paid pending pack blocks additional purchases, rerolls, and advancing the round. Navigating away and back restores its contents without charging again. This is in-memory route recovery, **not Classic save/reload persistence**. The current Classic run is still not promised to survive a browser reload.

## Interface

- The paid-pack dialog cannot be accidentally dismissed by Escape or a backdrop tap. “Skip rewards” is the explicit forfeiture action.
- Reward cards support keyboard selection; focus stays within the dialog. Controls restore focus on unmount where the previous element still exists.
- Selected count, capacity feedback, and equal-width actions remain outside the scrolling reward list. A 320×568 Spanish screenshot exposed clipped confirmation text in the first layout; the final layout keeps both actions and the reason for disabling confirmation visible.
- Pack names use the existing localized catalog. Reward names/descriptions use canonical item IDs for Decrees, Seals, Orbs, and Scripts. Selection guidance, settlement errors, and explicit skip labels have entries in all 13 languages. Tile-pack modifier prose and remaining shop strings still need the broader localization audit; this is not a claim that every shop string is translated.
- Pack reveal and selection animations honor reduced motion. Existing pack and consumable illustrations are retained.

### Pack motion follow-up

A later full unit run exposed an intermittent invisible reward label. A stricter,
synchronous regression reproduced the cause for both Bonus and Gold rewards:
`immediate: true` did not prevent the entry spring's first render from using
`opacity: 0`, half scale, and a vertical offset. Reduced-motion rewards now use
visible static styles from their first render; the backdrop and dialog also use
static final styles. Their normal-motion transform subscribes to both entry and
interaction springs so hover/selection does not depend on the entry spring moving.

Pack cards now honor both the app preference and the operating-system preference.
Hover tilt, press scaling, artwork zoom, button press scaling, and decorative
shimmer are suppressed; static artwork size, selection borders, color feedback,
affordability, and purchase/claim actions remain. Normal-motion effects remain
available. Two component regressions check both preference sources, Mega artwork
size, exactly one purchase callback, and disabled purchasing. Existing localized
reward tests now assert immediate visibility rather than waiting for animation.
Those tests also reproduced selection being cleared when the motion preference
changed. Selection reset now depends only on opening/changing a pack; reveal
timing is independent. Switching preferences in either direction retains the
chosen rewards and still permits confirmation.

The [verification ledger](IMPLEMENTATION_WRAP_UP.md) records the final unit,
browser, artwork, and build results for this follow-up. These motion checks are
not a physical-device or assistive-technology review.

## Verification scope

### Shop Omen guarantee follow-up

The Decree Omen's Rare-or-better requirement now travels from its canonical
definition through `OmenTagSystem`, `GameOrchestrator`, and `TeaHouseSystem`.
Previously the pipeline retained only the item category, so a five-gold
tradeoff could produce a Common or Uncommon Decree. The shared candidate pool
enforces the minimum rarity during both preflight and generation, including
fallback: if only Legendary candidates remain, the offer cannot fall back to
Common. Ordinary shop rarity weights are unchanged.

When every eligible Decree is already owned, that guarantee remains pending
for a later visit, without consuming the Omen or charging its shop-entry gold
tradeoff. Other applicable shop Omens still settle. Edition Omens likewise
remain pending when no unowned Decree exists. Starting a new run clears pending
and consumed Omens. This is catalog eligibility, not an assurance the player
has inventory capacity or enough money to buy every generated offer.

Stacked item, free-pack, and edition guarantees no longer overwrite or silently
discard each other after filling ordinary shop slots. Each edition uses a
distinct offer; if necessary, it adds an offer without replacing a guaranteed
Seal, Orb, or Script. Overflow offers are one-shot Omen rewards, not permanent
Charter slot increases. An item reroll returns to ordinary item capacity;
packs remain until purchase or shop exit, as before. The next visit returns to
ordinary capacity unless another reward or Charter applies. Edition offers
retain the existing zero-price behavior.

Ten engine regressions exercise six deterministic Rare+ purchases, repeat
opening/payment, exhausted-catalog deferral and later delivery, upward rarity
fallback, ten stacked Omens, three explicit free-pack settlements, reroll and
next-visit capacity, and new-run cleanup. The small-screen browser scenario
injects the active Omens but uses real generated offers, purchases, pack
skipping, rerolling, and client-route recovery. It does not prove organic skip
awards or season-lock tradeoffs, and does not claim Classic reload persistence.

Remaining catalog discrepancies are explicit:

- Foil, Holographic, and Negative descriptions in the canonical/localized
  catalog say “next purchased Decree,” while the runtime and `ITEM_LIBRARIES.md`
  describe a free edition offer in the next shop. This pass preserves the
  existing free-offer behavior; those promises still need reconciliation.
- Double Omen is in the legacy item library but absent from the acquireable
  `ALL_OMENS` catalog. Its legacy store branch is not evidence of a live feature.
- The named pack-skip synergy Decrees in `SKIP_SYNERGY_DECREES` are absent from
  `ALL_DECREES`, and `getSkipBonuses` has no runtime consumer. Their conflicting
  legacy effect descriptions are not implemented acquisition paths.

Verification: the full unit suite passed **727/727 in 65 files**. The affected
browser run passed **68/70**, including both new Omen cases; two existing desktop
pack scenarios timed out. Those scenarios and the Omen case subsequently passed
**6/6** in a separate one-worker desktop/mobile run without retries or weakened
assertions. Both 320-pixel Omen screenshots were inspected. TypeScript, the
Pages build, targeted lint, and new-test formatting pass. The
[completion ledger](IMPLEMENTATION_WRAP_UP.md#current-shop-omen-checkpoint)
records command scope, retained diagnostics, and the earlier failed worker run.

### Shop identity, Charter artwork, and localization follow-up

The ordinary shop now shows the actual offered Seal or Orb name, rule, and
rarity through the existing item catalog, not generic category placeholders.
Names and rules are no longer clamped to two lines. Buy buttons expose the
item name plus final price and use the full rule as their accessible description.
An unaffordable card cannot attempt purchase by bypassing its disabled button.

The header gives the title its own centered row on narrow screens and formats
gold/reroll values in the interface language. Stock counts, sections, empty
states, continuation, Charter confirmation, tier, and rarity labels have 17
new interface keys with matching interpolation tokens in all 13 languages.
Item/pack grids use one column below 400 pixels to leave long rules readable.
This does not fill every missing catalog translation.

`CharterCard` uses the new [Imperial Charter artwork](CHARTER_ART.md), with
localized names/rules outside the image. Base/upgraded tiers wrap normally;
literal escaped decorations and truncated titles are removed. The price control
spans the card on phones and sits alongside the content at wider sizes. The
confirmation names the exact Charter and cost; Cancel preserves gold and owned
IDs, and Buy charges/grants once through `ShopSession`.

Header, Charter, and ordinary-item card springs honor both app and OS reduced
motion. Item-card Polychrome animation and pressed-button scaling are disabled
under that preference. The separate `PackCard` hover springs still need the
same treatment; this is not an all-shop motion-compliance claim.

Three Charter component cases cover localization/art, full long text, accessible
price/rule, affordability, and reduced motion. Two actual-stock cases cover
Spanish Seal/Orb identity, rarity, full rules, named controls, motion suppression,
and once-only callback/disabled-card behavior. One header case covers localized
large balances, reroll description, and app reduced motion. The locale contract
checks all 17 keys in all 13 languages.

Six new desktop/mobile checks cover base and upgraded illustrated Charters and
actual Seal/Orb offers. Charter layouts are checked at 320×568 and 640×568;
native image decoding, child/document bounds, and reachable controls are asserted.
The base case cancels and buys through the real UI. The upgraded case deliberately
injects an offer with no gold: it proves rendering and affordability, not natural
unlock/acquisition. The stock case buys the named Seal and verifies gold,
inventory identity, and remaining count. Final screenshots were inspected.

The final combined shop/dialog/result/consumable run passed **66/66** without
retries (2.9 minutes). The complete unit suite passed **712/712 in 63 files**
serially; strict TypeScript, Pages-path build, and targeted lint/format pass.
The preceding focused run's two Charter failures came from serializing a `Set`
in the test snapshot; its other failure was an unchanged desktop Unity timeout.
The final run preserves transaction assertions and timeouts. Original diagnostic
artifacts are under `/tmp/tensho-charter-verification-vm5y46/initial-focused-suite/`.
The older 178-check full-suite result below predates these six new checks;
the current configured full suite contains 184 checks and has not been run here.

### Cash-out receipt follow-up

The round receipt now translates its heading, payout categories, savings advice,
and next-round/Act destination in all 13 locales. Numbers use the interface
language's grouping. Settled score, balance, and payout remain historical after
a purchase; savings guidance uses current gold and respects the interest cap
and blocked-interest rule. The presentation does not award or recalculate money.

A missing contribution from payout multipliers is now shown as **Reward bonus**:
`netGoldChange + rentalCost - baseReward - interest - decreeGold - heldGoldMarkReward`.
Together with the existing rental deduction, the displayed entries reconcile
to the authoritative settled total. A regression uses an actual Philosopher
round settlement rather than a fabricated multiplier calculation.

Small screens stack the receipt, payout card, and guidance. Longer balances can
wrap at separators; exceptionally long totals use smaller type while retaining
every digit. The billion-scale stress total fits on one line at 320 CSS pixels.
Existing gold artwork and the green/gold palette remain unchanged. Receipt
entrance respects reduced motion; short screens intentionally scroll within
the shop above its pinned action bar.

Seven component tests cover actual multiplier settlement, every payout category
in Spanish, French number formatting, changing current savings, capped/blocked
interest, zero rewards, and negative rental totals. A locale contract checks all
12 new keys and their interpolation tokens in all 13 languages. Three browser
scenarios run in each Chromium configuration at both 320×568 and 1024×768, with
Spanish, Russian, and Japanese strings and deliberately extreme presentation
values. They check entry sums, child/document bounds, unbroken totals, and
reachable savings guidance. Screenshots were inspected. The extreme values are
UI fixtures, not evidence of ordinary earnings or progression balance.

### Mounting-state and animation regressions

Receipt testing exposed two separate bugs:

- Screen shake translated the app beyond the viewport, including when the OS
  requested reduced motion. A stationary clipping boundary and combined
  app/system motion preference fix the overflow; phase changes cancel lingering
  shake. See [animation continuity](RUN_RESULTS_IMPLEMENTATION.md#screen-shake-boundary-and-motion-preference-follow-up).
- A shop update between initial render and passive subscription could leave
  `useGameController` displaying stale values. A direct component regression
  reproduced `gameplay:4` remaining visible after the engine became `shop:17`.
  The hook now refreshes once after installing all listeners, closing that gap
  without requiring another user action. Subsequent gold events still update
  normally. This does not add Classic save/reload persistence or change payouts.

The final browser run passed **178/178 checks** without retries (13.8 minutes),
including all six localized receipt checks and both new shake checks. The prior
run passed 174/178: two desktop tests timed out, and two mobile receipts were
absent because of the mounting-state issue. The deterministic regression proves
the subscription gap; it does not establish the cause of every historical
timeout. Original diagnostic artifacts remain locally under
`/tmp/tensho-payout-verification-9ULF1P/` (initial, second, and third full-suite
directories). Earlier failures also drove restoration of the existing English
Act-ascent wording and the large-total layout adjustment; assertions were not
weakened or given retries to obtain the final pass.

The later follow-up above closes the section headings/counts, continuation,
confirmation, and escaped-Charter gaps identified in this receipt pass.
Remaining localization includes missing tile/catalog translations, edition/sticker labels,
missing item catalog entries, and native-speaker review. This is not a claim
to translate the whole shop. Current complete unit/build results live in the
[wrap-up ledger](IMPLEMENTATION_WRAP_UP.md).

### Tile Pack rule and identity follow-up

Two seeded generation tests reproduced stale Tile Pack descriptions: Bonus Tile
advertised +10 while its actual enhancement grants +30, and the Gold-mark tile
advertised +2 when scored instead of 3 at round end when held. The recipe table
now stores only modifier selection, not a second set of authored rule numbers.
[`tileModifierEntries`](../src/core/tileModifierEntries.ts) reads the resulting
Tile's actual enhancement, Seal, and edition definitions for generated names
and descriptions. The tests also exercise the modifier scorer's played/held
contexts. The orchestrator's round settlement separately counts held Gold Marks
at 3 each; no payout or scoring constants changed.

[`tileRewardText`](../src/i18n/tileRewardText.ts) resolves public reward identity
and modifier entries through the existing translation catalog, falling back to
canonical text where entries are missing. It is used by the reward dialog and
ordinary Tile shop cards. Rank/suit and every modifier layer remain visible;
this helper must not be used to expose concealed rack tiles. Plain Flower/Season
names still fall back to authored text, and untranslated catalog entries remain
part of the broader localization audit.

Reward cards now wrap their complete names and rules, expose the rule as an
accessible description, and use ordinary rarity labels rather than calling
non-Decree rewards “Local Edicts.” Three component cases cover Spanish Bonus
and Gold rewards despite deliberately stale `PackContent` text, keyboard
selection with explicit confirmation, and stacked/plain/Honor tile names.

Two new desktop/mobile browser checks render a deliberate two-tile reward pack
at 320×568, verify its full Spanish descriptions and unclipped text, select both
rewards, and confirm actual wall IDs/modifiers, one payment, and resolved pack
state. Final selected-state screenshots were inspected. The first run passed
66/68; the new cases failed on a guessed Spanish suit label (“Bambú” versus
the existing “Bambúes”). Corrected exact expectations and the generic rarity
fix pass in the final **68/68** run without retries (5.4 minutes). Initial
artifacts remain at `/tmp/tensho-tile-rewards-DJYJTj/initial-focused-suite/`.
The complete unit suite passes **717/717 in 64 files**, with strict TypeScript,
Pages-path build, and targeted lint/format checks. The full 186-check browser
suite was not run at this checkpoint.

### Negative Tile: runtime gap and conflicting requirements

An isolated run on seed 713 accepted a Negative Bamboo 4 through
`GameOrchestrator.addTileToWall`; the tile appeared once in `wallTemplate`,
but `decreeSystem.getMaxSlots()` remained **5 before and 5 after**. The tile's
own edition definition says “+1 Decree slot.” Negative **Decrees** have separate
working slot logic; this probe does not question that behavior.

`GAME_MECHANICS.md` section 11 promises a tile slot effect, whereas
`ITEM_LIBRARIES.md` marks Negative's effect on tiles “N/A.” A user choice has
been requested: either support Negative tiles with explicit ownership/removal
lifetime, or keep Negative Decree-only and stop generating those tiles.
Generation and slot behavior remain unchanged pending that choice. Once chosen,
verify acquisition, transformation/copying, destruction, round boundaries,
new-run reset, and interaction with other slot sources. Do not close this
mechanics requirement merely because reward text now uses canonical definitions.

### Acquisition and settlement coverage

[`ShopSession.test.ts`](../src/game/ShopSession.test.ts) has 22 integration checks using actual engine/system instances and explicit transaction fixtures. They cover payment rejection, once-only grants, settled event visibility, combined pack capacity, reselection, pending-pack blocking, Temple rules, Negative Decrees, Charter continuity, new-run reset, rerolls, and distinct pack IDs. [`BlessingPackSystem.test.ts`](../src/systems/BlessingPackSystem.test.ts) separately covers once-only settlement and invalid indices. Locale tests require all new controls and interpolation tokens in every language.

[`e2e/shop.spec.ts`](../e2e/shop.spec.ts) exercises real UI purchase/claim operations with deliberate inventory fixtures on desktop and mobile Chromium. It checks combined-capacity feedback, single-reward recovery, explicit skipping, keyboard focus/selection, short-screen Spanish layout, and route revisit recovery. These fixtures isolate transactions; they are not evidence that ordinary players can reach later Acts. Current full-suite results are recorded in [the wrap-up ledger](IMPLEMENTATION_WRAP_UP.md).

## Corrected progression evidence

The previous `--shop` implementation called `prepareShopVisit()` but bought nothing. The status document's old “median Act 5 with shopping” statement was therefore not reproducible with that harness and has been withdrawn. The repaired harness now reports actual purchases, spending, claimed/skipped packs, and non-terminal policy stops.

Initial acquisition-pass measurements, before the subsequent play-validator corrections, using seeds 1–200 and the default Classic table/stake on September 9, 2026:

```sh
bun scripts/classic-balance.mts 200
bun scripts/classic-balance.mts 200 --shop
```

| Measurement | No purchases | Cheapest-first purchases |
| --- | ---: | ---: |
| Median / maximum Act reached | 1 / 2 | 1 / 7 |
| Mean completed rounds | 1.35 | 3.94 |
| Median run score | 763 | 1,324 |
| Reached Act 2 (rounded) | 8% | 43% |
| Reached Act 5 (rounded) | 0% | 5% |
| Reached Act 8 | 0% | 0% |
| Purchases / gold spent | 0 / 0 | 1,281 / 4,880 |
| Packs claimed / skipped | 0 / 0 | 384 / 340 |
| Actual losses | 197 | 187 |
| No-advice policy stops | 0 | 10 |
| Rejected fixed-hand-size plays | 3 | 3 |

This policy buys cheapest-first, picks the first valid pack selection, and never uses consumables, redraws, discards, or deliberate Yaku planning. Buying packs that it later skips is legal but strategically poor. These results demonstrate real acquisition integration and policy limitations, not balanced difficulty or human enjoyment.

The rejected plays exposed a follow-up issue: `previewScore` could quote a selection that the fixed-hand-size Boss Mandate subsequently rejected. [The play-validation audit](PLAY_VALIDATION.md) records the fix, Omen forecast parity, the concealed-rack cause of the no-advice stops, and updated measurements. The table above preserves the initial evidence rather than silently rewriting it. Resource-aware strategy remains required before drawing broader balance conclusions.

Still open: full acquisition/use coverage of consumables, documented pack skip synergies, ordinary later-Act progression, Classic save/reload behavior, and release verification. This pass does not close those requirements.
