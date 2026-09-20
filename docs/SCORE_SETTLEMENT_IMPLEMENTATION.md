# Authoritative last-play score display

September 19, 2026. Classic scoring presentation; not a balance change or a claim
that the full project is complete.

Later September 19 follow-up: [In-flow tutorial guidance](TUTORIAL_CARD_IMPLEMENTATION.md)
removes the overlapping hint and fixes a subsequently reproduced normal-animation
case that dropped multiplier decimal zeros. The evidence below remains the
earlier settlement checkpoint, not the latest verification totals.

## Fixed behavior

The previous UI divided an already-paid hand score by the previous multiplier,
then multiplied the display again as individual Yaku reveal events arrived.
The original browser reproduction paid **585** but displayed **1,521**. Later
plays could inherit the earlier multiplier, and the panel's `points || score`
fallback could substitute cumulative round score for a genuine zero-point play.

The orchestrator now attaches an immutable settled equation to `handPlayed`:

`floor(subtotal × combined multiplier) + adjustment = paid total`

The subtotal includes the actual pre-multiplication bonuses. The combined
multiplier includes the scoring pipeline's Yaku, Flower, Season, Decree, Orb,
Charter and loss-prevention factors. The net adjustment reconciles Decay,
zero-flooring, Script/Shanten penalties, Omens and rounding with the actual paid
total. This is a net reconciliation, **not an itemized per-effect receipt**.
Preview, complete-hand payment and tactical payment use the same settlement.
Existing score calculations and reward amounts are unchanged.

`useScorePresentation` replaces the whole last-play equation atomically. Yaku
events still drive their reveals, not the equation's arithmetic. Consecutive
plays replace the animation timer; round start resets it and unmount cleans it
up. The result counter animates the authoritative total independently.

The panel distinguishes **Last play** from the cumulative round score. Nonzero
adjustments occupy a separate row. Its native **Exact values** disclosure now
also opens for ordinary scored plays, including zero-paid plays with positive
base points; it exposes full subtotal, multiplier, adjustment and total along
with target and round score. New labels have entries and integrity coverage in
all 13 locales. Native-speaker review remains open. Existing generated artwork
and colors are preserved; this data/presentation fix needs no new bitmap.

## Verification

- **869/869 full unit tests in 83 files** passed, one worker (32.27 seconds).
  New cases cover repeated complete hands, tactical and zero-paid plays,
  Season/loss-prevention factors, Script and stacked Omen settlement in both
  scoring paths, frozen receipts, preview/payment equality, Yaku event ordering,
  timer replacement/reset/cleanup, and separation from cumulative score.
- **14/14 targeted browser checks** passed (55.6 seconds), one worker, original
  timeouts and no retries. Eight existing layout cases cover Spanish 320px,
  Russian 390px and Japanese desktop widths, enlarged text, native exact-value
  disclosure and exact large-value payment. Six scoring journeys cover English
  and Spanish reduced motion plus English normal animation on desktop/mobile.
  Each uses actual stage/confirm controls: complete hand 585, tactical 45,
  Omen-boosted tactical 217, Decay-floored zero, then new-run reset.
- Screenshot review of that green run found a delayed first-move tip obscuring
  the normal-animation mobile result. The scoring fixture now explicitly uses
  the real **Don't show tips** button, then checks viewport visibility and hit
  testing at the result. **6/6 final scoring journeys** passed (42.8 seconds,
  no retries); the unobscured normal-animation mobile screenshot was reviewed.
  This does not fix or certify the tutorial overlay's general placement.
- Strict TypeScript, targeted ESLint, relevant-file Prettier and `git diff
  --check` passed. The initial new test fixture failed strict typing because
  `getState()` exposes readonly properties; explicit fixture-only state casts
  corrected this, without changing runtime encapsulation.
- The Pages-base production build passed: **338 modules**, entry
  `index-BteVLlE8.js` (750.87 kB / 227.35 kB gzip), **264 precache entries /
  58,601.54 KiB**. Existing large-chunk and stale-Browserslist warnings remain.

Current browser JSON reports and images are under
`/tmp/tensho-settlement-WXV3Q1/`: `browser` (initial 12 checks), `final-browser`
(14 checks) and `unobscured-browser` (final six). The original pre-fix temporary
trace directory no longer contains artifacts; the 585/1,521 reproduction is
historical tool evidence, not a retained trace available for fresh inspection.

These fixed-deal fixtures prove scoring/UI behavior, not acquisition frequency,
balance or human enjoyment. They do not cover every possible effect combination.
Full-repository browser, production-browser and release-workflow suites were not
rerun for this fix. The owned test server is stopped. No commit, merge, push or
deployment occurred. Tutorial placement, broader mechanics/localization,
newcomer playtesting, physical-device review and main/default promotion remain
open in the [wrap-up audit](IMPLEMENTATION_WRAP_UP.md#completion-audit-still-open).
