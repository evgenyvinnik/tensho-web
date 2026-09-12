# Consumable targeting and confirmation

Updated September 10, 2026. This records the implemented interaction contract, not a claim that every consumable/build combination has been audited.

## What changed

The old gameplay popup attempted to use an item immediately when clicked, implicitly borrowing the gameplay selection. It offered no tile picker; failures from Seals and Scripts were silent. The replacement is **choose item → choose targets → confirm**.

- All three families use one native modal dialog, with illustrated item cards, a centered localized heading, a scrollable body, and a pinned Cancel/Use footer.
- Target selection belongs to the dialog. Inspecting an item, selecting targets, cancelling, or pressing Escape spends nothing and does not change staged gameplay tiles.
- Target tiles have complete, separate touch targets and numbered selection badges. Copy effects explain that target 1 becomes a copy of target 2.
- Concealed tiles retain face-down artwork and a generic accessible name. Merely opening or cancelling the picker does not reveal them. The existing successful-targeted-use reveal rule remains in place.
- Invalid counts and known effect-specific failures disable confirmation. The footer explains the reason before use. Failed effect execution leaves the dialog open with an error, retaining the item and its per-round allowance. After a successful use the dialog closes.
- Focus opens on Close, wraps within enabled dialog controls, and returns to the opener when possible. Native modal behavior makes the underlying game inert.
- Item names/descriptions use the existing translation library. Controls, family/count labels, Script penalty summaries, Omen protection, rank/suit failures, upgrade caps, reward capacity, missing Decrees/copy history, zero-gold effects, and concealed-outcome notices are supplied in all 13 locales. Unmapped engine errors still fall back to authored English; native-speaker review is outstanding.

## Authoritative rule fixes

`GameOrchestrator.validateConsumableAction` checks gameplay phase, ownership, remaining uses, target membership/uniqueness, authored target counts, and public-information effect suitability. The Seal, Script, and Orb systems expose pure validation used by both availability and execution. Shared context builders supply current capacity, gold, Decrees, and targets; validation does not execute effects or consume randomness.

| Rule | Current behavior |
| --- | --- |
| Exact targets | An Alchemist Seal needs exactly two distinct owned hand tiles. Missing, duplicate, excess, and non-hand IDs are rejected. |
| “Up to” targets | Manzu, Pinzu, Souzu, and Unity accept 1–3 tiles; Strength and Release accept 1–2. Explicit minimum-count metadata replaces the old exact-count interpretation. |
| Target order | Seals and Scripts receive targets in caller selection order, not their order in the rack. |
| Untargeted effects | Explicit nonempty targets are rejected, preventing unrelated concealed tiles from being revealed. Controller convenience methods only inherit gameplay selection when the item requires targets. |
| No-op rank/suit changes | If no selected tile can change suit or advance within ranks 1–9, the use fails without consuming the Seal. A mixed selection can still change its eligible subset, matching the existing effect behavior. |
| Script costs | The dialog shows the functional penalty, rather than flavor text such as “Rare find.” Active Omen protection is disclosed and is consumed only on successful use. |
| Orb levels | Successful use upgrades the authoritative yaku level and consumes the owned Orb once. Capped ordinary Orbs are disabled before confirmation. All-Yaku Orbs, the Void Seal, and the all-Yaku Script are rejected when every category is capped; partially capped all-Yaku upgrades remain valid. |
| Reward capacity | Decree-generating Seals and Scripts require an available Decree slot. Consumable-generating Seals may reuse their own consumed inventory slot; a full inventory does not incorrectly prevent this replacement. |
| Missing prerequisites | Decree-edition/copy effects require an owned Decree. The Fool requires a successfully used Fate Seal or Celestial Orb in this run. These failures preserve the item, allowance, Script penalty state, and Omen protection. |
| Zero-gold effects | Hermit/Balance are rejected when the current public state would grant no gold, rather than being consumed for nothing. |
| Concealed targets | Suit/rank suitability is not inspected when a selection includes concealed tiles. Confirmation remains available with a localized uncertainty notice; only execution checks the actual effect. Rejected use retains the concealed state and item; successful targeted use reveals the affected targets under the existing rule. |
| Chance effects | A valid Fortune use can still roll no edition and consume the Seal. Inspection does not roll, predict, or retry that chance. Missing Decrees are a known prerequisite failure and do not consume it. |

