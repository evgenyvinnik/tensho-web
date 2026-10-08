# Yaku Repetition Charter: consecutive-round growth

Status: published and hosted-verified in v1.0.261008-13, October 8, 2026.

## Requirement and resolved rule

`GAME_SYSTEMS.md` calls for identical Yaku across rounds to compound. The shipped
implementation counted matching families in only the previous round and added
20% per family, regardless of streak length. It also built that match list before
boss filtering. Corrected red tests reproduced ×1.4 instead of the chosen ×1.44
for two matching families and ×1.4 instead of ×1 when The Eye blocked both.

Using the user's delegated rules authority:

- A completed round records each actually paid, surviving Yaku family once.
- For each family scored in the current play, count its consecutive immediately
  prior completed rounds. Sum these counts and apply `min(4, 1.2 ** count)`.
  The authored factor 0.2 and maximum bonus 3 become ×1.2 growth and ×4 cap,
  before the existing Flower empowerment of the bonus. The Austerity checkpoint
  makes this cap ordering explicit in all thirteen localized descriptions.
- Repeated plays inside one round can use the bonus, but cannot grow the streak.
  Any earlier paid occurrence in that round counts even if a tactical play ends it.
- A completed round missing a family breaks that family's streak. An accepted
  skip breaks all streaks. A rejected skip changes nothing. A new run resets history.
- History records real play whether the Decree is owned or active; acquiring it
  can therefore use an already-established pattern. Suppression removes the bonus,
  not the history. Copies each apply their own capped factor; Frostbite reduces
  the combined Decree contribution through the existing rule.
- Boss-blocked patterns cannot grant a repetition bonus or extend a streak.
  Ascended patterns keep their original family identity. Rescued rounds use only
  patterns actually played; the rescue itself does not invent a Yaku.
- Old saves prove only their recorded previous-round families. They retain one
  prior round of credit, not invented earlier streaks. The optional new history
  round-trips unchanged, with positive integer counts and matching family keys.

This is an explicit implementation choice, not evidence that complete-hand
planning is now balanced or enjoyable. Organic progression still needs assessment.

## Presentation

The existing hover/focus/tap inspector gains a read-only list of prior pattern
streaks, in both play and owned shop inventory. Nothing opens automatically.
Face-down Decrees reveal neither the new artwork nor the streak list. Names,
rules, empty state and streak labels are supplied in all thirteen locales.
Existing localized Yaku names are reused for all 21 runtime families.

## New artwork and provenance

Created with the **imagegen skill and built-in image tool**. The tool does not
expose a model selector or verifiable model ID; no named latest-model claim is made.

- Installed: `public/assets/illustrations/decrees/yaku-repetition.webp`
- 512×512 with alpha; 53,456 bytes; original retained without overwrite.
- SHA-256: `b594dbb690ac3c3b0accee81975e786909fa594acaf4f07115da6709b71f8681`
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-1ab3bbbd-d554-4ca5-919b-909bb52b2673.png`
- Converted with `cwebp -q 85 -resize 512 512`. Visual inspection confirms three
  matching tile emblems, linked gold rings, full jade/ivory scroll silhouette,
  transparent margins and no baked-in rules. Shared portrait mapping connects
  gameplay, shop and discovered Archive; existing concealed artwork remains.

Final prompt:

> Use case: stylized-concept. Asset type: small transparent collectible Decree portrait for Tensho's Yaku Repetition Charter. Primary request: one exquisite hand-painted ivory parchment scroll with dark jade lacquer rollers, warm gold caps, a red wax seal and short green silk tassel. The dominant emblem is three matching small ivory mahjong tile backs linked by a rising spiral of three interlocking golden rings, suggesting patient repetition and accumulating strength. Luxurious East Asian fantasy board-game illustration; tactile parchment, carved gold, rich jade-green and warm ivory, restrained vermilion accents. Clean bold silhouette readable at 80px. Center the entire scroll in a square composition with generous transparent margins. Genuine alpha transparency. No scenery, people, hands, words, calligraphy, numbers, labels, watermark or UI frame. Rules will be separate localized text.

## Verification

Evidence directory: `/tmp/tensho-yaku-repetition-v4kXbH`.

- Initial test construction used the wrong score-field/continuation names; these
  fixture failures were corrected before using the tests as defect evidence.
  The resulting two red cases reproduced actual flat-growth and boss-filter bugs.
- First corrected mechanics/save batch passes 71/71.
- Expanded focused suite passes **119/119**: streak timing, skip/new-run reset,
  missed rounds, caps/copies/Frostbite, suppression, strict legacy/new saves,
  all-locale inspector concealment, secondary scoring and portrait mapping.
- An intermediate skip test used the nonexistent `skipRound` action; it now
  exercises the real `skip` action. Typecheck also caught an extra diagnostic
  argument to the shared save validator; its existing API is retained.

- Build/typecheck passes; production includes 435 precache entries. Full lint
  reports zero errors and 211 existing warnings. Release checks pass 13/13.
- The first full regression run had 2,598 passes and one existing balance CLI
  test exceed its 5-second deadline while build/release work ran concurrently.
  A full rerun without that build load is recorded separately; no timeout or
  assertion was relaxed.
- The first native browser run used the component-only `toHaveTextContent`
  matcher. Correcting it to Playwright's `toContainText` yields **6/6 native**
  passes without retries: EN/ES/RU, desktop and 320×568 touch viewport.
- Replaying the actual engine-earned saved run against the built production
  bundle passes **6/6**, including loaded artwork, localized inspector, staging
  without spending, actual compounded score, third-round history and reload.
- The Russian 320px inspector screenshot was visually inspected: wrapped text,
  readable artwork and streaks, and sell action remain inside the viewport.

- Full regression rerun passes **2,599/2,599 in 188 files** in 106.43 seconds,
  including the unchanged balance CLI test. Earlier failed runs remain recorded.

## Publication

- Source checkpoint: `49e6073cbc084c87217f79985ad2b37bb774d780`.
- [Independent CI and Pages deployment](https://github.com/evgenyvinnik/tensho-web/actions/runs/37743441856)
  succeed: 2,599/2,599 tests in 188 files, release checks and production build.
- Version/tag: `1.0.261008-13` / `v1.0.261008-13`.
- Built commit: `8de4a1f34b33ef14a166240fc9e0d7d5b89c9d8c`.
- Public `release.json`, remote tag and runtime entry
  `/tensho-web/assets/index-D8nlF-mP.js` agree. The hosted portrait SHA-256
  matches the installed asset above.
- Hosted EN/ES/RU desktop/touch replay journeys pass **6/6** without retries,
  including real scoring, stage/confirm, saved continuation and loaded artwork.

This closes this mechanic's implementation checkpoint, not overall completion,
organic balance, native-speaker review or physical-device/newcomer assessment.
