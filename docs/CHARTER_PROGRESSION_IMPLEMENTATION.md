# Charter progression: interest streaks, build prerequisites and eligibility gaps

September 22, 2026. Follow-up to the published `1.0.260922-1` checkpoint.
This is not a declaration that every Charter unlock is implemented.

## Money Tree prerequisite

The item library and canonical unlock catalog require maximum interest for ten
consecutive rounds, plus acquisition of Seed Pouch. The old bridge treated every
positive interest payout of at least five gold as a maximum. This was incorrect
with Charter/Omen-raised caps, omitted zero/blocked payouts, and let separate
runs or skipped rounds contribute to one streak. Its `maxConsecutiveInterestRounds`
field also served as both current streak and lifetime best, losing the best on
a shortfall.

The winning-round settlement now emits `interestSettled` with actual paid
interest, the cap used for that payout, and savings before payout. This includes
zero interest and captures the cap before Omen duration aging. The existing
positive-only `interestEarned` notification is retained, but no longer awards
progress. No reward, interest rate, cap or price is changed.

`currentMaxInterestRounds` tracks the active streak; the existing best field is
monotonic. A below-cap, blocked or zero-cap settlement resets only the current
streak. Accepted skips, defeats and new runs reset it too; rejected actions and
previews do not. The tenth qualifying payout feeds the existing persisted unlock
and Archive bridge. Already earned unlocks remain earned after a streak ends.

Serialization retains both counters. Legacy saves have no proven current streak,
so the new current counter defaults to zero rather than extending their old
counter. Existing recorded best values and already granted unlocks are preserved,
not retroactively adjudicated; this compatibility rule does not establish that
every historical award was earned under the corrected rules.

## Earlier interest-only verification

Eleven focused tests pass, including actual controlled winning plays through
shops, higher Charter caps, zero/blocked interest, skips and Boss rejection,
new runs, defeat, an earned Omen's boost expiring at payout, preview isolation,
zero-cap events, ten winning-round settlements, Archive unlocking and serialization.
The winning tiles, savings and target are fixtures, not organic balance evidence.
The base Charter is granted through authoritative acquisition for the unlock
boundary; these tests do not claim paid acquisition of Money Tree itself.

The initial test run had six assertion failures and one invalid fixture API.
The expanded run had two fixture errors (a stale state reference after restarting
and a wrong preview method name), subsequently corrected without weakening the
assertions. Strict TypeScript and targeted lint passed. Full regression passed
**1,078/1,078 in 97 files** (377.24 seconds). The first browser set passed **16/16**:
eight English/Spanish interest-boundary scenarios on desktop/touch and eight
existing Omen-duration cases. Expanding the interest tests to reload the page
then passed **8/8** (50.5 seconds), preserving best/unlock/Archive state while
resetting the new Classic run's current streak. Both runs used one worker, no
retries, and existing deadlines. Artifacts are local under
`/tmp/tensho-interest-progression-4Owif1/`. The Pages-base production/PWA build
passed: 342 modules, main entry `index-QpbkdaIx.js`, 268 precache entries /
63,927.66 KiB. Existing large-chunk and stale Browserslist warnings remain.
This interest-only stage added no bitmap. The subsequent combined checkpoint
adds the portrait described below.

## Build prerequisites and artwork

Radiant Edge now observes five simultaneously owned editioned Decrees, rather
than cumulative acquisitions. Full Palette observes the authoritative rack
capacity reaching five, not a temporarily sparse rack. Settled build snapshots
publish after successful actions, acquisitions, sales and initial round draws.
Nested effects do not expose intermediate inventories: Ankh's temporary copy
cannot unlock a five-Decree achievement before its destruction step finishes.
Current ownership resets on a new run; earned unlocks and minimum capacity persist.

Eight engine regressions cover simultaneous ownership, repeated buy/sell cycles,
Ectoplasm edition changes, preview/invalid-action isolation, ten real Ouija uses
through controlled round/shop transitions, Ankh, Ash-protected penalties and
exception-safe action nesting. These use explicit fixtures, not organic balance
evidence. The initial five-case run reproduced three failures; the expanded
focused set passed all eight. Three portrait tests verify item-specific art and
discovery gating in both Archive cards and details.

