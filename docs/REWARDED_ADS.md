# Rewarded ads: an emergency Turn for an ad

## What the player sees

On **Red Stake and above**, from **Act 2**, the last Turn of a round can be
extended: REDRAW's slot offers "+1 Turn" for Gold (10 × Act, doubling with
each Turn bought in the same round). When the player **cannot afford it**,
and an ad is ready, the slot instead offers "+1 Turn · Watch ad". Watching
to the end grants the Turn without spending Gold. Closing the ad early
grants nothing.

- At most **one ad Turn per Act** (`AD_TURNS_PER_ACT` in
  `src/game/playRules.ts`). The engine records it in the saved run
  (`adTurns`), so reloading cannot reset it.
- The offer appears only once the provider reports an ad is ready. With no
  ad, or ads switched off, the player simply sees the Gold price, disabled.
- White Stake and Act 1 never show it.

## How it is built

- `src/ads/rewardedAds.ts`: the provider. The game only asks whether an ad
  is ready for a placement (`emergency-turn`) and whether it was watched.
- `src/hooks/useRewardedAd.ts`: asks for an ad when the player becomes
  eligible; pauses music during the ad.
- `GameOrchestrator`: `getEmergencyTurnOffer().adAvailable` and the
  `adTurn` action grant the Turn. The UI calls it only after a full view.
- `SimulatedAdOverlay`: the stand-in ad used in development and tests.

## Configuration

Chosen at build time with Vite environment variables. **Default: off.** No
ad is offered and nothing is loaded from a third party.

| Variable              | Value      | Effect                                                  |
| --------------------- | ---------- | ------------------------------------------------------- |
| `VITE_REWARDED_ADS`   | `google`   | Google H5 Games Ads (Ad Placement API)                  |
|                       | `simulate` | Local stand-in ad (a few seconds, then a reward button) |
|                       | unset      | Off                                                     |
| `VITE_ADSENSE_CLIENT` | `ca-pub-…` | Your AdSense publisher id (required for `google`)       |
| `VITE_ADS_TEST`       | `on`       | Ask Google for test ads (`data-adbreak-test`)           |

Development and test builds (never production) can also switch to the
simulated provider from the browser console:

```js
localStorage.setItem('tensho-rewarded-ads', 'simulate') // then reload
```

## Going live with Google

These steps need the owner's accounts and decisions; none are done yet.

1. **AdSense account and H5 Games Ads approval.** Rewarded ads for web games
   use Google's H5 Games Ads (Ad Placement API). Check Google's current
   eligibility requirements and apply for `tensho.app`.
2. **ads.txt.** The site is served from the `tensho.app` custom domain, so
   add `public/ads.txt` with the line AdSense shows for your account
   (typically `google.com, pub-…, DIRECT, f08c47fec0942fa0`).
3. **Privacy policy.** The game has none today. Ads use cookies and device
   identifiers, so a policy disclosing them is needed before going live.
4. **Consent.** Serving ads to visitors in the EEA, the UK and Switzerland
   requires a Google-certified consent management platform; AdSense's
   Privacy & messaging tools can provide one.
5. **Build settings.** In `.github/workflows/deploy-pages.yml`, step
   "Build project site", add to `env`:

   ```yaml
   VITE_REWARDED_ADS: google
   VITE_ADSENSE_CLIENT: ca-pub-XXXXXXXXXXXXXXXX
   VITE_ADS_TEST: 'on' # remove once test ads work
   ```

6. **Test with test ads first**, then remove `VITE_ADS_TEST`.

The Google integration follows the Ad Placement API's rewarded flow
(`adBreak({ type: 'reward', beforeReward, adViewed, adDismissed,
adBreakDone })`) and is covered by unit tests against a mocked API. It has
**not** been exercised against live Google ads.

## Balance

Measured with `bun scripts/classic-balance.mts … --ad-turns` (every offered
ad treated as watched). See `docs/balance/2026-10-31-emergency-turn.md`.
