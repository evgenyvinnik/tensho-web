# Doppelganger: a visible, seeded round target

October 7, 2026 local / October 8 UTC. **Published and hosted-verified as
v1.0.261008-7.** Full local and independent CI regression pass 2,133/2,133;
native, production and hosted EN/ES desktop/touch journeys each pass 4/4.
This is a mechanics checkpoint, not whole-project completion.

## Decision and loop

The catalog promised a random copied Decree, but the runtime used the copier's
inventory index modulo the number of other items. That was deterministic position
selection, not randomness. The user authorized resolving remaining open rules;
the earlier question about target-refresh timing is superseded by this decision.

- On acquisition and at each round start, choose one other non-copy Decree from
  the owned inventory, excluding already-debuffed items. Choose uniformly from
  physical instances, so duplicate catalog items remain distinct candidates.
- Use the separate seeded `decreeCopies` stream. Shop rarity, wall, packs and
  other random streams are not advanced by the choice. Repeating a target on a
  later round is valid; there is no hidden no-repeat guarantee.
- Keep that physical target for the round. Preview, scoring queries, hovering,
  reordering, another acquisition and reload do not reroll it. Selling/removing
  the target leaves the copy inactive until the next round. Temporary target or
  copier suppression does not jump to a different item.
- If no candidate exists yet, wait without consuming RNG and choose when the
  first eligible Decree arrives. A newly acquired duplicate Doppelganger gets
  its own draw; it does not inherit its source instance's target.
- Refresh before incoming-round resource initialization. The existing one-level
  copy resolver applies the chosen effects and their costs. Source editions and
  copy chains are not duplicated. This does not implement every still-open
  consumed-power lifecycle elsewhere in the copy system.

The owned portrait's existing hover/focus/tap popover shows the localized target
name and physical slot, waiting/missing/suppressed states, and the copy rules.
Game inventory and Tea House inventory both provide the real owned list. Amber
Acorn hides both the portrait and target details. The same new portrait mapping
also feeds shop/catalog/archive artwork consumers. Thirteen locales have authored
rules and feedback; the shared item-text helper supplies the description even
for locale catalogs that previously omitted Doppelganger.

## Persistence

`OwnedDecree.randomCopyTargetId` stores the physical ID or null. The save boundary
validates its ID shape, allocation range, random-copy owner and non-self targeting.
A removed, previously allocated target remains valid and inactive; it must not be
silently replaced during restoration. RNG state includes the independently saved
stream. No preview or restore consumes RNG.

Legacy snapshots without the target field retain their former positional target
for the current round, including its old one-level-copy behavior. IDs are assigned
first using existing migration. The next round uses the new seeded rule. This
preserves an old hand's effective resources instead of changing it on reload.
Legacy snapshots are not evidence that the former selector was actually random.

## Verification ledger

- Initial focused run: **11/16**. Five new-test failures were fixture/API errors:
  Wide Grip grants +1 rack tile, not +2; the public query is `getRuleModification`,
  not an invented plural method. Type checking also caught missing explicit
  mutable-state typing and a possibly absent equation in the test. These were
  corrected without changing production resource values or weakening assertions.
- Expanded focused run: **85/85 in five files**. Nineteen new engine/integration
  cases cover seeded distribution, independent cursor advancement, preview purity,
  acquisition/round timing, empty candidates, sales, duplicate IDs, suppression,
  legacy migration, malformed saves, exact validated restore, paid score and real
  incoming rack resources. Fourteen UI/locale cases cover all thirteen locales
  and hidden-art/details privacy; one portrait mapping case is added.
- Strict TypeScript and full lint pass (zero errors / 211 existing warnings),
  and all thirteen release checks pass. Full regression passes **2,133/2,133 in
  173 files**, 96.3 seconds, two workers and unchanged deadlines.
- Pages-base production build passes: 431 precache entries / 70,889.26 KiB.
  Existing large-chunk and stale-Browserslist warnings remain; the new asset
  does not reduce the complete illustrated/audio offline installation cost.
