# Optional illustrated hand workshop

October 8, 2026. Player-facing follow-up to the
[batch-planning investigation](CLASSIC_BATCH_HAND_PLANNING.md).

## Implemented behavior

The rack has an explicit **Build a hand** control. Nothing opens automatically.
The workshop displays real tile images in separate keep/exchange panels, the
ordinary target form, the retained shape's minimum remaining tile distance, and
one redraw's actual allowance cost. An optional disclosure shows tile types that
would improve the retained shape, explicitly not wall inventory, probabilities,
predicted draws or a promise of completion.

Selecting the proposal only stages those tiles, replacing any prior staged
selection. The existing Redraw button is the separate spending step. The engine
recomputes the proposal before staging, and normal action validation still runs
at commitment. Opening, closing, and staging never consume a resource. Mobile
now says Redraw, not Draw, matching the interpolated guide instruction.

The bounded search is shared with the analysis adapter rather than copied. It
runs only while explicitly open, not on idle gameplay renders. The live wrapper
offers **redraws only**, unlike the experiment's discard-first policy. Therefore
the previous simulated win/completion gains cannot be attributed to this UI.
It prices present legal scoring options to avoid recommending exchange over a
known round clear, and refuses to exchange an already complete legal hand.

## Boundaries and privacy

- Requires an ordinary fourteen-tile concealed rack with no declared melds.
- Hidden faces suppress all plan details before score/shape inspection.
- Active altered grammar, structural Flower mutations, Winter legality,
  incompatible rack or Boss sizes receive a localized unsupported explanation.
- Locked tiles are retained; every proposed batch uses the engine validator,
  including replacement-chain capacity and exhausted redraw allowances.
- No wall faces/order, seed or RNG is supplied to candidate ranking. Validation
  can reject an impossible replacement, but cannot improve a candidate's rank.
- The proposal optimizes ordinary shape distance and breadth, not future score,
  modified grammar, draw effects or the best use of every resource. The visible
  warning tells players to compare scoring options and that chasing a full hand
  can lose the round. Game balance and confirmed mechanics remain unchanged.

All nineteen new strings exist in all thirteen locales, with interpolation
integrity tests. Native-speaker review is not claimed. Existing tile illustrations
and the generated guidebook are reused: exact tile identities are teaching content,
not new raster diagrams. The standard animated Popup supplies reduced-motion
support, focus trapping/restoration and one scroll area; controls are at least
44px, and tile rows wrap.

## Verification ledger

Evidence: `/tmp/tensho-hand-builder-Rob6DP`.

- First focused attempt: 53 passed, one failed. The test mistakenly activated
  Spring rather than Winter and unlocked Flower mutations without owning their
  Flowers. Corrected fixtures exercise the actual active permissions. Typecheck
  also required the explicit mutable test-state cast used by engine fixtures.
- Corrected focused tests: **54/54**. Covers immutable run/RNG/events, actual
  two-tile exchange, unchanged advice after hidden-wall replacement, hidden
  faces, locks, replacement shortages, altered rules, complete/clearing hands,
  unusual rack sizes, UI callbacks and thirteen-language strings.
- Full regression: **2,664/2,664 in 192 files**. Typecheck/build pass; lint has
  zero errors and the existing 211 warnings; all thirteen release tests pass.
- First native browser attempt: **six failures**, all requesting lazy-loaded
  images inside a closed disclosure. The check now opens that section before
  asserting image loading; no timeout or retry allowance changed.
- Corrected native workshop journeys: **6/6**, English/Spanish/Russian on
  desktop and 320px touch. Verifies real image loading, localized resource cost,
  horizontal geometry, close/focus restoration, identical saved state before
  confirmation, exact staged IDs, actual one-charge exchange and exact reload.
  Desktop intro and Russian phone exchange screenshots were visually reviewed.
- Existing resource journeys: **6/6**, including actual Purple Seal reward,
  exhaustion, locked tiles and bonus-only replacement shortage.
- Native privacy journeys: **2/2**. Hiding a face while the workshop is already
  open removes candidates and the selection control immediately; Escape restores
  focus. No tile images remain in the dialog, only its decorative guidebook.
- Initial production replay: **six failures before gameplay loaded**. The local
  preview was started without the build's `/tensho-web/` base; the requested JS
  asset returned HTML. Restarting the preview with the matching base fixes the
  configuration, not application code. Corrected production replay: **6/6**,
  using the saved native fixture with no source-module imports or injected logic.
- Read-only timing sample: forty ordinary seeded run starts retain byte-equal
  snapshots after planning; 32 return a redraw proposal and eight explain an
  unsupported state. Mean engine call 62.0ms, maximum 185.8ms on this host.
  This is neither physical-phone latency nor gameplay outcome/fun evidence.

Publication checks remain a separate gate. Whole-project
completion, broader balance and newcomer enjoyment remain unproven.

## Visual identity correction discovered during review

The first workshop screenshots exposed a pre-existing shared asset defect: engine
Dragon ranks are White/Green/Red, but the supplied files are Red/Green/White.
`getTileImagePath` now explicitly maps those ranks to files 3/2/1. No images,
tile identities, saved ranks, scoring or rules are rewritten. All callers of the
shared helper, including tiles, teaching examples and reward art, receive the fix.

All three Dragon sources and all four Wind sources were visually inspected.
Winds already match East/South/West/North and retain their ordering. Flower and
Season sources were also inspected and are unchanged. Three SHA-256 assertions
pin the reviewed Dragon pixels to their engine identities; four Wind mapping
assertions guard against applying the Dragon remap to other families. The focused
asset/TileImage set passes **47/47**. The workshop browser test now asserts the
localized White Dragon uses file 3 and Red Dragon file 1, not merely that a PNG
loads. All **six native and six production** journeys pass again, and the updated
desktop screenshot was visually checked. This closes the observed swap, not a
claim that every source image has received a complete semantic audit.
The final full regression passes **2,671/2,671 in 192 files**. Strict build and
targeted lint pass. These follow-up artifacts have the `dragon-` prefix in the
same evidence directory; no prior failure or screenshot was overwritten.

## Initial publication

Workshop source `2dc190b1ca4288cbf696fe3156efc324059800da` was independently built
and deployed by [workflow 37751444890](https://github.com/evgenyvinnik/tensho-web/actions/runs/37751444890),
including **2,664/2,664 CI tests**. Version **1.0.261008-16** has tag/built commit
`c96dd64700c93c91af5ab7172a4dc31b729d91a5`, matching the hosted manifest.
This initial version still contains the Dragon artwork swap; the corrective
follow-up and its hosted verification are recorded separately.
