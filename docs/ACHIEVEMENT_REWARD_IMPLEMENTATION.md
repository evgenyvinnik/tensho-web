# Achievement rewards: implementation contract

The user explicitly approved implementing the nine missing reward Decrees and
the Crimson/Obsidian Walls on October 21, 2026. This supersedes the proposed
removal of their reward promises. Keep existing achievement IDs, earned records
and legacy unlock IDs. Challenge Runs remain deferred. Publication still awaits
the requested final handoff.

## Required result

Each advertised reward must resolve to real catalog content, unlock from its
documented milestone, become available through its normal acquisition/selection
path, have an authoritative effect and localized explanation, survive reload,
and appear with its own generated artwork. Unlocking a Decree makes it eligible
for future offers; it must not silently insert a free item into an active run.

| Reward | Existing ID | Milestone |
| --- | --- | --- |
| Stage Master | `stage_master` | Reach Act 4 |
| Flower Pot | `flower_pot` | Reach Act 8 in optional Endless |
| Satellite | `satellite` | Hold at least 400 Gold in one run |
| Swift Andy | `swift_andy` | Win using at most 48 paid Turns |
| Lucky Sixes | `lucky_sixes` | Score 10,000 in one hand |
| The Idol | `the_idol` | Score 1,000,000 in one hand |
| Stuntman | `stuntman` | Score 100,000,000 in one hand |
| Cartomancer | `cartomancer` | Discover every current Fate Seal identity |
| Astronomer | `astronomer` | Discover every current Celestial Orb identity |
| Crimson Wall | `crimson_wall` | Win on Red Stake (tier 2) or higher |
| Obsidian Wall | `obsidian_wall` | Win on Black Stake (tier 4) or higher |

The original reward records specify names and milestones, not complete playable
rules. The following rules were implemented under the user's previous authority
to resolve underspecified mechanics. Each reward is its own catalog identity.

The October 25 six-Act campaign approval moves normal victory settlement to the
Act 6 Boss. Victory-based rewards and table/Stake achievements use that secured
win, with no Act-8 prerequisite. Flower Pot remains an optional Endless reach
milestone; the separate Omega library reward remains complete Act 8 in Endless.
Existing earned eight-Act wins and reward records remain valid. Speed Run stays
at 48 paid Turns or fewer, Charter Collector stays five purchases by the end of
Act 5, and Challenge achievements remain deferred.

## Implemented rules

| Reward | Effect |
| --- | --- |
| Stage Master | +25 Points and +1 Mult per completed Act. |
| Flower Pot | ×3 Mult while owning all four distinct Flower variants; duplicates do not substitute. |
| Satellite | +1 Gold per Orb family above level 1 at each won round's settlement. No income on defeat. |
| Swift Andy | +2 free REDRAW each round; −2 rack size. |
| Lucky Sixes | +6 Mult per played natural suited rank-6 tile. Stones do not count; Wild does not change its natural rank. |
| The Idol | ×3 Mult when at least two tiles are played and every tile has the same natural suit and rank. Stones break the match; Wild does not impersonate a different face. |
| Stuntman | +250 Points; −3 rack size. |
| Cartomancer | One free Fate Seal offer when entering each Tea House. |
| Astronomer | One free Celestial Orb offer when entering each Tea House. |
| Crimson Wall | All 12 starting Dragons receive Mult Marks (+4 Mult when scored); four base Decree slots instead of five. |
| Obsidian Wall | All 16 starting Winds receive Bonus Marks (+30 Points when scored); four base Decree slots instead of five. |

Shop-entry offers are part of the saved visit: rerolls, remounts and reloads do
not regenerate them. Acquiring an offer-granting Decree in the current visit
starts its benefit next visit. Copy effects grant their own offers, respecting
suppression. Simultaneous Omen guarantees must remain available too.

Wall Marks are ordinary replaceable enhancements applied once to the starting
permanent wall. They survive round reshuffles and saves, but do not overwrite
later Seal transformations or automatically enhance newly purchased tiles.

## Artwork

All eleven illustrations are generated and integrated: nine transparent 384px
Decree illustrations and two 1280×720 table backgrounds. Existing collection,
shop, Decree detail and table-selection artwork paths resolve these identities.
Prompts, source paths and processing settings are recorded in
[the art manifest](achievement-reward-art-manifest.json). Generation used the
built-in image-generation tool; its backend model identifier was not exposed.

## Verification gates

- All eleven achievement reward references resolve to the playable catalogs.
- Fresh profiles cannot obtain locked Decrees from normal shops, packs or other
  random sources. Real qualifying history unlocks them; obsolete IDs or counts
  alone cannot satisfy collection milestones.
- Persisted earned unlocks remain valid; new catalog additions reconcile on
  startup without inventing wins or replaying rewards.
- Preview and committed scoring agree; expired/debuffed Decrees and copy effects
  follow the same rules as existing content. Economic effects cannot pay twice
  through reload or rejected purchases.
- Wall rules belong to the captured run, not a later menu preference, and round
  progression and reload retain them. Both Walls appear in table setup and the
  Collection with accurate names, rules and images.
- All 13 locales cover new names, descriptions and unlock conditions. Long text
  remains usable on a 320px screen; hover information is available to touch and
  keyboard too.
- Generated art lives in the repository, decodes, has no embedded labels, and
  passes production/cache budgets. The built-in image-generation tool is used;
  its exact backend model identifier is not exposed, so no model-version claim
  is made.

## Status

The eleven rewards, unlock reconciliation, artwork and all 13 locale entries are
implemented locally. Final combined unit/component regression passes **3,468
tests in 237 files** (`/private/tmp/tensho-rewards-final-regression.json`).
TypeScript, scoped ESLint, whitespace checks and all 13 release-versioning tests
pass. The production build at `/private/tmp/tensho-rewards-build.3ZvJNn` passes
offline asset verification: 793 verified entries, 40,105,797 bytes (below 40 MiB).
The eleven new illustrations total 754,198 bytes.

Reward-specific browser verification passes **16/16 journeys**, with no skips or
retries, against the local test server: English/Spanish, desktop 1280px/mobile
320px, all nine Collection portraits and keyboard/touch details, both Wall
unlock boundaries and saved selections, permanent Marks through reload, and
Astronomer's real acquisition/reveal/free-offer persistence. The unlock fixtures
use recorded qualifying victories, not Full Unlock; presentation-only catalog
discovery fixtures are explicitly separate. Artifacts:
`/private/tmp/tensho-achievement-rewards-verified`.

Visual review confirmed readable Spanish Idol and Astronomer descriptions. It
also identified an existing shared ActionBar issue: the Spanish REDRAW label
(`RECAMBIAR`) overflows its narrow button at 320px. That is a separate layout
follow-up, not evidence that all mobile UI is complete.

These checks do not assert human balance/enjoyment or native-speaker review, and
do not clear the separate core browser findings in the wrap-up. This is not a
release approval. No commit, merge, push or deployment has occurred.
