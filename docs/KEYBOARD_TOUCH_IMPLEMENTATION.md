# Keyboard and touch play

November 1, 2026. No engine, balance or save-format changes. One new
persisted setting (`keyboardShortcuts`, default on).

## Keyboard

**Focus stays on the table.** A tile that changes zone is a new button in the
other zone, and the focused one leaves the DOM. Before this change, Enter on a
rack tile dropped focus to `<body>`: Chrome happened to resume Tab from the old
place, but screen readers and Safari lost it. Now (`src/gameplay/tileKeyboard.ts`,
`HandRack`):

- Enter/Space on a rack tile moves it to the felt and focuses the next rack
  tile, so Enter, Enter, Enter picks a run. When the rack is empty, focus
  follows the tile to the felt; returning works the same way in reverse.
- Only keyboard or assistive activation moves focus (`detail === 0`, or a
  visible focus ring). Taps and mouse clicks leave it alone.
- After a keyboard Play hand, REDRAW, Select all or Esc removes the focused
  control, focus goes to the first rack tile (or the felt's).

**Arrow keys** walk the tiles: Left/Right and Home/End stay in the zone in
reading order; Up/Down go to the nearest tile on the row above or below,
crossing between felt and rack. They act only on a focused tile, so they are
always on.

**One-key shortcuts** (`src/hooks/useTableShortcuts.ts`):

| Key | Action                          |
| --- | ------------------------------- |
| P   | Play hand                       |
| R   | REDRAW                          |
| A   | Select all / Clear all          |
| Esc | Put every tile back in the rack |

Each works only while its control would. Letters match the typed character,
then the physical key, so AZERTY and Russian or Thai layouts work. They stand
down for text fields, open dialogs and popovers, the deal, IME composition and
modifier keys (Ctrl/Cmd+P still prints). Esc waits while tile details show,
because Esc closes those first. Shortcuts can be turned off in Settings →
Gameplay (WCAG 2.1.4); the description names every key, in all 13 locales.

Controls announce theirs with `aria-keyshortcuts`. With a mouse or trackpad
(`any-hover: hover` and `any-pointer: fine`), a small key cap marks Play hand,
REDRAW and Select all. Corner caps wait for a 560px action bar, so they never
crowd a localized label. Phones never show them. The cap is CSS
(`data-shortcut` and `::after` with empty alt text), so a button's text and
accessible name stay its label. An earlier `<kbd>` version added "P" to Play
hand's text and broke `toHaveText('Play hand')` in `app.spec.ts`.

## Touch

- `touch-action: manipulation` on controls and full-screen surfaces: two
  quick taps on neighbouring tiles, or on Play hand, are two taps, not a
  double-tap zoom in iOS Safari or its web view. Pinch zoom and scrolling
  still work. It sits in the base layer, so `touch-*` utilities still win.
- Custom `:hover` rules (illustrated buttons' lift, Pavilion tabs and cards,
  the achievement toast's close button) only apply where a pointer can
  hover. On a touch screen `:hover` sticks to the last control tapped; an
  illustrated Decree used to stay scaled to about 1.05× after a tap.
  Tailwind's `hover:` variant was already gated this way.

## iPad review

The menu, table, Tea House and Settings were checked at 744×1133, 768×1024,
820×1180, 1024×1366, their landscape sizes, 590×820 (Split View) and 375×1100
(Slide Over), with an iPad user agent and touch. Nothing overflows the page,
Play hand and Continue stay on screen, and the frame keeps its corners. On
1024×768 landscape the rack uses 50px tiles with free felt above. That is the
deliberate `HEIGHT_SHARE` budget in `useHandTileSize` (laptops keep one row),
and it stays above the 44px touch target, so it is unchanged.

## Verification

- Unit: `tileKeyboard.test.ts`, `useTableShortcuts.test.tsx`, and new
  `HandRack` and `ActionBar` cases. Full suite: 3,839 tests in 267 files.
- Browser: `e2e/keyboard-touch.spec.ts` covers the keyboard journey (Enter,
  arrows, P, A, Esc with focus checked at each step), dialogs swallowing
  shortcuts, the setting turning them off, and touch (`manipulation`, taps
  leave focus alone, no key caps).
- 17 existing browser specs (action bar, rack and felt, dialogs, tile
  details, Pavilion, tutorials, play/redraw, progress reset) plus the new one,
  on both projects: 175 passed, 69 failed, 4 skipped. None of the failures is
  new. The same 68 in `tap-discard`, `quiet-inventory` and `tile-details` fail
  identically on the parent commit `5aed06f`: they look for the removed
  single-tile Discard, an old first-move hint, Table Loop test ids and old
  `PlaySurface` tile names. `interaction` at 320×568 with a mouse fails 1 in 8
  repeats on both commits: when tiles move, the board scrolls under the
  resting pointer, which opens a Flower's hover details (Bamboo on this
  branch, Winter on the parent). `app.spec.ts` passes in full.
  `beginner-guide.spec.ts` fails on both commits: it looks for a
  `[data-open-beginner-guide]` button the table no longer has.
- Not verified on physical iPhone or iPad hardware: double-tap zoom and
  sticky hover were checked in Chromium's touch emulation only.
