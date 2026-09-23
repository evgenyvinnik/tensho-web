# Classic run persistence

Updated: September 22, 2026.

**Status: implementation in progress. Classic autosave/resume is not enabled.**
The existing saved table/difficulty preference and Table Loop action journal are
separate features. Neither restores a Classic run after a browser reload.

## Verified prerequisite: faithful subsystem restoration

The September 22 checkpoint repairs existing serialization boundaries before
connecting them to durable saves:

- `RunRandom` exports a versioned JSON state with the original seed and exact
  cursors for initialized streams. Unused streams remain unused. Restoration
  validates the version, seed and stream cursors before replacing live state.
  Zero is a legitimate cursor, not a request to restart at seed 1. Existing
  seeded sequences and the nine-stream partition remain unchanged.
- Omen snapshots retain the interest-cap bonus, its remaining rounds and the
  private skip-reward random cursor. Constructing a restored Omen system no
  longer clears or notifies the live global Omen store. The store itself still
  needs to be included in the complete run snapshot; this change does not
  claim that active tags or history are independently persisted.
- Mandate snapshots retain their private random cursor, so face-down outcomes
  continue instead of reverting to ambient randomness. Existing serialized
  restrictions remain intact; the enclosing restore must reattach the shared
  Debuff system rather than activate the boss a second time.
- Tea House snapshots retain visit discounts and the original free-reroll
  allowance alongside the number already used. Offers are detached copies;
  previously purchased stock remains purchased. JSON wall tiles are rebuilt as
  real `Tile` instances with their existing IDs and modifiers. Live Charter
  eligibility can be supplied on restore; missing policy grants no upgrades.
- Blessing Pack snapshots detach nested contents and restore tile rewards as
  `Tile` instances. An open, unresolved pack retains its selected reward and
  can be resolved once; an already claimed pack remains resolved. Existing
  legacy handling still considers old opened packs without a resolution flag
  resolved, because those records cannot prove the rewards were never claimed.
- Older internal subsystem snapshots lacking the new fields default to no
  bonus/free rerolls and an unseeded private generator. This is API compatibility,
  **not** a guarantee that a future whole-run loader can reconstruct missing
  historic random positions.

These are internal typed codecs, not a validated public save-file format.
Only `RunRandom.fromState` currently accepts and validates unknown input.
Do not wire arbitrary local-storage JSON straight into the other subsystem
constructors without an enclosing schema and cross-state validation.

## Verification

- Initial seven regression cases all failed: interest duration, destructive
  Omen construction, skip RNG, Mandate RNG, free rerolls, visit discounts and
  shop Tile prototypes.
- After those fixes: **66/66** focused tests passed.
- Expanded continuation checks initially passed **52/53**. The failed fixture
  advanced two shops side-by-side while restoring only the shop stream; Seal
  definitions also consume the global consumables stream. The fixture now
  restores **all** run streams between continuations. It compares future
  definitions/prices, not newly generated opaque instance IDs. Existing stored
  offer and item IDs are preserved. No production RNG order was changed to
  make this comparison pass.
- Corrected focused run: **99/99** passed.
- Two additional pending-pack tests reproduced lost Tile prototypes and shared
  mutable contents (**12 passed, 2 failed**); both are repaired.
- Final full suite: **1,207/1,207 tests in 107 files**, 44.42 seconds.
- Strict TypeScript, targeted ESLint and `git diff --check` passed.
- Pages-base production/PWA build passed: 344 modules and 270 precached entries
  (67,794.28 KiB). Existing large-chunk and outdated Browserslist warnings remain.
- **18/18 browser checks** passed without retries, using one worker and a private
  port: Omen durations, stacked shop rewards, and pack purchase/use provenance
  in English/Spanish on desktop/touch. These exercise existing gameplay; they
  are **not** Classic save/reload tests.
- Browser artifacts: `/tmp/tensho-classic-save-3TxjgM/browser-results`.
  The isolated server was shut down before further repository edits.

No UI, translations, art, gameplay balance or deployment workflow is changed by
this prerequisite checkpoint. Existing generated artwork is retained. A new
illustration is not needed for internal serialization code.

## Remaining implementation before claiming Classic resume

1. Versioned authoritative `GameOrchestrator` snapshot, not the legacy
   `gameStore`: all tile zones/melds, captured table/stake rules, resources,
   round/Act/endless state, effects, inventory quotas and runtime identifiers.
2. `ShopSession` snapshot: open/closed state, exact offers, visit totals and the
   paid pending pack, with references linked to the restored pack system.
3. Include global Omen data, Fate Seal copy history, Debuff/Mandate links,
   meta-progression run context and instance-counter continuity. Restoring must
   not replay purchases, acquisition rewards, interest or run-start statistics.
4. Validate and stage the entire restore before mutating any live singleton or
   store. Audit the remaining subsystem codecs and reject unsupported/malformed
   saves without silently replacing a valid current run.
5. Durable writes at settled action/shop boundaries; storage failures and corrupt
   records must be visible and recoverable. Include Classic storage in the
   existing reset/rollback workflow and specify stale-tab write handling.
6. Localized resume/replace controls and correct gameplay/shop routing on reload.
   Visiting a menu or changing next-run setup must not overwrite the saved run.
7. End-to-end continuation tests for gameplay, bosses, consumables, pending packs,
   shop prices/rerolls, once-only meta rewards, victory/endless and reset failures,
   followed by actual desktop/touch reload tests and deployment verification.

Outstanding mechanics decisions in the other ledgers remain unapproved. Saving
the current rules must not silently choose a new rule for those questions.