Availability is a known-failure check, not a guarantee of a beneficial outcome. Concealed identity and random outcomes remain unresolved until confirmation. This pass does not reject every possible redundant enhancement or identical-copy effect, or simulate future draws. The Fool's eligible history is now aligned with the item library, as recorded below. Do not describe the picker as predicting every possible outcome.

## Fool copy-history follow-up

The item library explicitly names Fate Seals and Celestial Orbs as the Fool's
eligible source families. The runtime previously recorded successful Scripts,
so a Script could replace an eligible source or make an otherwise unusable Fool
create a Script. Four failing regression checks reproduced this mismatch.

- Successful Seals and Orbs establish the source. A Script neither establishes
  nor replaces it. A defensive guard in the history setter also protects
  alternate callers; the legacy consumable store now records Orb history in
  both its state and its Seal system, and leaves it unchanged after Scripts.
- Failed uses, inspection, selection, and cancellation do not replace history.
  History survives a round boundary and resets with a new run.
- The dialog says which localized item will be created. With no eligible
  history, it specifically names the two eligible families rather than telling
  the player to use any consumable. The new label and family placeholders are
  present in all 13 locales.
- Creation still uses the source's catalog definition with a fresh instance ID,
  Base edition, and unused state. It does not reuse an inventory instance or
  execute the copied item. For example, creating an Orb does not upgrade its
  Yaku level until that Orb is separately used.
- Existing self-copy semantics are retained: a successfully used Fool is itself
  the last Fate Seal. Another Fool can therefore create a fresh Fool. The item
  library does not state an exclusion. Each confirmation still spends the
  ordinary allowance; replaying the old consumed instance ID is rejected.
  Excluding self-copy would be a separate design change, not part of this
  family-eligibility correction.

`src/game/ConsumableCopyHistory.test.ts` covers eight cases: Script-only
history, intervening Scripts after each eligible family, direct-setter defense,
fresh-instance/self-copy costs, round/new-run lifetime, and both legacy-store
history states. The English and Spanish browser scenarios use all three
families through the rendered controls, inspect/cancel the preview, and verify
that confirmation creates the named fresh Orb without granting its upgrade.

## Unity Honor-conversion follow-up

Unity previously changed the suit to Wind but retained the numbered rank and
red-five flag. Regression tests reproduced nonexistent Wind ranks 5–9. The
library specified Honors without a rank mapping; the runtime already selected
Winds and produced valid identities for ranks 1–4. The completed rule preserves
those results and cycles higher ranks through the same four identities:

| Original suited rank | Wind |
| --- | --- |
| 1, 5, 9 | East |
| 2, 6 | South |
| 3, 7 | West |
| 4, 8 | North |

This deterministic mapping is an explicit completion of the unspecified rule,
not a claim that the original design documented it. It uses no random draw.
Unity still accepts one to three targets and changes only eligible suited tiles;
existing Honors/bonus tiles are unchanged. Physical IDs, enhancements, Seals,
and editions survive. A red five loses its aka-dora flag when it becomes a Wind;
that is separate from the Red Seal modifier, which survives.

The pure `src/core/tileTransformations.ts` helper is shared by settlement and
the consumable policy. The dialog derives its four illustrated columns from
that same rule, using existing Wind artwork and translated names. This is a
static public legend, never an inspection of hidden target identities. Unity's
name, description, and legend heading are supplied in all 13 locales; this does
not imply that every other item description is localized.

Verification on September 10:

- Eleven orchestrator cases cover all nine source ranks across hand/wall/template,
  modifier preservation, no randomness, a real scoring triplet, and a throwing
  concealed-tile proxy. Four pure-helper cases exercise the full suit/rank matrix,
  unchanged Honors/bonus tiles, mapping completeness, and invalid-input guards.
