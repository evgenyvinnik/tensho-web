# Physical Decree copies and destructive Script targets

Updated September 29, 2026. Verified local checkpoint awaiting publication, not whole-project completion.

## Gameplay defects

The live inventory allowed duplicate catalog entries (including Ankh copies),
but actions used the catalog ID rather than the selected physical scroll.
Selling or changing the edition of a second copy could affect the first; an
Eternal first copy could block selling its ordinary sibling. Crimson Heart
recorded a catalog ID and suppressed both copies instead of one. Copied
Perishable stickers shared a mutable object: two copies advanced the same
countdown twice in one round and also mutated the original offer.

The audit exposed two related Script settlement defects. Hex applied Polychrome
but its destruction step had no retained-target ID, so it destroyed nothing.
Ankh retained every Decree with the chosen catalog ID, rather than only the
chosen original and its new copy. These do not require new design choices:
the existing definitions promise a single random target and destruction of the
other Decrees. Eternal protection and Omen of Ash still apply.

## Implementation

- Every acquired Decree receives a monotonically allocated `instanceId`.
  Copying an owned Decree allocates a new identity. Catalog `id` remains unchanged
  for artwork, localization, discovery, unlocks, shop eligibility and telemetry.
- Sales, edition changes, removals and the gameplay scroll callbacks target the
  physical instance. Legacy catalog-ID API callers retain first-match behavior;
  current UI controls do not use that ambiguous fallback.
- Crimson Heart and Amber Acorn record physical IDs. Main scoring, secondary
  scoring/copy targets, structural-rule checks and visible suppression use the
  same identity. Existing catalog-wide suppression in old saves is retained
  until its ordinary expiry; restoration does not invent which historic copy
  the old code intended to suppress.
- Hex retains its actual edition target. Ankh retains its chosen original and
  newly acquired copy. Destruction addresses each other physical copy separately,
  respects Eternal stickers, and removes each destroyed Negative copy's capacity.
- Acquisitions copy the mutable sticker; exported/restored Decree-system states
  are detached, so previews, copies and round timers cannot age another inventory.
- Saves retain IDs and the next allocation counter. Legacy saves without these
  optional fields migrate deterministically without consuming the gameplay RNG.
  Explicit Resume persists that migration atomically with the ownership claim;
  read-only menu inspection never rewrites a record. Failed writes retain the
  exact legacy save, and a competing tab cannot claim an obsolete observation.
  The public parser rejects duplicate/malformed IDs and invalid/reused counters.
  Reload cannot reuse a sold ID and accidentally revive a stale sale command.

Existing generated scroll and Script illustrations remain connected by catalog
ID, including face-down identity protection. Half Suited now has a distinct
generated portrait in the shared artwork lookup. Edition/sticker-detail
presentation remains a separate UI follow-up; this is not a claim that every
modifier is sufficiently explained.

## Half Suited artwork

The imagegen skill guided built-in generation of a transparent parchment scroll
with a half-brocade-wrapped ivory tile emblem, matching the existing jade, navy,
ivory and gold collection. The tool exposes no model identity or selector, so
use of a specifically named latest model cannot be independently verified.
The original is preserved; no existing asset was overwritten. The 512×512 alpha
WebP is **70,058 bytes**, converted with
`cwebp -q 90 -alpha_q 100 -m 6 -resize 512 512` and visually inspected.

