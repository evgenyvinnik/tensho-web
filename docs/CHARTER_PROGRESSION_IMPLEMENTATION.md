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

## Remaining Charter audit

Source inspection establishes these next requirements, not completion:

- Tea House and CharterSystem eligibility currently require the base purchase
  but do not consult the persistent achievement unlock. Enforcing that gate must
  accompany reachable/correct prerequisite counters, not permanently hide powers
  behind disconnected statistics.
- Omen Lens and Observatory describe use **from packs**, but their unlocks read
  all Seal/Orb uses without acquisition provenance.
- Liquidation's condition reads current-run Charter count; verify its intended
  relationship to the already tracked best-in-one-run count and base acquisition.
- Observatory's item-library rule says held Orbs multiply **their Yaku**;
  the current canonical definition/scoring applies every held Orb. Reconcile
  this rules conflict before changing the multiplier.
- Every upgrade still needs paid shop acquisition, repeat-purchase rejection,
  next-run base prerequisite, persistence and its actual effect checked. A data
  row or a direct `purchaseCharter` fixture alone is insufficient evidence.

Other outstanding mechanics choices, Classic run persistence, newcomer testing,
native-speaker review and installed-PWA upgrade checks remain open.
