# Tea House owned-build panel

October 3, 2026. This closes a player-facing gap exposed by the
[shopping comparison](CLASSIC_BUILD_SHOP_BALANCE.md): the simulation could compare
and replace owned Decrees while shopping, but the Tea House UI did not expose the
owned inventory or its existing sale action.

## Implemented behavior

- An illustrated owned-build section sits above the offers, in authoritative
  inventory order. It shows actual ownership/capacity, including Negative slots,
  and wraps rather than requiring horizontal scrolling on narrow screens.
- The existing scroll details support hover, focus and tap. Rules, editions,
  Eternal/Rental/Perishable and expiry information are shared with gameplay.
- Selling asks for confirmation with the localized name and actual sale price.
  Cancel does nothing; confirmation calls the existing engine with the physical
  instance ID. Duplicate names cannot select the wrong copy. Eternal sale stays
  disabled. Confirmation returns focus to the surviving build heading, including
  after the selected card disappears. A polite status announces success/failure.
- Gold, capacity and affordable offers react to the transaction. Ordinary sales
  can free room for a replacement; selling a Negative copy also removes its slot
  and does not falsely create spare capacity. Rejected transactions retain state.
- The panel does not force a tutorial, select purchases or expose the experimental
  analysis policy as a recommendation. No scoring, price or acquisition rule changed.
- Screenshot review exposed the existing error/footer stacking problem: their
  backgrounds sat below the positioned scene overlays. Both now have an explicit
  foreground layer. An actual hit-test regression failed before the fix and passed
  afterward; the Spanish inventory-full message is visibly readable on a short phone.

Seven new strings are present in all thirteen locales with exact interpolation
parity. Polished Stone's Italian, Russian, Thai, Filipino and Turkish descriptions
incorrectly promised an Honor multiplier; they now describe its actual +60 Chips.
The locale check also verifies the runtime effect. Native-speaker review remains
outstanding; this is not a certification of all existing tutorial/catalog prose.

## New portrait

The imagegen skill guided a new Polished Stone illustration, saved at
`public/assets/illustrations/decrees/polished-stone.webp`. Shared asset mapping
uses it in owned scrolls, shop cards and the Archive. It remains concealed when a
Decree is face-down. Names and rules stay localized HTML, never raster text.

Built-in image generation was used; the tool exposes neither a model selector
nor a model identity, so a particular latest-model claim cannot be verified.
Original retained at
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-e5bec5aa-cad5-4a8c-9b58-3b456fc3df25.png`.
Mechanical conversion only: `cwebp -q 85 -resize 512 512`, preserving alpha.
Final asset: 512×512, 34,386 bytes, SHA-256
`045551074dbe809ac90803b94ae281499c17435c0193d429f05479e707c2747a`.
Generated output and rendered desktop/touch screenshots were inspected.

Exact prompt:

> Use case: stylized-concept. Asset type: miniature Decree portrait for Tensho, a mahjong roguelike. Primary request: Polished Stone, a single smooth oval dark jade river stone resting on a small folded ivory polishing cloth, with a slender antique gold vein in the stone catching warm light. Premium hand-painted East Asian fantasy board-game item illustration matching forest green, ivory and aged gold UI. Bold simple instantly legible silhouette at 44–80px, centered complete object in a square composition with generous transparent outer padding. Tactile polished jade and subtle woven cloth, soft amber highlight, restrained detail. Genuine transparent alpha background. No scenery, surrounding frame, scroll, human hand, face, tiles, text, letters, digits, calligraphy, logos or watermark. This is a decorative item portrait, not a rules diagram.

## Verification

- Focused component, locale and asset checks passed **72/72**, including canonical
  +60 Chips, physical-copy confirmation, cancellation, focus return, Eternal,
  rejected sales, capacity changes, transparent dimensions/size and concealed art.
- The full local suite passed **1,537/1,537** before the final two foreground-class
  changes and one additional shared-art test. The final focused set includes that
  new test; do not mislabel the earlier full run as a 1,538-test run.
- All **13 release checks**, strict TypeScript, targeted lint, whitespace checks
  and the final Pages-base production/PWA build passed. Existing large-chunk and
  stale Browserslist warnings remain.
- Final native browser regression passed **26/26**, desktop and touch, with no
  retries. The new journeys use controlled full six-scroll inventories and actual
  engine play into the Tea House. They exercise full-inventory rejection, foreground
  error visibility, Eternal protection, sale cancellation, exact-copy sale,
  ordinary replacement versus Negative capacity, both motion preferences, 320px
  English/Spanish wrapping, image decode, complete save/reload equality and the
  next-round route. Existing identity/modifier/expiry tests remain green.
- Separate production desktop/touch checks restore the browser-generated saved
  shop fixture without source-module imports, verify exact artwork bytes and 512px
  decode, cancel then commit a sale, reload exact state and continue to play with
  zero page errors. Fixtures prove transaction/UI behavior, not organic rare-offer
  frequency, human comprehension or enjoyment.

Retained failures: the default browser port was already occupied, so a separate
owned server was used without disturbing it. Four initial fixtures failed because
the test wrote an invalid `Base` offering edition; a diagnostic identified it and
the fixture now uses the canonical absent base edition. Four geometry checks and
one diagnostic then counted deliberately oversized scroll art as clipped text;
the corrected check separately verifies text fit and viewport bounds. The error
foreground check subsequently reproduced a real UI defect, fixed above.

Evidence: `/tmp/tensho-shop-build-first-browser/` and
`/tmp/tensho-shop-build-aM6Bjs/`, including `release-browser.json`, screenshots,
saved fixture attachments and `verify-production.cjs`. The original generated
image remains separate from temporary browser artifacts. No player save is used.

The broader implementation, unconfirmed mechanics, deliberate Yaku planning,
human newcomer sessions and physical-device/native-language reviews remain open.

## Published checkpoint

Source commit `14a1e880632f362b7d6b440e5c8ef25890a71b9a` is on main.
[CI run 37139457730](https://github.com/evgenyvinnik/tensho-web/actions/runs/37139457730)
passed the final **1,538/1,538 application tests**, **13/13 release checks**,
production build, provenance verification and Pages deployment. Published
**v1.0.261003-5**, built/tagged at `f5ed840926555df4c2a4ce721773ce4578f8d611`.
The public manifest and remote version tag match that commit.

Hosted desktop/touch verification passed using the same browser-generated shop
save: exact artwork SHA-256 and dimensions, cancellation without mutation,
confirmed sale, exact reload, responsive layout and next-round navigation, with
zero page errors. The hosted screenshots and script remain in the evidence
directory above. Owned development/preview servers were stopped; the pre-existing
server on port 4173 was left untouched. This is an incremental published feature,
not whole-project completion or a human-fun result.