- Project: `public/assets/illustrations/decrees/half-suited.webp`.
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-f39e398e-4a6d-4646-95ff-aefdfa352319.png`.
- Project SHA-256: `36f4cca4f6de68e4385217114ccc7318b0d37f01f1c8f2420d4acb6bd6d8ba6c`.

Exact final prompt:

> Use case: stylized-concept. Asset type: individual transparent illustrated Decree scroll portrait for Tensho, a mahjong roguelike inventory. Primary request: Half Suited, represented by one bold ivory mahjong tile whose lower half is wrapped in rich jade-green brocade embroidered with small golden circles, while its upper ivory half stays uncovered; a small fan of two ivory tile silhouettes behind it. Integrate this simple, instantly readable emblem as the central painted subject of an upright unfurled ivory parchment scroll. Style/medium: polished painterly fantasy inventory art, matching an established imperial Chinese scroll collection: deep jade cylindrical rollers at top and bottom, ornate warm-gold end caps, slim navy-and-gold fabric side borders, tiny red wax seal near lower corner, restrained turquoise cord tassels. Composition/framing: square canvas, full upright scroll centered, generous transparent outer margins, bold large central tile motif legible at 64px. Lighting: gentle gilded highlights and soft internal shading. Background: genuinely transparent alpha, no scenery, no floor, no external cast shadow. Constraints: no writing, text, letters, numbers, watermark, UI labels or outer card rectangle; no copied game logos; do not include a moon, coins or other competing emblems. The tile is half dressed in brocade, not broken. New standalone asset.

## Verification

The first six new regressions failed before implementation. They covered the
missing physical-ID contract, exact-copy sale/edition/removal, shared Perishable
timers, two-copy Crimson Heart suppression and durable allocation. A subsequent
integration pass reproduced three further failures: both duplicate bonuses still
scored under Crimson Heart (85 instead of 65), Hex left three Decrees instead of
one, and Ankh left four instead of two. All are now corrected.

The focused pre-expansion set passed **117/117**; its preceding run passed
113/114 because an older test expected Crimson Heart to report a catalog ID.
That assertion now checks the actual selected instance; its score/deactivation
assertions are unchanged. The expanded identity file passed **20/20**, including
legacy migration, strict parser failures, Ash/Eternal protection, Negative
capacity and detached Perishable clocks. Strict TypeScript, targeted ESLint
and whitespace checks passed.

The initial full regression passed **1,426/1,427** in 122 files (76.32s). The one
failure was Amber Acorn's older catalog-ID expectation, now updated to check
physical IDs while retaining seeded-order equality. The first browser attempt
could not start because port 4173 belonged to another server; that server was
left untouched. A separate owned server used port 4193.

The browser batch then ended **16 passed / 5 failed / 1 interrupted / 14 unrun**
(10.2 minutes). All four new desktop identity scenarios passed; two old
secondary-scoring expectations still named the catalog ID. Those expectations
now compare the acquired instance; the fixed 967/585 score assertions are
unchanged. Three mobile resume cases timed out as measured host load rose from
about 5 to over 90. This correlation does not establish the cause of every
timeout. The fourth mobile case was interrupted deliberately to reduce
contention; both the owned batch and server reached terminal status. No deadline
was widened and no unrelated server/process was stopped.

September 29: two more regressions reproduced acceptance of partially stripped
new save identities. The parser now accepts either the complete old shape or
complete physical-identity shape, not missing IDs/counters in a new checkpoint.
Legacy migration remains supported. The all-catalog validator fixture now models
distinct physical copies rather than cloning an instance ID or omitting IDs.
The expanded identity/art/save subset finished **98/99** in 181.54 seconds:
all 22 identity and 50 save-parser cases passed, as did the Half Suited portrait
rendering/concealment and actual alpha-WebP checks. The remaining River Tax
concealment case timed out at its unchanged five-second deadline. Host load
reached over 790 during this run. This is not a green test batch; its report is
`identity-art-units.json`. Final strict TypeScript, targeted ESLint and whitespace
checks then passed. The Pages-base production build passed (361 modules,
274 precache entries). A production-browser check then exposed a real migration
defect: restored engine IDs existed only in memory while Resume reported the
legacy disk snapshot as saved. Three new repository/coordinator regressions all
failed before repair. Migration now occurs under the existing Web Lock, in the
same validated atomic write as the explicit ownership claim. All **106/106**
identity/parser/repository/coordinator tests then passed, including quota failure,
retry, stale competing claims, unchanged RNG and no replayed gameplay events.

The final full regression passed **1,435/1,435 in 122 files** (95.42 seconds),
including the earlier timeout cases with unchanged deadlines. Strict TypeScript,
targeted ESLint, whitespace and **13/13 release-workflow tests** passed. The
rebuilt Pages-base production bundle passed. Its desktop and 320×568 touch
checks passed real Classic play/reload, durable legacy duplicate migration,
exact-copy sale/payment/capacity, Save and leave/Resume, and Table Loop
play/reload, with no JavaScript errors. The served Half Suited asset hash matches
the checked-in output. Local build checks do not certify public deployment.

The expanded browser regression initially finished **37/38**: a documentation
edit during the run caused Vite to reload the page (`12:33:07`,
`docs/DECREE_IDENTITY_IMPLEMENTATION.md`), discarding the Spanish Sacrifice
test's temporary fixture. This was verification interference, not evidence for
changing the product or extending deadlines. With the entire repository frozen,
the unchanged batch passed **38/38** in 2.1 minutes. Reports are
`browser-final.json` (retained failure) and `browser-frozen.json` (green rerun).
The production checks were also repeated with popup opacity settled and explicit
viewport bounds; both desktop and touch passed. The settled 320px portrait and
sale popup were visually inspected and fit without clipping.

Commit, independent CI and public deployment verification are pending.
Browser fixtures establish duplicate ownership and Script availability, then
exercise actual sell/use/confirm controls and durable reload. They do not prove
organic duplicate acquisition frequency, balance or newcomer comprehension.
Artifacts are recorded under `/tmp/tensho-decree-identity-xV21C1/`.

## Separate scoring decisions

The same audit found two unresolved authored-condition mismatches:

- Perfectionist (`decree-perfectionist`) promises ×3 if the first hand wins,
  but `first_hand` only checks `handsPlayed === 0`.
- Supernova (`decree-supernova`) promises ×2.5 if twice over target, but
  `double_target` checks the round score before the current hand. The ordinary
  round ends as soon as its target is reached, so this condition is not normally
  attainable on the next play.

A user question proposes evaluating both against the current hand without either
conditional bonus (first-hand target clear / twice-target hand score). This needs
an explicit non-circular qualification rule; no answer has been assumed and
neither rule is changed by this checkpoint. Other pending mechanics, full-project
integration, human playtesting and physical-device checks remain open.
