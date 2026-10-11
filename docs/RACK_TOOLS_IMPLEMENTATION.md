# Reachable rack tools

October 11, 2026. UI backlog item 6; no engine, balance or save-format changes.

Below 640px, the rack keeps its guidebook and a 44px More control visible.
Build a hand and Riichi live in an inline disclosure, not a horizontal scroller
or another modal. Above the breakpoint the same controls remain inline.
Opening the disclosure neither computes a Riichi shape search nor spends
resources. The existing tool dialogs retain explicit confirmation, keyboard
dismissal and focus return to their trigger inside the still-open disclosure.
The More control exposes its expanded state, controls ID and translated name
in all thirteen locales. Long status and action text wraps within its bounds.
The discard target retains its separate fixed-width column.

The disclosure intentionally stays open after inspecting a tool, so returning
focus never lands on a hidden button. Using a tool on desktop also remembers
that expanded state, preserving its return-focus target if the window narrows.
It is local UI state and resets on reload; resizing does not remount the tool
controller or change the saved run.

## New artwork

Mode: built-in image generation, transparent output. The tool exposes no model
selector or verified model identifier, so no named-model claim is made.
The imagegen skill guided alpha preservation, visual inspection, and saving
the runtime asset into the project rather than referencing its external original.

Runtime file: `public/assets/illustrations/table-tools.webp`, 512×512 alpha WebP,
42,546 bytes, mechanically resized/compressed with `cwebp -q 85 -resize 512 512`.
SHA-256: `706ee8de68bad76aaafd4a95ae0242b8cc612ab5be264da7c7b319a15352a0a4`.
It is decorative (empty alt), displayed only in the expanded phone controls,
and lazy-loaded. The functional More glyph remains a crisp SVG.

Original:
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-7bf6e65b-f8d3-4d04-ad19-b368d2026c8d.png`.

Exact generation prompt:

> Use case: stylized-concept. Asset type: small illustrated planning tray in the mobile table-tools disclosure of Tensho, a mahjong roguelike. Primary request: one shallow emerald lacquer planning tray holding three ivory mahjong tiles and a loosely rolled ivory planning scroll with antique-gold end caps. Style: premium hand-painted East Asian fantasy board-game object illustration, softly shaded dimensional materials, rich forest green, warm ivory and antique gold, delicate gilded corner detailing, matching an ornate green-and-gold guidebook. Composition: one complete centered isolated still-life, square canvas, modest transparent padding, bold simple silhouette readable at 64–96 pixels. Tiles show simple green circular pips only. Genuine transparent alpha background. No scene, floor, pedestal, external frame, people, lettering, numbers, calligraphy, logo or watermark.

## Verification

Evidence root: `/tmp/tensho-rack-tools-vtGi59`. Browser/release-build verification
uses an isolated source snapshot excluding the unrelated pending `src/index.css`
changes; the full unit suite runs in the working repository.
Focused component tests pass 70/70 (RackTools, PlaySurface, RiichiControl).
The full unit suite passes **2,911/2,911 in 207 files**, targeted lint is clean,
and all thirteen deployment-versioning tests pass. Publication checks remain
pending at this point.

The initial browser batch retained 24 passes and 30 failures in `native.log`:
26 new cases incorrectly compared save ownership/revision/timestamp across
reload, two old Riichi cases needed to reopen the new disclosure after reload,
and two discard geometry cases found a real 5px target shift during text-spacing
stress. Reload assertions now compare every engine snapshot field while keeping
the exact raw-save comparison during inspection. Riichi cases follow the new
interaction without changing payment assertions. The status badge now spans
the mobile header width and its counter row reserves 44px, preventing the
text-driven geometry change. The discard tolerances have not been relaxed.

The second batch passes 53/54, retaining a Russian 5px text-spacing failure.
Direct geometry inspection proves the header itself no longer changes height:
the browser instead scroll-anchors to its moving counter text. Excluding the
header from scroll anchoring fixes that jump. The follow-up `anchored.log`
passes all 64 cases: 12 discard geometry checks, 26 newcomer/book journeys and
26 all-locale tools journeys. The Russian phone rendering and generated runtime
artwork were inspected visually. The focus-on-resize refinement is subsequently
covered by the expanded tools journeys.

The final focus-on-resize/keyboard batch passes **26/26** (`rotation.log`).
The isolated Pages-base production build passes (`release-build.log`), with
437 precached entries / **37,885,471 bytes**, below the 40 MiB ceiling. The
working-tree build in `verified-build.log` also passes but includes the pending
CSS; it is not the release-browser artifact. Production uses the isolated build.

All **64 production-browser checks pass** (`production.log`) with no retries:
all-locale tools, keyboard/rotation/focus return, unchanged inspection/reload,
decoded new artwork, newcomer guide discovery, and discard geometry stress.
All 23 changed runtime/test/asset files match the verified snapshot byte-for-byte.
The final code also passes all **16 native paid-tool journeys** (`paid-tools.log`):
hand-builder hidden-face guards, real staging/exchanges, Riichi payment,
completion/abandonment, and exact resource-state reload on desktop and touch.
