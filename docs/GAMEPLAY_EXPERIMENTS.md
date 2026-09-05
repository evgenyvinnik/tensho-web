# Making Tensho Fun: Gameplay Experiments and Wild Ideas

**Created:** September 4, 2026  
**Status:** Mostly design proposals. E01–E06 and the section 1.4 coach are now built — see [Section 0](#0-what-has-been-built). Everything else in this document remains a proposal, not an approved backlog.  
**Baseline inspected:** `77e0345` on `main`.

This document captures the discussion about why Tensho still feels unengaging, proposes a different core loop, and collects ambitious experiments that could give the game a stronger identity. Numbers in proposed mechanics are starting points for playtests, not established balance values. Several ideas are deliberately incompatible alternatives; building all of them would defeat the purpose.

The immediate objective is **three rounds that people want to replay**. A larger item library, more illustrations, or more tutorial text cannot establish that on their own.

## Navigation

- [0. What has been built](#0-what-has-been-built)
- [1. What the current game is missing](#1-what-the-current-game-is-missing)
- [2. The experience we want](#2-the-experience-we-want)
- [3. Recommended experiment: build a hand on the table](#3-recommended-experiment-build-a-hand-on-the-table)
- [4. Alternative core loops](#4-alternative-core-loops)
- [5. The idea bank](#5-the-idea-bank)
- [6. Example builds players could discover](#6-example-builds-players-could-discover)
- [7. Teach decisions and make combinations readable](#7-teach-decisions-and-make-combinations-readable)
- [8. Prototype order and playtest plan](#8-prototype-order-and-playtest-plan)
- [9. Implementation implications](#9-implementation-implications)
- [10. Open design decisions](#10-open-design-decisions)

Related documents:

- [Current game mechanics](GAME_MECHANICS.md)
- [Current game systems](GAME_SYSTEMS.md)
- [Implementation status](IMPLEMENTATION_STATUS.md)
- [UI design](UI_DESIGN.md)
- [Existing item library](../ITEM_LIBRARIES.md)

The current mechanics document remains the description of the existing rules. An experiment should update those rules only after a concrete design is chosen and implemented. Existing item names may resemble proposals below; the proposed effects are not claims about their current behavior.

## 0. What has been built

Two things in this document left the proposal stage. Everything else below is
still a design idea.

### The Table Loop prototype (E01–E05)

A playable three-round run at `/:lang/table-loop`, reachable from the main menu
and running **beside** the classic loop rather than replacing it, so a playtest
session can compare the two.

| Experiment | Where it lives |
| ---------- | -------------- |
| E01 persistent groups | [`TableLoopEngine.ts`](../src/tableloop/TableLoopEngine.ts) — four meld slots and a pair slot, placement allowance, revision, recovery exchange, round settlement |
| E02 pattern milestones | [`milestones.ts`](../src/tableloop/milestones.ts) — six milestones, each paid once per round, each raising a standing multiplier |
| E03 build choice | Three starter Decrees offered before the first tile is dealt |
| E04 shop | Eight interacting Decrees; three unowned offers between rounds |
| E05 causal chain | [`scoring.ts`](../src/tableloop/scoring.ts) emits ordered stages; [`CausalChain.tsx`](../src/components/tableloop/CausalChain.tsx) paces them, and they can be skipped or shown at once under reduced motion |
| E06 offers row | [`DraftRow.tsx`](../src/components/tableloop/DraftRow.tsx) and `claimDraft`/`passDraft` on the engine — a variant, off by default |
| Section 7 first session | [`practice.ts`](../src/tableloop/practice.ts) authors the deal and derives the guide steps from run state |

`/:lang/table-loop?seed=<n>` replays an exact deal, so a hand that confused
someone during a session can be handed to the next player unchanged.
`&draft=1` selects the offers variant for a side-by-side comparison, and
`?practice=1` opens the authored teaching deal.

Deliberately **not** built here: living tiles, the route map, seasons, and
wagers. Keeping them out is what makes it possible to learn whether building
across turns helps at all.

### E06, the offers row, as a separate variant

Phase C names the visible draft row as the next source of agency to try, and
insists it be tested on its own. It ships as a **run variant**, off by default:
a toggle on the opening panel, or `?draft=1`.

Three face-up tiles. Each group you place holds one refill slot open, and that
one replacement may come from the offers instead of the wall. Only the claimed
offer is replaced, so the two you passed on stay visible and remain a plan.
Declining takes the wall tile; so does doing anything else, which the interface
says before it happens.

The simulation runs the variant too (`--draft`), and it is not free:

| | base loop | offers row |
| --- | ---: | ---: |
| Rounds cleared | 82% / 54% / 47% | 85% / 63% / 59% |
| Table finished | 50% / 44% / 43% | 57% / 55% / 56% |
| Exchanges spent | 4.0 / 4.0 / 3.7 | 3.6 / 3.5 / 3.2 |

One guided replacement per placement is worth roughly half an exchange, and it
lifts the later rounds by nine to twelve points of clear rate. That is the risk
the document names — "too much choice removes the need to adapt" — showing up
as a number rather than a hunch. Whether it also makes the turn more
interesting is a question for people, not for the simulator.

### The first session (section 7)

The teaching sequence runs in the order the document sets out, as an authored
practice deal — labelled as practice, which is the condition section 3 attaches
to authoring one. Reach it from the opening panel or with `?practice=1`.

1. A short deal holding exactly two groups: an obvious Bamboo run and a pair of
   nines. Nothing else in the twelve tiles combines, so the first decision is
   legible.
2. Both moves can be inspected before committing. Selecting one lights the
   slots it fits and shows the exact score there — the run offers four meld
   slots at 55, the pair offers the pair slot at 35 — which is the document's
   "explain the score and which table slot each choice occupies".
3. The chosen group stays visible while the rack refills.
4. The wall behind the deal is authored so a matching run arrives whichever
   group was committed first. The guide points at the opportunity and does not
   play it.
5. The player finds it. The causal chain resolves and **then** the guide names
   it: "That was a Twin Sequence."
6. One upgrade follows, obviously connected to what just happened — Echoing
   Bamboo repeats exactly the kind of run they just doubled.
7. Control passes to ordinary seeded play.

Every step is derived from run state rather than a counter, so the guide cannot
claim progress the table does not show.

### Two of section 10's open questions, measured

[`scripts/tableloop-questions.mts`](../scripts/tableloop-questions.mts) runs the
same seeds under policies that differ in exactly one habit. Answering the
questions turned up a bigger problem than either of them.

**A slot could be sold twice.** A revision cost one action and paid the new
group in full, so a greedy policy spent **two thirds of its placements cycling
the pair slot** — place a pair, replace it with a slightly better pair, repeat.
Section 9 asks for exactly this to be prevented. A revision now pays the
difference over the group it turns out, credited at the current multiplier, and
the slot's forecast shows `+0` before you commit rather than after. Replacing
like with like is worth nothing; replacing weak with strong is worth the
upgrade.

What that one rule did to the loop:

| | before | after |
| --- | ---: | ---: |
| Revisions | 46% of actions | 19.7% |
| Placements that were sequences | 30.2% | 50.9% |
| Placements that were pairs | 66.0% | 40.9% |

Shape recognition went from a third of what players do to half of it, which is
what section 1.1 was asking for in the first place.

**A milestone's multiplier now belongs to the pattern, not the ledger.** It used
to be banked for the round, so a player could build a Twin Sequence, keep the
multiplier, and demolish one of the twins for free. It is derived from the table
each time it changes: the points it paid are kept, the claim is kept so it can
never be sold twice, and the multiplier goes when the pattern does. The forecast
names the cost — "breaks a pattern · −0.5 Mult" — before the commitment, not
after it. This is what gives "Pure Suit" the weight of an actual suit
commitment.

**Q4 — should revision be universal?** Yes. At 19.2% of actions, with 97.7% of
them taken when no ordinary placement was legal, it is a recovery valve rather
than an optimisation. Making it a Decree would remove the only thing keeping a
mismatched rack from ending a round early. It now has a price, which is what it
was missing.

**Q6 — does holding the pair back become mandatory?** It leans that way without
being one: holding it back clears 1.69 rounds a run against 1.60 for spending it
early, and 1.49 against 1.35 with Patient Pair, whose whole identity is that
timing. A lean, not a mandate.

### The opening choice was a trap, and is not any more

Under one policy the three starters finished **45% / 22% / 10%** of their runs.
A 4.5× spread is not a choice. Chasing it produced the session's most useful
mistake:

- Dragon Lantern, exactly as this document proposes it, fired at all in a
  quarter of runs — the wall offered sixteen Dragon groups across three hundred.
- Doubling its multiplier moved the win rate one point, so the reward was never
  the problem.
- Widening the trigger to any Honor group reached 12%; to any set, 10%. Only
  3.8% of placements were sets.
- A policy that deliberately set up adjacency did worse — and so did every other
  Decree under it.

The finding is structural: with five slots and about four placements a round,
there are not enough placements after a setup for a neighbour bonus alone to
pay. It is now **Watch Fire**, where a set scores +0.5 Mult outright *and*
lights its slot; the adjacency is upside on a base that always does something,
and where you put a set still matters.

Patient Pair was trimmed for dominating, then restored once the revision fix
landed — most of its lead had been the pair slot being re-scored, so the trim
was undoing an exploit rather than a Decree. The three now finish **33% / 30% /
26%**: a 1.27× spread.

### Celebration, and what is blocked (section 7)

Intensity escalates with the chain rather than with every score update: an
ordinary placement gets nothing, a newly discovered milestone gets a brief
named flourish, and a completed table gets a stronger one. It is dismissible,
it holds for about a second, and it is marked `aria-hidden` because the causal
chain already announces the same event. Under reduced motion it does not render
at all — the chain is the readable static result the document asks to preserve.

The sound half of that section is **not built and cannot be**: `public/assets/sfx/`
is empty, so there is no settling sound to play and no motif for a related group
to answer with. Authoring audio is outside what this change can do; the visual
escalation is written so a sound layer can hang off the same levels
(`none` / `milestone` / `completion`) when the assets exist.

### Readability and keyboard (sections 7 and 9)

- Rack tiles are real toggle buttons: keyboard reachable, named, `aria-pressed`,
  with a visible focus ring. A whole group can be selected and committed
  without a mouse, which is what the section 9 walkthrough asks for.
- Slots announce their kind, whether they are filled, and the exact score the
  current selection would land.
- A selection strip shows the tiles you picked separately from the rack,
  together with what they form — "Sequence · 3·4·5 索 +55" — answering the
  section 7 request to show the current combination rather than making the
  player read it off the rack.
- The score line, the causal chain and the offers row are polite live regions,
  so a result is announced rather than only drawn.

### Numbers came from measurement, not from the classic curve

[`scripts/tableloop-sim.mts`](../scripts/tableloop-sim.mts) plays seeded runs
with a greedy policy — it never revises, never plans a milestone, and exchanges
its least-connected tiles — and reports the distribution. Two findings changed
the design:

- **Rack size settles open question 1.** At ten tiles the policy managed 3.6
  placements out of six actions and finished the table 25% of the time: the
  "too rare to plan around" failure this document warns about. At fourteen it
  finished 72% of the time and placement stopped being a decision. Twelve is
  the shipped value.
- **Structure points had to leave the classic 10/20/30/50.** With those values,
  clearing a round and finishing the table were nearly the same event — the
  "only the finishing bonus matters" failure. The loop now uses 15/40/45/80,
  and in round one the policy clears without finishing in about a third of its
  runs.

Current clear rates for that policy: roughly 82% / 55% / 44% across the three
rounds. These are simulation figures for a deliberately unclever player. They
say the targets are not arbitrary; they say nothing about whether the loop is
enjoyable, which still needs the observation described in section 8.

### The coach (section 1.4)

[`beginnerCoach.ts`](../src/gameplay/beginnerCoach.ts) now makes two separate
statements instead of conflating them. `findBeginnerSuggestion` still teaches
one recognizable shape and drives the first-play highlighting.
`buildCoachAdvice` prices candidate selections with the orchestrator's own
`previewScore`, then offers "points now" beside "build toward this" and states
the round's pressure — the points this hand needs, and what the shape costs to
keep. It never prices a concealed tile.

The two options render inside the play area's idle state and give way to the
forecast once the player selects something, so the coach occupies no vertical
space of its own. That is not cosmetic: the gameplay screen has no slack at
720px tall, and a 54px strip of its own was enough to push the hand zone under
the action bar.

**The diagnostic, repeated.** Section 8 asks for the opening-score measurement
to be run again after any change to the coach.
[`scripts/coach-diagnostic.mts`](../scripts/coach-diagnostic.mts) does that over
the same seeds 1-100, and reproduces the original figures exactly before
reporting the new ones:

| Observation | Then | Now |
| ----------- | ---: | --: |
| Starts with a suggested scoring shape | 99 | 99 |
| Starts suggesting a redraw | 1 | 1 |
| Median score of the taught shape | 36 | 36 |
| Taught shape below target / remaining plays | 85 of 99 | 85 of 99 |
| Median score the coach's other option finds | — | 95 |
| That option below target / remaining plays | — | 11 of 100 |
| Median points it adds over the taught shape | — | 55 |

The teaching suggestion is unchanged on purpose: it still answers "which tiles
form a group?", which is a different question. What changed is that the player
is now also shown a move that keeps pace, and told which is which.

Finding more points is not the same as being right, and the panel does not
claim otherwise — it shows both options and names the tradeoff. This remains an
opening-move measurement, not a win rate.

## 1. What the current game is missing

### 1.1 Recognizing a shape can feel weaker than playing miscellaneous tiles

In the current unmodified scoring rules:

| Selection                         | Tile points | Structure points | Total before modifiers |
| --------------------------------- | ----------: | ---------------: | ---------------------: |
| Bamboo 3–4–5                      |          15 |               20 |                     35 |
| Three distinct Honor tiles        |          45 |                0 |                     45 |
| A pair of simple tiles (2–8)       |          10 |               10 |                     20 |

A player discovers a sequence, expects a meaningful reward, and can score less than three unrelated Honors. Decrees can change that comparison, but the initial scoring language does not consistently reinforce the pattern recognition we teach.

This is not proof that every sequence should beat every other selection. Different builds should value different things. It is evidence that the baseline reward for learning a pattern needs attention.

Source: [ScoringEngine.ts](../src/rules/ScoringEngine.ts), particularly `getTilePoints`, `getMeldStructurePoints`, and partial-play scoring.

### 1.2 Immediate scoring can dismantle progress toward the exciting reward

Ordinary plays select two to five tiles. Played tiles leave the hand, while Yaku require a complete legal hand. The player uses useful groups to keep pace with the round, then has to assemble a complete hand from what remains and the replacement draws.

That tension could work if players could assess the tradeoff and frequently experience the eventual reward. At present, the relationship between a small play and a future complete hand is difficult for a newcomer to see. Much of the named pattern system sits behind a substantial completion requirement.

Sources: [GameOrchestrator.ts](../src/game/GameOrchestrator.ts), `executePartialPlay`; [ScoringEngine.ts](../src/rules/ScoringEngine.ts), the complete-hand gate on Yaku detection.

### 1.3 Early upgrades do not reliably establish a plan

The current run grants two random starter Decrees. The pool includes an exception to Tanyao, an economy effect, extra plays, and scoring modifiers. Their practical value varies considerably for a player who is mainly making small tactical plays.

An unfamiliar exception to an unfamiliar rule asks for understanding before it offers a clear desire. A better opening upgrade would immediately answer: **Which tiles do I want now, and why?**

Sources: [DecreeSystem.ts](../src/systems/DecreeSystem.ts), `STARTER_DECREES`; [GameOrchestrator.ts](../src/game/GameOrchestrator.ts), `initializeStarterDecrees`.

### 1.4 The current coach can teach a weak scoring habit

An exploratory diagnostic on the inspected checkout sampled starting seeds 1 through 100. It called `findBeginnerSuggestion` on each opening hand and evaluated scoring suggestions with the authoritative `previewScore` method.

| Observation                                        |   Result |
| -------------------------------------------------- | -------: |
| Opening seeds examined                             |      100 |
| Starts with a suggested scoring shape              |       99 |
| Starts suggesting a redraw                         |        1 |
| Median score of a suggested shape                  |       36 |
| Scoring suggestions below target / remaining plays | 85 of 99 |

In a separate check of seed `12345`, the coach recommended a sequence worth 35 points against a 300-point target with four plays. Enumerating legal selections of two through five tiles found an immediate play worth 71: two pairs and a White Dragon.

**Interpretation limit:** This was an opening-move diagnostic, not a human playtest, win-rate estimate, or proof of the best long-term strategy. An early low-scoring play may preserve a valuable future hand. The comparison does show that the coach ranks one group's structure points without explaining the round's resource pressure or evaluating the full score of alternative selections.

Any subsequent coach should explain choices and opportunity costs. It should not equate “this is a recognizable shape” with “this is the right move.”

Source: [beginnerCoach.ts](../src/gameplay/beginnerCoach.ts).

### 1.5 Complexity arrives before the player has a favorite interaction

The game already has Decrees, Flowers, Seasons, several consumable families, Charters, Omens, Stakes, and Boss Mandates. Those systems can support depth. Presenting their significance together makes it harder to identify the next exciting decision.

The design hypothesis is that players need to discover one satisfying interaction before they are asked to manage a collection of systems.

### 1.6 What to take from Balatro

Balatro's official explanation describes playing poker hands against round targets and acquiring Jokers that change scoring, card behavior, and economy. See the [official FAQ](https://www.playbalatro.com/faq).

Our design interpretation: a strong run repeatedly connects recognizable patterns, a desired draw, an upgrade that changes priorities, and a satisfying resolution. Copying the names or quantities of its systems will not automatically produce that connection in Mahjong.

Tensho has its own promising material: repeated tiles, overlapping sequences, a discard river, visible arrangements, and the gradual construction of a hand.

## 2. The experience we want

### The player should regularly think

- “I know which tile I want next.”
- “That purchase changes how I will play.”
- “I can take the reliable points, or spend a scarce resource chasing something better.”
- “I made these pieces work together.”
- “I understand why that combination exploded.”
- “Next run, I want to try the other path.”

### Design principles

1. **Progress should be visible.** Useful groups should contribute to a recognizable plan.
2. **Patterns should matter early.** Basic combinations deserve meaningful rewards before advanced Yaku knowledge is required.
3. **Upgrades should change decisions.** Prefer an effect that changes what a player keeps, places, redraws, or buys over several barely noticeable percentage bonuses.
4. **Chance should create opportunities to respond.** Keep uncertainty around future tiles; give the player understandable tools for influencing it.
5. **Commitments need consequences.** Slot use, limited redraws, and gold should create real tradeoffs.
6. **Big scores need readable causes.** Every major score jump should have an identifiable source.
7. **Complexity should arrive through discovery.** Introduce a system when the player can use it to solve a problem they already understand.
8. **The game should permit surprising combinations.** Bound execution and resource loops without flattening every powerful build into the same output.
9. **Small screens are a design constraint.** Core decisions must work through taps, readable tiles, and a stable layout.
10. **Playtesting decides.** Neither a large feature list nor a passing automated suite establishes enjoyment.

## 3. Recommended experiment: build a hand on the table

### E01 — Persistent groups

**Pitch:** Each group you play stays on the table. You score now and build toward a larger combination over several turns.

A table has four group slots and one pair slot. The player draws from a smaller working rack, places a valid group, and refills the rack. Later placements interact with earlier groups. A complete table earns a finishing bonus.

The Mahjong idea becomes visible: “Build four groups and a pair.” The player learns the full arrangement by constructing it rather than being required to recognize fourteen tiles at once.

**The interesting choice:** Fill a slot with something reliable, or preserve that slot and spend a redraw looking for a group that interacts with the existing table.

**Main risk:** It could become an automatic process of placing every available group. Limited resources, competing patterns, and meaningful commitments must create decisions; persistence alone is not enough.

### A concrete first prototype

These are provisional rules for a small standalone experiment:

| Element             | Initial proposal                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Working rack        | 10 playable tiles; compare 8 and 10 in a later test                                                                                           |
| Table               | Four meld slots plus one pair slot                                                                                                            |
| Placement allowance | Six actions per round; this deliberately replaces the existing four-play budget                                                               |
| Place action        | Commit one valid sequence, triplet, quad, or pair into a compatible empty slot                                                                |
| Redraw allowance    | Three exchanges; exchange one to three rack tiles, using the existing replacement semantics                                                   |
| Redraw cost         | One exchange, no placement action                                                                                                             |
| Replacements        | Refill the rack after a placement while tiles remain in the wall                                                                              |
| Revision            | Spend one placement action to replace one table group with a valid group of the same slot type from the rack; displaced tiles go to the river |
| Round clear         | Meet a score target; allow an explicit Finish action once the target is reached                                                               |
| Finishing the table | Four groups plus the pair earns a one-time completion bonus and ends the round                                                                |
| Resource exhaustion | End when no placement actions or legal actions remain; compare accumulated score with the target                                              |
| Between rounds      | Clear the table and rebuild the wall from the run's persistent tile collection                                                                |
| Initial content     | Three short rounds, six clear Decrees, one gentle boss, and a small shop                                                                      |

The unused sixth action permits a revision or a recovery play. Completing the table is a major scoring route, not the only way to pass. Targets must be retuned for this loop; retaining the current target curve without measurement would be an arbitrary constraint.

If the player reaches the target before finishing the table, continuing can pursue its completion bonus within the same finite action budget. Reaching the target remains a secured clear in this prototype; optional wagers can change that later only if they state the additional risk explicitly.

### E02 — Pattern milestones

Award satisfying combinations before the table is complete:

- Two identical sequences: a **Twin Sequence** bonus.
- Two groups in the same suit: the beginning of a **Pure Suit** route.
- One sequence in each suit using the same ranks: a **Three-Suit Sequence** bonus.
- Two different Dragon triplets: visible progress toward a **Dragon Court** finish.
- Four sequences and a pair: a distinct completed-table identity.

Use descriptive names first and optional traditional names in details. Adapted patterns are Tensho rules, not assertions about traditional Mahjong scoring.

**Scoring constraint:** A milestone pays once per round when first achieved. Moving or replacing groups cannot repeatedly claim the same milestone. Completion bonuses and explicit Decree retriggers are separate events.

### E03 — Build choice before the first round

Offer one of three understandable starting Decrees. Example prototypes:

- **Echoing Bamboo:** Bamboo sequences trigger twice when first placed.
- **Patient Pair:** The pair slot gains a bonus for each meld already on the table when the pair is placed.
- **Dragon Lantern:** A Dragon triplet adds a multiplier to subsequently placed groups beside it.

Each choice should change a decision in the first round. The opening hand need not guarantee victory, but it should offer a credible way to explore the chosen effect. An authored teaching deal may guarantee that opportunity when clearly presented as practice.

### E04 — A small pool of consequential shop choices

Begin with six to ten effects that interact. A purchase should regularly change the next draw the player wants. Examples: a sequence retrigger, a pair reward, an Honor interaction, a suit conversion, a limited river recovery, and an economy tradeoff.

Keep at least two viable directions in early shops: improve the existing plan or pivot toward something newly possible. Do not silently force every offer to match the current build, because that would remove discovery.

### E05 — Show the causal chain

Resolve a move in readable stages: placed group, relevant groups already on the table, triggered Decrees, multiplier, score landing on the target meter.

For example: the second sequence lights up, the matching first sequence answers, Twin Sequence appears between them, and the Echo Decree triggers. The animation teaches the interaction the player just created.

Let players accelerate familiar sequences, skip repeat flourishes, inspect the breakdown, and use reduced motion. Preserve an exact or clearly bounded preview; suspense can come from the draw and the choice rather than concealing already determined arithmetic.

### E06 — Better access to the tile you are chasing

Add a visible three-tile draft row as a second experiment after the persistent-table loop works. One replacement per placement can come from that row, with other replacements coming from the wall. Replace only the claimed offer.

This turns some bad draws into an actionable question: “Do I take the tile that completes this sequence, or deny myself that completion to keep a valuable Dragon?” In a solo game, avoid describing this as denying another player unless an opponent actually exists.

**Risk:** Too much choice removes the need to adapt and slows every refill. Test one chosen replacement before making the entire draw a draft.

### An example of the intended moment

> I already placed Bamboo 2–3–4. Another identical sequence would trigger my Decree twice. I am holding Bamboo 2 and 3. Do I use my last redraw to chase the 4, or place this Dragon triplet and secure the round?

The player has a specific desired tile, a visible reason to want it, an alternative that matters, and a cost for pursuing the riskier route.

## 4. Alternative core loops

These are competing prototypes, not requirements to combine with E01.

### E07 — Compact hands with immediate pattern identities

Keep the existing cycle of selecting and replacing a small group. Give compact selections their own scoring identities: Pair, Two Pairs, Sequence, Triplet, Full Group (a triplet plus a pair), and several special compositions. Upgrade those frequent patterns during the run. Reserve full Mahjong hands as a separate advanced opportunity.

**Why it might work:** It brings build progression into ordinary turns with less structural change than a persistent table.

**Tradeoff:** It moves closer to a familiar hand-scoring formula and gives Tensho less spatial identity. Composition bonuses need meaningful minimum sizes; “all one suit” should not become a trivial reward for almost every tiny selection.

**Test when:** E01 is too slow, crowded, or difficult to understand on phones.

### E08 — Bank or ascend

Build a table, then choose whether to bank its current value or continue assembling a richer pattern while a finite turn budget decreases. Banking ends the attempt. Continuing puts a clearly stated portion of the unbanked reward at risk.

**Why it might work:** Creates explicit push-your-luck decisions and memorable near misses.

**Tradeoff:** Can punish players for experimenting or devolve into always banking at a mathematically obvious threshold. Teach the safe action first; make the cost of continuing visible. Do not conceal odds or invent losses after a commitment.

### E09 — A small puzzle board with Mahjong tiles

Place tiles on a compact grid. Matching triples and sequences form along marked lines; intersections can contribute to a larger chain. The wall becomes a bag the player edits between rounds.

**Why it might work:** Placement creates spatial choices, future plans, and chain reactions with a clear visual cause.

**Tradeoff:** This is a major redesign. It changes the identity of a hand, the value of a tile, and much of the existing item content. Prototype separately with plain tiles before integrating art or the full economy.

## 5. The idea bank

Stable IDs make it possible to select experiments later. Each entry names the interesting choice and the main failure mode. Most belong after the first prototype has earned another iteration.

### Draws, the river, and manipulating chance

| ID / idea                    | Mechanic and player payoff                                                                                               | Tradeoff or failure mode                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| E10 — River rescue           | Once per round, exchange a rack tile for one visible discarded tile. A previous sacrifice can become a planned recovery. | Without a cost or eligibility rule, the river becomes an unlimited second hand.                                                           |
| E11 — Read the wall          | Spend a resource to reveal the next few draws, then choose whether to play or redraw around that information.            | Exact knowledge may eliminate all tension; reveal a small window and distinguish known draws from probabilities.                          |
| E12 — Split the draw         | Offer a normal blind draw or a narrower suit-specific draw with a visible cost. Choose flexibility versus commitment.    | If suit targeting is too cheap, every run becomes a pure-suit build.                                                                      |
| E13 — Keep one for later     | A reserve slot holds a tile across rounds. Save a rare connector, an upgraded tile, or a Dragon for the next boss.       | The reserve must remove a real tile from circulation and occupy limited capacity.                                                         |
| E14 — A declared wish        | Name a tile family before drawing. A fulfilled wish earns a small reward; missing still gives a normal draw.             | Prediction must use the real seeded draw, not secretly force or withhold success. Avoid making wishes a mandatory extra click every turn. |
| E15 — Bargain with the river | A merchant offers one revealed river tile in exchange for two rack tiles or gold. Buy certainty at a visible price.      | Another shop-like interruption can break the turn rhythm; embed the offer in the existing river view.                                     |

### A table that remembers what you build

| ID / idea                        | Mechanic and player payoff                                                                                                    | Tradeoff or failure mode                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| E16 — Neighbor bonuses           | Some groups or Decrees affect the group immediately beside them. Placement order becomes part of the build.                   | Show exact affected slots before commitment; do not require pixel-perfect positioning.                                          |
| E17 — Winds rotate the table     | A Wind effect rotates the sequence of groups, changing which effects are neighbors before a scheduled trigger.                | Rotation alone must not replay placement rewards; confusing movement can erase the player's understanding of the board.         |
| E18 — Bridge a gap               | A special tile can connect two otherwise separate sequence fragments across adjacent slots.                                   | A powerful exception needs a visible rule and limited uses, or all sequence structure becomes meaningless.                      |
| E19 — A group under construction | Place an incomplete two-tile sequence into a reserved slot, then complete it later for a bonus.                               | Creates a clear chase but can trap the player. Show the missing tiles and provide a costly exit.                                |
| E20 — Open versus concealed      | Score an open group immediately, or seal a group for a larger completion reward later.                                        | Too many concealed groups make the board hard to read. Face-down presentation must still tell the owner what they committed.    |
| E21 — The long staircase         | Consecutive sequences on the table build a 1–9 route with a large one-time payoff.                                            | A narrow chase needs smaller intermediate rewards and an alternate route to clear the round.                                    |
| E22 — Shatter and rebuild        | Break an existing group into a limited number of reusable tiles, surrendering its future interactions to repair another slot. | Prevent the same physical tiles from scoring repeatedly without a scarce action or explicit effect.                             |
| E23 — The fifth group            | A rare rule opens an extra meld slot while reducing another resource. Build an oversized table for a special finish.          | Increased tile count and trigger count can dominate; resize the mobile layout and rebalance completion requirements explicitly. |

### Decrees that produce recognizable builds

| ID / idea                    | Mechanic and player payoff                                                                                                                     | Tradeoff or failure mode                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| E24 — Echo and recursion     | An Echo Decree repeats a neighboring trigger; another effect can amplify the echo once. Discover a chain that is more powerful than its parts. | Define copying depth and per-action trigger limits. An engine limit must not silently change a displayed forecast. |
| E25 — Twins become wild      | Two identical groups grant a one-use wildcard for the next placement. A recognizable achievement opens a new possibility.                      | Wildcards should show the identity they adopt and avoid making all later groups interchangeable.                   |
| E26 — The stubborn pair      | The pair becomes more valuable the longer its two tiles are held before placement. Timing gains importance.                                    | Never reward waiting without consuming turns; the reward must be tied to meaningful actions.                       |
| E27 — Dragon choir           | Different Dragon groups amplify one another; a complete trio triggers a dramatic final resolution.                                             | Progress should be useful at one and two Dragons, not only after an extremely rare third.                          |
| E28 — Contrarian decree      | The least-used suit in this run receives a growing reward. Pivoting can compete with specialization.                                           | Track the condition openly and prevent cheap oscillation from generating unlimited growth.                         |
| E29 — Pacifist wealth        | Finish a round without redrawing for an economy bonus that funds a stronger future build.                                                      | The opportunity cost must be real, but a failed condition should not ruin the run or invite tedious restarting.    |
| E30 — Beautiful imperfection | One deliberately incomplete slot multiplies a finished neighboring pattern. A rule-breaking build celebrates an intentional flaw.              | Introduce after standard completion is understood; mark the exception on the affected slot.                        |
| E31 — Decree fusion          | Combine two compatible Decrees into one stronger rule, freeing a slot and sacrificing flexibility.                                             | Show the result before payment. Too many hidden recipes make the shop depend on external guides.                   |
| E32 — An oath with an escape | Choose a restriction such as avoiding Honors for a strong bonus. Pay to break the oath when a better opportunity appears.                      | A free escape removes commitment; no escape can make a run feel decided by a bad draw.                             |

### Tiles with a life across the run

| ID / idea                   | Mechanic and player payoff                                                                                                       | Tradeoff or failure mode                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| E33 — Apprentice tiles      | A tile gains experience from a few clearly named achievements and evolves into one of two effects.                               | Persistent tracking across a large wall can become unreadable; begin with one marked tile and deterministic thresholds.                     |
| E34 — Twin soul tiles       | Two linked tiles trigger a bonus when they appear in separate groups on the same table.                                          | Clearly mark both partners; a lost partner should have a stated recovery or unlinking option.                                               |
| E35 — A tile that remembers | A tile retains a modest bonus from its largest previous combination. Players become attached to a particular physical tile.      | Put a cap or diminishing growth rule on it so one lucky tile does not become the entire strategy.                                           |
| E36 — Hungry tiles          | Feed an unwanted tile to another tile for a permanent upgrade. Deck thinning becomes a visible sacrifice.                        | Require a shop service or limited consumable; unlimited feeding would erase the wall and trivialize draws.                                  |
| E37 — Cracked treasure      | A fragile tile has a powerful scoring effect and a disclosed chance to break. Choose present strength versus future reliability. | This extends existing fragile-tile concepts; state whether the preview is exact, a floor, or a range. Do not exaggerate the likely outcome. |
| E38 — Double-faced tiles    | A tile has two printed identities; flip it once per round before placing it.                                                     | A face must be chosen before validation and scoring. Never let it satisfy contradictory identities simultaneously without an explicit rule. |
| E39 — Wandering rank        | A marked tile increases or decreases rank after each completed group. Plan around when it will become the missing tile.          | Show the next state before the action; preserve a simple visual identity and bound ranks.                                                   |

### Shops, routes, and voluntary risks

| ID / idea                           | Mechanic and player payoff                                                                                                                | Tradeoff or failure mode                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| E40 — Shop apprenticeship           | Choose a merchant specialty for the next few shops: tile editing, Decrees, or economy.                                                    | Specialization should bias a disclosed portion of offers, not eliminate all alternatives.                                             |
| E41 — A tile workshop               | Buy one precise operation: change a suit, shift a rank, remove a tile, or duplicate a tile. Every purchase visibly changes future draws.  | Offer only a few operations at once and show the resulting wall composition.                                                          |
| E42 — A recipe on the horizon       | Reveal a future reward for achieving a clear condition, such as a three-suit table. The player can deliberately build toward it.          | Avoid making the reward so necessary that every run follows its recipe.                                                               |
| E43 — An optional contract          | Accept an extra objective before a round for a stated reward: use two Dragon groups, finish with a particular suit, or preserve a redraw. | Missing the optional goal should forfeit its reward by default; any additional penalty must be explicit.                              |
| E44 — Wager the surplus             | After securing the round, stake a capped portion of bonus gold on one more placement achieving a named pattern.                           | This is an in-game resource mechanic. It must not unexpectedly revoke the secured clear or introduce an endless post-win grind.       |
| E45 — Borrow tomorrow's fortune     | Take an immediate upgrade in exchange for a known reduction in next-round resources.                                                      | Display the next round's actual allowance and prevent debt chains that defer all consequences indefinitely.                           |
| E46 — Forked ascent                 | Choose between a predictable boss, a lucrative difficult round, or a tile-editing stop.                                                   | Routes need distinct decisions, not a map full of icons that differ only in reward size.                                              |
| E47 — Treasure with a visible curse | Pick a strong reward together with a known constraint, such as an unusable table slot or a suit restriction.                              | Constraint severity must be judged against the current build; do not label an effectively impossible combination as merely difficult. |

### Bosses, seasons, and alternate tables

| ID / idea                   | Mechanic and player payoff                                                                                                | Tradeoff or failure mode                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| E48 — The Mirror Court      | The boss rewards symmetry: matching outer groups or mirrored suit order.                                                  | Keep valid ordinary scoring available. Symmetry should create a puzzle, not demand one exact lucky draw.                |
| E49 — The Collector         | A boss offers a bonus for one visible tile family and changes that preference after a group is placed.                    | Telegraph the sequence or clearly disclose uncertainty; avoid retroactively invalidating committed groups.              |
| E50 — The Taxing River      | Recovering a discarded tile costs score or gold, but recovered tiles gain a useful property.                              | The player needs a viable alternative to river recovery; costs and effects should fit in one sentence.                  |
| E51 — An approaching winter | A visible season track changes after a fixed number of placements. Prepare a table before a known rule change.            | Prefer planning around scheduled changes to unexplained penalties arriving after commitment.                            |
| E52 — Bloom or harvest      | A Flower can grow toward a larger future reward or be harvested now for a useful action.                                  | Give the player one or two plant decisions, not a second resource-management game on top of every turn.                 |
| E53 — A rotating table      | A special table rotates adjacency after each placement. Build around predictable changing neighbors.                      | Keep this out of the default introduction and avoid involuntary camera rotation.                                        |
| E54 — The minimalist table  | Fewer rack tiles and fewer slots, but concentrated rewards and shorter rounds.                                            | Requires its own targets and completion grammar; reducing rack size alone can make draws frustrating.                   |
| E55 — A glass table         | Large bonuses for intact groups, with an explicitly described fracture condition that removes future interaction bonuses. | Loss should follow a player-readable rule. Avoid random destruction of a carefully assembled board without counterplay. |

### Stranger experiments and optional modes

| ID / idea                         | Mechanic and player payoff                                                                                       | Tradeoff or failure mode                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| E56 — Dream mahjong               | A rare table introduces printed impossible ranks such as 0 and 10, opening sequences outside the normal range.   | This affects validation, art, translations, and teaching. Confine it to a clearly named variant.                           |
| E57 — Two timelines               | Maintain two small tables and choose which receives each group. A limited bridge effect connects their finishes. | Doubles visual and decision complexity. Prototype only after one-table play is compelling, especially on phones.           |
| E58 — The living wall             | During a run, the player chooses which tile families the wall grows more frequently.                             | Growth must be explicit and update visible composition; hidden adaptation would make probabilities untrustworthy.          |
| E59 — Boss rule theft             | Defeating a boss lets the player take a weakened version of its rule as a Decree. Turn an obstacle into a build. | Show the player version separately; copying the boss's full power can break later rounds.                                  |
| E60 — A rival's ghost             | Play the same seed as a recorded run and see optional milestone comparisons between rounds.                      | Never interrupt each move with comparison pressure. Seed and rules versions must match.                                    |
| E61 — A cooperative table         | Two players exchange limited tiles and complete complementary groups on a shared table.                          | Multiplayer is a separate product-sized effort. First test a local pass-and-play version for shared decisions.             |
| E62 — A three-round challenge     | Short authored or seeded runs with a focused rule: win with pairs, master river recovery, or exploit an Echo.    | Keep these optional and available without daily streak obligations. A compact mode should not require a long unlock grind. |
| E63 — A puzzle from your run      | Save an interesting hand and its visible resources as a replayable puzzle after the round.                       | Preserve the actual state and label hindsight information. Avoid claiming one solution is optimal without evaluating it.   |
| E64 — The final outrageous decree | A rare late-run rule lets the pair act as a bridge, adds a third suit identity, or makes a group echo backward.  | The rule should transform an established strategy and resolve with bounded triggers, not simply say “everything scores.”   |

## 6. Example builds players could discover

The goal is for someone to describe their run in one sentence. These are speculative combinations of the ideas above, not existing tested builds.

### The Bamboo Echo

**Identity:** “I repeat sequences and make them answer one another.”

- Echoing Bamboo repeats the newly placed sequence's scoring contribution.
- A second identical sequence earns Twin Sequence once.
- A suit-editing purchase makes the required Bamboo tiles easier to assemble.
- A limited copy effect amplifies one Echo.

**Interesting choice:** Use a Bamboo tile in an immediately available group, or keep it to complete the matching sequence.

**Counter-pressure:** A boss makes adjacent identical groups less effective, encouraging different placement order rather than deleting the build.

### The Dragon Choir

**Identity:** “My Dragons make the rest of the table sing.”

- A Dragon group buffs subsequently placed neighbors.
- A reserve slot carries one rare Dragon tile between rounds.
- River recovery completes the next Dragon group.
- Two Dragon colors earn an intermediate reward; the third provides the spectacular finish.

**Interesting choice:** Commit a Dragon group early for its future buff or wait for a better slot arrangement.

**Counter-pressure:** Honor restrictions reduce reliability, so the player needs useful sequences as a fallback.

### The Patient Pair

**Identity:** “I save the smallest group for the biggest moment.”

- Hold the pair while placing melds to charge its bonus.
- Use the reserve to protect one valuable pair tile across rounds.
- Place the pair last to finish the table and resolve the stored reward.

**Interesting choice:** Spend a pair tile in a triplet that secures the target, or preserve the finishing plan.

**Counter-pressure:** A boss changes the timing bonus, encouraging an early pair for one round rather than making all pair effects worthless.

### The River Alchemist

**Identity:** “The tiles I throw away become tomorrow's tools.”

- Discards contribute a bounded economy reward.
- A one-use recovery retrieves a tile when it becomes a connector.
- The workshop transforms a recovered tile into a permanent wall improvement.
- A fragile scoring tile provides a strong immediate option at a known long-term cost.

**Interesting choice:** Sell certainty now for gold or spend that gold to recover a specific future combination.

**Counter-pressure:** River access becomes expensive for a round. The build remains playable through its permanent tile edits.

### The Wandering Scholar

**Identity:** “I get stronger by changing my plan.”

- The least-used suit gains a bonus.
- A double-faced connector supports two potential groups.
- A merchant specialty can change between Acts.
- A three-suit milestone rewards switching at the right time.

**Interesting choice:** Continue a reliable suit or pivot while its alternative is temporarily stronger.

**Counter-pressure:** A restricted slot makes the timing of the pivot matter.

## 7. Teach decisions and make combinations readable

### A first-session sequence

1. Use a short, clearly identified practice deal with an obvious sequence and an alternative pair.
2. Let the player inspect both outcomes. Explain the score and which table slot each choice occupies.
3. Place the chosen group. Leave it visible and refill the rack.
4. Present an opportunity for the next group to interact with the first.
5. Let the player discover the interaction, with an optional hint if they pause or request help.
6. Resolve the interaction visibly and name it after the player has seen it happen.
7. Offer one upgrade whose relevance to that experience is easy to understand.
8. Hand control to ordinary seeded play; keep the guide available through a small help action.

The first experience should demonstrate why the game is interesting, not merely list which controls exist.

### Improve the coach

- Offer “points now” and “build toward this” when both are credible, with a plain explanation of the difference.
- Evaluate legality, active Decrees, actual score, remaining actions, and lost future opportunities before making a recommendation.
- Avoid presenting an immediate-score maximum as the best long-term move.
- Never expose concealed information through highlighted suggestions or an exact forecast.
- Use explicit known-wall counts only where the rules allow them; do not invent completion probabilities.
- Stop highlighting automatically once the player demonstrates understanding. Keep manual hints available.

### Make the rack readable before adding more explanations

- Provide optional rank badges and distinct suit symbols alongside the art.
- Show selected tiles separately at full readable size. Do not require tapping a few exposed pixels of an overlapped tile.
- Keep the table's five slots stable on desktop and mobile. Explore a compact two-row table or a horizontal summary with an expanded slot view.
- Show the pair slot as visually different from meld slots.
- Use tap and keyboard focus for details; hover is an additional affordance.
- Prioritize the target, remaining actions, next decision, and current combination over secondary inventories.
- Introduce consumable families when acquired, with details available on demand.
- Keep localized labels and descriptions readable without truncating essential rules.

### Sound, animation, and celebration

- Give a placed group a crisp settling sound and brief physical response.
- Let related groups answer with a matching sound motif so repeated interactions become recognizable.
- Escalate sound and visual intensity with the actual chain, not every small score update.
- Show the source of each bonus near the object that produced it, then combine the result at the score display.
- Reserve a stronger flourish for a newly discovered interaction, a completed table, or an unusually powerful move.
- Preserve a readable static result, speed controls, muted play, and reduced-motion support.
- Avoid long mandatory celebrations on every move; anticipation should not become waiting for the interface.

### What to delay in the first prototype

Additional currencies, multiple consumable inventories, advanced Yaku exceptions, extensive meta progression, and a large boss roster should wait. Existing art can support the experiment. New images are most useful once a mechanic has earned a clear visual identity.

## 8. Prototype order and playtest plan

### Phase A — Establish the baseline

- Observe a few current-version sessions with Mahjong newcomers and experienced strategy-game players.
- Record what they think the objective is, what tile they want next, and why they choose a move.
- Measure time to first intentional scoring pattern, first meaningful upgrade, and first recognized interaction.
- Note when players ask for help, stop making deliberate choices, or voluntarily restart.
- Repeat the opening-score diagnostic after changes to the coach or scoring rules, without confusing it with a human enjoyment metric.

### Phase B — Three-round persistent-table prototype

Build E01–E05 together as one coherent experiment:

- Ten-tile rack; four meld slots and a pair slot.
- Six placement actions, three redraws, and one action cost per revision.
- A small set of immediate pattern milestones and a one-time table finish.
- Three starting choices drawn from six implemented Decrees.
- Two ordinary rounds and one gentle boss with a telegraphed rule.
- A compact shop focused on those same interactions.
- Readable mobile controls, a score preview, and concise cause-and-effect feedback.

Keep the draft row, living tiles, route map, seasons, and wagers out of this first comparison. That makes it possible to learn whether building across turns helps at all.

### Phase C — Test one additional source of agency

Compare the successful base prototype with E06, the visible draft row, or E10, limited river rescue. Test them separately first.

Look for whether players can deliberately chase an interaction without turning every replacement into a lengthy optimization task. More choice is useful only if the choices remain legible and consequential.

### Phase D — Expand through build identities

Add a small family of compatible effects around the strongest observed strategies. Prefer three distinct, understandable builds over many weakly differentiated items. Introduce bosses that ask those builds to adapt and permanent tile edits that make the player's purchases visible in later rounds.

### Phase E — Try the wild variants

Prototype E08 or E09 separately if the main approach still fails to create engaging turns. Add alternate tables, evolving tiles, and unusual Decree combinations only when the underlying play is already enjoyable.

### Evaluation questions

| Question                                | Evidence to look for                                                      | Warning sign                                                           |
| --------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Can the player understand a turn?       | Explains one legal action and its immediate result without being prompted | Repeatedly follows highlights without knowing why                      |
| Does the player want a particular draw? | Names a tile or suit and connects it to a visible plan                    | Treats all replacements as equally arbitrary                           |
| Do upgrades change play?                | Keeps or discards different tiles after buying a Decree                   | Buys whatever is affordable and notices little difference              |
| Are there real alternatives?            | Can explain a reliable move and a more ambitious move                     | The largest highlighted score is always the obvious answer             |
| Is the payoff understandable?           | Identifies the groups and Decree responsible for a large score            | Attributes all results to hidden multipliers                           |
| Does a loss teach anything?             | Names a resource choice or build weakness they would change               | Concludes the opening draw decided everything                          |
| Does the player want another run?       | Restarts voluntarily and names something else to try                      | Stops after understanding the controls                                 |
| Does it work on a phone?                | Makes the same choices without fighting tile overlap or menus             | Accidental selections, unreadable state, or frequent layout navigation |

A first qualitative pass might involve five to eight people with mixed Mahjong familiarity. That is useful for discovering confusion and patterns, not for statistically establishing retention or a universal win rate. Counterbalance the order of current and prototype sessions where practical.

**Keep an experiment** when it creates understandable choices and repeatable moments players want to pursue. **Revise it** when the idea is understood but one strategy dominates. **Drop it** when it mainly adds explanation, clicks, or invisible arithmetic.

### Failure conditions for the recommended loop

- Every available group should always be placed immediately.
- Completing a table is either practically guaranteed or too rare to plan around.
- Redraws feel mandatory chores rather than choices.
- The player cannot remember why a slot matters.
- A strong Decree makes tile identity irrelevant.
- Only the finishing bonus matters, making intermediate placements feel empty.
- Bonus animations take longer than the decisions they resolve.
- The board requires repeated zooming or scrolling just to decide a move.

If these persist after a focused iteration, compare E07's compact-hand approach before adding more systems.

## 9. Implementation implications

This section identifies consequences of a future prototype; it is not an instruction to migrate the live game immediately.

### State and rules

- Keep the working rack, persistent table groups, temporary UI staging, river, wall, and run inventory distinct.
- Store committed group identity, slot, physical tile IDs, placement order, and pending effects in authoritative game state.
- Previewing or moving temporary staging tiles must not consume resources, award milestones, or trigger permanent growth.
- Each physical tile must occupy exactly one location. A table tile cannot simultaneously remain in the rack or be drawn again from the wall.
- Group replacement must transfer displaced tiles to the river and preserve already earned score without re-awarding old milestones.
- Define completion from group structure. Quads mean a completed table can contain more than fourteen physical tiles; the pair slot and four meld slots are the relevant contract.
- Separate short-table milestone detection from existing full-hand Yaku validation. Adapted Tensho bonuses should not accidentally inherit incompatible Riichi requirements.
- Persist tile edits across rounds and explicitly clear round-local table state, charge counters, and milestone claims.

### Scoring and bounded interactions

A useful event sequence is: validate commitment → spend action → move tiles → score the new group → resolve allowed Decree triggers → award newly completed milestones → award a first completion bonus if applicable → determine round outcome → refill if play continues.

- Give triggers a clear source, target, and action identity so explanations and forecasts can refer to them.
- Copying and retrigger effects must have explicit recursion rules. Start with one copy level and a documented finite per-action resolution budget.
- Do not rescore the entire persistent table after every placement by default. Repeated scoring should come from visible rules the player chose.
- Award each milestone category once per round in the initial prototype. If repeated achievements later become a mechanic, define their identity and cost explicitly.
- Use the same authoritative pipeline for previews and actual scores. Label random-output effects with a truthful floor or range.
- Compare patterns and upgrades against action cost and likelihood, not just the size of their largest possible score.

### Existing content needs a compatibility pass

An effect that refers to “held tiles,” “winning hand,” “per scored tile,” “concealed,” “number of hands,” or a specific Yaku may change meaning substantially when groups persist. Do not silently reinterpret all 164 existing Decrees.

Select a small compatible set. For each, decide whether it reads the new placement, the current rack, the committed table, or the whole round. Clearly define scope in its description. Apply the same audit to Flowers, Seasons, consumables, bosses, and table modifiers before admitting them into the experimental pool.

### Relevant integration points

| Area                             | Existing starting point                                            | Likely change                                                              |
| -------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Authoritative play and resources | [GameOrchestrator.ts](../src/game/GameOrchestrator.ts)             | Table commitments, placement allowance, revision, and round completion     |
| Pattern parsing                  | [PartialHandParser.ts](../src/rules/PartialHandParser.ts)          | Validate individual groups; add a separate cross-group milestone evaluator |
| Score calculation                | [ScoringEngine.ts](../src/rules/ScoringEngine.ts)                  | New-group scores, milestone rewards, and explicit retriggers               |
| Decree interpretation            | [DecreeSystem.ts](../src/systems/DecreeSystem.ts)                  | Clarify target scope and admit a curated compatible subset                 |
| Shop                             | [TeaHouseSystem.ts](../src/systems/TeaHouseSystem.ts)              | Small coherent offer pool and understandable tile edits                    |
| Board and rack interaction       | [PlaySurface.tsx](../src/components/gameplay/PlaySurface.tsx)      | Stable table slots and readable rack selection                             |
| Gameplay screen                  | [GameplayScreen.tsx](../src/components/screens/GameplayScreen.tsx) | Resource labels, preview, table state, and conditional Finish action       |
| Guidance                         | [beginnerCoach.ts](../src/gameplay/beginnerCoach.ts)               | Explain immediate value and future opportunities                           |

### Verification that matters for a prototype

Cover the irreversible gameplay transitions: score/resource parity, tile conservation, one-time milestone awards, revision costs, legal completion with quads, bounded copying, concealed information, exhaustion, and round resets. Walk through a full three-round run with taps and keyboard controls. Automated correctness checks support the experiment; observe people playing to evaluate whether it succeeds.

## 10. Open design decisions

These are questions to resolve through prototypes, not requests to stop work before creating one.

1. Does a rack of eight or ten tiles create the clearest choices without excessive bad draws?
2. Should patterns pay fixed points, additive multiplier, multiplicative bonuses, or a deliberately small combination?
3. How large must shape rewards be before recognition feels valuable while loose-tile strategies remain possible in an alternate ruleset?
4. Should table revision be available to everyone or become a Decree identity?
5. Does a visible draft row improve agency more than limited river recovery?
6. Does keeping the pair until the end create satisfying anticipation or an obvious mandatory order?
7. Is the completing-table reward exciting enough without making all partial progress irrelevant?
8. Which traditional Yaku are naturally understandable across committed groups, and which belong in advanced modes?
9. How frequently should a player encounter an upgrade that changes their desired tiles?
10. Which boss constraints provoke adaptation while leaving a recognizably viable plan?
11. How much score-detail animation remains enjoyable after ten rounds?
12. Do players prefer short three-round challenges, a longer run, or both once the same core loop is compelling?

The next implementation milestone should be a playable answer to E01–E05, followed by observation and comparison. The other experiments are a reservoir of directions to try when evidence suggests what the game needs next.
