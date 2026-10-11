# Classic layout simplification and readable hands

October 10–11, 2026. Implementation checkpoint; verification is recorded below.
Follow-up work is listed in [UI improvement backlog](UI_IMPROVEMENT_BACKLOG.md).

## Problem

The Classic play screen stacked about ten full-width rows above the rack: top
bar, save status, table chip, Decrees and consumables, a separate Yaku ledger
row, a two-row score panel, the progressive hint, the coach, the forecast, a
Flora/Wall side column, the staging zone and the rack header. At 1440×800 (a
MacBook viewport) the content needed ~1,240px inside an 828px canvas, so the
rack itself started below the fold. At 390×844 no rack tile was visible at all.

Newcomers also had no way to see which tiles belong together. The Chinese
numerals on Character tiles are unreadable to them, and the existing **Tile
Hints** setting was stored but never used by gameplay.

## Layout contract

- The screen never scrolls as a whole. The round header, a one-row score panel,
  the rack and the action bar are always visible.
- Only the **board** scrolls: inventory, guidance and staging. The rack lives
  at the end of the board and is pinned (`sticky`) to its bottom while the
  board can still show the whole staging zone above it (its minimum height
  plus 24px); on the smallest phone (320×568) it scrolls with the board
  instead of hiding it. When a tile is
  staged, the board scrolls the staging zone into view, using the pinned
  rack's height as scroll padding.
- Inventory is one rail: Decrees, consumables, a Flowers/Seasons chip, a Wall
  chip (now opening a real breakdown dialog) and an icon-sized Yaku ledger.
- The rack picks the largest tile size that fits the space it actually has
  (`fitHandTileSize`): up to 28% of the viewport height and at most three rows,
  counting group gaps and labels. A laptop keeps a 14–16 tile rack on one row.
  New intermediate sizes `compact` (42×59) and `regular` (60×84) avoid the
  large jump between presets. Touch targets stay at least 44px.
- The rack header is one row everywhere; phones scroll it sideways instead of
  spending a second row of rack height on secondary buttons. **Learn the
  tiles** now lives there permanently (icon on phones).
- The staging zone shows one instruction; the duplicate "Guided first move"
  kicker is gone, and phones show only its title because the hint card carries
  the sentence. It grows to its content (`flex: 1 0 auto`), so staged tiles
  and their coach message can never spill over the inventory above.
- Exact values sit behind an icon-sized disclosure (ⓘ drawn as generated
  content, so the summary's text is exactly "Exact values").
- Shop: the Yaku ledger joins the build panel's heading, save status moves to
  the header, and the cash-out total is one row on phones.
- A selection left in the engine (Settings and back, restored runs) is cleared
  when the play screen mounts, so tiles never appear chosen with an empty board.

## Second pass: one line per job (user review)

- **Tips are a popup.** From tablet width up (≥640px), the progressive hint
  floats (`ProgressiveHintCard floating`) instead of taking a row. It hangs
  from a zero-height positioned wrapper placed right after the inventory, so
  it covers only the empty top of the staging area: Decrees, consumables and
  trackers stay usable (tips themselves point at them), and it never covers
  the rack or the actions. Only its card takes input. Phones keep it at the top of the board's scroll: browser
  checks at 320×568 and 390×844 showed a popup there covered the staged tiles
  the player needs to tap. The shop keeps its in-flow card, because the shop
  is a scrolling page and a floating card would cover items.
- **One scoring line.** The coach's two options ("Points now", "Build toward
  a Sequence"), the forecast for the current choice and the last play's
  equation share the score bar's second slot: the forecast or coach shows
  while there is a choice to make, and the settled equation otherwise. The old
  forecast panel is gone; its pace sentence is the total's tooltip and its
  accessible description. Yaku reveals float over the board, and "why this
  hand works" sits under the staged tiles.
- **One round chip.** Act, round type and Act progress are one chip, with the
  progress as a thin track along its lower edge.
- **Nothing twice.** The action bar no longer repeats the wall, hands and
  discard counts already on the table. The redraw count, shown nowhere else,
  is a small badge on the Redraw button.
- **Stable rack.** A staged tile leaves an empty dashed slot in the rack, so
  the next tile never moves under the player's finger (the browser check
  caught exactly that: a centred rack re-flowed after each tap).

## Third pass: modes, flowers and Table Loop (user review)

