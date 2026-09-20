# Secondary Decree scoring: Yaku and retriggers

September 19, 2026. Local implementation checkpoint; broader completion remains open.

## Confirmed defects

`GAME_SYSTEMS.md` states that Frostbite halves Decree effects. Although the main
point/multiplier and gold paths had been corrected, Yaku Amplifier and Yaku Nexus
still applied their full benefit. Mandate-disabled Yaku powers, tile retriggers
and retrigger amplification also bypassed suppression in these secondary paths.
Ten of twelve new integration cases failed before the correction.

The engine now calculates a baseline Yaku product after Mandate filtering/tier
reductions and table bonuses, then a Decree-boosted product. Frostbite interpolates
only the difference by `0.5 ** frostbiteCount`. The normal, unfrozen path keeps
the original boosted product directly. Native Yaku and table benefits remain
intact; tier identities stay discrete. Celestial Orb and other scoring layers
remain outside this Decree-only difference. Preview and payment use the same
calculation without leveling Yaku during previews.

Disabled IDs now reach Yaku, retrigger and retrigger-amplifier queries. These
paths resolve copy effects using physical owned order, so a disabled neighbor
does not make Blueprint skip to a different power. Echo Dimension amplification
itself can be copied, and its copies stop contributing when the source is
disabled. One-level copy resolution still prevents cycles.

## Verification

Initial new integration run: **2 passed / 10 failed**. After the correction,
the new cases plus prior Frostbite/gold/Decree regressions passed **85/85**.
The expanded new file then passed **16/16**, including an actual Crimson Heart
activation/deactivation, The Arm's tier reduction, Dragon's Den's native Yakuman
benefit, no-Yaku tactical plays, physical-copy suppression and copied amplifier
counts. The full suite then passed **945/945 in 88 files**, 118.54 seconds.
Strict TypeScript, targeted ESLint and whitespace checks passed.

The new browser scenarios deliberately configure Decrees and a complete deal,
then exercise actual Stage Hand and confirmation controls in English and Spanish,
desktop and 320px touch contexts. The first hand pays 967 with Amplifier, Nexus
and Frostbite; the second pays the native 585 while Crimson Heart disables the
single Amplifier. These fixtures do not demonstrate natural acquisition frequency,
balance or newcomer comprehension.

The browser set passed **18/18**, 121.53 seconds, one worker, no retries and no
deadline changes. It includes the four new secondary-scoring journeys, four
flat-point Frostbite journeys, four gold-settlement journeys and six existing
complete/tactical scoring journeys. Spanish desktop and 320px touch paid-score
and disabled-inspector screenshots were reviewed. Existing decimal/currency
notation and large-target hint localization issues are not fixed by this rule
change. The fixture server was started fresh after all source edits, avoiding
the duplicated singleton URLs documented in the preceding economy checkpoint.

Artifacts: `/tmp/tensho-secondary-hhayqK/browser.json` and `browser/`. The owned
server is stopped. The Pages-base production build passed: 339 modules, entry
`index-CKgq6QCj.js`, 266 precache entries / 62,682.12 KiB. Existing large-chunk and
stale Browserslist warnings remain. This is not live deployment/PWA-upgrade
verification.

## Still open

Frostbite's fractional **retrigger** semantics are not implemented by this change.
The existing scoring engine expands whole trigger counts; the user has been asked
whether a single extra trigger should retain half of its reward or round down to
zero triggers. No answer is assumed. The subsequent
[copy-rule checkpoint](DECREE_COPY_IMPLEMENTATION.md) fixes physical-neighbor
resolution in ordinary flat/multiplier scoring and connects copied rack,
discard and extra-hand benefits and costs. Binary powers, Treasure Hunter timing,
remaining copied-effect lifecycles, other Season/Flower requirements, human/device testing,
remaining localization and deployment remain open.

No additional bitmap is needed for this rule change. Existing Decree/Season art
and the newly generated [Wealth Engine portrait](DECREE_ECONOMY_IMPLEMENTATION.md)
remain connected. No commit, merge, push or deployment has been performed.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-secondary-hhayqK/browser.json npx playwright test e2e/secondary-scoring.spec.ts e2e/frostbite-score.spec.ts e2e/frostbite-gold.spec.ts e2e/score-settlement.spec.ts --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-secondary-hhayqK/browser
VITE_BASE_PATH=/tensho-web/ bun run build
```
