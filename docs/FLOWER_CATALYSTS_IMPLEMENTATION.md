# Flower-paid Decree catalysts

October 7, 2026 (October 8 UTC) — published and verified in **v1.0.261008-1**.

The delegated choices are in [the decision log](RULE_RESOLUTION.md). This is
the optional one-Flower payment described by the Yaku Mutation Decree draft,
not the separately authored two-Flower Yakuman Succession activation.

## Connected rules

- Direct offers for Tanyao Dispensation, Yaku Amplifier and Yaku Nexus accept
  either the quoted gold price or one explicitly chosen owned Flower. Eligibility
  follows real rule effects, not the broad presentational YakuDoctrine category.
- Opening the illustrated chooser, selecting a Flower, and cancelling are
  read-only. Confirmation rechecks ownership, offer availability, the resulting
  Flower count and resulting Decree capacity before any payment.
- Flower payment spends zero gold, counts one purchase and grants zero resale
  value. Editions and stickers survive; Rental remains a future obligation.
- The consumed type loses its powers until recollected. Current held counts
  govern set bonuses: four-to-three loses double effectiveness, three-to-two
  locks Flower-powered acquisition, two-to-one loses the bonus Decree slot.
  Negative capacity is included in validation; owned Decrees are never deleted
  to force an otherwise illegal trade through.
- Earned awakening and rebloom eligibility survive consumption and exact reload.
  Optional saved distinct-type history preserves the four-type achievement even
  when the types are not held simultaneously. Old history-free saves round-trip
  unchanged. Actual draw/profile integration has a regression test.
- Stock already generated stays fixed. Subsequent purchases use current Flower
  eligibility, and rerolls generate from that count. A pre-generated pack with
  every choice now Flower-ineligible cannot charge; mixed packs still work and
  explain a rejected choice without mislabeling it as an inventory problem.
- Thirteen locales include the payment choice, consequences, capacity failure,
  confirmation and receipt. The chooser reuses the existing four generated
  Flower portraits; this checkpoint does not claim another image generation.

## Local evidence

- TypeScript passes. Focused engine/chooser/card/pack/rebloom batch passes
  **35/35**. Two additional engine cases cover mixed-pack settlement and retained
  Holographic/Rental modifiers; the final engine file passes **16/16**.
- Full two-worker regression passes **1,955/1,955 in 163 files**, before those two
  additional cases. Do not present this as a full 1,957-case run.
- Both initial and strengthened native browser batches pass **4/4** without
  retries or changed deadlines: English/Spanish desktop and 320×568 touch.
  Controlled fixtures enter a genuine shop phase after a winning play. They
  prove zero-gold alternative access, explicit selection, capacity rejection,
  no-op cancellation, exact-copy sale, zero-gold payment, zero resale, once-only
  purchase, lost bonus slot, history/awakening retention, exact reload and the
  next round. This is a targeted transaction journey, not an organic balance run.
- Mobile screenshots were inspected for portrait/name wrapping, scrollable
  consequences and readable confirmation buttons. Every displayed portrait
  decodes at 512px; dialog/document checks find no horizontal overflow. No
  native-speaker or physical-device review is claimed.
- Pages-base production build and all **13 release checks** pass. Repository
  lint completes with zero errors and 211 existing warnings.
- Built-production replay also passes **4/4**, loading the captured v2 envelope
  and built assets only, with no source imports, retries or changed deadlines.
  Final touched-test lint and `git diff --check` pass.
- Logs/reports: `/tmp/tensho-catalysts-ui-final.log`, `...-core-final.log`,
  `...-full.log`, `...-native.json`, `...-native-final.json`, `...-build.log`,
  `...-lint.log`, `...-release.log`. Captured v2 replay envelope:
  `/tmp/tensho-catalysts-replay.json`.

## Published verification

- Implementation commit: `ca3c08d64e5b3a86a37b2021a23e95f46bfb97b1`.
- [Release workflow](https://github.com/evgenyvinnik/tensho-web/actions/runs/37706584220)
  passes independently: **1,957/1,957 tests in 163 files**, all **13 release
  checks**, build and deployment. Build job `113082278390`; deployment job
  `113082978504`. No failed-job retry was needed.
- **4/4 hosted journeys pass**, English/Spanish desktop and 320×568 touch,
  without retries/deadline changes. They use the captured save, public built
  assets and actual UI transactions, not development imports. Spanish phone
  confirmation screenshot inspected; long copy/buttons wrap inside the frame.
- Public `release.json`, runtime version and remote `v1.0.261008-1` tag agree
  on `c1ef96ed50272254816a87d940191ae1146ab529`. Entry point:
  `/tensho-web/assets/index-DuSynnzS.js`; lazy shop chunk:
  `/tensho-web/assets/ShopScreen-dvQN4Ea_.js`.
- The initial provenance probe incorrectly expected the shop's UI marker in
  the entry chunk. Corrected it to follow the actual lazy ShopScreen chunk;
  no runtime correction was necessary. Keep this distinction from a stale or
  failed deployment in the record.
- Reports, screenshots, captured envelope, complete CI output, deployment watch
  and provenance log: `/tmp/tensho-catalysts-evidence-cQpNRW`.
  Both owned local test servers (4200/4201) were stopped; the pre-existing 4173
  server was untouched.

## Remaining scope

Full Frostbite behavior, the separate
Yakuman Succession item, Fate Seal/Negative lifetime, other catalog reconciliation
and organic balance/newcomer fun assessment retain their previous scope.
