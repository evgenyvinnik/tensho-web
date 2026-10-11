# UI improvement backlog

October 11, 2026. Handoff list, not a claim that any item is done. It follows
the [Classic layout simplification](LAYOUT_SIMPLIFICATION.md), which made play
fit MacBook, iPad and phone screens, unified the score line, turned tips into a
popup on wider screens, removed duplicated counters and added felt colours.

Each item names where to work and what "done" means. Priorities: **P1**
visibly wrong or blocks newcomers, **P2** friction, **P3** polish. Keep the
existing contracts: 44px touch targets, all thirteen locales for new copy,
reduced motion respected, no hover-only information.

## P1 — visibly wrong or blocks newcomers

**Release verification finding (October 11):** the combined production batch
passed 27/28 checks, but Russian at 320×568 with fonts held failed before dragging:
after scrolling to the last rack tile, the discard target had viewport ratio 0.
The retained trace shows group labels widening the grouped rack and its header
scrolling out of view. This was a layout defect, not a passed drag test or
merely a lazy-image check. Evidence:
`/tmp/tensho-table-save-iQpNr5/integrated-production/discard-layout-discard-sta-8cb50-red-during-font-loading-ru--mobile-chrome/trace.zip`.
The [tap-discard checkpoint](TAP_DISCARD_IMPLEMENTATION.md) reproduces its exact
seed and fixes group-label width and selection reflow. All 38 final native
geometry/resource and all-locale tap/keyboard checks pass, as do the same 38
production-browser checks and 14 native tutorial/hand-builder checks. The fix is
published and reverified in v1.0.261011-5's 64 hosted checks; arbitrary enlarged
racks and real devices remain open.

1. **Action buttons break words on phones.** At 320–360px, "Saltar" and
   "RECAMBIAR" wrap mid-word ("Salt/ar", "RECA/MBIA/R"). Use an icon plus a
   short label, or let Skip/Redraw become icon buttons with accessible names
   below 400px. Files: `src/components/gameplay/ActionBar.tsx`, the
   `max-width: 359px` block in `src/index.css`. Done when no action label
   breaks inside a word in any locale at 320px.
   **Implemented for secondary controls:** fixed icon slots below 640px, localized
   accessible names and wide-screen text. Primary restriction copy/rare power
   combinations remain under review; this is not an all-state closure.

2. **Discarding needs a tap path.** Discard is drag-only (drop on 🗑). On
   touch that is hard to discover and to do. Add "Discard" to the action bar
   when exactly one tile is selected, sharing the drag path's
   `onTileDiscard`. Files: `ActionBar.tsx`, `GameplayScreen.tsx`. Done when a
   tile can be discarded with taps only, and the discard count still shows
   once (the 🗑 zone).
   **Implemented:** a stable Discard action is enabled for exactly one legal
   tile, sharing the drag handler and engine checks. Native tests cover all
   thirteen locales, keyboard/touch, payment and reload; see the checkpoint.

3. **Wall breakdown is English-only.** The Wall dialog's suit names come from
   `getSuitName` and its tile titles say "remaining" in English. Localize them
   and delete the now-unused non-compact `WallDisplay` branch (hard-coded
   "Wall" / "tiles remaining"). File: `src/components/gameplay/WallDisplay.tsx`.
   **Published and verified in v1.0.261011-5:** full localized suit headings and
   tile-name/count captions, readable existing artwork and separate red-five
   counts replace the two old branches. See [wall readability](WALL_READABILITY_IMPLEMENTATION.md).

4. **Tip copy no longer matches the screen.** The first-move tip says "Learn
   the tiles opens the visual guide", but phones show that button as a book
   icon only. Show the label next to the icon in the rack header when the tip
   is open, or change the copy to refer to the book icon (thirteen locales).
   Files: `src/config/progressiveTutorialHints.ts`, `PlaySurface.tsx`.
   **Published and verified in v1.0.261011-6:** both first-move lessons refer
   to the visible book icon in all thirteen locales, without resetting dismissed
   lessons. [Evidence](QUIET_INVENTORY_IMPLEMENTATION.md).