- The policy now recognizes a high-rank conversion that connects to an existing
  Wind; locale checks require the rule and all four Wind labels in every locale.
- Both browser configurations pass the Spanish 320×568 flow: decode the four
  illustrations, inspect/select/cancel without mutation, confirm a red-five and
  concealed-nine conversion, and play the resulting East pair for points.
  Both screenshots were inspected: the guide fits and Cancel/Use remain pinned
  while targets scroll. There are now thirteen consumable scenarios per browser.
- Full unit/component suite: **676 tests in 57 files passed**. Strict TypeScript,
  the Pages-base build, and targeted ESLint passed. The full browser run was
  **167/168 (12.8 minutes)**: the unrelated desktop Mega pack scenario exceeded
  its 30-second test limit. Its trace shows reward settlement and arrival at
  gameplay, but the run is still recorded as a failure. Three unchanged isolated
  repetitions then passed in 25.9 seconds total; the timeout's cause is unproven.
  Original traces/screenshots are retained locally under
  `/tmp/tensho-unity-verification-SOOXrS/full-suite/` (temporary, not repo assets).

The September 9 balance artifacts remain pre-Unity source snapshots. Current
commands may produce different results now that high-rank conversions are legal
and the policy can select them; their stored measurements were not rewritten.

This does not change transformation lifetime or retroactively repair old invalid
tiles. The separate red-five rank-change defect found during this audit is
corrected in the follow-up below.

## Physical rank-conversion follow-up

Strength and Ouija previously retained `isRed` after changing a red five to
another numbered rank. Twelve failing regression cases reproduced this across
all three suits for Strength, a mixed Strength selection, and all eight non-five
Ouija outcomes. Ordinary four-to-five and five-to-five behavior already worked.

Both settlement paths now use `convertSuitedTileRank`. It preserves suit,
physical ID, enhancement, Seal, and edition, but keeps the aka-dora flag only
when an already-red tile remains rank five. An ordinary tile becoming five does
not gain red status. Existing Honors/bonus tiles are unchanged; invalid numbered
target ranks are rejected. This concerns physical transformations, not temporary
scoring stand-ins such as Transmuter. It does not change transformation lifetime
or migrate pre-existing malformed tiles.

- Fourteen engine cases cover the three suits, a normal four becoming five,
  mixed eligible/rank-nine targets, all nine Ouija ranks, and hand/wall/template
  identity and modifier preservation. Strength takes no random draw. Ouija still
  draws one rank and applies its one-time hand-size penalty, including the
  existing separate random choice of a tile to move out of the hand.
- The initial Ouija test incorrectly expected only one total random call;
  inspection confirmed the second call is its authored hand-size penalty. The
  fixture now controls those streams separately and asserts both calls, the
  13-tile hand, consumed item, and rejection of a second use. No penalty was
  removed to make the test pass.
- Three additional pure-helper cases cover every source/target rank in all
  three suits, no-op object identity, unchanged Honors/bonus tiles, and invalid
  targets. The helper suite now contains seven cases, including the Unity rules.
- All **693 unit/component tests in 58 files**, strict TypeScript, targeted lint,
  and the Pages-base production build passed. All **28 consumable browser checks**
  passed without retries (54.1 seconds). The new desktop/mobile 320×568 scenario
  verifies cancellation preserves the red five, confirmation spends the item
  once, and the rendered tile's accessible image name is an ordinary six.

At this checkpoint, the focused browser run did not replace the preceding
**167/168** full-suite result or resolve its shop timeout; the then-expanded
170-check suite had not yet run in full. The subsequent payout/animation pass
ran **178/178** successfully, including all consumable scenarios. See the
[current verification ledger](IMPLEMENTATION_WRAP_UP.md); historical timeout
causes are not inferred from later passes.

## Verification and retained findings

