# First-win campaign: six Acts and a gentler finish

## Player decision

The player requested an achievable first win, less punishing White/Red late
game, better Decree synergy guidance, Tea House journey feedback, and a clear
celebration. When asked about length, they explicitly chose shorter normal
runs rather than retaining eight Acts.

Normal victory now requires defeating the **Act 6 Boss: 18 rounds**, down
from 24. The final Boss is a Showdown. Endless begins only after the player
opts in; subsequent Showdowns remain at Acts 8, 16, etc. Stakes are still
eight optional difficulty tiers, independent of the six-Act campaign.

## Target curve

Small / Large / ordinary Boss targets on White and Red:

| Act | Previous Small | New Small | New Large | New Boss |
| --- | ---: | ---: | ---: | ---: |
| 1 | 300 | 300 | 450 | 600 |
| 2 | 800 | 800 | 1,200 | 1,600 |
| 3 | 2,000 | 2,000 | 3,000 | 4,000 |
| 4 | 6,000 | 5,000 | 7,500 | 10,000 |
| 5 | 15,000 | 10,000 | 15,000 | 20,000 |
| 6, finale | 30,000 | 18,000 | 27,000 | 36,000 |
| 7, optional | 55,000 | 30,000 | 45,000 | 60,000 |
| 8, optional | 90,000 | 45,000 | 67,500 | 90,000 |

Score-target Mandates replace the ordinary Boss multiplier. Violet Vessel
still uses ×6: **108,000 at the new finale**, compared with 540,000 at the
previous Act 8 finale. Higher Stakes inherit the same gentler base and retain
their cumulative modifiers. Red still removes Small-round reward Gold; it
does not add a score penalty. Act 9+ retains the previous independent 90,000
scaling anchor, rather than silently halving late Endless difficulty.

## Same-seed policy check

40 seeds starting at 1, Green Felt, observed-build shopping, resources and
consumables enabled; no complete-hand pursuit. Commands:

```sh
bun scripts/classic-balance.mts 40 --build-shop --resources --consumables --table=green_felt --stake=1 --seed=1 --json
bun scripts/classic-balance.mts 40 --build-shop --resources --consumables --table=green_felt --stake=2 --seed=1 --json
```

| Configuration | White wins | Red wins |
| --- | ---: | ---: |
| Original eight-Act campaign | 13 / 40 | 10 / 40 |
| Gentler curve, eight-Act intermediate pilot | 22 / 40 | 19 / 40 |
| Final six-Act campaign with Act 6 Showdown | 22 / 40 | 23 / 40 |

The final policy reached Act 6 on 24/40 seeds on each Stake. These are
heuristic-policy outcomes, **not human win rates or evidence that Red is
easier than White**. Economy changes alter purchases and subsequent run
trajectories; a small paired seed set does not establish a universal ordering.
The shorter campaign and gentler curve should still receive newcomer playtesting.

## Guidance and presentation

- Tea House: cleared Act/round, campaign-position progress bar, and the next
  destination. Uses the engine's next-Act forecast, including Act-reduction
  Charters. Endless shows a secured victory instead of an impossible fraction.
- Optional Decree guide in the owned build and Codex: reliable +Points/+Mult
  early, growth before the finale, ×Mult amplification, matching conditions,
  and a worked arithmetic example. Collapsed by default; keyboard/touch usable.
- Table selection distinguishes table rules from Stake difficulty and
  recommends Green Felt / White for a first win.
- The existing illustrated victory landscape is retained. The results screen
  explicitly secures victory; Return to menu is primary and Endless secondary.
- All new guidance and updated victory copy is localized across 13 languages.

## Save and achievement compatibility

Existing wins are retained. Old in-progress Act 7/8 runs finish their current
Boss; they are not silently awarded a win on load. Saved targets and scores
are preserved, while newly generated Acts use the new curve. Old Act 8 wins
can still opt into Endless. Victory and cash-out cannot settle twice.

Normal win rewards and Stake unlocks work at Act 6. Ascending / Flower Pot
(reach Act 8), Omega (complete Act 8), and Stone Script (reach Act 12 plus its
purchase prerequisite) remain explicitly optional Endless milestones.
Charter Collector remains five purchases by the end of Act 5, as confirmed.

## Verification

- Full shared-checkout suite: **3,665 tests in 252 files passed**, with two
  workers and a 20-second per-test timeout on the busy local host.
- Desktop/mobile browser coverage: **14 journey/result-flow cases passed**;
  after the final compact victory/action-order adjustment, all four affected
  desktop/mobile victory cases passed again.
- TypeScript build, scoped lint, whitespace checks, production build under
  `/tensho-web/`, and asset/precache delivery verification passed.
- Phone (320px), compact desktop and wide desktop screenshots were inspected.
- The browser preview temporarily disabled file watching so concurrent edits
  could not reset fixtures. That preview and its temporary configs were removed.

These are local checks, not a commit or deployment claim. The full suite also
includes unrelated concurrent native-app changes; those files were preserved.