5. **Empty consumables take a third of the inventory rail.** Three "×0"
   chips sit there for the whole first Act. Hide a consumable type while its
   count is 0 (or fold all three into one "Items 0" chip that opens a dialog).
   File: `src/components/gameplay/ConsumablesBar.tsx`.
   **Published and verified in v1.0.261011-6:** zero-count families occupy no
   space; owned families keep their illustrated controls and accessible counts.
   Last-item use returns focus to the Wall control if its original trigger is
   gone. [Evidence](QUIET_INVENTORY_IMPLEMENTATION.md).

## P2 — friction

6. **Secondary rack buttons scroll away on phones.** "Build a hand" and
   "Riichi pledge" sit in a sideways-scrolling header row. Move them behind a
   single "⋯ More" button (menu or sheet) below 640px; keep them inline above.
   File: `src/components/gameplay/PlaySurface.tsx` (rack header).
   **Published in v1.0.261011-7:** one localized 44px More
   disclosure replaces sideways scrolling below 640px; the book remains visible.
   Existing dialogs retain confirmation and focus return, including after resize.
   New planning-tray art accompanies the mobile tools. [Evidence](RACK_TOOLS_IMPLEMENTATION.md).
   The first hosted batch has one unexplained Space-to-close failure; sixteen
   focused repeats and a final 26-case all-locale traced recheck pass unchanged.
   Retain that diagnostic limit; do not call it a proven keyboard root-cause fix.

7. **Coach chips truncate on phones** ("Build towar… +59"). Shorter copy for
   the chip title ("Build a Sequence"), keeping the long sentence as the
   tooltip/description. Files: `CoachPanel.tsx`, locale `gameplay.coach.*`.
   **Published and verified in v1.0.261011-8:** short localized labels and a
   tap/keyboard comparison show the actual tile artwork and exact scores.
   Corrected the misleading “keep/build toward” promise; both suggestions are
   selections to play, not predictions. All 100 final development-browser and 90
   production checks pass, along with 52 hosted coach/rack-tool journeys and all
   2,931 tests in independent CI. [Evidence](COACH_COMPARISON_IMPLEMENTATION.md).

8. **Score bar is two rows on phones.** Fold "N to clear" into the progress
   bar's label and drop the separate SCORE / TARGET captions below 400px so
   score, bar and target fit one row above the forecast line. File:
   `src/components/gameplay/ScorePanel.tsx`. Keep `.game-score-remaining` and
   the progress bar's `aria-valuetext`.

9. **Long group labels widen groups.** Russian "ПОСЛЕДОВАТЕЛЬНОСТЬ +30" makes a
   three-tile group wider than its tiles. Allow the label to wrap to two short
   lines or use a compact per-locale abbreviation key
   (`gameplay.groups.short.*`). File: `PlaySurface.tsx`, locales.
   **Implemented:** physical tile widths bound each group; two label lines are
   reserved and partial staging keeps the same group box and blank tile slots.
   Thirteen-locale native checks verify label bounds and unchanged positions.
   The integrated sub-360px CSS introduced a 2px/4px gap mismatch and removed
   compact spacing while staging. The [interaction recovery](TILE_INTERACTION_IMPLEMENTATION.md)
   shares one responsive gap value and uses a persistent layout marker; all 38
   final tap/keyboard-discard and drag-geometry checks pass. Published in
   v1.0.261011-12; the broader production-browser gate remains in verification.

10. **Felt colours stop at the play screen.** Apply `feltPalette` to the Tea
    House, Game Over and the menu's Run Setup preview (a swatch of the cloth
    next to the table name). Files: `ShopScreen.tsx`, `GameOverScreen.tsx`,
    `src/components/menu/*`, `src/utils/feltPalette.ts`.

11. **Shop tip as a popup.** Play now floats tips on wider screens; the shop
    still pushes items down. Float it over the cash-out banner (not the
    items) from 640px up. Files: `ShopScreen.tsx`, `ProgressiveHint.tsx`.
    Update `e2e/tutorial-layout.spec.ts` ("shop hint occupies its own row").
    **Published in v1.0.261011-9 with a revised interaction:** a collapsed, in-flow disclosure
    on both sizes keeps guidance optional without covering merchandise. No timer
    closes reading material. The full lesson expands only on request. See the
    [compact Tea House checkpoint](SHOP_DENSITY_IMPLEMENTATION.md).

