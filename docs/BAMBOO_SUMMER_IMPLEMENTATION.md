# Bamboo shelters Summer

**October 7, 2026 — implementation checkpoint; production verification open.**

The user delegated coherent resolution of the remaining ambiguous rules. This
connects the existing four-terminal Bamboo/Summer interaction to actual paid
plays. It does not complete the remaining Flower and Season requirements.

## Rule and lifetime

- A paid tactical or complete play containing at least four physical suited 1s
  or 9s earns protection while Bamboo and a normal Summer are active.
- Restore all Summer-withheld tiles to the live wall's tail, in stored reservation
  order, once. Keep their identities, modifiers and ownership. No cloning, random
  draws or wall-template edits. An empty reserve still allows protection to be earned.
- Score first, then grant protection, then refill. Forecast and payment therefore
  see the same wall. Previews/staging cannot grant or spend this reward.
- Subsequent normal Summers retain their ×1.3 score multiplier but cannot shrink
  the wall again this round. Protection expires on win, final defeat or skip.
- Drought blocks earning the reward unless an active Eternal Garden overrides
  suppression. Later Drought does not undo an already-earned restoration, just
  as it does not rewind past draws. This is not general immunity to Drought.
- Count physical selected faces, not virtual tiles, scoring transformations or
  repeated scoring triggers. Honors are not terminals for this interaction.

The optional Flora inspector shows localized earned-protection text in all 13
languages. It does not add a mandatory recipe, another action button or an
upfront combination checklist. Normal Summer now has its own generated portrait;
corrupted Summer retains its distinct Season tile.

## Save compatibility

Current engine snapshots are version 2 and require the protection boolean.
Legacy version 1 snapshots may omit it and restore unprotected, without inventing
an earned reward. The next checkpoint writes version 2. Protected saves cannot
also contain a withheld reserve. Storage envelope format, key and write-lease
protocol are unchanged. An older app rejects version 2 rather than silently
discarding progress; downgrading a saved run is not supported.

## Verification ledger

Evidence directory: `/tmp/tensho-bamboo-summer-R85V9c`.

- Initial TypeScript check exposed a test fixture missing the new boolean; fixed.
- Initial focused run: 74 passes and one strict-field validation failure. Making
  the new field universally optional would hide corrupt current saves. Snapshot
  versioning fixes that while preserving the exhaustive required-field test.
- Focused follow-up: 218/218 in nine files; TypeScript passes.
- Full run before final round-end cleanup tests: 1,837/1,837 in 156 files.
- Round-end cleanup regressions pass: 16/16 Bamboo tests.
- Initial native batch: all eight cases reached and verified the earned reward
  and its reload, then failed to draw the second Summer. The fixture had assumed
  a redraw preserved wall order; redraw correctly reshuffles returned tiles.
  Use an initial discard replacement to preserve the authored second-Season
  position, retaining the later real redraw and all payout/persistence assertions.
- The next native attempt used a nonexistent discard-button selector. Stopped
  that diagnostic batch (six failed, two not run) after confirmed selector failures; use the actual
  pointer/touch drag-to-discard interaction, as in the existing Autumn journeys.
- Final full regression: 1,839/1,839 tests in 156 files. TypeScript/Pages build,
  13 release checks and lint pass (zero errors, 211 existing warnings).
- Final native Bamboo journeys: 8/8 desktop/320px touch, English/Spanish, quad
  and complete play. Screenshots reviewed: fan artwork, wrapped earned-state
  text, scrollable inspector and reachable close control.
- Broader native persistence batch: 11/12 pass; the Spanish short-phone
  save-and-leave journey hits its overall 30-second test deadline. No timeout
  increase or assertion removal; an unchanged isolated recheck is pending.
- Pages-base production batch: eight overall 30-second deadline failures at
  different stages (art inspection, dragging, staging, payment and later earned
  inspector). No failing scoring/persistence assertion was reached. This is not
  a passing production result. Host one-minute load was observed above 460;
  that is diagnostic context, not a substitute for a successful replay.
- Unchanged isolated production replay, persistence recheck and publication
  remain open. Do not mark this release or the overall project verified.

The browser journey starts from an actual legacy envelope, draws Summer and
Bamboo through normal replacement, stages and pays a terminal quad or full hand,
checks preview/payment equality and physical reserve restoration, reloads,
draws another Summer, inspects earned protection without mutating the run, and
starts the next round. English and Spanish are exercised on desktop and touch.

## Artwork provenance

Mode: **built-in image generation**, transparent-background generation. The tool
does not expose an exact model selector or ID; no unverified model-version claim.
Image generation skill used to create an original raster inventory portrait.

- Source: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-8d9388c1-55c4-40b6-a224-fcb5bac91339.png`
- Runtime: `public/assets/illustrations/summer-fan.webp`, 512×512 with alpha,
  71,448 bytes; mechanically converted with `cwebp -q 85 -resize 512 512`.
- SHA-256: `f62c7377c2bbf7f2031dc57266907955270d274b9330e87a5b870553cbd50dde`.

Exact generation prompt:

```text
Use case: stylized-concept
Asset type: transparent Summer Season portrait for Tensho, an East Asian mahjong roguelike with hand-painted jade, antique-gold and ivory botanical illustrations.
Primary request: one elegant open folding fan made of warm ivory silk and burnished gold ribs, decorated with a simple painted golden summer sun and a graceful jade-green bamboo sprig. A small living bamboo leaf cluster nestles beside the fan. Premium painterly fantasy game-object illustration, restrained gilding, rich lacquer-like jade shadows, warm summer light.
Composition: square canvas; complete compact centered object, slight three-quarter angle, generous transparent margins, strong readable silhouette at 48 pixels. No clipping.
Background: genuinely transparent alpha with clean edges, no ground plane, no external drop shadow.
Constraints: no text, letters, numerals, calligraphy, labels, mahjong tile faces, people, scenery, frame, logo or watermark. This is a single finished inventory-style illustration, not a UI mockup.
```

## Still open

Orchid/Spring, Plum/Autumn, advanced Flower mutations/catalysts, Frostbite's
fractional-payout draft, remaining item-rule requirements, organic strategy
balance and human newcomer/fun validation remain separate work.