- Browser journeys use a deliberately constructed valid v2 save, not a claim
  about organic rarity or enjoyment. They must inspect the real portrait/target,
  pay a forecasted hand, reload the shop exactly, enter the next round, verify
  the seeded target and actual rack size, then reload exactly again. Production
  and hosted replays use the native fixture without importing production internals.
- First native journeys pass **4/4**, 30.7 seconds. That seed legally chose the
  same target next round. A stronger deterministic seed-2 fixture additionally
  requires an actual Ancient Scroll → Wide Grip change and 11 → 14 rack growth;
  it passes **4/4**, 18.8 seconds. EN/ES desktop and 320×568 touch are covered.
  All browser runs use original deadlines and zero retries. The short-phone
  Spanish popover and optimized artwork were visually inspected.
- Production replay passes **4/4**, 15.8 seconds, using the stronger native v2 fixture and
  only public UI/save behavior. Final hosted publication evidence follows below.

Evidence root: `/tmp/tensho-doppelganger-39BYzN`.

## Published release — v1.0.261008-7

- Implementation: `7ea136fb399b5edc79d2ee5661213e6b3a3e224c`, pushed to main.
- Version bot/tag/build checkout: `324f65f201d64cdd4c0f9db0852f4d088f39df2b`.
- [Workflow 37721536452](https://github.com/evgenyvinnik/tensho-web/actions/runs/37721536452)
  independently passes **2,133/2,133 in 173 files**, thirteen release checks,
  production build and Pages deployment without a job retry. Build job
  113130067482; deploy job 113130788960. Local main fast-forwarded to the bot commit.
- Public release manifest, Git tag and runtime version agree; entry
  `/tensho-web/assets/index-BOp7N6h7.js`. Hosted portrait is exactly 64,878 bytes
  with the checksum below. Evidence: `provenance.json`, `ci.log`.
- Hosted journeys pass **4/4**, 16.4 seconds, no retries/skips/flakes: EN/ES
  desktop and 320×568 touch. They verify real portrait decoding, localized
  target details, +345 forecast/payment, exact shop reload, next-round Ancient
  Scroll → Wide Grip targeting and 11 → 14 rack size, then exact reload again.
  No page errors or horizontal overflow. Evidence: `hosted.json` and
  `hosted-artifacts`; native and production evidence remains alongside it.
- Both temporary verification servers are stopped. The pre-existing port 4173
  server was left untouched. Earlier fixture-test failures remain recorded above.

## Artwork provenance

Generated through the built-in image tool using the imagegen skill. The tool does
not expose an exact model ID/selector; the requested latest-model identity cannot
be independently verified, so no specific model claim is made.

- Original retained at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-bf674b60-91cc-4044-af92-504f5ef0aa02.png`.
- Project asset: `public/assets/illustrations/decrees/doppelganger.webp`,
  512×512 with alpha, 64,878 bytes. Mechanical cwebp quality-85 conversion preserves
  transparency. Original and optimized output visually inspected; no old art replaced.
- SHA-256: `e71707d2b59cd768ff363e8d40a62f0a15c2bd3d8a6e1abee45e75b201a9c6b5`.

Final prompt:

> Use case: stylized-concept. Asset type: transparent inventory portrait for Tensho's Doppelganger Decree. Primary request: a distinct ornate illustrated scroll about borrowing another Decree's power. Subject: a cream parchment hanging scroll with deep jade rollers, antique gold end caps, dark indigo silk edging and small red wax seal. The center shows two matching ivory theatrical masks facing each other across an oval dark-jade mirror, one solid and one luminous translucent jade reflection, linked by a single golden arc. Style: polished hand-painted fantasy game item, tactile gold filigree and warm parchment, coherent with Tensho's jade/gold/red illustrated scrolls. Composition: centered square cutout, complete compact scroll silhouette, ten percent clear padding, recognizable at 56px. Lighting: warm gold rim highlights, calm mysterious green glow. Constraints: genuinely transparent background; no scene, no words, letters or numbers, no watermark; do not paint a checkerboard; no decorative border outside the scroll.

Broader consumed-copy powers, remaining item wording, observed newcomer strategy
and fun, native-language/physical-device review and offline installation size
remain open. Previously confirmed Merchant, Rental and Cerulean Bell rules remain.
