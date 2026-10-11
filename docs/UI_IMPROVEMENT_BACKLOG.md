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

1. **Action buttons break words on phones.** At 320–360px, "Saltar" and
   "RECAMBIAR" wrap mid-word ("Salt/ar", "RECA/MBIA/R"). Use an icon plus a
   short label, or let Skip/Redraw become icon buttons with accessible names
   below 400px. Files: `src/components/gameplay/ActionBar.tsx`, the
   `max-width: 359px` block in `src/index.css`. Done when no action label
   breaks inside a word in any locale at 320px.

2. **Discarding needs a tap path.** Discard is drag-only (drop on 🗑). On
   touch that is hard to discover and to do. Add "Discard" to the action bar
   when exactly one tile is selected, sharing the drag path's
   `onTileDiscard`. Files: `ActionBar.tsx`, `GameplayScreen.tsx`. Done when a
   tile can be discarded with taps only, and the discard count still shows
   once (the 🗑 zone).

3. **Wall breakdown is English-only.** The Wall dialog's suit names come from
   `getSuitName` and its tile titles say "remaining" in English. Localize them
   and delete the now-unused non-compact `WallDisplay` branch (hard-coded
   "Wall" / "tiles remaining"). File: `src/components/gameplay/WallDisplay.tsx`.

4. **Tip copy no longer matches the screen.** The first-move tip says "Learn
   the tiles opens the visual guide", but phones show that button as a book
   icon only. Show the label next to the icon in the rack header when the tip
   is open, or change the copy to refer to the book icon (thirteen locales).
   Files: `src/config/progressiveTutorialHints.ts`, `PlaySurface.tsx`.

5. **Empty consumables take a third of the inventory rail.** Three "×0"
   chips sit there for the whole first Act. Hide a consumable type while its
   count is 0 (or fold all three into one "Items 0" chip that opens a dialog).
   File: `src/components/gameplay/ConsumablesBar.tsx`.

## P2 — friction

6. **Secondary rack buttons scroll away on phones.** "Build a hand" and
   "Riichi pledge" sit in a sideways-scrolling header row. Move them behind a
   single "⋯ More" button (menu or sheet) below 640px; keep them inline above.
   File: `src/components/gameplay/PlaySurface.tsx` (rack header).

7. **Coach chips truncate on phones** ("Build towar… +59"). Shorter copy for
   the chip title ("Build a Sequence"), keeping the long sentence as the
   tooltip/description. Files: `CoachPanel.tsx`, locale `gameplay.coach.*`.

8. **Score bar is two rows on phones.** Fold "N to clear" into the progress
   bar's label and drop the separate SCORE / TARGET captions below 400px so
   score, bar and target fit one row above the forecast line. File:
   `src/components/gameplay/ScorePanel.tsx`. Keep `.game-score-remaining` and
   the progress bar's `aria-valuetext`.

9. **Long group labels widen groups.** Russian "ПОСЛЕДОВАТЕЛЬНОСТЬ +30" makes a
   three-tile group wider than its tiles. Allow the label to wrap to two short
   lines or use a compact per-locale abbreviation key
   (`gameplay.groups.short.*`). File: `PlaySurface.tsx`, locales.

10. **Felt colours stop at the play screen.** Apply `feltPalette` to the Tea
    House, Game Over and the menu's Run Setup preview (a swatch of the cloth
    next to the table name). Files: `ShopScreen.tsx`, `GameOverScreen.tsx`,
    `src/components/menu/*`, `src/utils/feltPalette.ts`.

11. **Shop tip as a popup.** Play now floats tips on wider screens; the shop
    still pushes items down. Float it over the cash-out banner (not the
    items) from 640px up. Files: `ShopScreen.tsx`, `ProgressiveHint.tsx`.
    Update `e2e/tutorial-layout.spec.ts` ("shop hint occupies its own row").

12. **Shop density.** On a phone the cash-out banner, tip and build panel
    still precede the first item. Collapse the cash-out to one line after its
    entrance animation (details in a disclosure), and keep "Continue" sticky.
    Files: `RoundCashOutBanner.tsx`, `ShopBuildPanel.tsx`.

13. **Dragons have no index.** Suited tiles show 1–9 and winds carry letters,
    but White/Green/Red Dragons have no hint for newcomers. Add a small
    coloured initial (W/G/R, localized) through the same `.tile-index`
    generated-content badge. File: `src/components/tiles/TileImage.tsx`.

14. **Table Loop wastes desktop space.** Its rack uses small fixed tiles on a
    mostly empty 1440×800 screen. Reuse `fitHandTileSize` for `RackRow`.
    Files: `src/components/tableloop/RackRow.tsx`, `TableLoopScreen.tsx`.

15. **Audit the remaining screens at 1440×800, 768×1024 and 390×664**: Codex,
    Collection, Achievements, Settings, Game Over. Same contract as play: no
    page-level horizontal overflow, primary action visible without scrolling.

## P3 — polish

16. **Menu hierarchy.** "TABLE LOOP (EXPERIMENT)" is as large as "NEW RUN".
    Move experiments into a smaller secondary button or a submenu.
    File: `src/components/screens/MenuScreen.tsx`.
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

- **Module-URL helper for e2e.** After a source edit, the dev server serves
  `GameOrchestrator.ts?t=…`; specs importing the plain path drive a second
  engine instance. Add a shared helper in `e2e/helpers/` that resolves the
  loaded URL from `performance` resource entries, and use it everywhere.
- **Lazy-image checks.** `e2e/beginner-guide.spec.ts` (ja, 320×568 @20px) and
  the mobile table-selector check in `e2e/app.spec.ts` wait for every image to
  be `complete`; with installed Chrome, lazy images outside the viewport never
  load. Scroll each image into view before asserting, or load dialog images
  eagerly.
- **Browser install.** Playwright 1.57 expects Chromium build 1200; run
  `npx playwright install chromium` (or pin a channel in config) and free or
  avoid port 4173, which another local project's preview server holds.
- **Layout tests to extend**: add assertions for the felt CSS variables per
  table (`data-felt` on the play column), the rack's empty slots
  (`[data-rack-slot]`), and the pinned rack (`data-rack-pinned`).
