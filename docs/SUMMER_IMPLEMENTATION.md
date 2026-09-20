# Summer's live-wall tradeoff

September 12, 2026. A bounded Classic implementation, not completion of every
Season or Flower interaction. Table Loop rules are unchanged.

## Rule and operational interpretation

`GAME_SYSTEMS.md` specifies Summer's +30% base-score benefit and −20% wall size,
round-scoped stacking, and a Bamboo/terminal-heavy exception. The existing score
modifier worked; the wall-size getter had no gameplay consumer.

Each newly drawn **normal Summer** now sets aside 20% of the then-remaining live
wall for this round. Retained tile count is `floor(remaining × 80 / 100)`.
Successive Summers apply to the then-current remaining pool, not repeatedly on
ordinary draws. This timing, live-versus-dead pool boundary and rounding are
explicit implementation assumptions: the source document does not specify them
verbatim. For a one-tile pool, zero tiles remain. The existing score multiplier
stacks independently as before.

The dead wall is not shrunk directly. Bonus replacement still takes a dead-wall
tile and replenishes it from the live wall if possible. Summer's reduction
occurs before that replacement, including when Summer itself is a replacement
inside a bonus chain. Corrupted Drought does not receive normal Summer's cost.
An Omen lock to Summer applies the same rule to the physical Season drawn.

## Ownership and previews

- `seasonWall.ts` is shared by actual draw resolution and dry-run replacement
  capacity, so action availability includes the shrinking pool.
- `summerReserve` stores the actual set-aside tile objects. It is not a discard
  river, score source, or permanent deletion. Consumed wall prefixes stay intact.
- The run-owned `wallTemplate` is unchanged. Round initialization clears the
  reserve and rebuilds from that template, returning those tile identities.
- Tile replacement/removal helpers include the reserve, preventing obsolete
  copies if permanent collection edits occur before the round rebuild.
- Availability checks copy pools and fork RNG/Season state. Rejected exchanges
  cannot spend tiles, actions, rewards or Omen locks just by being previewed.

The inspector describes the benefit and round-only cost in all 13 locale files.
Normal Seasons remain marked partially implemented because their documented
combinations are unfinished. No native-speaker translation review is claimed.

## Open requirement

Bamboo + Summer is supposed to let terminal-heavy hands negate wall shrinkage.
“Terminal-heavy” has no threshold in the documents, and the timing of a hand
exception relative to an already-shrunk wall is also unspecified. A user choice
has been requested; the exception is **not implemented**. A preselected or
unanswered option is not approval. Reserved physical identities provide a basis
for restoration once that rule is settled, but do not constitute the exception.

## Verification

The focused run passed **82/82** tests across seven files using
`bun run test:run ... --maxWorkers=1 --pool=threads` (2.81 seconds). This includes
11 new Summer cases: edge-pool rounding, actual draw and score tradeoff,
compounding, corrupted Drought, locked Summer, side-effect-free capacity
rejection, and next-round physical collection restoration. Monsoon's nested
Season fixture now supplies additional tail tiles because a real Summer costs
tiles; its conservation check includes the reserve. No production behavior was
weakened to preserve the old fixture's expected replacement count.

The final full suite passed **790/790 tests in 72 files** (55.79 seconds). Strict
TypeScript and the Pages-base production build passed. The focused desktop/mobile
gameplay/art run passed **24/24** checks (31.7 seconds), including a real pointer
redraw, exact reserve identities, exchanged-tile return, 1.3 multiplier, localized
inspector and non-mutating details. The mobile Summer screenshot was inspected.

The first browser attempt passed 22/24: the new Summer expectation omitted the
tile a redraw returns to the live wall. The correct total is 16 retained minus
one dead-wall replenishment plus one returned tile = 16. The test now also checks
that returned tile's identity. No gameplay code changed to accommodate the test.
Initial and final artifacts are preserved in `/tmp/tensho-summer-seo-jgY1pJ/`.

See the [current checkpoint](IMPLEMENTATION_WRAP_UP.md#current-summer-and-public-guide-accessibility-checkpoint)
for the separate 8/8 production guide checks and overall outstanding work.
Earlier Monsoon counts are historical, not automatically current verification.
No commit, push or deployment performed.
