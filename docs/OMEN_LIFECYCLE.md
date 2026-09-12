# Earned Omens and round-scoped Seasons

Updated September 10, 2026. This is a verified implementation slice, not a
declaration that all Omen effects or the overall game are complete.

## Rules and defects corrected

`GAME_SYSTEMS.md` specifies that Seasons stack in draw order and expire after
the round. Two runtime paths violated that rule:

- Skipping advanced directly to a new deal without clearing the old Season
  stack or its Decay discard counter. Skip now clears that round-scoped state
  before initializing the incoming round. This does not award a win payout,
  interest, or shop visit. Pending Omen rewards and Season locks are separate
  state and remain available for their intended trigger.
- Drawing an Omen-locked Season called a force-set helper intended for fixtures
  and mandates. That helper erased earlier Seasons, reset discard penalties,
  and invented a new ID. The draw now appends through `SeasonSystem.addSeason`
  with the locked variant, retaining the physical tile ID, previous stack,
  active-first ordering, and discard count. The following draw is ordinary.
  Locked draws retain their previous non-corrupted behavior; this pass does
  not introduce a new corruption roll or retune its probabilities.

Boss skip availability also disagreed with execution: `canPerformAction` and
the available-action list reported a valid skip, while execution rejected it.
The action snapshot now includes the authoritative round type, and the shared
validator permits only Small/Large rounds. Rejected Boss skips do not award
Omens, increment skip counts, or advance the round.

## Acquisition evidence

[`OmenAcquisition.test.ts`](../src/game/OmenAcquisition.test.ts) contains eight
cases using real `processAction({ type: 'skip' })` calls and the ordinary seeded
Omen selection. No Omen is injected into these acquisition fixtures:

- Seed 3 earns a pending free pack while skipping clears old Decay state and
  produces neither payout nor shop access.
- Seed 13's second skip earns Ash and its Winter lock. A subsequent explicit
  draw fixture preserves an existing Autumn/Decay, appends the actual Spring
  tile as Winter, then appends an ordinary Summer. Dead-wall replacement order
  and replenishment are retained. Using the Season lock does not consume the
  separate Void Script protection.
- Seed 6 earns Fortune's immediate gold once, without a round-win payout.
- Seed 16 earns Rare+ on the second skip. Its fee is absent until a deliberate
  winning Boss-hand fixture enters the shop, then is charged once. The offer
  is Rare or Legendary, and reopening does not charge again.
- Boss skip availability/execution and Omen state agree on rejection.
- Seeds 4, 12, and 5 exercise Rivers, Abundance, and Precision respectively:
  next-round modifiers apply once, their tags are consumed, and a new run
  clears the modifiers. Precision's real starting hand has 16 tiles after
  removing starter Decrees from that fixture.

[`omen-acquisition.spec.ts`](../e2e/omen-acquisition.spec.ts) adds two scenarios
in both browser configurations at 320×568. The first clicks Skip twice, stages
a deliberate winning hand, and verifies Rare+ delivery and a single five-gold
fee through the actual shop route. The second clicks Skip to clear old Seasons,
earns Ash through the next Skip, then stages tiles and clicks Redraw to consume
the lock while retaining the stack, Decay counter, and Script protection.
Mobile staging uses touch input. A tutorial tip is dismissed through its own
control before the final screenshot; no gameplay handler is mocked.

These tests deliberately control the wall and winning hand to isolate the
lifecycle. They do not prove normal play reaches every Omen or completes a run.
The follow-up source audit found that the compact display exposed only the
first Season, its expansion handler rendered no details, and corruption labels
and rules could disagree. Those interface defects are now corrected in the
[Flora follow-up](FLORA_IMPLEMENTATION.md), together with actual Decay discard
tracking and secondary-effect Flower protection. Several underlying Season
powers remain unconnected and are explicitly listed there.

## Verification and limits

The initial five-case engine run reproduced three failures: Season leakage,
stack replacement, and Boss skip availability. They pass after the source fix.
The draw fixture was then corrected to follow the existing FIFO dead wall and
its end-of-wall replenishment; no replacement rules were changed to fit a test.

The complete pre-art unit checkpoint passed **735/735 in 66 files**. Strict
TypeScript, targeted lint/format, and the Pages-path production build passed.
The focused browser run passed **39/40**: all four new scenarios passed, while
an existing mobile copy-order test timed out during context teardown.

The full browser run completed **186/192** in 23 minutes. All new lifecycle
scenarios and the formerly timed-out mobile copy-order scenario passed. Six
early desktop scenarios timed out (menu readiness, table selector, localized
table names, selected-table propagation, first-move tutorial, and score
forecast). Several also exceeded context teardown; three traces could not be
completed as valid ZIP archives. Existing Chrome processes showed substantial
CPU use, but that is not proof of the cause. Assertions and timeouts were not
weakened. Diagnostics are preserved under
`/tmp/tensho-omen-lifecycle-tfmlCS/initial-focused-suite/` and `full-suite/`.

The [wrap-up ledger](IMPLEMENTATION_WRAP_UP.md) records subsequent artwork
integration and follow-up verification. A focused rerun cannot retroactively
turn this full-suite result into a pass. Live deployment, physical-device
testing, human enjoyment, edition-description conflicts, and the pending
Negative-tile/Fate-Seal lifetime choices remain separate requirements.

Subsequent current-source verification passed **739/739 unit tests in 68 files**
and the complete **198/198 browser suite without retries** (12.6 minutes),
including all four lifecycle checks and the six previously timed-out desktop
scenarios. See the wrap-up ledger for the intervening Gap Bridge example and
pack-motion corrections. This is a separate full-suite result, not a rewrite
of the earlier 186/192 outcome.
