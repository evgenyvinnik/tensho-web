# Omen costs, live durations and skipped rounds

September 22, 2026. Follow-up to [Double Omen](DOUBLE_OMEN_IMPLEMENTATION.md),
not a whole-project completion claim.

## Reproduced mechanics defects

Three of five new engine regressions failed before this correction:

- Austerity's next-round interest restriction survived skipping that round and
  incorrectly withheld the following Boss payout's interest.
- Interest Omen's three-round benefit counted only won rounds, not skipped ones.
- The store cleared an applied Season lock in a zero-delay timer. A new lock
  acquired before that callback ran was erased by cleanup of the old lock.

An accepted skip now ages existing economy durations before awarding its new
Omen. This does not award a payout, interest, shop visit or round-win event.
The newly earned reward retains its full duration. Rejected Boss skips do not
age durations. Winning-round payout still reads the effect first, then ages it.
Season locks are consumed synchronously, so cleanup cannot remove a newer lock.
No Season scoring rule or pending mechanics proposal is changed.

Seed 19 earns Austerity then Speed: skipping the restricted Large round allows
the Boss's ordinary five-gold interest; playing that Large round instead withholds
interest once. Seed 1 earns Interest then Multiplication: Large consumes one of
the three boosted rounds even when skipped, and the Boss earns seven-gold interest.
Winning deals and starting gold are controlled fixtures after actual seeded skips.

## Player-facing effects

The optional disclosure now says **Omen effects**, since an acquisition tag may
be consumed before its effect ends. It reads the engine's live Season lock and
interest durations rather than inferring them from historical tags. The panel
remains available when only a live restriction or benefit remains, and disappears
when both active tags and ongoing effects are gone.

Each pending Rare+ guarantee shows its own five-gold fee and says the fee is only
charged when that offer is delivered. Deferral keeps both the guarantee and its
fee pending. Copied guarantees show two distinct fees. Applied/replaced Season
locks and expired interest restrictions do not remain as stale instructions.
The generated Double Omen illustration remains; no new bitmap is needed for
these live costs and durations. All four effect messages and the revised heading
are supplied in thirteen languages, without claiming native-speaker review.

## Verification

The focused set passed **66/66 in five files**, 110.74 seconds, including all
five duration regressions, thirteen new locale-specific live-effect cases and
existing Double Omen, acquisition and Monsoon coverage. An empty-section markup
cleanup followed that run and is included in the full regression run.

The first full run finished with **1,061 passes and six five-second timeouts**
in five files (1,021.62 seconds). These were the Classic balance CLI, ActionBar,
ConsumablesBar, DecreeBar and ShopItemCard tests, not assertion mismatches.
An unchanged full rerun passed **1,067/1,067 in 96 files**, 213.07 seconds;
neither deadlines nor assertions were relaxed. Strict TypeScript, targeted lint,
selected formatting checks and whitespace checks passed. Test-fixture state uses
the existing mutable OrchestratorState type without weakening the runtime API.

All **28/28 browser checks** passed without retries: eight live-effect checks,
eight Double Omen checks, four acquisition/Season-lock checks, four paid Merchant
swap/reload checks, and four entirely UI-driven Table Loop victory/defeat runs.
English and Spanish cover desktop and touch; live effects and copied fees were
reviewed in Spanish screenshots at desktop and 320px widths. Browser artifacts
and the unit JSON report are under `/tmp/tensho-omen-effects-WKiQIX/` (local,
temporary evidence, not repository assets).

The local Pages-base production build was interrupted under extreme host load
(load average above 200); its final output shows TypeScript completed and Vite
began transforming, but the build did not finish and is not reported as passing.
The standalone TypeScript check also passed earlier.
The clean GitHub runner subsequently passed all 1,067 application tests, the
Pages-base production/PWA build (342 modules; 268 precache entries / 63,927.40 KiB),
and provenance verification, then successfully deployed **v1.0.260922-1**.
Hosted desktop and 320px touch checks verified the displayed version, actual
Table Loop placement, reload preserving spent actions, and the Spanish Classic
route without JavaScript page errors. Existing broad verification
limits—Classic persistence, real devices, native speakers, newcomer playtesting,
unapproved mechanics choices and installed-PWA upgrades—remain open.

The checkpoint was merged into main without rewriting history, preserving the
feature branch. [Release evidence](RELEASE_IMPLEMENTATION.md#september-22-publication-checkpoint)
records the successful workflow and matching public manifest/tag/commit.