- Earlier Fool checkpoint: **628 unit/component tests in 54 files**, strict TypeScript, the Pages-base production build, targeted ESLint, formatting, and **166/166 desktop/mobile browser checks** passed without browser retries. The full browser run took 10.0 minutes. Four new checks cover the English/Spanish copy-preview flow on both browser configurations; that checkpoint contained twelve consumable scenarios per configuration. The earlier four failing history tests are retained as regressions and now pass.
- Earlier preflight checkpoint: **620 unit/component tests in 53 files**, strict TypeScript, the Pages-base production build, targeted ESLint, and **162/162 desktop/mobile browser checks** passed without browser retries. That full browser run took 4.6 minutes. Both 320×568 Spanish screenshots were inspected: the reason and both footer actions remain visible while targets scroll independently.
- `src/game/ConsumableAvailability.test.ts`: 21 additional checks cover ordinary/all-Yaku caps, visible suitability, full reward capacity, reuse of the consumed inventory slot, missing history/Decrees, zero-gold effects, chance non-speculation, and failure preservation of RNG/events/penalties/Omen state. A throwing proxy proves public validation does not read a concealed target's rank, suit, or suitedness.
- At the preflight checkpoint, the browser file contained ten scenarios per browser: the seven original flows plus full Decree capacity, a missing-Decree Script, and concealed valid/invalid suitability. The existing Spanish no-op and capped-Orb flows assert disabled confirmation and the localized reason before any attempted use.
- The first full unit attempt in this checkpoint passed 619/620 but timed out on the paired CLI simulation at the five-second default. That integration test runs two subprocesses, each already bounded at twenty seconds. Its outer limit is now 45 seconds, with all determinism assertions and subprocess bounds retained; the final full run passed. This is not a simulation performance guarantee.

Earlier targeting checkpoint (retained history):

- `src/game/ConsumableTargeting.test.ts`: 19 engine checks cover six up-to definitions, five invalid target cases, four no-op cases, copy order, untargeted concealment, Script counts/limits, and Orb use/phase.
- `e2e/consumables.spec.ts`: seven scenarios on both desktop and mobile cover real shop purchase followed by use; staging/cancellation/focus/concealment; copy order; Spanish 320×568 no-op recovery; Script effect plus penalty; Orb upgrades/cap errors; and protected-Script cancellation/commit.
- All 14 new browser checks passed within the final 126-check full browser run (which also includes the new artwork checks). Screenshot inspection confirmed that Spanish error feedback and both action buttons fit a 320×568 viewport, while the target grid can scroll independently.
- Browser testing exposed focus leaving the control cycle at the last button; explicit Tab/Shift+Tab wrapping fixed it without weakening the assertion.
- An initial acquisition fixture incorrectly replaced the wall with only fourteen tiles, leaving no playable deal after the dead-wall reservation. The fixture now preserves the full wall. This was not evidence of a production purchase bug.
- A full unit attempt encountered worker-start failures and timeouts during heavy host load. It is not counted as successful verification. The final bounded-worker run passed 520 tests across 46 files, with strict TypeScript and the Pages-base production build also passing; see the wrap-up ledger.

## Still open

The systems document says Fate Seals affect only the current hand and never change wall composition, while existing runtime behavior and regression tests persist tile changes into `wallTemplate`. This pass preserves that behavior rather than silently retuning the game. Reconcile the intended lifetime of changes across the rules, item descriptions, and implementation before closing the broader mechanics audit.

This pass does not establish balance, exercise every generated-item combination, or replace later-round, Act 8, Endless, and resource-aware simulation coverage. See [implementation wrap-up](IMPLEMENTATION_WRAP_UP.md).

The Fool family mismatch recorded at the preflight checkpoint is corrected in
the follow-up above. A [conservative consumable policy and matched-seed comparison](CLASSIC_CONSUMABLE_BALANCE.md)
now exercise real use paths. Its unpriced destructive/Script strategies, build-aware
shopping, and named-Yaku pursuit remain open; these use-path tests do not establish
complete progression balance.
