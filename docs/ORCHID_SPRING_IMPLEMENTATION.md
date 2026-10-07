# Orchid draws during Spring

October 7, 2026 — published and verified in **v1.0.261007-11**.

Under the user's delegated rule authority, each normally drawn Honor earns one
extra physical dead-wall draw while Orchid and normal Spring are effective.
Extra draws never recursively earn more. See the complete timing, suppression,
exhaustion and persistence rules in [the decision record](RULE_RESOLUTION.md).

## Connected paths

Transient per-cycle accounting tracks earned credits and the chronological drawn
tiles. Starting deal, ordinary refill, Serpent, explicit draw, redraw and Dead
Wall Writ all use it. The bonus resolves after ordinary draws, so it adds a real
selection advantage instead of occupying a slot that would have filled anyway.
Redraw returns its old tiles only after this resolution. The Mandate settles
once, with the actual last drawn tile rather than the last tile in sorted rack
order; Hook, hidden information and Bell's single current lock remain applied.

Two related gaps found through these paths are corrected: explicit draw validates
the actual rack capacity instead of a hard-coded 14, and Spring drawn through
Dead Wall Writ fills its new spaces. The Writ remains once per round. No scoring
rule, saved-run schema or confirmed user choice changes.

The Orchid inspector uses a new generated portrait. After an experienced bloom,
it shows localized draw-count/non-chaining text in all thirteen locales, without
an upfront recipe or modal interruption. This is a transient explanation: load
and round-start clear it, not the actual saved tiles. Native-speaker review is
not claimed. Plum/Autumn, mutations/catalysts and remaining item rules are open.

## Verification ledger

Evidence directory: `/tmp/tensho-orchid-2kLmDV`.

- Initial engine batch: 31/33 pass. The explicit-draw case exposed the hard-coded
  14-tile validation limit; the Fish test incorrectly used discard rather than
  a play, which is the authored trigger for its hidden draws. Runtime capacity
  and that test action are corrected; Fish's rule is not changed.
- The next engine batch passes 33/33. Broader focused checks pass 79/80; the new
  starting-deal fixture installed its controlled draw sources after skipping,
  but skip had already dealt the next round. Install them before the skip.
- Final focused checks pass **80/80** in five files. Full regression passes
  **1,868/1,868 in 157 files**. A subsequently added complete-hand payout test
  and over-capacity draw rejection checks pass in the **24/24** Orchid follow-up;
  this adds one test to the full-suite total. No runtime source changed after
  the full run started.
- Native Orchid journeys pass **8/8**, desktop and 320×568 touch, English and
  Spanish, through real paid play and redraw. They verify two extra physical
  tiles, exact action costs and paid forecast, localized post-bloom explanation,
  decoded 512px artwork, read-only inspection, exact reload, return to ordinary
  capacity on a later play, and round expiry. Spanish phone screenshot reviewed:
  the illustration and earned explanation fit the scrollable inspector.
- Broader real redraw/Seal/lock/exhaustion browser checks pass **6/6**.
- Pages-base build, TypeScript, all **13** release checks and lint pass (zero
  errors, 211 existing warnings). Built-production replay passes **8/8** using
  the captured native save envelopes, with no runtime source imports.
- At the implementation commit, independent release CI and hosted replay were
  pending; final evidence follows below. Controlled scenarios do not demonstrate organic acquisition
  frequency, native-speaker translation quality or player enjoyment.

## Published verification

- Implementation commit: `92744437f123fdf115d439464d899103c84c182a`.
- [Release workflow](https://github.com/evgenyvinnik/tensho-web/actions/runs/37698241743)
  passes **1,869/1,869 tests in 157 files**, **13 release checks**, build and
  deployment. This includes the final complete-hand payout test.
- Public manifest and remote `v1.0.261007-11` tag both identify
  `6b2ba20b3c04c3a85a397c7e70d7a0c241391fac`. Hosted Orchid artwork has the exact
  SHA-256 recorded below.
- **8/8 hosted journeys pass**, with no retries or deadline increases, covering
  English/Spanish, desktop/320px touch, paid play/redraw, extra tile identities,
  resource costs, forecast/payout, translated illustrated inspection, exact
  reload, ordinary capacity recovery and round expiry.
- Logs: `ci-build.log`, `deploy-watch.log`, `hosted.log` in the evidence directory.
  Both owned servers were stopped; the pre-existing port 4173 server was untouched.

This completes the Orchid/Spring checkpoint, not the whole project. Plum/Autumn,
mutation/catalyst acquisition, remaining item rules, strategy balance and human
newcomer/fun validation remain separate requirements.

## Artwork provenance

Mode: built-in image generation, guided by the imagegen skill. The tool exposes
no exact model ID/selector; no unverified latest-model claim is made.

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-82e8e363-e1c0-4fe0-969c-6d63d7d91fa5.png`
- Runtime: `public/assets/illustrations/orchid-bloom.webp`, 512×512, alpha,
  61,906 bytes; mechanical `cwebp -q 85 -resize 512 512` conversion.
- SHA-256: `d415f8167dee6098efdc067593ce5872c142f4760653fa2d8a03609e83927934`.

Exact generation prompt:

> Use case: stylized-concept. Asset type: transparent Orchid Flower portrait for Tensho, an East Asian mahjong roguelike. Primary request: a compact elegant orchid plant with three ivory and soft lavender orchid blooms, slender arching stems and deep jade leaves, in a small dark-jade ceramic pot with a restrained antique-gold rim and botanical gilding. Premium hand-painted fantasy inventory illustration, worn lacquer, delicate petals, warm gold highlights, matching an established forest-green, ivory and antique-gold botanical game palette. Composition: square canvas, complete centered object in slight three-quarter view, strong readable silhouette at 48 pixels, generous transparent margins, no clipping. Background: genuinely transparent alpha, no ground plane or external drop shadow. Constraints: no text, letters, numerals, calligraphy, labels, mahjong tile faces, people, scenery, frame, logo or watermark. A finished miniature inventory portrait, not a UI mockup.
