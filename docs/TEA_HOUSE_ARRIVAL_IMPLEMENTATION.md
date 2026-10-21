# Tea House arrival: pay toasts, inline upgrades, Orbs used at once

October 17, 2026. Replaces the Tea House's top section (the round receipt with
its chips, savings coach and next-round line), the Decree compare hint, and the
Yaku upgrades popup, and changes how a bought Celestial Orb works.

## What the player sees

- **The pay arrives.** The Tea House opens on the round's Gold arriving rather
  than a receipt. One toast per source slides into the top-right corner under
  the header — the clear, interest, Decrees, Gold tiles, any reward adjustment,
  rentals charged (flying the other way) and a swift-clear Omen — its coins fly
  into the purse, the purse bumps, and the balance counts up as each lands.
  Toasts fade on their own. Sources that paid nothing are not shown; the clear
  always is. Reduced motion shows every toast at once with no coins.
- **No repeats.** The Act/round heading, the "Next: … target" line, the
  balance before/after and the "Next cash-out" interest coach are gone. The
  interest rule and the arrival itself are explained by the Tea House title's
  help, which also now holds the Decree hint ("open a scroll to read its rules
  or sell it") that used to sit above the build.
- **Yaku upgrades inline.** The build panel shows the run's upgrades as a row
  of tokens with their levels (the same token as the table's rail). The row is
  absent until an Orb has been used; there is no popup and no empty-state
  prose. A family that rises while the shop is open flashes once.
- **Orbs are used the moment they are taken.** Buying an Orb, or choosing one
  from a Blessing Pack, applies its upgrade at once and nothing waits on the
  rail. A reveal then shows the family rising to its new level with the bonus
  a matching score now earns (Black Hole lists every family). An Orb whose
  family is already at its maximum level cannot be bought; a pack choice needs
  a free level per copy chosen. Orbs created during a round still wait on the
  rail for the player's own tap.

## Where it lives

- `src/components/shop/CashOutToasts.tsx` and `cashOutEntries.ts`: the toasts
  and their schedule; `cashOutArrival.ts` remembers (per tab) which settlement
  was already shown, so a reload or a trip to Settings never pays the same
  Gold into the purse twice on screen. The shop screen shows
  `gold − pending` in the header until every toast has landed; the engine's
  balance is never changed by the presentation.
- `src/components/shop/YakuUpgradeRow.tsx` and
  `src/components/gameplay/YakuUpgradeToken.tsx`: the inline row and the token
  it shares with `CollectibleRail`.
- `GameOrchestrator.applyCelestialOrb` applies an Orb without holding it and
  announces `consumableAcquired` then `celestialOrbUsed`; the event now carries
  `levels` (every family changed, from → to) and `onAcquire: true`, which a
  rail use never sets even for a bought Orb an older save still holds.
  `ShopSession` routes Orb rewards
  through it and refuses capped Orbs with the new `maxLevel` reason, simulated
  on a detached copy of the levels so two pack copies need two free levels.
- `src/game/orbRevealQueue.ts` and
  `src/components/effects/CelestialOrbReveal.tsx`: the reveal, queued only
  for Tea House uses that changed a level, cleared on load.

## Consequences worth knowing

- The Observatory Charter pays for Orbs **held**; bought Orbs are no longer
  held, so it now rewards only Orbs created during a round (for example by a
  copying Seal). Its rule text is unchanged.
- The achievement and unlock counters still see both acquisition and use.
- Removed locale keys: `shop.payout.{heading,clear,interestBlocked,
  interestCap,interestSave,nextRound,nextAct,balance}`, `shop.build.help`,
  `shop.ui.subtitle`, `yakuUpgrades.{summary,intro,baseline,empty,help,note}`.
  Added: `shop.help.build`, `shop.kinds.orbHelp`, `orbReveal.{used,title}`;
  `shop.help.cashOut` and `progressiveHints.shop.content` reworded.