- **Menu.** The classic start is a large illustrated hero button, **New Classic
  Run** (or **Play** before the first run), and the second mode is **Table Loop
  Mode** rather than an experiment. Neither carries a subtitle. All thirteen
  locales are updated.
- **Flowers and Seasons open beside the track.** Hovering the track with a
  mouse, tapping it, or pressing Enter opens an anchored, non-modal popover
  (`src/components/ui/AnchoredPopover.tsx`) listing what each Flower and
  Season modifies, such as *Plum +5% per sequence*. It replaces the separate
  window. It stays fully on screen even when the track has scrolled away, keeps
  its close control in a sticky header, closes on Escape or an outside press,
  and keeps Tab order: Tab on the track enters it, Shift+Tab returns, and Tab
  past its end continues after the track.
- **Selections name themselves.** When the selected tiles form exactly one
  group, the forecast heading names it (Pair, Sequence, Triplet, Quad), so a
  newcomer sees what the scorer will pay for.
- **Narrowest phones.** Below 360px the rack spacing tightens so a full hand
  fits at the 44px touch target.
- **Table Loop Mode matches Classic.** It sits on the same felt, table artwork
  and corner frame (`TableFelt`, coloured by the last chosen table style), with
  the classic top bar (way out, round with progress pips, gold), score panel
  (score / target, progress bar, actions and exchanges) and orange / green
  buttons. The board (inventory, practice guide, table, patterns, scoring
  chain, offers, river) scrolls inside a frame styled like the staging zone,
  while the rack and actions stay pinned. The rack is fitted with
  `useHandTileSize`; below 360px its spacing tightens so twelve tiles make two
  rows of six. Empty slots show dashed tile outlines for the tiles they take,
  and each slot shrinks its tiles to its measured width (`fitSlotTileSize`), so
  a quad never spills out. The round-end, tea house and run-end panels are
  cards on the same felt.

**iOS Safari pass (iPhone 16e simulator, iOS 26.2, live build):** the menu,
the Table Loop start choice and a full select → place → score loop work in
WebKit. It found two phone problems, both fixed: the hint under the rack grew
from one line to two as the selection changed, moving every tile about 15pt
between taps; and on a phone the slot a selection fits (or the offers row
waiting for a pick) could sit below the visible board, so "tap a highlighted
slot" pointed off-screen. The hint now sits above the rack, where a longer hint
grows into the board instead, and the board scrolls the first highlighted slot
(or the offers row) into view. Note for anyone testing in the simulator: its
screenshots can lag one frame behind a tap, so take a second screenshot before
judging a result.

**WebKit device sweep of the deployed build (a6675ea)** with Playwright's
WebKit and its iPad Mini (portrait and landscape), iPhone SE (320×568) and
iPhone 13 profiles: on every device the Classic rack and Play action and the
Table Loop rack and Finish action are fully on screen with no horizontal
overflow, and after selecting a pair the enabled Pair slot has been scrolled
into view. On the two phones Classic opens the board on the hand, so the flower
chip starts one swipe above it, by design. The iPad simulator itself needs the
owner's permission in the simulator panel and was not used.

Checked in the browser at 1440×800, 768×1024, 390×844 and 320×568 (Table Loop:
no horizontal overflow, rack pinned, board 189px tall at 320×568; slots never
clip their tiles). Reduced motion exposed a real focus bug: a global tiny
transition kept the popover's `visibility` mid-change when focus moved in, so
the panel is now measured with opacity instead. Automated: unit suite 2934/2935
(the balance CLI test passes alone; it is timing-sensitive under load); Table
Loop, flora, route-loading, classic-resume, orchid, play-structure,
forecast-layout, audio, interaction and the menu/route specs pass in both
Playwright projects. The remaining failures in the specs that touch the flower
track also fail on unmodified `main`; they are listed under test debt in the
[backlog](UI_IMPROVEMENT_BACKLOG.md#test-and-tooling-debt-do-alongside-the-above).

## Felt colours

Each table style now has a `feltColor` (green, lacquer red, olive bamboo,
ochre gold, night-market indigo, slate, ghost violet, ember charcoal).
`feltPalette` derives the table gradient, the Seigaiha wave stroke, the
vignette and two panel shades from it in plain hex (the wave pattern is an SVG
data URI, where CSS colour functions are not reliable). The play screen passes
the palette to `TablePattern`, which no longer hard-codes green, and overrides
`--color-dark-forest` / `--color-forest-green` for its subtree, so the score
bar, rack, action bar and dialogs opened from them all take the cloth. A unit
test keeps beige text at ≥7:1 contrast on every felt's panels, and every table
has a distinct cloth.

## Readable hands (Tile Hints, on by default)

- The rack is laid out as the scorer's own groups (`groupHand`, built on
  `parsePartialHand`), each above a coloured label such as **Pair +15** or
  **Sequence +30**; loose tiles follow unmarked. Concealed and bonus tiles are
  never grouped. Groups are read from the whole rack, so tiles neither move
  nor resize while the player stages them; a partly staged group stays in place
  without its label.
