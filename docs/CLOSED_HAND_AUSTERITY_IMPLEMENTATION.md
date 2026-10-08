# Closed-Hand Austerity: complete-hand mastery

Status: locally verified, October 8, 2026. Publication pending.

## Requirement and chosen rule

`GAME_SYSTEMS.md` promises exponential growth for concealed hands. The old live
definition instead paid a flat ×1.5, including small tactical selections. Two
red tests reproduced both differences before implementation.

Under the user's delegated authority, a genuinely completed concealed hand now
receives `min(4, 1.5 * 1.2 ** priorCompleteConcealedHands)` from each active copy
of this Decree, before Flower empowerment. The first hand retains ×1.5; later
ones earn ×1.8, ×2.16 and so on. This is a deliberate full-hand investment rule,
not a claim that the numerical curve has been human-balanced.

- Only committed, fully completed concealed hands advance run mastery, once per
  play, after that play's scoring. Multiple Yaku and copied Decrees cannot multiply
  the count. Special complete shapes such as Seven Pairs count once.
- Tactical plays, invalid actions, previews and Shanten Clemency's virtual
  completion neither receive this bonus nor advance it. Other rule-enabled
  genuinely complete shapes qualify through the authoritative hand parser.
- Mastery survives round changes, tactical plays, skips and save/reload. A new
  run starts fresh. Ownership/suppression does not change earned history; buying
  the Decree later can use completed hands from earlier in that run.
- The ×4 cap is before Flower empowerment; Frostbite scales the combined Decree
  contribution as usual. This checkpoint also clarifies that same existing cap
  ordering in Yaku Repetition's thirteen-locale descriptions.
- Saves without the new optional count prove zero mastery; total plays do not
  prove complete hands. New counts must be nonnegative safe integers no larger
  than total committed plays. Old Austerity effect definitions remain strictly
  validated and round-trip without inventory rewriting, but resolve to the new
  rule at scoring time, including copies. Modified legacy multipliers are rejected.
- The analysis-only tactical shopping policy cannot value complete-hand mastery;
  it treats Austerity as unpriced rather than recommending its sale for no value.

## Player presentation

An optional hover/focus/tap scroll inspector shows completed hands and the next
qualifying hand's base factor in gameplay and owned shop inventory. No automatic
overlay is added. All thirteen locales have names, rules and progress text;
concealed Decrees reveal neither artwork nor mastery details. Translations still
need native-speaker review.

## Artwork provenance

Generated using the **imagegen skill and built-in image tool**, then installed in
the repository. The tool does not expose a verifiable model ID or model selector;
this is not a claim that a named latest model was selected.

- Asset: `public/assets/illustrations/decrees/closed-hand-austerity.webp`
- 512×512, preserved alpha, 54,566 bytes.
- SHA-256: `bba3d78da7dc2aa9112ff82aaeb9e4c17a2495fdd4d83fbd1f3cfa5fa2cc5d99`
- Original retained at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-efb9ff6d-de6a-4981-8f9f-04369aef6979.png`.
- Converted with `cwebp -q 85 -resize 512 512`; the installed image was visually
  inspected for a complete silhouette, jade lotus, tile backs, no text and margins.

Final prompt:

> Use case: stylized-concept. Asset type: transparent collectible Decree portrait for Tensho, Closed-Hand Austerity. Primary request: a luxurious hand-painted ivory parchment scroll with deep jade lacquer rollers, warm carved gold caps, a restrained red wax seal and green silk tassel. The dominant emblem is a closed jade lotus bud protecting a small fan of ivory mahjong tile backs, encircled by fine ascending golden rings, suggesting patient concealed-hand mastery. East Asian fantasy board-game art matching jade, ivory, antique gold collectible scrolls. Bold clean silhouette readable at 80px, tactile parchment and carved materials, soft warm highlights. Entire scroll centered in a square with generous transparent margins and genuine alpha. No scenery, people, hands, words, calligraphy, numbers, labels, watermark or UI frame; all rules will be localized separately.

## Verification

Evidence directory: `/tmp/tensho-austerity-biiL6P`.

- Red tests: the second complete hand incorrectly remained ×1.5 rather than
  ×1.8; a tactical sequence incorrectly received ×1.5 rather than ×1.
- An intermediate run failed due to a missing compatibility-constant import;
  typecheck caught read-only fixture assignments and i18next's numeric `count`
  parameter. These construction issues were corrected, not hidden by relaxed checks.
- Focused regression passes **139/139** in eight files: real score/growth,
  legacy/new saves, special hands, Clemency exclusion, copies/Frostbite,
  late ownership, skips/reset, all-locale concealment and analysis-policy safety.

- Full regression passes **2,620/2,620 in 190 files**. Build/typecheck passes;
  lint reports zero errors and 211 existing warnings.
- The first native browser batch passes all six repetition journeys, but its
  six Austerity cases retain a copied Ittsu-name assertion from the prior test.
  Correcting that assertion exposes locale formatting: the lazy-loaded language
  can leave `resolvedLanguage` at the fallback. The new factor now uses the
  selected `language`; the corrected six Austerity journeys pass without retries.
- The Russian 320px screenshot was visually inspected: wrapped rules, portrait,
  localized ×2,16 factor and the sell action all fit the panel.

- Final focused recheck passes 19/19 after the decimal-formatting correction;
  rebuilt production and all thirteen release checks pass.
- Production replay passes **12/12**: both illustrated progression mechanics,
  EN/ES/RU on desktop and 320px touch, actual staged/confirmed scores, unchanged
  preview history, earned counters, loaded artwork and saved continuation.

Publication and hosted verification remain separate gates. This checkpoint does
not establish organic full-hand frequency, strategy balance or newcomer enjoyment.
