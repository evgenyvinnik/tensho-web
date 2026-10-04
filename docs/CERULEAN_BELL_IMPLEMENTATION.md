# Cerulean Bell: one current forced tile

User-confirmed October 3, 2026: keep only the latest forced tile, rather than
accumulating locks. This is a scoped mechanics correction, not completion of the
broader implementation audit.

## Behavior and recovery

Each draw cycle releases the previous lock and randomly selects one physical
tile from the current rack. The same tile can be chosen again. Multi-tile redraw
still invokes the existing single post-draw cycle. Locked tiles remain subject
to the real action validator.

Legacy Bell snapshots retain only the final insertion-ordered lock. Engine
restoration and durable saved-run claiming both normalize it, without consuming
RNG. Reading storage alone does not rewrite it. Failed claims preserve the old
record; a successful retry persists the normalized snapshot. Other mandates
are unchanged.

The boss badge now opens localized rules through the shared modal, with keyboard
dismissal and focus restoration. Bell has a generated portrait; all thirteen
locales describe the new rule. No claim of native-language editorial review.

## Regression evidence

Evidence root: `/tmp/tensho-hand-plan-8wXYR1`.

- Three failing-first Bell tests reproduced accumulated locks and legacy restore
  behavior. The final tests cover twenty draw cycles, six real exchanges,
  strict saved-state validation, exact restore, and a subsequent legal play.
- The saved-run test covers non-mutating reads, failed writes and successful
  durable retry. Focused mechanics/save/legality checks passed 50/50.
- UI, locale, asset and mechanics checks passed 78/78 before the drag follow-up.
- Native browser testing found a separate drag-release defect: React's last
  rendered move could precede the actual release position. A failing-first unit
  reproduces this; drop targeting now uses the pointer-up coordinates. Focused
  drag/Bell checks passed 25/25.
- Final browser batch passed 12/12: English, Spanish and Russian desktop/touch
  Bell journeys plus resource cycling. Six additional interaction regressions
  passed. Tests use actual pointer/touch drags, six exchanges, saved-lock checks,
  reload, rule dialogs and legal play, with no retries. Russian 320px screenshot
  was visually inspected; this is browser emulation, not physical-device review.
- TypeScript, targeted TS/TSX lint, 13 release checks and the Pages-base
  production/PWA build passed. Standalone analysis commands were separately
  typechecked; the repository lint configuration ignores `.mts` files.
- Production bundle checks passed in four isolated desktop/touch × current/legacy
  save contexts: normalized claim, exact art hash/decode, dialog focus return,
  legal play, exact reload and zero page errors.

Retained failures: initial browser fixtures incorrectly supplied the rich mandate
definition where the strict round catalog requires its compact definition. A
later batch had save/locator failures during development-server changes; a fresh
server and imports before fixture mutation resolved them, but exact causality
for the old timeouts is not established. One draft test targeted a nonexistent
discard button and was corrected to the existing drag workflow. The native
batch then passed 10/12 and exposed the real drop-coordinate bug above.
Original logs/screenshots remain in the evidence root, including `bell-before.log`,
`drag-before.log`, `bell-browser*`, `bell-diagnostic`, `bell-clean-isolated`,
`bell-native`, and final `bell-release` artifacts.

Final local suite: **1,575 passed across 135 files**, with one worker-start timeout
for the five-test `BeginnerGuide.test.tsx` file (not an assertion failure). The
run exited 1 after 1,653.52 seconds. Its unchanged isolated recheck passed four
tests but the first pair-example test exceeded its original 5-second deadline
(20.346 seconds); that run also exited 1. Read-only host inspection showed load averages of
651.45 / 574.65 / 412.93. This supports contention as a concern, not proof of the
exact cause of every earlier timeout. No unrelated processes were interrupted
and no deadlines were increased. Independent CI/deployment remains pending.
The related analysis and its retained diagnostic are in
[Classic hand planning](CLASSIC_HAND_PLANNING.md).

## Generated artwork

Asset: `public/assets/illustrations/cerulean-bell.webp`, 512×512 with alpha,
38,314 bytes. SHA-256:
`e78e49cdbb8ee9cf4cfb1df4199c7c53d2828825560dc82db4e08014b52cb135`.

Mode: new transparent-background generation through built-in image generation;
the tool exposed no model-version selector. Mechanical WebP conversion used
`cwebp -q 85 -resize 512 512`. Generated original:
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-e9196649-790c-483a-8077-04ad5ab5e004.png`.

Exact prompt:

> Use case: stylized-concept. Asset type: small boss illustration for Tensho mahjong roguelike. Primary request: one exquisite cerulean-blue temple bell with a short braided antique-gold hanging loop, sculpted gold rim and visible small clapper. Premium hand-painted East Asian fantasy board-game object illustration matching forest green, ivory and aged gold game UI. Glazed deep blue enamel with restrained gold filigree, warm soft highlights. Centered complete isolated bell, simple bold silhouette readable at 32–64px, square composition with generous transparent padding. Genuine transparent alpha background. No scene, floor, pedestal, frame, scroll, human, tiles, text, numbers, letters, calligraphy, logo or watermark.
