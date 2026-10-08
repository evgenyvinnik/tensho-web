# Riichi pledge implementation

Updated: October 8, 2026. Published and hosted-verified in **v1.0.261008-20**.
Not a whole-project completion claim.

## Why this checkpoint exists

ITEM_LIBRARIES.md defines Pluto's Riichi-family upgrade and Riichi Devotee,
but Classic supplied no declaration flag to its scoring context. Unit coverage
of the Yaku detector alone did not prove a player could ever earn these bonuses.
The user delegated open-rule decisions; this adds an explicit, optional Tensho
pledge rather than automatically awarding Riichi to every complete hand.

## Chosen contract

See [the recorded decision](RULE_RESOLUTION.md#optional-riichi-pledge-tensho-adaptation)
and [core mechanics](GAME_MECHANICS.md#optional-riichi-pledge-tensho-adaptation).
Cost is 1 Gold once per round, paid before completion. It is an ordinary expense,
not a purchase/progression-spending event. Tactical play and virtual Clemency
completion are blocked during the pledge; cycling and items remain legal.
Completion consumes it once; abandonment restores tactics with no refund or
second pledge. Boss exclusions and natural Yakuman exclusions still apply.
No Riichi-only temporary tile lock, tenpai requirement, extra reward refund,
score-history rewrite or new save-version requirement was invented.

The optional `riichiStatus` field records available/active/spent. Its absence in
a legacy save means available but does not fabricate saved history on read.
Action validation, preview, execution and UI share the authoritative engine.
Declaration and abandonment emit an explicit event; autosave captures settled
state, and the controller refreshes even when abandonment changes no tiles/gold.
Round initialization resets the option; final defeat settles an active pledge
as spent. Reopening the help or refreshing never pays twice.

The optional rack control opens a localized explanation and confirmation. The
active state stays visible and tactical play is disabled with a localized reason.
All 13 locales have rule/cost/error copy. The hand workshop can propose a legal
redraw without tactical score advice while pledged, preserving its ordinary
shape/privacy restrictions. No automatic bot policy starts pledging.

## Boss forecast defect found and fixed

The Eye's no-repeat Yaku and The Mouth's first-Yaku filter mutated their history
during previews. Repeated previews could consume eligibility and pay less than
the first forecast. Mandate scoring now receives preview mode: filtering uses
the prospective first pattern but only committed plays record it. Existing
non-preview calls retain their behavior. Integration tests compare repeated
previews, the entire saved state, and actual payment for both Bosses.

## Artwork

Generated with the **built-in image-generation tool**, following the imagegen
skill. This tool exposes no verifiable model ID/selector; no named “latest”
model is claimed. New illustration, not an overwrite. The skill guided the
transparent-output, review, installation and provenance steps.

- Installed: `public/assets/illustrations/decrees/riichi-devotee.webp`.
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-82baa118-856f-4e30-af93-9705393004f5.png`.
- Conversion: `cwebp -q 85 -resize 512 512`, preserving alpha; 52,856 bytes.
- SHA-256: `0609c06c1b39248d0523ad972c38f8f2cc438ff3acbd97274f50d0dac34294cb`.
- Original and installed asset visually reviewed. Shared DecreeArtwork mapping
  supplies the pledge, shop, owned inventory and discovered Archive; existing
  undiscovered-item privacy behavior is unchanged.

Final prompt:

```text
Use case: stylized-concept
Asset type: transparent painted Decree portrait for Tensho, a jade-and-gold Mahjong roguelike; readable at 72 pixels.
Primary request: a Riichi Devotee pledge scroll. Center an ivory Mahjong declaration stick with a single crimson dot, resting diagonally across a tightly bound emerald ribbon and a warm gold coin; a small red wax seal signifies commitment. These are symbols, not instructional tile faces.
Style/medium: polished hand-painted fantasy game inventory illustration, carved jade-green cylindrical scroll rollers, ornate warm metallic gold finials, softly textured ivory parchment, restrained crimson accents. Match the established jewel-like jade and parchment Tensho Decree family; a single collectible scroll, not a scene.
Composition/framing: square canvas, centered complete vertical scroll with short tassel, generous transparent margin, strong simple silhouette. Soft highlights and deep painterly shading, clean alpha edges.
Constraints: genuinely transparent background; no backdrop, no checkerboard, no text, no letters, no numbers, no watermark, no UI framing beyond the physical scroll, no extra tiles, no people.
```

## Verification trail

Local artifacts: `/tmp/tensho-riichi-46vk5B`.

- First engine run: 10/12 passed. One real workshop integration failure was fixed;
  the other assertion incorrectly treated additive Court Mult as additive final
  Mult. The next assertion used base subtotal rather than the settled equation's
  points and was corrected. These do not change the existing scoring formula.
- The subsequent Boss-filter test exposed the real preview-history defect above.
- Initial UI tests tested visibility before the animation's first frame; the
  component tests now set reduced motion explicitly. Actual browser visibility
  remains separately asserted.
- Initial browser launch found port 4173 occupied. It was not stopped or reused;
  an owned server on 4186 was used. Eight initial native EN/ES desktop/320px-touch
  complete/abandon journeys passed.
- Phone screenshot review moved the no-refund warning and confirmation to an
  optional fixed Popup footer. Eight final native journeys pass with both in the
  viewport, no horizontal overflow, loaded artwork, restored focus, unchanged
  inspection snapshots, a real two-tile redraw, separate staging/payment, and
  exact save/reload after declaration, abandonment and scoring.
- First unrestricted local full run: 2,748/2,755 passed in 198 files. Six timed out
  at existing 5-second deadlines while full tests, build/lint and browsers ran
  together; one mandatory-field test had not accounted for the newly optional
  legacy-compatible state. The latter now explicitly checks absence rather than
  treating it as corruption. Invalid values still fail the boundary. No timeout
  or gameplay assertion was relaxed. The bounded recheck passes **2,755/2,755
  in 198 files**. After adding fixed-Boss/defeat cases, the final complete recheck
  passes **2,757/2,757 in 198 files** in 100.90 seconds with two workers.
- Final TypeScript/production build passes; lint has zero errors and 211 existing
  warnings. Thirteen release-workflow tests pass. The final focused engine/dialog
  set passes **47/47**, including the shared Popup's seven existing cases.
- All **eight production replay journeys pass**, EN/ES, complete/abandon,
  desktop/320px touch. They use the native saved envelope with a previously
  consumed Pluto and owned Riichi Devotee; no source imports or runtime injection
  are used against production. This explicitly controlled starting build is not
  evidence of natural shop acquisition or human strategy. Actual declaration,
  redraw/staging/play or abandonment, payment, layout and reload are exercised
  through the UI. No retries or deadline changes.

## Publication

Source `385d5d6a3a537738a2d202b1abee1e7bd996168f` is published as
**v1.0.261008-20**, built and tagged at
`ddded601efd5ece660b90b4c83182bd0c382cb03`.
[Workflow 37765528097](https://github.com/evgenyvinnik/tensho-web/actions/runs/37765528097)
independently passes **2,757/2,757 tests in 198 files**, build and deployment.
Build job: `113272134255`; deploy job: `113272872260`.

Hosted release manifest, remote tag and runtime version agree. The entry is
`assets/index-BQ9Y0vuj.js`; the live portrait matches the SHA-256 above.
All **eight hosted EN/ES complete/abandon journeys pass** on desktop and 320px
touch, without retries or deadline changes. They verify loaded artwork, visible
warning/confirmation, read-only inspection, focus restoration, real declarations,
redraws and scoring, abandonment without refund/redeclaration, and exact reloads.
These are fresh-context replays, not historical installed-PWA migration tests.
Both owned local verification servers were stopped; the pre-existing server on
port 4173 was left untouched. Main was fast-forwarded to the auto-version commit.

## Remaining scope

This closes an unreachable mechanic and two forecast mutations, not proof of
organic full-hand accessibility, pledge balance, player enjoyment, native-speaker
review, Safari/physical-device layout, or whole-project completion. The 1 Gold
risk/reward is a documented design choice, not a demonstrated optimal price.