- Suited tiles show an Arabic numeral badge, drawn as generated content so it
  never changes a tile's text or accessible name.
- The "N away" chip explains itself (tooltip and screen-reader text).
- Turning **Tile Hints** off restores plain rack order without badges. The
  setting's description is updated in all thirteen languages, as are the new
  group-label and shanten-help strings.

The Settings switch was also corrected: the global 44px touch rule had stretched
every switch into a 48×44 blob with an invisible off state. The button keeps the
44px target; the visible track is a bordered 48×24 pill.

## Verification

Measured in the dev build with the first-move hint and coach showing:

| Viewport | Before | After |
| --- | --- | --- |
| 1440×800 (MacBook) | rack below fold (1,241px in 828px) | everything fits; 16 tiles on one row |
| 1024×768 (iPad landscape) | — | everything fits; one row |
| 768×1024 (iPad portrait) | — | everything fits; large tiles, two rows |
| 390×844 (phone, standalone) | no rack tile visible | everything fits |
| 390×664 (phone in Safari) | — | rack and actions pinned; board scrolls |

A complete first move (stage the glowing Pair, Play, settle 25 × 1.21 = 30)
and a round clear into the Tea House were exercised in the browser. After the
second pass, 390×664 fits with the tip open (board 418px of 416px), the phone
top bar measures 315/315px, and Night Market and Red Lacquer runs were checked
for felt colour. Unit tests: 2,848 pass with two workers before the second
pass; the full suite passes again after it (see below).

Browser-test findings that changed the implementation:

- A floating tip on phones covered staged tiles (320×568, 390×844), so tips
  float only from 640px up. On desktop, a tip anchored to the board's top
  covered the consumable buttons (every consumables spec timed out on it),
  so it now hangs below the inventory. Note: an absolute child of a flex
  container takes the container's start as its static position, hence the
  explicit zero-height wrapper.
- Staged tiles could spill over the inventory when the staging zone's fixed
  minimum was smaller than its content; it now grows to its content.
- Visually hidden labels inside sideways-scrolling rails escaped the rails'
  clipping (the rails were not positioned), widened the game column to
  ~700px, and `scrollIntoView` then shifted the whole screen left by ~156px
  at 320×568. `.scroll-rail` is now positioned, and its scroll padding keeps
  the first item clear of the fade (this also fixed "Hand (16)" being clipped).

- A complete hand with four Yaku at 320px squeezed the forecast's badges into
  a 50px column ("Menzen Tsumo" broke letter by letter) and the score bar
  grew until the board vanished. The name-and-Yaku block now takes a full
  row on narrow screens, badges never break inside a name, and the numbers
  move to the next row.
- The Redraw count badge is generated content, so the button's text stays
  exactly its label.

E2E (installed Chrome, test-mode server, one worker, desktop and mobile
projects): the layout set passed 101/112 before those fixes. Final runs on a
freshly started server: 48/48 (flora, hand builder, tutorial layout, Yaku
ledger, forecast layout) and 158/160 (consumables, interaction, play
structure, discard layout, secondary scoring, score settlement, progressive
hints, app, table selector, shop build, hand-builder guards, Riichi, Decree
details, beginner guide). The two failures were the lazy-image readiness
checks, fixed afterwards; the affected specs (tutorial layout, interaction,
forecast layout, beginner guide, app, play structure) then passed 84/84. Unit tests:
2,858/2,858 in 204 files (two workers). Lint: 0 errors, 211 existing
warnings. TypeScript: clean.

### Device matrix (production build)

A script drives the production bundle (`vite preview`) under Playwright
device emulation (viewport, pixel ratio, touch, mobile user agent) with
installed Chrome, as a brand-new player: first-move tip open. It checks page
scroll, sideways overflow, that the score bar, Play and every rack tile are
on screen, tile size, labelled groups, numeral badges (one per numbered
tile), and then plays the guided first move to a score.