12. **Shop density.** On a phone the cash-out banner, tip and build panel
    still precede the first item. Collapse the cash-out to one line after its
    entrance animation (details in a disclosure), and keep "Continue" sticky.
    Files: `RoundCashOutBanner.tsx`, `ShopBuildPanel.tsx`.
    **Published and verified in v1.0.261011-9:** illustrated exact-total
    receipt and phone build disclosures replace tall initial panels. Continue
    remains pinned. Details open immediately on request rather than collapsing
    during reading. All 68 final native, 26 production and 26 hosted browser
    checks pass, plus all 2,947 tests locally and in CI. The first card is partly
    visible on short phones; scrolling is still needed for the full offer. See
    the checkpoint for retained diagnostic failures and verification limits.
    Reverified with all 26 shop journeys on the combined v1.0.261011-10 release;
    its CI passes all 2,951 tests. This does not close the gameplay failures below.

13. **Dragons have no index.** Suited tiles show 1–9 and winds carry letters,
    but White/Green/Red Dragons have no hint for newcomers. Add a small
    coloured initial (W/G/R, localized) through the same `.tile-index`
    generated-content badge. File: `src/components/tiles/TileImage.tsx`.
    **Local follow-up, not published:** all thirteen locales now supply distinct
    Dragon hints, controlled by the existing setting and suppressed on hidden
    faces. The optional illustrated guide pairs all three existing tile images
    with full localized names. Short Thai/Tagalog words avoid ambiguous initials.
    The 56 focused tile/locale tests and five guide tests pass; TypeScript and
    targeted lint pass. The first eight browser journeys pass five: English
    desktop times out waiting for initial save readiness, while both Tagalog
    cases expose a real badge-width defect (31.5px text in 25.86px content).
    Reduced padding and a wider tile-contained badge correct that fit without
    shrinking the font. All 26 desktop/phone journeys then pass without retries,
    but screenshot review reveals a Tagalog caption splitting "Berdeng" mid-word.
    A new word-boundary assertion reproduces that exact defect. The guide now
    uses image-and-name rows on phones and three columns on desktop. The final
    local batch reports 16 passes and one initial-save-readiness timeout before
    ending with signal exit 143; it is incomplete, not a green 26-case run.
    Both Thai/Tagalog phone rechecks pass unchanged (2/2), and their screenshots
    confirm readable badges, whole-word captions and a visible close control.
    A subsequent focused unit run passes 58/61,
    with three existing cases timing out at 5 seconds; these are not clearance.
    Original evidence remains in `/tmp/tensho-interaction-IE5a7E/dragon-native`,
    `dragon-final`, `dragon-word-wrap`, `dragon-rows` and `dragon-rows-focused`;
    no assertion or timeout was relaxed. TypeScript, targeted lint and all four
    browser-runner subprocess checks pass. Candidate `73ee4c1` is on the
    verification branch; independent CI `38175717641` succeeds, including its
    production-browser step. Detailed log download subsequently returns HTTP
    403, so no newly extracted per-test total is claimed here. The broader core
    acceptance pass exposes a separate top-row corner overflow; publication is
    held for that fix. Native-speaker review is not claimed.

