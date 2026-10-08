# Observatory: matching held Orbs

October 8, 2026. Resolves the Charter conflict recorded in
[Charter progression](CHARTER_PROGRESSION_IMPLEMENTATION.md) under the user's
delegated rule-resolution authority.

## Rule and integration

The old implementation multiplied every play by ×1.5 for every held Orb,
including unrelated families and plays with no Yaku. The item library explicitly
promised a bonus for the Orb's own Yaku. Each held unused Orb now qualifies only
if its family actually scores after Boss filtering; distinct held copies stack,
but multiple matching patterns never repeat the same Orb. Black Hole qualifies
once for any surviving Yaku, including unmapped Yakuman, and not for an empty
Yaku list. Ascension keeps the original family. Frostbite does not weaken a
Charter's bonus. The final multiplier layer and rounding remain unchanged.

The same calculation feeds score forecasts, threshold-Decree qualification and
actual payment. No RNG, inventory mutation or progression is added by inspection.
Using an Orb retains its existing permanent-within-run family upgrade but removes
its held bonus. Existing saves keep their exact inventory, levels and paid score;
future scoring adopts the corrected rule, not an unconditional legacy power.
Price, acquisition gates and slot limits are unchanged.

All thirteen locales have current rule text. The shared item-text adapter overrides
stale saved/catalog descriptions for Observatory. Selecting an Orb while owning
the Charter reveals illustrated rule details. The consumption tradeoff stays
beside the confirmation controls, rather than requiring a phone user to scroll
past all inventory cards to learn the cost. No automatic modal is introduced.

## Artwork

The imagegen skill's built-in generator produced a new transparent portrait,
installed as `public/assets/illustrations/charters/observatory.webp`. The shop,
discovered Archive and held-Orb explanation share it; hidden Archive entries do
not reveal it. The original remains at
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-a2bf45f4-4986-408a-a415-dcbec641925b.png`.

The generator exposes no verified model ID or selector, so a named latest-model
claim is not made. `cwebp -q 85 -resize 512 512` preserves transparent alpha in
the 63,010-byte asset. SHA-256:
`6c0b0f572e6dde7b26f20a0a6e197eeb4278a422bb83119b1ca794747ea7cf2d`.
Both original and installed versions were visually reviewed: complete scroll,
distinct telescope/orb emblem, no baked-in rule text or replacement of old art.

Final prompt (built-in mode):

> Use case: stylized-concept. Asset type: transparent collectible portrait for the Observatory Imperial Charter in Tensho, an illustrated Mahjong roguelike. Primary request: a single luxurious ivory parchment scroll with midnight-blue lacquer rollers, warm gold caps, a red wax seal and a short navy silk tassel. Its dominant painted emblem is an elegant brass-and-jade astronomical telescope angled upward toward one luminous turquoise celestial orb in a delicate gold orbit, suggesting attunement to one particular constellation. Style: premium hand-painted East Asian fantasy board-game illustration, tactile parchment and carved gold, jade, cobalt blue, warm ivory; bold readable silhouette at 80px. Composition: centered complete scroll in a square image, generous clear margins, genuine transparent alpha background. No scenery, people, hands, lettering, calligraphy, numerals, labels, watermark or UI border. All names and gameplay rules will remain separate localized text.

## Verification ledger

Evidence: `/tmp/tensho-observatory-xk7hjN`.

- Initial fixture run: six failures/one pass, including wrong Ittsu ID, missing
  explicit Black Hole eligibility and an invalid corrupted-Season setup. The
  first repair also used the wrong force-Season method name. Corrected fixtures
  reproduce **three scoring failures/four passes** before implementation.
- Corrected engine/art suite: **86/86**. Expanded helper, engine, localized-copy
  and discovery-gating set: **52/52**, including aliases, duplicate families,
  Black Hole, Boss exclusion, consumed/used instances, immutable previews,
  actual payments, strict save/reload and Frostbite.
- Full regression: **2,714/2,714 in 196 files**. TypeScript/build pass; lint has
  zero errors and the existing 211 warnings; thirteen release checks pass.
- Initial native browser set: eight failures in the new staging assertion.
  Stage Hand deliberately records selected IDs; the test incorrectly required
  a wholly unchanged snapshot. The corrected assertion permits exactly the
  expected selected IDs and requires every other saved value to stay unchanged.
  Corrected native journeys: **8/8**, no retries or changed deadlines.
- Phone screenshot review prompted moving the consumption warning next to the
  always-visible confirmation buttons. All **eight final native journeys pass**,
  including an in-viewport warning assertion. The Spanish phone screenshot was
  reviewed again with the warning and both controls visible.
- All **eight production replays pass**, English/Spanish hold/use on desktop and
  320px touch, without retries or changed deadlines. Saved fixture envelopes
  replay against the actual Pages-base build without source imports or runtime
  code injection. Inspection/cancellation leave the save unchanged; use consumes
  exactly one Orb and grants its upgrade; staging spends nothing; committed score
  matches the forecast and exact paid state survives reload. Final build and
  changed-file lint pass. The final full regression again passes **2,714/2,714
  in 196 files**. Publication/hosted verification remains separate.

Browser fixtures explicitly grant earned Charter ownership and a known ordinary
hand. They do not claim natural unlock reachability or paid purchase coverage;
the existing sixteen-Charter acquisition suite covers that boundary separately.
Human strategy/enjoyment, native-language quality, physical devices and historical
installed-PWA migration are not established by these checks.
