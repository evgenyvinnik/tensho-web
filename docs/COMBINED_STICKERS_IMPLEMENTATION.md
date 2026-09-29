# Combined Decree stickers

September 29, 2026. Published checkpoint: **v1.0.260929-3**.

## Confirmed defect and rule

[Game mechanics, section 6d](GAME_MECHANICS.md) explicitly allows Rental alongside
Eternal or Perishable, never Eternal alongside Perishable. The live
`TeaHouseSystem` rolled these combinations but returned only the first sticker.
Rental could therefore disappear along with its purchase discount and ongoing
cost. Four failing-first tests reproduced dropped shop modifiers, shared copy
timers, and the save parser's rejection of a multi-sticker item.

## Implementation

- New shop Decrees carry `stickers`; legacy `sticker` remains readable without
  rewriting an existing save or consuming random numbers during restore.
- The live shop retains both rolls, the existing 4/7/8 thresholds and 30% roll
  chances. Its shop-stream draw schedule, including the old non-Rental cost draw,
  is preserved. Rental sets the base price to 1G; existing edition surcharges and
  discounts are unchanged, pending the separate pricing decision.
- Acquisition and duplication copy each timer independently. Eternal protects
  the physical copy against selling/destruction. Perishable expires using the
  existing round-start timing. Rental still charges after expiry; expiration
  disables active Decree effects, not the rental obligation.
- The real round cash-out charges both rented copies once and permits debt.
  Shop and owned items round-trip through the public save boundary; duplicate
  types, Eternal+Perishable, more than two stickers, and simultaneous legacy and
  array representations are rejected rather than silently losing effects.
- Shop cards show both badges and translated descriptions. Owned hover/focus/tap
  popups show both modifiers; face-down cards conceal them. Existing generated
  Decree artwork is reused; no new bitmap was needed for these rule labels.
- Native touch checks exposed first-paint overflow: three popups initially
  reached 590.75/577.25px in a 568px viewport before the animation-frame
  measurement corrected them. Layout-phase measurement now positions the
  mounted portal before paint, retaining ResizeObserver for later reflow.

## Correction to the prior checkpoint

The earlier expiry release description incorrectly attributed a save failure to
negative countdowns. The parser already accepts negative legacy counters via
`integer`. The all-catalog save regression passed unchanged with `-4` counters.
Clamping to zero is a countdown fix, not proof of a former save failure. Parser
compatibility was not tightened to justify that claim; the earlier ledger and
inline explanation have been corrected.

## Verification ledger

- Initial combined-sticker regressions: 4/4 failed before implementation.
- Focused live generation, acquisition, purchase/restore, existing identity and
  legacy save/UI coverage: 91/91 passed after implementation.
- Expanded combined-sticker and owned-card checks: 27/27 passed, including
  thresholds/draw counts, price surcharge, invalid combinations, real payout,
  debt, concealment, and independent copies.
- Strict TypeScript passed. Full lint: no errors, 211 existing warnings.
- Release-workflow tests: 13/13 passed.
- Full local run: 1,449/1,458 passed; nine tests in eight files exceeded the
  unchanged five-second deadline (696.57 seconds total). All eight files then
  passed **78/78 unchanged** in 11.98 seconds. Original failures are retained;
  this is not described as a full green run. Observed host load was about 87,
  which is a possible contributor, not a proven cause of every timeout.
- Initial browser run: 57/60 passed; the three actual popup-bound failures
  above were retained. A separate synchronous-measurement unit regression
  failed before repair; all **17/17** owned-popup unit checks passed afterward.
- Final desktop/touch browser verification: **60/60 passed** in 4.2 minutes,
  with no retries. Bounds assertions and timeouts were not relaxed. Spanish
  phone and Russian short-viewport screenshots were visually inspected.
- Final TypeScript and changed-component lint passed; the Pages-base production
  build passed (existing large-chunk and stale Browserslist warnings remain).
- The first local preview was started without the build's `/tensho-web/` base
  setting, so asset requests received HTML rather than JavaScript. The preview
  configuration was corrected without changing the product or test deadlines.
- Production-bundle desktop and touch checks then passed: real play, exact
  combined-sticker save/reload, expired Rental details, Eternal sale disabled,
  and once-only sale/reload of the other physical copy. No JavaScript page
  errors were observed.
- Local artifacts: `/tmp/tensho-combined-stickers-2PNdJs/`.

The tests initially miscounted shop RNG draws and omitted fixture tile IDs; these
test-construction errors were corrected by tracing the actual generation and
action paths. They are not reported as product bugs.

## Publication

- Implementation: `7de0706a74154ace18e8bcdc44491eb6c7454130` on `main`.
- Versioned build/tag: `e18c9f46ca05860c3932855dbfcdae2130662143`,
  `v1.0.260929-3`.
- [Independent CI and deployment](https://github.com/evgenyvinnik/tensho-web/actions/runs/36630390975)
  passed **1,459/1,459 tests in 125 files**, 13 release-workflow tests, build and
  Pages publication. This includes the final first-paint regression.
- Public `release.json`, remote tag and visible menu version match the built
  checkout. Fresh hosted desktop/touch checks passed real play, combined save
  restore, both modifier descriptions, protected Eternal sale and exact sale /
  reload of the expired Rental copy, without JavaScript page errors.
- Original failed local results remain recorded above; independent CI does not
  retroactively make those runs green. This release is not proof that the full
  project or all sticker semantics are complete.

## Still open, not silently changed

- Authored sticker eligibility exclusions (decaying/sell-triggered Decrees for
  Eternal, zero-start growers for Perishable) require a separate catalog audit.
- Section 6b says Perishable begins at tier 6; the stake table and live config say
  tier 7. Section 6d's 28% no-sticker claim differs from the existing independent
  rolls (34.3% before eligibility restrictions). This checkpoint does not retune
  either threshold or probability.
- Perishable's precise five-round lifetime, passive interactions, and all
  destructive Script combinations are not established by this targeted audit.
- Unused older shop/sticker helpers still represent single-sticker prototypes;
  this checkpoint repairs the live `TeaHouseSystem`/`DecreeSystem` path, not an
  assertion that every exported prototype implements the final rules.
- New array-bearing saves require this or a newer client. Old single-sticker
  saves remain accepted; backward loading in a pre-checkpoint client is not
  supported. Existing save-before-update/lease safeguards are unchanged.
- Human balance/fun evaluation, physical-device review and the outstanding
  broader mechanics decisions remain open.