14. **Table Loop wastes desktop space.** Its rack uses small fixed tiles on a
    mostly empty 1440×800 screen. Reuse `fitHandTileSize` for `RackRow`.
    Files: `src/components/tableloop/RackRow.tsx`, `TableLoopScreen.tsx`.
    **Implemented:** Table Loop Mode now uses the classic table's felt,
    artwork, frame, top bar, score panel and buttons; the rack is fitted with
    `useHandTileSize` and pinned above the actions while the board scrolls; each
    slot sizes its tiles to its measured width. See
    [Table Loop Mode polish](LAYOUT_SIMPLIFICATION.md#third-pass-modes-flowers-and-table-loop-user-review).

15. **Audit the remaining screens at 1440×800, 768×1024 and 390×664**: Codex,
    Collection, Achievements, Settings, Game Over. Same contract as play: no
    page-level horizontal overflow, primary action visible without scrolling.

## P3 — polish

- **16-tile hands at 320×568.** Opening the board on the hand (done) shows
  the whole rack for 14-tile hands; 16-tile hands need four rows there.
  Fitting six tiles per row would need ~14px more rack width (narrower frame
  and padding below 360px, tighter group spacing) without going below 44px
  targets. Files: `src/index.css`, `PlaySurface.tsx`.
  **Partly implemented:** below 360px the frame margin, rack padding and group
  spacing tighten (`src/index.css`); 10 of 10 random 320×568 hands showed the
  whole rack. A fully grouped 16-tile complete hand still overflows because of
  its yaku badges.

16. **Menu hierarchy.** "TABLE LOOP (EXPERIMENT)" is as large as "NEW RUN".
    Move experiments into a smaller secondary button or a submenu.
    File: `src/components/screens/MenuScreen.tsx`.
    **Implemented:** a large illustrated **New Classic Run** (or **Play**)
    hero button, with **Table Loop Mode** as the illustrated secondary entry.
    No "experiment" wording remains in the interface.
17. **Tablet tile size.** iPad landscape uses medium tiles with spare board
    height. Let `fitHandTileSize` use the measured board height (not a fixed
    28% of the viewport) so tall boards earn larger tiles.
    File: `src/hooks/useHandTileSize.ts`.
18. **Round chip progress.** The Act track along the chip's lower edge reads
    as an underline at Act 1. Consider a small "1/8" or dimmer unfilled
    segments. File: `GameplayTopBar.tsx`.
19. **Slow first play load in dev** (~10s before `/play` renders). Preload the
    play route chunk from the menu (hover/idle) and check production chunk
    sizes. Files: `src/router/*`, `vite.config.ts`.

## Test and tooling debt (do alongside the above)

- **Failing on `main` (18225c2) before the Table Loop polish**, reproduced on a
  clean checkout with installed Chrome against a test-mode dev server:
  `flower-mutations` (both projects; two rack elements share one
  `data-play-tile` id), `tile-details` stage/return for es/fr/ja (the floating
  first-move tip intercepts the click on a staged tile), `bamboo-summer` on
  mobile (discard zone out of view), `frostbite-retriggers` (both projects) and
  the table selector's `imagesLoaded` check in `app.spec.ts`.
  **Recovery in progress:** current `6c8e408` reproduction confirms duplicate
  Plum tiles, floating guidance interception and complete-hand phone discard
  reachability. Local presentation fixes, including the newly exposed compact
  gap regression, pass all 172 final-source native browser checks.
  Frostbite's dismissal target and shop guidance expectations were stale tests;
  the table image failure has not reproduced in the desktop/mobile recheck.
  See [tile interaction evidence](TILE_INTERACTION_IMPLEMENTATION.md) for
  retained failures, pending broader checks and publication status.

- **Module-URL helper for e2e.** After a source edit, the dev server serves
  `GameOrchestrator.ts?t=…`; specs importing the plain path drive a second
  engine instance. Add a shared helper in `e2e/helpers/` that resolves the
  loaded URL from `performance` resource entries, and use it everywhere.
- **Real-device pass.** Layout was verified under device emulation (see the
  device matrix in `LAYOUT_SIMPLIFICATION.md`). Check on a physical iPhone in
  Safari (dynamic toolbar, notch, WebKit) and an iPad, and with one or two
  people new to mahjong.
- **Browser install.** Playwright 1.57 expects Chromium build 1200; run
  `npx playwright install chromium` (or pin a channel in config) and free or
  avoid port 4173, which another local project's preview server holds.
- **Layout tests to extend**: add assertions for the felt CSS variables per
  table (`data-felt` on the play column), the rack's empty slots
  (`[data-rack-slot]`), and the pinned rack (`data-rack-pinned`).