Money Tree has a unique generated portrait in its shop card and discovered
Archive entry; other Charters retain the shared illustration. Rules remain
localized HTML. [Artwork provenance and prompt](CHARTER_ART.md#money-tree-portrait)
record the unchanged transparent asset and the image-generation tool's limits.

## Combined checkpoint verification

Full regression passed **1,089/1,089 in 99 files** (188.44 seconds). Strict
TypeScript, targeted lint and all thirteen release-workflow tests passed.
The first browser run retained **7 passes / 3 failures**: two Money Tree checks
used Array.includes on a Set after their successful paid purchase; one mobile
interest scenario was interrupted by a documentation-triggered Vite reload.
The fixture now uses Set.has. With no concurrent edits, the next run retained
**9 passes / 1 failure**: the first desktop scenario missed its existing five-second
initial control-visibility deadline. That unchanged scenario then passed all
**three isolated repetitions** (26.7 seconds total), with no retries or increased
deadlines. The intermittent startup delay's cause is not established.

The browser coverage includes English/Spanish interest thresholds and persistence
on desktop/touch, plus a real ten-gold Money Tree purchase raising the cap to
twenty. The offer/base grant are deliberate fixtures, not proof of achievement
eligibility gating. The 320px Spanish shop screenshot was visually inspected:
portrait, localized identity/rules, price and Continue fit without horizontal
overflow. Archive portrait discovery gating has component coverage.
Artifacts: `/tmp/tensho-charter-release-bQltze/`.

Pages-base production/PWA build passed: 343 modules, main entry
`index-C_tkVuph.js`, 269 precache entries / 65,774.40 KiB. Existing large-chunk
and stale Browserslist warnings remain. This is the verified release candidate;
publication subsequently succeeded as **v1.0.260923-1**. GitHub independently
passed all units and build; the public manifest, remote tag, hosted artwork hash
and desktop/touch gameplay were verified. [Release ledger](RELEASE_IMPLEMENTATION.md#charter-progression-publication-checkpoint).

## Pack-use provenance follow-up

Omen Lens and Observatory require 25 uses of their respective consumables **from
packs** in both `ITEM_LIBRARIES.md` and `docs/GAME_MECHANICS.md`. Their old unlock
conditions instead read all lifetime uses. Acquisition already distinguished
purchase, pack and generated rewards, but successful-use events lost that source.

Authoritative grants now stamp the acquired instance's source after capacity
validation, preserving object identity. Successful Seal/Orb use carries that
source through the event bridge. Separate persistent `packFateSealsUsed` and
`packCelestialOrbsUsed` counters drive these two unlocks. Ordinary lifetime-use
statistics and achievements still include all successful uses. Preview, failed
use, acquisition alone and rejected grants do not earn a pack-use increment.
The Fool and other generators create `generated` items, even if their template
or previous consumed item came from a pack. Unknown legacy items do not count
as pack-sourced, and acquisition overrides stale template provenance.

Legacy saves initialize the new counters to zero, keeping their general-use
totals and existing unlock records. We cannot infer old pack usage from those
totals; previously earned unlocks are not revoked. New counters persist across
runs and reloads. This does not introduce Classic run persistence.

Eight engine tests cover instance-specific mixed sources, the 24-to-25 boundary,
paid pack purchase/claim/use for both families, general totals, Fool copies,
failed actions/capacity, serialization and unknown/stale provenance. The first
seven tests reproduced seven failures. After implementation, two fixtures needed
their completed-round type populated before exiting the shop, and the existing
shop identity regression required preserving the granted object (not replacing
it with a clone). The focused set then passed 46/46 before the final legacy case
was added. Strict TypeScript and targeted lint passed.

All **eight browser journeys** passed in 20.0 seconds with one worker, no retries
and unchanged deadlines: English/Spanish, Seal/Orb, desktop/320px touch. They use
explicit base/stat/offer fixtures, then real payment, reward selection, shop
exit, item inspection/confirmation, unlock/Archive updates and page reload. They
prove the boundary, not organic progression balance or achievement-gated offers.
Artifacts: `/tmp/tensho-pack-provenance-JHtp69/`. Full regression passed
**1,097/1,097 in 100 files** (40.10 seconds). Strict TypeScript, targeted lint,
new-test formatting and diff checks passed. Pages-base production/PWA build
passed: 343 modules, main entry `index-DZH0YSR4.js`, 269 precache entries /
65,774.81 KiB. Existing bundle/Browserslist warnings remain. Existing generated artwork is unchanged; this
accounting repair does not require another bitmap.

Published as **v1.0.260923-2**. GitHub independently passed all 1,097 units and
the build; the public manifest/tag and hosted desktop/touch smoke checks match.
See [publication evidence](RELEASE_IMPLEMENTATION.md#pack-provenance-publication-checkpoint).

## Achievement-gated offers and purchases (local follow-up)

The canonical availability rule now requires all three conditions for an upgrade:
its persistent unlock is earned, its base is owned in the current run, and the
upgrade is not already owned. Base Charters remain initially available. Both
Tea House offer generation and CharterSystem purchase validation use this rule;
a stale/forced locked offer cannot charge gold or grant an item. A depleted
eligible pool produces no Charter offer, not a locked fallback.

The UI controller supplies a live resolver from the persisted progression store
to the application singleton. A newly earned unlock or reset is visible without
restarting the run. Pure engine instances default to locked upgrades and accept
an explicit resolver for simulations/tests. Neither the engine nor its rules
import the progression store. The legacy Charter store uses the same canonical
rule. Restoring owned Charters preserves their effects; it does not award unlocks
or bypass prerequisites for later purchases. A new run still requires its base.
The existing lazy loading boundary is preserved by wiring in the controller,
not eagerly importing the game engine in the application entry point.

Twenty initial cases cover every one of the sixteen upgrades' generated offers,
paid transactions, stale eligibility, repeat rejection and next-run base checks,
plus canonical defaults, live unlock/reset lookup, state restoration and the
legacy store. Catalog grants/unlock sets isolate availability; they are not
organic balance or complete power-effect coverage. The initial nineteen-case
run failed: seventeen cases exercised the not-yet-existing resolver API, while
two demonstrated permissive availability/restoration. Existing Tea House and
Observatory scoring fixtures now explicitly supply earned eligibility.

Liquidation's prerequisite now reads the already-maintained lifetime best for
Charters redeemed **in one run**, not the new run's current count. A qualifying
past run remains valid when Discount Sale is acquired later. Two further
integration cases use authoritative grants, separate runs and the progression
bridge: nine in one run plus one later remains insufficient; ten in a prior run
qualifies after the later base acquisition. The ten-Charter boundary case failed before
this evaluator correction. No threshold was changed.

The first full suite passed **1,117/1,117 in 101 files** (46.97 seconds), before
the two historical-count cases. All **44 browser checks** passed (3.1 minutes):
English/Spanish earned/unearned Money Tree purchase attempts, real payment and
cap effects, reload preserving unlocks but not bypassing the new base requirement,
pack provenance, illustrated Charters, localized receipts, reduced motion,
pending-pack route recovery, capacity and keyboard/short-phone flows. Browser
offers and achievement boundaries are deliberate fixtures. No retries or longer
deadlines were used. Artifacts: `/tmp/tensho-charter-eligibility-HIINkp/`.
After the historical-count correction, final full regression passed
**1,119/1,119 in 101 files** (187.01 seconds), and the eight earned/unearned
purchase-and-reload browser journeys passed again (1.1 minutes). Strict
TypeScript, targeted lint, new-test formatting and diff checks passed.
That candidate production/PWA build passed (343 modules, 269 precache entries /
65,775.25 KiB). A subsequent returning-player audit found a compatibility case
that must also pass before publication: earlier permissive releases could record
an upgraded-Charter purchase without its achievement unlock record.

Startup reconciliation now quietly preserves known upgraded Charters recorded in
lifetime purchase history as persistent unlocks. It does not infer eligibility
from Archive discovery/unlock flags, unknown IDs, or a standalone run snapshot.
The migration is idempotent, emits no new-unlock notices for old purchases, and
does not resurrect history after a progression reset. Current-run base ownership
and duplicate protection still apply. A dedicated regression failed before the
migration; an added browser case verifies hydration through an actual page reload.
Final verification includes this compatibility change: **1,120/1,120 units in
101 files** (71.77 seconds) and **10/10 purchase/reload/legacy-hydration browser
checks** (32.5 seconds), with one worker, no retries and unchanged deadlines.
Strict TypeScript, targeted lint, selected formatting and diff checks passed.
The final Pages-base production/PWA build passed: 343 modules, main entry
`index-DRYVI_m3.js`, 269 precache entries / 65,775.37 KiB. Existing bundle and
Browserslist warnings remain. Browser artifacts are under
`/tmp/tensho-charter-eligibility-HIINkp/browser-migration`.
The existing generated artwork is preserved; this rules wiring adds no bitmap.

## Remaining Charter audit

Source inspection establishes these next requirements, not completion:

- Spending progression still treats every negative gold delta as spending,
  including penalties; audit transaction categories for Plentiful Stock.
- The documented Full Unlock profile option is not wired to a player control or
  achievement suppression. Archive `unlockAll` only changes archive entries;
  it is not evidence of a working profile-wide opt-out. Do not use discovery
  alone to bypass the progression registry.
- Observatory's item-library rule says held Orbs multiply **their Yaku**;
  the current canonical definition/scoring applies every held Orb. Reconcile
  this rules conflict before changing the multiplier. An optional user question
  now asks which rule to use; no answer has been assumed.
- Every upgrade now has controlled offer/paid-acquisition/repeat/new-run checks.
  Complete natural prerequisite reachability, persistence and actual power-effect
  coverage across all sixteen still require auditing. Unused legacy shop
  generators are not claimed to match the active ShopSession/TeaHouse path.

Other outstanding mechanics choices, Classic run persistence, newcomer testing,
native-speaker review and installed-PWA upgrade checks remain open.