| Device (viewport) | Page scroll | Rack on screen | Tile | Groups / badges | First move scores |
| --- | --- | --- | --- | --- | --- |
| iPhone SE 1st gen (320×568) | none | scrolls with board | 44×59 | yes / all | yes |
| iPhone SE 2nd/3rd gen (375×667) | none | all 14 | 44×59 | yes / all | yes |
| iPhone 13 in Safari (390×664) | none | all 14 | 44×59 | yes / all | yes |
| iPhone 13 standalone (390×844) | none | all 14 | 44×59 | yes / all | yes |
| iPhone 14 Pro Max (430×932) | none | all 14 | 44×59 | yes / all | yes |
| Pixel 7 (412×915) | none | all | 44×59 | yes / all | yes |
| Galaxy S8 (360×740) | none | all | 44×59 | yes / all | yes |
| iPad Mini portrait (768×1024) | none | all 14 | 70×98 | yes / all | yes |
| iPad Pro 11 portrait (834×1194) | none | all 14 | 90×126 | yes / all | yes |
| iPad Pro 11 landscape (1194×834) | none | all 14 | 70×98 | yes / all | yes |
| iPad Mini landscape (1024×768) | none | all 14 | 50–60 wide | yes / all | yes |
| MacBook Air 13 in Safari (1440×790) | none | all 14 | 70×98 | yes / all | yes |
| MacBook 13 small window (1280×720) | none | all 14 | 70×98 | yes / all | yes |

Hands are random, so the iPhone SE (375×667) was also checked over ten
hands: the rack was pinned and fully on screen in 10/10. The 320×568 phone
never pins (rack, tip, score and actions cannot all fit at 44px targets);
score and actions stay put and the board scrolls.

The matrix found two more defects, both fixed:

- **Blank rack tiles on short phones.** Tile images were `loading="lazy"`;
  browsers never fetch a lazy image that a scroll box is clipping, so rack
  rows below the board's fold (and guide/table-picker images in dialogs)
  stayed blank until scrolled. `TileImage` now loads eagerly by default
  (tiles are small and precached for offline play); table-picker cards load
  eagerly too. This also fixed the two image-readiness e2e checks.
- **Rack pinning threshold.** A fixed 150px window left iPhones in Safari
  (390×664) unpinned with the first-move tip open. The window now only has
  to fit the staging zone plus 24px.

After publication (v1.0.261011-3) the same matrix was run against the live
site with the same results.

**Smallest phone (320×568, the 2016 iPhone SE / 5s).** The rack cannot be
pinned there: its 270px width holds five 44px tiles per row and only ~310px
remains for board and rack. The board therefore opens scrolled to its end
(the hand, the staging line and the actions), holding that position while
the tip and notices arrive until the player first touches or scrolls the
board; the tip and inventory are one swipe up. Over ten random hands the
whole rack was on screen on arrival in 7/10 and Play in 10/10; the other
three were 16-tile hands, which need four rows and cannot fit at 44px. The
iPhone SE 2nd/3rd gen (375×667) stayed at 10/10.

**Real Mobile Safari (iOS 26.2 simulator).** The live site was opened in
Safari on temporary iPhone 17 and iPad mini (A17 Pro) simulators (real
WebKit, Safari's toolbar and safe areas). On the iPhone the round chip, score
bar with coach options, inventory, first-move tip, full 14-tile labelled rack
and action bar all sit above Safari's toolbar without page scroll; the tip's
last lines continue under the pinned rack and are reached by scrolling the
board. On the iPad mini everything fits with large tiles and the tip floating
below the inventory. Not verified: physical hardware, and whether people new
to mahjong find the hands obvious (no playtest was possible here).

### Browser test notes

- This machine's Playwright 1.57 has no bundled Chromium (build 1200) cached,
  and port 4173 is held by another project's preview server. The suite was run
  against `.claude/launch.json`'s `e2e` server (test mode, port 4273) with the
  installed Google Chrome channel, from a scratch config that only overrides
  the browser channel and server.
- Editing a source file while the dev server runs re-versions importers
  (`GameOrchestrator.ts?t=…`); specs that `import('/src/game/GameOrchestrator.ts')`
  then drive a second engine instance and fail. Restart the server after
  edits, or resolve the loaded URL from `performance` resource entries.
- With installed Chrome, two image-readiness checks failed because lazy
  images clipped by a scroll box never load. Fixed by eager tile and
  table-card images (see the device matrix); both checks now pass.
