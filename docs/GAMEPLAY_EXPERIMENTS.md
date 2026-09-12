# Making Tensho Fun: Gameplay Experiments and Wild Ideas

**Created:** September 4, 2026  
**Idea bank expanded:** September 10, 2026 — 118 experiments, including the moonshot collections in sections 11, 13, and 17, three concrete session pitches in section 14, and six subtraction tests in section 15.

**Latest synthesis:** September 10, 2026 — section 16 connects the idea bank to the upgrade-payoff problem and specifies three small comparison prototypes. These are variants of existing ideas, not additional approved features.

**Implementation handoff:** [Section 18](#18-fun-first-prototype-brief) turns the bank into a deliberately small experiment brief, with a fallback if the core loop still fails. It is a proposal for discussion, not authorization to implement all these systems.

**Status:** Mostly design proposals. E01–E06, the section 1.4 coach and the section 1.1 scoring baseline have implementation notes in [Section 0](#0-what-has-been-built). Those notes record prior work, not a fresh verification of the current build. Everything else in this document remains a proposal, not an approved backlog.

**Baseline inspected:** `77e0345` on `main`.

This document captures the discussion about why Tensho still feels unengaging, proposes a different core loop, and collects ambitious experiments that could give the game a stronger identity. Numbers in proposed mechanics are starting points for playtests, not established balance values. Several ideas are deliberately incompatible alternatives; building all of them would defeat the purpose.

The immediate objective is **three rounds that people want to replay**. A larger item library, more illustrations, or more tutorial text cannot establish that on their own.

## The two-minute version

**The design bet:** make tiles feel like parts of a machine the player is building, rather than unfamiliar symbols they must understand before anything exciting happens. A turn should create a plan, change that plan, or deliver its payoff.

Read the bank in three levels of ambition:

- **Make an ordinary turn compelling:** [persistent groups](#e01--persistent-groups), [visible tile offers](#e06--better-access-to-the-tile-you-are-chasing), and [upgrades that pay off during ordinary play](#16-make-the-interesting-part-happen-during-ordinary-play). Start by observing the existing prototype; these are not all missing features.
- **Give the run a personality:** [a charged scroll you choose when to fire](#e71--the-wind-up-shrine), [repairing a favorite tile with gold](#e77--kintsugi), [rewriting one upgrade rule](#e88--rewrite-one-sentence), and [a boss shaped by your earlier bargains](#e94--the-boss-you-assembled).
- **Question what the game even is:** [rob a palace using tile patterns](#e97--the-heist-table), [collapse the board into cascades](#e114--avalanche-mahjong), [split tiles into smaller numbers](#e115--break-a-tile-into-its-numbers), or [face your previous hand as a rival](#e118--your-previous-hand-becomes-the-enemy). These belong in separate experiments, not simultaneous additions to Classic.

**My first bet to test:** one scroll with a visible charge-and-release effect, using the [E71 prototype brief](#worked-example-e71--the-wind-up-shrine). It targets the complaint that upgrades do not change the next decision. Compare it with the existing loop before adding more content. If players can explain the choice but still do not want another run, test a different core loop rather than expanding that scroll into a whole system.

For imagined play rather than specifications, read the [three short session pitches](#14-three-sessions-worth-imagining). For a deliberately smaller game, read [what to remove](#15-the-other-wild-idea-remove-half-the-game). Every number below is a test parameter unless explicitly identified as a historical measurement.

## Start here: the fun we are chasing

This is a menu of possibilities, not a promise to implement 118 features. The working hypothesis is that Tensho needs more anticipation, consequential choices, and surprising interactions—not simply more rules to explain.

For a quick tour, start with these fantasies:

- **“One more tile and this works.”** Leave a group under construction (E19), see a tile worth chasing in the offers row (E06), or rescue something previously discarded (E10). The missing piece gives the next draw meaning.
- **“I built a ridiculous machine.”** Charge a wind-up shrine (E71), connect two complementary Decrees (E76), or arrange a small trigger pipeline (E72). The reward should follow visibly from the player's choices.
- **“This tile is my favorite.”** Let a tile learn (E33/E82), repair it with a golden seam (E77), or preserve its story as an heirloom (E80). Attachment comes from what happened during play, not just rarity.
- **“I could win safely, but what if…?”** Declare an ambitious final group (E65), bank or ascend in an alternate loop (E08), or accept one absurd bargain (E86). Clearly disclose the stakes and preserve any already-secured clear where the rules promise one.
- **“I caused this final boss.”** Earlier bargains write its restrictions (E94); a sleeping dragon can be deliberately provoked (E90). Difficulty becomes a consequence to plan around, not merely a larger target.
- **“My table is telling a story.”** Patterns build an illustrated paper theater (E95), and interacting groups answer each other musically (E96). Keep the established art direction, but make spectacle follow a real mechanical payoff.
- **“What if points weren't the objective?”** Try a short heist with pattern locks (E97), a collapsing palace (E98), or a compact spatial puzzle (E09). These are separate core-loop experiments, not extra panels on the current game.

Every proposal needs a tradeoff: what does the player gain, what do they give up, and why might another choice be attractive? Each idea's risk notes matter as much as its exciting part.

**Suggested reading:** sections 1–3 for the diagnosis and core-loop proposal; sections 5, 11, and 13 for the extended idea bank; section 12 for the shortlist and incompatible combinations; section 14 to imagine actually playing three different prototypes. Section 0 records implementation history and simulation results; neither those results nor this brainstorm establish that people find the game fun. That still needs observed playtests.

## From player complaints to experiments

This index connects the concerns raised during development to the idea bank. These are design hypotheses, not a fresh bug audit or a claim that the listed features are missing. Keep implementation evidence in section 0 and the implementation documents.

| Concern or wish | Ideas to explore | What would make the experiment worth keeping? |
| --- | --- | --- |
| “I don't know Mahjong, so I don't know what to do.” | Section 7's authored first session, optional rank/suit aids, and explanations of two meaningful choices | A newcomer can identify a group and explain a reason to play it without memorizing Mahjong terminology. |
| “I play something, then it feels like I start over.” | E01 persistent groups, E19 a group under construction, E21 the long staircase | The player can point to visible progress and name a tile they want next. |
| “Playing everything feels like the obvious answer.” | E07 compact hands, E20 open versus concealed, E26 the stubborn pair | Keeping a useful tile sometimes has an understandable advantage over spending it now. A confirmation step alone does not create that tradeoff. |
| “The upgrades don't change how I play.” | E31 fusion, E41 tile workshop, E71 wind-up shrine, E76 duet, E88 rewrite one sentence | A purchase changes which tile the player keeps, which group they pursue, or when they score—not just the displayed total. |
| “I want those ridiculous combo moments.” | E24 bounded echoes, E27 Dragon choir, E64 outrageous Decree, E72 conveyor court | The player deliberately sets up a strong interaction and can explain what caused the payoff afterward. |
| “Every run and boss feels similar.” | E46 forked ascent, E59 boss rule theft, E89 duelist, E92 invitation, E94 a boss assembled from earlier bargains | Players describe different plans across runs; bosses ask for adaptation without routinely disabling the whole build. |
| “I want to care about my tiles.” | E33 apprentice tiles, E35 remembered combinations, E77 kintsugi, E80 heirloom, E82 tile quests | A player remembers a particular tile because of a decision or event, without needing permanent power grinding. |
| “The art is wonderful; make the world feel alive.” | E95 paper theater, E96 musical scoring, section 7's causal animations | Illustration, table color, and sound reinforce a real interaction. The same state remains clear with sound off and reduced motion. |
| “The layout and descriptions are hard to use on a phone.” | Section 7's stable table layout and accessible tile details; section 12's small-screen guardrails | The next action stays readable inside the ornamental frame, corners remain clear, localized descriptions fit, and scroll details work by tap or focus as well as hover. |
| “I want a reason to try again after losing.” | E62 short challenges, E63 puzzles from a run, E99 director's cut | A loss suggests a different approach that the player voluntarily wants to test, rather than another obligation or grind. |

### The interaction contract beneath the wild ideas

These presentation rules should support whichever core loop wins the playtest; they are not substitutes for an interesting decision:

- **Stage, inspect, commit.** Selection and any “select all” shortcut should stage tiles without spending resources. Show legality and the known result before the explicit play action. Clearing removes the selection, not tiles from the run. Disable actions with no meaningful effect and explain actual restrictions without repeating the same numeric rule across the screen.
- **Art carries identity; text carries rules.** Use illustrated scrolls for Decrees, recognizable pack art, a consistent gold symbol, and the selected table's palette. Keep names, effects, costs, and warnings in localized text outside the artwork. Make selling a secondary, compact action, visually separate from opening details.
- **Teach the next decision, then get out of the way.** Offer a short explanation at the moment it becomes useful, allow dismissal and replay, and never require reading a glossary to make the first satisfying combination.
- **Keep the table in place.** Reserve ornament clearance, center confirmation titles, keep primary actions predictable, and let longer secondary content scroll. A new mechanic must justify its screen space on a small phone as well as a desktop.

### Permission to be much stranger

If incremental improvements do not produce an enjoyable loop, keep the radical alternatives on the table: E09's spatial puzzle, E56's impossible ranks, E57's two timelines, E61's cooperative table, E97's heist, or E98's collapsing palace. Prototype one tiny slice as a separate mode. These proposals deliberately change what the game is; they should not become six additional systems bolted onto the default run.

## Navigation

- [The two-minute version](#the-two-minute-version)
- [From player complaints to experiments](#from-player-complaints-to-experiments)
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
- [11. More wild ideas: give every run a story](#11-more-wild-ideas-give-every-run-a-story)
- [12. What to try next, and what not to build together](#12-what-to-try-next-and-what-not-to-build-together)
- [13. Further out: twelve rule-breaking experiments](#13-further-out-twelve-rule-breaking-experiments)
- [14. Three sessions worth imagining](#14-three-sessions-worth-imagining)
- [15. The other wild idea: remove half the game](#15-the-other-wild-idea-remove-half-the-game)
- [16. Make the interesting part happen during ordinary play](#16-make-the-interesting-part-happen-during-ordinary-play)
- [17. Beyond the score chase: six more radical experiments](#17-beyond-the-score-chase-six-more-radical-experiments)
- [18. Fun-first prototype brief](#18-fun-first-prototype-brief)

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

### Where a round's score comes from (questions 2, 3 and 7)

Three of the open design decisions are one question asked from different sides,
and the causal chain built for E05 already carries the answer: every resolution
reports its stages and each stage says what it added.
[`scripts/tableloop-attribution.mts`](../scripts/tableloop-attribution.mts)
walks them and adds up who paid.

| Source | Share of all score |
| --- | ---: |
| Group base — tiles and structure | 59.9% |
| Completing the table | 19.4% |
| Milestone rewards | 13.2% |
| Decree flat points | 11.1% |
| Everything the multipliers add | 9.4% |
| Revision credit | −13.0% |

**Q3 — how large must shape rewards be?** They already are. Group base is the
single largest source by a wide margin, which is what section 1.1 wanted. The
half of the question about loose-tile play does not apply here, because this
loop accepts nothing but complete groups; it applies to the classic loop, and
is answered above.

**Q7 — is the completion reward exciting without making partial progress
irrelevant?** Yes, and by a comfortable margin. Completion is a fifth of the
score while partial progress is roughly three quarters, and rounds are cleared
more often than tables are finished (82% against 51% in round one). Both halves
of the question are satisfied, so nothing changed.

**Q2 — fixed points, additive multiplier, multiplicative bonus, or a small
combination?** This one had a real answer hiding in it. Multiplication accounts
for **9.4%** of all score — the "deliberately small combination" is, in
practice, fixed points with a decorative multiplier. Doubling every milestone
multiplier moved that share only to 10.6%, and mostly by inflating the
completion bonus rather than ordinary placements. The reason is structural, and
it is the same one that sank the neighbour bonus: **in a four-placement round, a
multiplier earned midway has almost nothing left to multiply.**

So patterns pay fixed points — that is the income, and the measurement says so
plainly. What the multiplier is actually for is something else entirely: it is
what a pattern *costs to break*, the commitment that stopped a slot being
re-scored indefinitely. Sized for that job rather than for income, every
milestone multiplier is doubled. Breaking Pure Suit now genuinely hurts,
multiplication's share rises to 12.1%, and measured clear rates do not move at
all — 82/57/50% before and after.

That is worth stating as a design fact rather than a tuning note: **in this
loop, multipliers are a commitment device, not an income source.** Any future
effect that hopes to pay through multiplication needs a longer round to do it
in.

### E04's actual test, and what the shop failed

E04 sets two conditions: an early shop should keep at least two viable
directions open, and **a purchase should regularly change the next draw the
player wants**. The shop was built to spec and never checked against either.
[`scripts/tableloop-shop.mts`](../scripts/tableloop-shop.mts) checks both.

Money was never the problem — 91% of shop visits could afford two or more of
the three offers. The second condition failed outright. Owning a Decree barely
changed what a player placed:

| Owned | Bamboo run | other run | set | pair |
| --- | ---: | ---: | ---: | ---: |
| Echoing Bamboo | 17.5% | 33.6% | 8.2% | 40.7% |
| Watch Fire *(unrelated)* | 17.0% | 33.5% | 8.7% | 40.8% |

Two different Decrees, indistinguishable behaviour. The reason is that all eight
were passive score modifiers: they change how much a placement is worth, not
what you go looking for. Echoing Bamboo doubles a Bamboo run, but you cannot
*find* more Bamboo runs — you place what the rack gives you. Principle 3 says
this in advance: prefer an effect that changes what a player keeps, places,
redraws or buys over another percentage.

Two Decrees that act on the rack and the rules instead:

- **Wide Rack** — two more tiles in the rack, so every placement has more to
  choose between.
- **Gap Bridge** — once a round, a run may leave one rank out: 3·4·6 counts as
  a sequence. This is E18's bridge, with the limited use that section demands,
  and it changes which tiles are worth keeping rather than what they pay.

| Owned | Bamboo run | other run | set | pair |
| --- | ---: | ---: | ---: | ---: |
| baseline | 17.5% | 33.6% | 8.2% | 40.7% |
| + Wide Rack | 19.1% | 35.5% | 10.1% | **35.4%** |
| + Gap Bridge | 20.2% | **37.9%** | 7.7% | **34.1%** |

Sequences up four points, pairs down six, and more of the round's actions turn
into placements. That is a Decree changing what the player wants, which is what
E04 asked for. The pool is ten now, still inside the "six to ten" the section
opens with, and 82% of visits still afford two of them.

### The scoring baseline, in the live game (section 1.1)

This is the one change in section 0 that is **not** confined to the prototype.

The complaint was specific: a Bamboo run paid 15 tile points plus 20 structure
for 35, while three unrelated Honors paid 45 and no structure. Learning to spot
a pattern paid less than not learning to. The prototype dodged it structurally,
by refusing to accept anything but a complete group; the live game could not,
because that is its whole tactical layer.

Two changes, made together so that value moves rather than leaves:

- A tile in a tactical play that belongs to **no group** scores half its tile
  points. Halved rather than zeroed, because the document asks for loose-tile
  strategies to stay possible.
- Structure points rise from 10/20/30/50 to **15/30/40/65**.

The comparison is now 45 against 22. The things the document says should stay
true still do, and are pinned as tests: an Honor triplet still beats a run of
simples, a selection with no group in it still scores something, and a complete
hand is untouched — every tile in one already belongs to a meld or the pair, so
neither the eight-Act target curve nor the Decrees that scale off it move.

Balance was measured rather than asserted.
[`scripts/classic-balance.mts`](../scripts/classic-balance.mts) is the harness
the implementation-status document has had outstanding; it plays the
highest-scoring legal selection every hand and reports how far the run gets.

**September 9 audit qualification:** the candidate search is heuristic. The
audit found Boss Mandate restrictions missing from preview validation and an
old `--shop` flag that bought nothing. [The shop audit](SHOP_IMPLEMENTATION.md)
records the replacement acquisition path; [the play-validation follow-up](PLAY_VALIDATION.md)
records the shared validator, concealed-rack fallback, and corrected measurements.
The historical table
below is a scoring-policy comparison, not proof of complete legal-play coverage
or player difficulty.

| | before | discount only | both changes |
| --- | ---: | ---: | ---: |
| Rounds cleared per run | 1.32 | 0.97 | 1.34 |
| Median run score | 751 | 656 | 763 |
| Runs reaching Act 2 | 5% | 5% | 8% |

The discount on its own was a 27% difficulty regression. Paired with the
structure raise it is neutral, which is the point: the same game, with the
reward pointed at recognising a shape. And the rule is stated where the decision
is made — the forecast reads "Loose tiles score half · group them for full
points".

One incidental fix: that table of structure values existed in three copies —
the scoring engine, the partial-hand parser's search weights, and the coach's
ranking. They are one exported table now, because a search optimising weights
the scorer no longer uses is a bug waiting to happen.

### Resource-aware Classic follow-up

The [September 9 balance audit](CLASSIC_BALANCE_AUDIT.md) now compares the same
200 seeds under baseline, resource-aware, and one-away policies. With unchanged
cheapest-first shopping, using real discards/redraws raises median Act reach
from 1 to 2 and mean rounds from 4.01 to 5.49. The one-away variant records two
complete hands in 4,707 plays. None of these policies uses consumables or
optimizes shop synergies, and none reaches Act 8 in this sample. These findings
motivate further investigation of pattern access and item use; they do not
establish human difficulty, enjoyment, or permission to implement the idea bank.

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

At this historical checkpoint, the sound half was not built and
`public/assets/sfx/` was empty. That limitation has since been addressed:
[the audio implementation record](AUDIO_IMPLEMENTATION.md) documents generated
synthesized cues and live feedback using the same escalation levels
(`none` / `milestone` / `completion`). Whether that sound makes the interaction
more enjoyable still needs listening and playtesting.

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

**Historical diagnosis:** This section describes the inspected baseline `77e0345`, not a fresh audit of the working tree. Some issues have since been addressed as recorded in section 0. Keep the original observations as the rationale for the experiments, not as claims that every defect remains present.

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

E01–E05 now have a playable answer, as recorded in section 0. The next step is observation and comparison, not treating the remaining ideas as an implementation checklist. The other experiments are a reservoir of directions to try when evidence suggests what the game needs next.

## 11. More wild ideas: give every run a story

All E65–E100 below are **new proposals, not implemented features or approved requirements**. They expand the original 64 experiments rather than replacing them. Names, costs, and limits are illustrative. Effects that resemble existing items still need a compatibility audit; a matching name does not mean the mechanic exists.

The central hypothesis: the player should not merely ask “which selection scores most?” They should sometimes ask “can I pull off the ridiculous thing I am building?” The ridiculous thing must still be understandable.

### A. Change what a turn feels like

#### E65 — The last empty seat

The final empty table slot offers a visible choice: finish conventionally, or declare a more specific finishing shape for a larger bonus. The declaration spends an action and cannot be changed for free. A guaranteed ordinary finish becomes a deliberate gamble on a spectacular finish.

**Watch out:** Keep a secured round clear secured. This is a completion challenge, not permission to unexpectedly turn a win into a loss.

#### E66 — The traveling spark

A spark moves to the next numbered slot after each committed placement. Building in its current slot charges a later bonus; building elsewhere preserves another plan but misses that charge. Slot order becomes a short, visible timing puzzle.

**Watch out:** Movement is turn-based, not real-time. Show the next position and make all interactions usable without animation.

#### E67 — Two ways to read the same tiles

A rare Decree lets one newly committed selection choose between two legal interpretations, such as a standard group or an explicitly defined alternate recipe. Preview both results before commitment. The fun is finding a second use for tiles the player thought they understood.

**Watch out:** Choose exactly one interpretation. Do not count the same physical tiles twice or introduce exceptions without a visible recipe.

#### E68 — The sealed envelope

Commit a visible objective now, such as finishing with Bamboo, for a reward revealed and fixed before acceptance. The envelope stays beside the table and opens when the condition is met. It makes a future moment tangible without another currency.

**Watch out:** This is a presentation-led variant of E43's contract. Compare the two presentations rather than shipping two overlapping systems.

#### E69 — Encore instead of replacement

Once per round, a special action reactivates one existing group at a reduced, explicitly previewed value instead of placing a new group. Spend a scarce action enjoying the engine already built, or use it to approach completion.

**Watch out:** An Encore is not a fresh placement, revision, or new milestone. Define which Decrees can hear it and prevent self-repeating chains.

#### E70 — The escape hatch

Sacrifice a future shop reward for one emergency exchange when the rack has no legal group. The player has a costly answer to a bad situation instead of only a restart button.

**Watch out:** First compare against the existing recovery exchange. Keep this only if it creates a distinct, comprehensible decision; it must not become a routine tax on every round.

### B. Build an engine that visibly does something

#### E71 — The wind-up shrine

One Decree stores a charge whenever a different suit is placed. Spend its charges on one future group, or keep charging toward a larger release. Its illustration visibly fills with light.

**Watch out:** Cap stored charges, show the exact release preview, and decide explicitly whether unused charge survives a round.

#### E72 — The conveyor court

Three visible Decree positions form a tiny pipeline: mark the new group, transform its marked bonus, then echo that bonus. Rearrange the pipeline between rounds to change the result. The player builds a little scoring machine they can point to.

**Watch out:** Only introduce ordering if order genuinely changes decisions. Define event phases and bounded copying; arbitrary trigger order is not a puzzle.

#### E73 — Ink runs out

A powerful scroll has a small number of charges. Use them now, sell the depleted scroll, or refill it at a shop instead of buying something new. A favorite item becomes a resource decision rather than a permanent automatic bonus.

**Watch out:** Show remaining charges on the item and never consume them during previews. Limit upkeep so the shop does not become maintenance work.

#### E74 — The understudy

A modest Decree learns one narrowly defined effect from an adjacent Decree after several qualifying plays. The player can later sell the teacher and keep the learned technique.

**Watch out:** Show the eligible effect and learning progress. Forbid learning another learning/copying effect in the first prototype.

#### E75 — The rebellion

Each time the player declines an offered build-specific bonus and makes a different legal group, a rebellion meter advances toward a one-use rule break. Occasionally resisting the build becomes part of the build.

**Watch out:** Count real committed opportunities, not selection toggles. Avoid rewarding intentionally bad play so strongly that the obvious strategy is to sandbag.

#### E76 — The duet

Two Decrees share a single, readable objective: one prepares a group and the other resolves it. For example, the first marks a sequence and the second rewards a later triplet containing its middle rank.

**Watch out:** Each item needs a useful standalone effect. A two-item combo that does nothing until both randomly appear is not a satisfying early build.

### C. Make individual tiles memorable

#### E77 — Kintsugi

A tile deliberately repaired at a workshop gains a golden seam and a chosen conditional effect. Its strength comes from surviving a meaningful sacrifice, not merely having a rarer border.

**Watch out:** Distinguish repairable damage from permanent destruction. Never encourage repeated zero-cost breaking and repairing for growth.

#### E78 — The courier tile

A marked tile carries a one-use bonus into the next group that includes it. When committed, it transfers a smaller parcel to one eligible replacement tile chosen by the player. A useful effect travels through the run.

**Watch out:** Keep at most one parcel initially. Transfers cannot duplicate it, and the destination must exist in the visible rack.

#### E79 — The sworn enemy

Two marked tile families have opposing bonuses: favoring one strengthens it while weakening the other until the next shop. An awkward draw offers a genuine pivot rather than simply being worthless.

**Watch out:** Keep an ordinary scoring floor. Show both consequences before commitment, and cap any oscillating growth.

#### E80 — The heirloom

At the end of a run, save one favorite tile's appearance and story in a cabinet. A separate seeded challenge can start with that tile's explicitly balanced effect. Players remember “my impossible Bamboo five” without making the default game easier through grinding.

**Watch out:** Default runs keep comparable starting power. Clearly separate cosmetic remembrance from challenge-specific mechanical inheritance.

#### E81 — The shapeshifter's price

A tile can become a chosen missing rank, but doing so removes its permanent enhancement or consumes an exchange. The player gets precision at the cost of a treasured property.

**Watch out:** Identity is chosen before validation. Preview the permanent loss and require confirmation for the transformation, not extra confirmation for every normal play.

#### E82 — A tile with a quest

One tile asks for a short personal achievement, such as joining both a sequence and a triplet across different rounds. Completion offers two clearly different evolutions.

**Watch out:** This is a focused implementation of E33's living tiles, not another parallel progression system. Begin with one quest tile and no mandatory grind.

### D. Shops that tempt you to change your mind

#### E83 — Try before you buy

A shop item offers a miniature sandbox using a saved, visible hand from the previous round. Try its effect and inspect the score difference without changing the real run.

**Watch out:** Label this as a demonstration, not a guarantee of future strength. Do not expose future wall draws or let sandbox actions mutate the run.

#### E84 — The pawn ticket

Temporarily pawn a Decree for gold and a fixed, visible buyback price at the next shop. Lose its effect for the coming round to afford a transformation now.

**Watch out:** Reserve the item reliably and disclose what happens if it is not reclaimed. No hidden interest or real-money stakes.

#### E85 — The merchant remembers

Buying a kind of tile edit unlocks a related, guaranteed service at the next shop. A purchase can establish a two-stop plan instead of only improving the current inventory.

**Watch out:** Guarantee the stated service, not a hidden adaptive shop. Preserve unrelated offers so changing direction remains possible.

#### E86 — One absurd bargain

A rare shop offers a powerful item with an immediate, specific sacrifice: lose one Decree slot, remove a chosen suit's enhanced tiles, or give up the next shop. Show the resulting state before acceptance.

**Watch out:** This extends E47's visible curse. Test one simple bargain at a time and reject combinations that leave no legal continuation.

#### E87 — The commission board

Choose one of two visible shop commissions: a reliable low reward or a demanding build-specific reward. The next merchant pays for the selected achievement and offers a related upgrade.

**Watch out:** Use the same objective machinery as E43/E68. Do not stack several contract panels or punish players for ignoring them.

#### E88 — Rewrite one sentence

A rare shop service edits one constrained keyword in a compatible Decree: “Bamboo” becomes “Circles,” or “first” becomes “last.” A familiar item becomes personal to the current build.

**Watch out:** Offer authored, tested variants rather than arbitrary natural-language rule editing. Show the complete localized result and exact price before purchase.

### E. Bosses that are puzzles rather than score walls

#### E89 — The duelist

A rival publicly commits a small pattern. Beat it with a contrasting named shape for a reward, or ignore the challenge and keep scoring normally. The rival reacts to completed groups, never a real-time timer.

**Watch out:** The rival's rule and available responses must be knowable. Do not fake an opponent that secretly adapts to invalidate the player's choice.

#### E90 — The sleeping dragon

A visible meter wakes the boss after a fixed number of high-power effects. Waking it increases pressure but exposes a bonus opportunity. Decide whether to build quietly or provoke an explosive finish.

**Watch out:** Preview meter changes and both phases. Never surprise the player by changing the target after they have already secured the clear.

#### E91 — The confiscated seal

A boss temporarily locks one Decree, but shows a short achievable condition that releases it. The player works toward a satisfying restoration rather than enduring a whole round with the build switched off.

**Watch out:** Do not lock the only tool needed for the release condition. Provide an alternate costly release if the necessary tiles never arrive.

#### E92 — The invitation

Before a boss, choose which of two public restrictions it will impose. One challenges the strongest part of the build for a better reward; the other is safer but less lucrative.

**Watch out:** Both options need honest, build-aware descriptions. This can replace a route-map decision rather than adding another layer above it.

#### E93 — The courtroom objection

Once during a boss round, spend a limited resource to suspend one named restriction for the next placement. The dramatic moment is choosing exactly when to break the rule.

**Watch out:** Preview the exempted rule and the rules that remain. Avoid a universal immunity button that makes bosses irrelevant.

#### E94 — The boss you assembled

At earlier shops, accepting powerful rewards adds visible clauses to the final boss. The finale becomes the consequence of the bargains made during the run.

**Watch out:** Cap the number of clauses and reject incompatible combinations. Keep the complete future boss summary available before every bargain.

### F. Full moonshots and presentation-led experiments

#### E95 — The paper theater

Turn a run's board into an illustrated miniature scene. Sequences extend a bridge, Dragon groups light lanterns, and the pair opens a gate. The environment tells the story of the actual build.

**Watch out:** Generated images are decorative assets, never the only explanation of state. Keep tiles, text, selected table colors, and accessible contrast authoritative; use static equivalents under reduced motion.

#### E96 — The score is a song

Assign a brief musical phrase to each group family. A real interaction makes its phrases answer one another, and the finish resolves the motif. A player can hear their build coming together.

**Watch out:** Keep animations skippable and sound optional. Do not turn the game into a rhythm test or make every ordinary placement a long performance.

#### E97 — The heist table

A standalone mode replaces the score target with a small, visible sequence of locks. Each lock accepts several pattern solutions; surplus strength buys a shortcut or reduces alarm. The player plans a route through a puzzle using their build.

**Watch out:** This changes the objective and needs its own tutorial and balance. Prototype one short heist, not an entire campaign.

#### E98 — The collapsing palace

A standalone mode gives the table a few connected rooms. Completing patterns stabilizes rooms; abandoning one grants a resource but removes its future bonus. The run becomes a visible series of sacrifices.

**Watch out:** Collapse follows committed turns, never wall-clock time. Start with three rooms and a compact phone layout; do not combine with the two-timeline mode initially.

#### E99 — The director's cut

After a loss, optionally replay the last round from its original known state with one changed shop purchase. See whether a different idea would have worked, then return to a fresh run.

**Watch out:** Label the replay as practice, exclude it from ordinary records, and preserve the seed and rules version. The replay contains hindsight, so it is not proof the original decision was bad.

#### E100 — Write your own legend

A sandbox lets players combine a small set of validated rule modules into a shareable challenge: an extra pair slot, a rotating spark, borrowed boss powers, or dream ranks. The community can find combinations the designers did not expect.

**Watch out:** Share data-only configurations, never executable code. Validate compatibility and trigger budgets, version challenge rules, and keep sandbox records separate. This is a late-stage tool, not the cure for an unproven core loop.

## 12. What to try next, and what not to build together

### My recommended shortlist

The strongest next bet is **a visible plan, a purchase that changes it, and a payoff the player can explain**. More content is useful only when it serves that chain. The order below is a design recommendation, not evidence these ideas are fun already.

1. **Observe the existing Table Loop first.** Ask a newcomer what tile they want and why, without pointing at a button. Record where their plan disappears. Do not rebuild E01–E06 merely because their original proposals remain in this document.
2. **Try E19: a group under construction.** If players cannot name a desired tile, an incomplete visible group may create that desire. Test a single reserved slot with a clear cancellation cost.
3. **Try E71: the wind-up shrine.** If players understand groups but upgrades feel passive, a visible charge-and-release decision can make a build tangible. One new Decree is enough for the experiment.
4. **Try one E41 tile-editing service.** If the player has a plan but cannot influence it, let one shop purchase deliberately improve future draws. Show the before/after wall composition.
5. **Try E89: the duelist.** If ordinary turns work but rounds feel interchangeable, give one boss an optional pattern challenge that does not invalidate the build.
6. **Apply E95/E96 to a proven payoff.** Make the discovered interaction look and sound special after it is mechanically worth pursuing, retaining the established illustrated green-and-gold style.

These are separate test candidates. Do not add them all to the same build and then attempt to infer which one helped.

### Three deliberately different prototype packages

- **“One tile away”** — E19 under-construction group plus the already available offers-row variant E06. Test whether chasing a missing tile creates anticipation. Compare E19 alone before combining it with offers.
- **“I built a machine”** — E71 charge-and-release, followed later by a small E76 duet. Test whether purchases change the player's next three decisions. Leave living tiles and new currencies out.
- **“One more impossible finish”** — E65 finishing declaration in a short three-round challenge. Test whether players voluntarily take a clearly explained risk after safety is secured. Leave debt, curses, and additional wagers out.

If none makes people want another run, compare a genuinely different core loop such as E07 compact hands or E97 the heist table. Do not respond automatically by adding another inventory.

### Guardrails for the entire idea bank

- No mechanic earns its place just because it is implementable, visually impressive, or familiar from another game.
- Keep the main decision readable on a small screen. Hover details must also work with tap and keyboard focus.
- Put essential rules in localized interface text, not inside generated artwork.
- Preview deterministic consequences through the real scoring pipeline. State uncertainty when outcomes depend on unrevealed draws.
- Reward clever combinations generously, but prevent unbounded copying, free resource loops, and repeat milestone farming.
- Keep failure understandable. A loss should suggest another approach rather than imply the player needed a wiki or a lucky purchase.
- Avoid mandatory streaks, time pressure, and permanent power grinding as substitutes for enjoyable turns.
- Simulations establish properties of their policies, not human excitement. In particular, section 0's score attribution cannot establish that completion feels exciting; that remains a playtest question.
- A small experiment can be rejected. Keep the reasoning and evidence without keeping an unsuccessful feature in the default game.

### A lightweight record for the next experiment

For each selected idea, record: **hypothesis → smallest rule change → comparison build → observed decisions → decision to keep, revise, or remove**.

Ask players: “What were you trying to make happen?”, “Which purchase changed your plan?”, “Why did that big score happen?”, and “What would you try on another run?” Capture their actual answers and whether they voluntarily restart. Do not lead with “Was the new feature fun?” or equate clearing the round with enjoying it.

### Copyable prototype brief

Use this when an idea moves from the wishlist into an actual experiment. Approval to write this document is not approval to implement every proposal.

```markdown
## Experiment: E__ — Name

Status: proposed / approved for prototype / testing / kept / revised / rejected
Player fantasy: “I want to…”
Problem observed: What actually happened during a playtest?
Hypothesis: Changing ___ will help players ___ because ___.
Smallest playable change: One rule, one item, or one short encounter.
Meaningful choice: Gain ___ by giving up ___; the alternative is ___.
Rules: Trigger, cost, timing, limits, cancellation, and failure behavior.
Example turn: Show the starting state, two choices, and their consequences.
Readability: What must be visible without opening a tooltip?
Access: Touch, keyboard, localization, reduced motion, and sound-off behavior.
Safety checks: No infinite triggers, repeat claims, or impossible continuation.
Comparison: Same starting conditions, with and without this change.
Observe: What players pursue, misunderstand, abandon, and voluntarily replay.
Reject or revise if: Name a behavior that would disprove the hypothesis.
Out of scope: Other ideas deliberately excluded from this prototype.
Result: Observations and limitations, separate from designer interpretation.
Decision: Keep, revise, or remove; explain why.
```

### Worked example: E71 — The wind-up shrine

**Status: proposal, not a description of the current implementation.** These numbers are deliberately provisional.

- **Fantasy:** “I saved my big effect for exactly the right group.”
- **Smallest change:** One Decree with three visible charge marks. Each committed sequence adds one charge, up to three. Before a later placement, the player may arm the shrine to spend all three charges and double that placement's group-base points. Pair and triplet placements can receive the bonus too, so charging and spending need not favor the same shape.
- **Timing:** A placement cannot spend a charge it has just earned. Spending resolves first, then a qualifying sequence may add one new charge. Previews and cancelled selections change nothing. Charges reset between rounds; a trigger never charges itself recursively.
- **Choice:** Spend on a modest available group now, or save for a stronger group that might not arrive before the round ends. Ordinary unarmed play remains available. The shrine does not duplicate milestone rewards or other Decree triggers.
- **Example:** With three charges and two actions left, doubling a 35-point group adds 35 now. Saving for a possible 55-point group could add 55 instead, but that group is not guaranteed. Display the known score separately from the hoped-for draw.
- **Interface:** Put charge marks on the scroll and expose an explicit “Use on this play” toggle through tap, click, or keyboard. Preview the added points before confirmation. Animate the marks flowing into the scored group; provide the same information instantly with reduced motion and no sound.
- **Comparison:** Use the same short seeded runs with and without the shrine, alternating which version people try first. Do not introduce another new item, currency, or boss at the same time.
- **Evidence sought:** Players notice the charge state, explain a reason to save or spend, and can identify the shrine's contribution after scoring. Record whether they want another run without being prompted to replay.
- **Reject or revise if:** Players always spend immediately, always forget to spend, or cannot tell which score was doubled. A higher clear rate alone does not count as success.

The point of the brief is to turn “this sounds amazing” into a small, falsifiable design bet. Keep the strange ideas; make each one earn its place through play.

## 13. Further out: twelve rule-breaking experiments

**All twelve are new proposals, not implemented features or approved work.** The goal is to find a distinct Tensho fantasy, not reproduce another game's item count. These alternatives explore information, timing, sacrifice, and physical tile identity. Their numerical limits are prototype assumptions, not balanced rules.

### E101 — Mortgage the next draw

Borrow one tile from a visible future-draw queue now. The next refill is one tile smaller to repay the loan. A tempting missing piece becomes available immediately, but the player must decide whether completing today's group is worth having fewer choices afterward.

- **Example choice:** Take the Bamboo 5 that completes a run, or keep a full refill for a possible Dragon triplet.
- **Smallest prototype:** One public queue position and one outstanding loan. Display the reduced refill before confirmation; preserve the debt through a round transition if it is not yet repaid.
- **Risk / reject if:** Borrowing is always correct on the final action. Give unpaid end-of-run debt an explicit settlement cost, or disallow borrowing when no repayment is possible; never hide that cost until settlement.

### E102 — Fold a tile into an origami familiar

Permanently remove a tile from the run's wall to create a tiny companion with an authored effect. A Bamboo familiar might reward the first sequence each round; a Dragon familiar might reward saving an Honor through several placements. Only one familiar can be active.

- **Example choice:** Sacrifice a useful Dragon for its companion, or keep it to improve the chance of a triplet.
- **Smallest prototype:** One between-round service with two fixed recipes. Show the changed wall composition and familiar rule together.
- **Risk / reject if:** Every familiar is just a permanent multiplier, or sacrificing an unwanted tile has no downside. The slot and lost tile must create a real opportunity cost. Keep artwork expressive and rule text outside it.

### E103 — The shop wants a pattern, not gold

A wandering merchant offers one special item in exchange for a complete group from the rack. Accepting the trade removes those physical tiles from the run; declining leaves ordinary scoring available. The best purchase can cost the exact group that would clear the round.

- **Example choice:** Score a triplet now, or trade it for a Decree that supports the rest of the run.
- **Smallest prototype:** One optional, clearly timed encounter with one fixed offer. Preview score forgone, tiles removed, and inventory capacity before committing.
- **Risk / reject if:** Players trade away their only path forward without understanding it. Keep a legal continuation available and do not introduce a second full shop interface during every turn.

### E104 — Bet on a public draw

Before one special draw, optionally predict its suit. Success grants a fixed reward; failure spends a disclosed stake. Show exact remaining suit counts only when the rules make that information public. No real money and no purchasable retries.

- **Example choice:** Back the suit your wall editing has made common, take a riskier fixed-price offer, or skip without penalty.
- **Smallest prototype:** One optional wager per round, with fixed rewards and no loss-chasing escalation. Derive any displayed odds from the real eligible draw pool, including weighting.
- **Risk / reject if:** It becomes a reflex click or distracts from building groups. This overlaps E08's risk fantasy: test one, not both. Never rig outcomes to manufacture a near miss.

### E105 — A tile with two faces

One special tile has two printed identities, such as Bamboo 3 and Circle 7. Flip it freely while planning, then lock the chosen identity when committed. It creates two specific possibilities instead of the overwhelming flexibility of a universal wild tile.

- **Example choice:** Complete a Bamboo sequence now, or retain the Circle face for a nearly finished pair.
- **Smallest prototype:** One authored two-face tile; both identities are visible in its details. Use an explicit flip control, not an ambiguous double tap.
- **Risk / reject if:** It is almost always an automatic include. Count it as one physical tile everywhere, lock its identity for the entire resolution, and do not let retriggers flip it into scoring twice under different names.

### E106 — The ceramic kiln

Temporarily take a tile out of the rack and place it in a single kiln slot. Each committed action advances a visible transformation track. Withdraw it early for a modest change, or wait for a more valuable result while playing with fewer available tiles.

- **Example choice:** Retrieve a strengthened 4 to finish a group, or wait one more action to turn it into a scarce 5.
- **Smallest prototype:** One tile, two authored stages, no real-time waiting. Show retrieval timing, the final stage, and what happens at round end before insertion.
- **Risk / reject if:** It is just a free upgrade for a tile the player never wanted. The unavailable tile must matter; avoid combining this with several other off-rack storage mechanics.

### E107 — Cross-stitch the table

Allow two neighboring groups to share one physical tile at their intersection. A Bamboo 3 might complete a 1–2–3 sequence and a triplet of 3s. Building around the intersection produces a distinctive spatial puzzle.

- **Example choice:** Claim two group shapes efficiently, but lock their shared tile so either group becomes expensive to revise.
- **Smallest prototype:** A separate two-group board with one marked intersection. Score the tile's base value once while explicitly allowing both structure rewards.
- **Risk / reject if:** Players cannot explain ownership or revisions. This changes the ordinary Mahjong hand model; it needs a separate mode and cannot silently count as a legal classic full hand.

### E108 — Silence one scroll, wake another

Before scoring, voluntarily suppress one owned Decree for that resolution to give another a specific authored enhancement. An economy scroll could be silenced to strengthen a scoring scroll, making the build's internal tradeoff visible.

- **Example choice:** Receive reliable gold, or forgo it to push this group over the target.
- **Smallest prototype:** Two compatible scrolls and one approved enhancement, shown as a before/after score and reward breakdown. A suppressed scroll cannot also supply its ordinary passive benefit during that resolution.
- **Risk / reject if:** Suppressing an irrelevant scroll is always free. Avoid a generic “double anything” implementation until trigger order, copies, and mutual suppression have explicit limits.

### E109 — Catch the overflow

After a round is secured, a limited vessel can capture some excess score. Choose one use between rounds: a small opening resource next round or an immediate shop benefit. The vessel has a visible cap and empties after use.

- **Example choice:** End comfortably with a purchase bonus, or prepare a more flexible opening rack for the harder round ahead.
- **Smallest prototype:** One vessel, two fixed rewards, and a capped conversion curve. Show how much of the current preview would actually count.
- **Risk / reject if:** Strong runs snowball while struggling players gain nothing. Compare progression with and without it; avoid uncapped score-to-gold conversion, repeated settlement claims, and mandatory farming after a clear.

### E110 — Break your own masterpiece

Shatter a completed group for a one-time rescue resource, leaving a visible cracked slot that cannot be rebuilt this round. The player can sacrifice beautiful progress to save a run, but loses the group's standing contribution and dependent patterns.

- **Example choice:** Keep a high-value sequence and hope for a useful draw, or destroy it for an exchange that might complete a stronger pattern elsewhere.
- **Smallest prototype:** One shatter per round. Preview all removed score and milestones, the locked slot, and the granted resource before confirmation.
- **Risk / reject if:** Shattering becomes profitable score farming. Never refund already-spent resources or pay the broken milestone again; distinguish this permanent sacrifice from ordinary revision.

### E111 — The season is a dial you can turn

Instead of a purely automatic season change, completing a particular public pattern lets the player advance a small season dial. Stay in the current season to use a known bonus, or move to the next to favor a different part of the build.

- **Example choice:** Preserve today's sequence bonus, or turn toward the Dragon bonus for the group you are saving.
- **Smallest prototype:** Two seasons, one transition opportunity, and both rules always visible. The transition applies to subsequent actions, not retroactively to the triggering play.
- **Risk / reject if:** Choosing the season adds bookkeeping without changing a tile decision. This is an alternative to the current season behavior, not a second season system stacked on top of it.

### E112 — Pass the unfinished table

An asynchronous challenge lets one player leave a seeded, partially built table for another to finish with a fixed action allowance. The interesting gift is an inviting unfinished plan, not a maximum-power save file.

- **Example choice:** Leave an obvious safe completion, or arrange two plausible routes so the next player can surprise you.
- **Smallest prototype:** Export and import a versioned, data-only challenge with no accounts, chat, leaderboard, or server requirement. Validate every tile, rule, and action budget before loading; preserve the recipient's ordinary run separately.
- **Risk / reject if:** Challenges routinely contain unwinnable states or depend on hidden creator knowledge. Begin with an authored challenge template and a demonstrated legal completion. Treat shared state as untrusted input, never executable rules.

### Which of these deserves attention first?

For a **small, distinctive experiment**, E105's two-face tile offers an understandable decision with little additional screen space. E106's kiln is a larger bet on anticipation. E107's shared-tile board and E112's pass-the-table challenges are deliberate moonshots, not prerequisites for a good single-player game.

Keep section 12's shortlist ahead of these additions until observation points elsewhere. The practical priority remains: make a newcomer recognize one appealing possibility, give them a way to pursue it, and make the payoff visibly belong to their decision. None of these ideas can guarantee fun without being played.

## 14. Three sessions worth imagining

These are **authored prototype pitches**, not descriptions of a live session,
new experiment IDs, or promises that random draws will supply these moments.
They turn the idea bank into three experiences we can compare. Time ranges are
pacing targets, not timers imposed on the player. Practice deals may be authored;
ordinary runs must retain their disclosed random rules.

### Pitch A — The missing Bamboo

**Fantasy:** “I can see the beautiful thing I am one tile away from making.”

**Ingredients:** E01/E02 persistent patterns, then E19 under construction. Test
the existing E06 offers row separately before combining it with E19.

1. **Opening minute:** The practice rack contains a Bamboo sequence and a pair.
   The player sees what each would score and which slot it would occupy. One
   short prompt explains matching ranks versus consecutive ranks; no glossary
   or inventory tour interrupts the decision.
2. **First plan:** The player places Bamboo 2–3–4. It remains on the table. Later,
   Bamboo 2 and 3 can reserve one slot as an unfinished matching sequence. The
   slot shows the missing 4 and the proposed reward, but pays nothing yet.
3. **The actual dilemma:** A complete group could provide reliable points now.
   Pursuing the 4 costs an exchange and keeps a slot unavailable. The player
   can also abandon the unfinished group at a stated cost. Neither path should
   require guessing what a button consumes.
4. **The payoff:** If the matching sequence is completed, the earlier group
   answers it visually and the pattern reward names both sources. If it fails,
   the safe alternative remains visible; the teaching script must not promise
   that an ordinary random exchange will succeed.
5. **Between rounds:** Offer an existing compatible sequence upgrade alongside
   an alternative. Ask what the player expects the purchase to change, then
   watch the next round without coaching the answer.

**Minimum slice:** One reserved slot, one incomplete-sequence recipe, explicit
completion and abandonment rules, and a short practice deal. Do not introduce
living tiles, contracts, or a new currency.

**Keep it if:** Players independently name their missing tile and sometimes
choose the safe group for an understandable reason. **Rework it if:** Reserving
is automatic, becomes an unavoidable trap, or mostly adds another confirmation.

### Pitch B — The little scoring machine

**Fantasy:** “This was not a lucky number; I deliberately made my scroll do that.”

**Ingredients:** E71 charge-and-release, with E05 causal feedback. E76's duet is
a possible later extension, not part of the first comparison.

1. **Opening minute:** Give the player the single shrine from section 12's worked
   example. Its three charge marks and one-sentence rule are visible without
   hover. Use that example's sequence-charging rule consistently; E71's original
   different-suit trigger is an alternative, not an additional requirement.
2. **Build anticipation:** Committed sequences fill the marks. Selection,
   hovering, and previews never charge it. A brief response connects each new
   mark to the group that earned it.
3. **The actual dilemma:** At full charge, a modest group can spend the effect
   now, while a stronger group is only partly assembled. The player compares
   known additional points with the remaining actions and uncertain draw.
4. **The payoff:** An explicit arm control changes the forecast. Confirmation
   sends the stored charge into that group, and the breakdown distinguishes
   its base points from the shrine's extra contribution. Ordinary play stays
   available, and arming can be cancelled without spending anything.
5. **A reason to replay:** A post-run summary shows the player's largest release
   and its causes. Ask what they would save the charge for next time; do not
   manufacture another objective or require a replay to claim a reward.

**Minimum slice:** One Decree, one charge counter, one spending decision, and
forecast/resolution parity. Start with an authored mid-round practice state so
the charge dilemma can be tested immediately, then verify that it occurs often
enough in ordinary rounds to justify the item.

**Keep it if:** Players can explain both saving and spending. **Rework it if:**
It charges too late to matter, always rewards immediate use, or requires watching
a long animation to understand a simple doubling.

### Pitch C — Rob the impossible palace

**Fantasy:** “My tiles are tools for a clever escape, not just points.”

**Ingredients:** E97's heist as a separate core-loop experiment. This is the
radical fallback if understandable scoring still fails to make people care.

1. **Opening minute:** Show three visible vaults with illustrated locks. One
   accepts a pair, another a sequence, and another a triplet. The practice rack
   offers at least two possible openings; each lock shows what it accepts.
2. **The actual dilemma:** A Bamboo 4 belongs to both a possible pair and a
   possible sequence. Opening one vault spends those physical tiles, so the
   player cannot silently use the same 4 for both plans.
3. **A useful surprise:** One opened vault grants a single-use key that can
   complete another lock at a stated cost. Another offers treasure. Choose
   flexibility for a deeper attempt or a smaller haul that is easier to secure.
4. **The finish:** A visible action allowance limits the heist. A freely
   available escape action banks the currently shown haul and ends the attempt;
   exhaustion forfeits only the explicitly unbanked haul. Continuing after an
   escape is not allowed. The preview distinguishes what is safe from what is
   still at risk.
5. **A reason to replay:** Change one lock arrangement or available tool for
   the next short challenge. The intended attraction is discovering another
   route, not unlocking a permanent stat increase through repeated losses.

**Minimum slice:** Three vaults, three basic recipes, one tool, one finite action
budget, and a clearly explained escape. Use existing tile artwork. Leave the
Classic score economy, boss roster, route map, and collectible inventory out.

**Keep it if:** Players anticipate a route and can explain why they changed it.
**Rework it if:** There is only one sensible lock order, escaping is always
obvious, or the map becomes another small-screen layout problem.

### Choosing the first pitch

Use **A** when the problem is “I have nothing to chase.” Use **B** when it is
“I understand groups, but my upgrades are boring.” Use **C** when players
understand the scoring game and still do not want another round. These are
different diagnoses; adding all three would obscure which one we solved.

The existing Table Loop lets us observe A's foundation without another rewrite.
Start there, keep the illustrated identity, and let an observed player decision
choose the next experiment. The ambition is a memorable story about a move—not
merely a longer list of features.

## 15. The other wild idea: remove half the game

Adding systems is not the only way to find Tensho's identity. These six tests
deliberately remove familiar parts of the game to discover which decisions are
worth keeping. They are **alternative prototype constraints**, not six new
features, changes to the current rules, or additions to the 112 experiment IDs.
Run them separately; combining every simplification would produce a different
game without telling us which change helped.

### A. The tiny wall

For a standalone teaching prototype, use two suits and ranks 1–5, with only
pairs, triplets, and three-tile sequences. Remove Honors, bonus tiles, rare hand
names, and the full-hand requirement for this comparison. Keep recognizable
tile illustrations and an optional numeric label.

- **Question:** Does recognizing a possibility become enjoyable when the player
  has fewer identities to learn?
- **Smallest test:** One short authored opening followed by a disclosed seeded
  reduced wall. Tune its own targets; Classic's odds and progression do not
  transfer to this smaller pool.
- **Cost:** Less variety and less Mahjong identity. Reject it if players learn
  quickly but immediately run out of interesting choices. A successful result
  could justify an introductory mode, not automatically replacing Classic.

### B. One scroll, one spectacular rule

Borrow E71's wind-up shrine as the only upgrade in a short run. Remove the
consumable inventory, shop rerolls, rarity tiers, and the rest of the Decree
catalog. Give the player the rule before the first meaningful decision.

- **Question:** Can a single understandable interaction carry three rounds?
- **Smallest test:** Use section 12's existing charge-and-release specification
  without inventing a second trigger system. Compare an otherwise identical
  short run without the scroll.
- **Cost:** Less build discovery. If the scroll is forgettable even when it is
  the only one, more scrolls are unlikely to fix that particular interaction.
  If it works, add one complementary rule next, not twenty unrelated items.

### C. No shop screen

After settlement, show two free, mutually exclusive upgrade choices directly
above the table. Choosing one resumes play. For this variant, remove gold,
prices, selling, packs, and rerolls rather than leaving unusable currencies in
the interface. Both offers must fit the current inventory and have a legal
effect; exhausted offer pools need an explicit continuation.

- **Question:** Is shopping creating interesting planning, or interrupting the
  part people actually want to play?
- **Smallest test:** Three rounds with an authored pair of consequential offers
  at each break, using existing art and accessible expandable descriptions.
- **Cost:** Loses saving-versus-spending decisions. Keep the variant only if
  players still explain different upgrade choices, not merely finish faster.

### D. A run with no score target

Use E97's heist pitch: visible pattern locks, a finite action allowance, and an
explicit escape. Remove chips, multipliers, rising blind targets, and the
Classic economy. A sequence opens a door instead of filling a number bar.

- **Question:** Is the missing motivation a concrete objective rather than a
  more generous scoring formula?
- **Smallest test:** Section 14's three-vault session, with at least two viable
  routes and no additional map or combat system.
- **Cost:** This is a different core loop. Success would support a separate
  direction for Tensho, not prove that Classic is fixed. Do not quietly switch
  an existing saved run to these rules.

### E. Remove the pre-game lecture

In an explicitly labelled practice deal, let the player inspect and make a
simple group before showing a rules overview. Explain only the consequence of
that action, then offer one contrasting choice. Keep an always-available help
control; remove compulsory glossary reading and inventory tours.

- **Question:** Can the first satisfying decision teach more effectively than
  the first page of instructions?
- **Smallest test:** Compare two optional introductions to the same authored
  deal. Give both versions the same information about costs before commitment.
- **Cost:** Discovery can become confusion. Watch whether players understand
  why the move worked and can find the next one without a highlighted answer.
  Skipping tutorials must remain possible, and help must work without hover.

### F. Stop asking for a long run

Use E62's three-round challenge as a complete experience: a starting identity,
one meaningful upgrade, and a finale. Make the best interaction reachable
within that session instead of treating early rounds as a toll before the
interesting content. Leave meta unlock grinding and daily obligations out.

- **Question:** Is the enjoyable part too far away, or is it absent even when
  the player can reach it immediately?
- **Smallest test:** One fixed challenge with instant replay and a second seed
  available by choice. Record voluntary replay, not just completion time.
- **Cost:** Less room for gradual build growth. If people want another run,
  extend the arc carefully; if they do not, adding more Acts is not the next
  experiment.

### A decision before another implementation sprint

Observe a few newcomers playing the existing short Table Loop and ask them to
name what they want to happen next. Treat those sessions as qualitative clues,
not a statistically reliable verdict:

- **They cannot read the rack:** test A or E.
- **They understand groups but do not care about upgrades:** test B.
- **They lose interest between rounds:** test C.
- **They understand the game and still do not care about scoring:** test D.
- **They like a moment but dislike the journey to it:** test F.

Keep the current build available for comparison, alternate test order, and
write down the player's actual decisions and words. A rejected experiment is
useful evidence. The objective is not to ship the biggest idea bank; it is to
find a small set of rules that makes someone say, unprompted, “Let me try that
again.”

## 16. Make the interesting part happen during ordinary play

### The problem beneath the polish

The design hypothesis is that Tensho can explain an action clearly and still
fail to make that action desirable. Better tutorials solve “what does this
mean?” They do not necessarily solve “why do I want another turn?” More art
can make the table inviting, but the player needs something on that table to
anticipate, manipulate, and finally set off.

There is a concrete warning in the historical
[consumable-aware Classic comparison](CLASSIC_CONSUMABLE_BALANCE.md): its
conservative policy used 1,090 consumables across 200 runs, including 588 Orbs,
but produced no complete hands or detected Yaku triggers. This was a specific
pre-Unity-fix source snapshot and a limited automated policy, not a human
playtest or proof that those outcomes are impossible. Nevertheless, it raises
an important question: **are we selling players improvements to a payoff they
rarely reach?** Rerun the measurement against a chosen prototype; do not treat
these historical results as current balance figures.

Do not respond only by increasing every reward. First test whether the player
can deliberately activate the thing they bought, soon enough to connect the
purchase to the result.

### Three competing ways to bridge the payoff gap

These extend E02, E07, and E71. Pick one for a separate, labelled prototype;
they are not proposed simultaneous changes to Classic or the existing Table
Loop. All example values are provisional.

| Variant | What the player does | Smallest implementation | Main danger |
| --- | --- | --- | --- |
| **A. Little patterns, big identity** | Buy a sequence upgrade, then activate it by playing an ordinary sequence—not only by completing a full Mahjong hand. | One local sequence reward and one local triplet reward; preserve a separate completion bonus. | Local payouts make completing the larger hand pointless. |
| **B. A scroll with a fuse** | Charge a visible scroll through ordinary groups, then choose when to release it. | E71's one-scroll prototype: one trigger, one capped counter, one explicit spending action. | The fuse charges too late, or firing immediately is always best. |
| **C. Finish a promise** | Publicly commit to a pattern, build toward it over several plays, then collect one substantial reward. | One optional contract chosen from two visible patterns, with a fixed deadline and disclosed opportunity cost. | The promise becomes a compulsory checklist or a trap dependent on lucky draws. |

**A's rule boundary:** A local group reward is a new prototype rule, not a
claim that a three-tile group is a traditional Yaku. Name it “sequence bonus”
or “triplet bonus” in beginner-facing text. Define whether a physical group
can earn both a local reward and a completion reward; pay the local reward
only on its first qualifying commitment, never again through rearrangement.

**B's rule boundary:** Use section 12's worked E71 specification rather than
silently mixing its trigger with another variant. Display charge and the
known release result before commitment. Previewing, undoing a selection, or
reopening the screen must not charge or spend the scroll.

**C's rule boundary:** For example, pledge to place two sequences this round
instead of accepting a smaller immediate benefit. Ordinary placements still
pay normally. The pledge pays once on completion; failure loses only the
foregone benefit, not previously earned points. Make its eligibility and
deadline visible before accepting. Do not secretly alter draws to fulfill it.

### The upgrade audition

Before enlarging the item library, audition a tiny set of upgrades using four
questions. This is an editorial test, not a numerical balance formula:

1. **Intent:** Can the player say which tiles this upgrade makes them want?
2. **Access:** Can it plausibly trigger in the next ordinary round, without an
   authored rescue draw or hidden luck adjustment?
3. **Choice:** Does it change what they keep, exchange, place, or save?
4. **Attribution:** After it triggers, can they identify what it contributed?

An upgrade can intentionally be a rare, difficult build-around. The problem
is making *every* early upgrade demand expert recognition or a distant payoff.
Give a first-time player one accessible interaction; reserve difficult ones
for an informed choice. Avoid turning the shop into a guaranteed sequence of
perfectly matching items: adaptation is part of the experiment too.

### Keep the crazy ideas, but give each a job

Use the existing idea bank according to the feeling that is missing:

- **Nothing to look forward to:** try the kiln (E106), unfinished groups (E19),
  or a charged shrine (E71). Each makes future potential visible.
- **No satisfying rule-breaking:** try two-faced tiles (E105), rewriting one
  bounded scroll clause (E88), or a shared-tile board (E107). Each needs an
  explicit limit so the player can reason about what is legal.
- **No emotional attachment:** try a repaired tile (E77), an apprentice tile
  (E33), or an origami familiar (E102). Let a specific decision create its
  story; do not require repetitive permanent-power grinding.
- **No dramatic decision:** try the last empty seat (E65), a voluntary bargain
  (E86), or shattering a masterpiece (E110). Disclose exactly what can be lost.
- **No reason for the world to exist:** try the heist (E97) or collapsing palace
  (E98). In these separate modes, the patterns change the situation rather
  than only a number. Do not quietly replace an existing saved run's rules.
- **The mechanics work but the payoff feels flat:** try the paper theater
  (E95) or musical scoring (E96). Animate the cause and consequence, with
  immediate readable results available when motion or sound is disabled.

### A small test before another large sprint

Start with the existing three-round Table Loop and one accessible upgrade.
Watch a handful of newcomers and experienced players separately. Then compare
one payoff-bridge variant against that baseline, alternating order and keeping
the art, tutorial assistance, and starting scenarios comparable. Use labelled
authored practice states to demonstrate the mechanic, followed by ordinary
seeded rounds to test whether it actually occurs without assistance.

Record decisions and short quotations, not just a final “was it fun?” rating:

- Before the next draw: “What are you hoping for?”
- At an upgrade: “What would this change about your next move?”
- After a combo: “What made that happen?”
- At the end: “Would you like another run, a different variant, or to stop?”

Also record time to the first self-directed group, time from acquiring an
upgrade to its first activation, activations per round, unused upgrades,
requests for help, and voluntary replay. Separate inability to operate the UI
from inability to form a plan. Small sessions supply qualitative evidence,
not statistically reliable retention estimates.

**Keep** a variant when players form their own plans, sometimes change them
for understandable reasons, and attribute the payoff to their choices.
**Rework** it when one move dominates or it needs constant coaching.
**Stop expanding it** when players understand the mechanic but do not want
to use it again. At that point, try the smaller or stranger core-loop
alternatives rather than adding another currency, tutorial, or content tier.

The immediate deliverable should be one memorable, repeatable decision—not
implementation of this entire document.

## 17. Beyond the score chase: six more radical experiments

These are fresh design proposals, not implemented mechanics or traditional
Mahjong rules. They extend the bank to E118. Each asks whether tiles could
produce a different kind of decision, rather than merely a bigger multiplier.
The example numbers are prototype parameters, not balance recommendations.

### E113 — The missing tile is the treasure

A special table rewards the **negative space** between groups. Place Bamboo
1–2–3 beside Bamboo 5–6–7 and an empty, illustrated pedestal promises a bonus
if you eventually supply the missing 4. The absence becomes something visible
and desirable, not a pattern the player must discover in a glossary.

- **The delicious choice:** Spend a 4 now in an ordinary sequence, or preserve
  it to complete the connection between two groups already on the table.
- **What makes it different:** E19 completes one unfinished group; this joins
  two complete groups without invalidating either of them.
- **Smallest prototype:** Two group slots and one connector socket. Both groups
  score normally once. Filling the socket pays one separate connection reward;
  the connector cannot simultaneously occupy the rack or another group.
- **Risk / reject if:** The board becomes a confusing recipe book, or failure
  to find the connector makes all prior play worthless. Show eligible tiles,
  keep the ordinary clear attainable, and begin with one connection rule.

### E114 — Avalanche Mahjong

An alternate compact board lets completed groups disappear, causing tiles
above them to settle into newly formed groups. The player sees the whole
deterministic cascade before committing the placement that starts it.

- **The delicious choice:** Clear a modest group now, or place a less valuable
  tile that sets up two linked collapses on the next turn.
- **What makes it different:** E09 proposes a spatial puzzle broadly; this
  commits to gravity and board transformation as its central pleasure.
- **Smallest prototype:** A 3-by-4 board, one definition of a scoring group,
  and a fixed resolution order. Process all visible cascades before any refill;
  unrevealed refill tiles never appear in an exact score forecast.
- **Risk / reject if:** Automatic cascades decide the game while the player
  watches. Reward setups that players can predict, limit board size, and make
  every animation skippable. This replaces persistent-table rules in a separate
  mode; it is not another layer on the default board.

### E115 — Break a tile into its numbers

A workshop can split one suited tile into two lower ranks of the same suit,
conserving the rank total: a Bamboo 8 can become Bamboo 3 and Bamboo 5. A
reversible-looking material transformation creates a very concrete way to
repair a hand—but the operation itself costs a scarce resource.

- **The delicious choice:** Keep an 8 that completes a triplet, or split it
  into two missing pieces for different sequences.
- **Smallest prototype:** One split token per round and only two suggested
  valid partitions. Each output rank must be 1–9; Honors cannot split. Require
  room for the extra physical tile before committing the transaction.
- **Risk / reject if:** Players generate points or duplicate rare modifiers
  through splitting and merging. Retire the original tile ID, create two new
  IDs, and exclude modified tiles from the first prototype. Rank conservation
  does not imply score conservation; explicitly price the extra scoring body.

### E116 — Spend your combo to change the battle

A boss has an announced next action. Scoring a qualifying group offers a
choice: take its normal points, or surrender a displayed portion to cancel
one specific upcoming restriction. Your strongest combination can become
defense instead of damage.

- **The delicious choice:** Take the points that put the target within reach,
  or interrupt the boss so the sequence you are saving stays playable.
- **Smallest prototype:** One boss, one public restriction, and one interrupt
  opportunity. Preview both outcomes from the same staged group. Committing
  either option consumes the same tiles and action exactly once.
- **Risk / reject if:** Interrupting is compulsory, turning the mechanic into
  a hidden tax. The restriction must have a tolerable duration and an ordinary
  way to play around it. Never withdraw points from an already settled clear.
  Compare this with E89's duelist rather than combining both immediately.

### E117 — An expedition with no shop

Replace between-round shopping with choosing one of two illustrated rooms.
A workshop transforms a tile; a garden changes a group interaction; an archive
offers a rule to adopt. The run becomes a sequence of tangible decisions, with
no gold prices or reroll economy in this variant.

- **The delicious choice:** Visit the workshop for reliable repair, or the
  archive for a rule that could turn the whole build in another direction.
- **Smallest prototype:** Three rounds, two room choices at each intermission,
  and a tiny authored reward pool. State the operation before room selection;
  do not reveal a different offer after the player has committed.
- **Risk / reject if:** The rooms are simply a slower shop with fewer choices.
  Each visit needs one consequential action, then an immediate return to play.
  This extends E46's route idea and section 15's subtraction tests, but removes
  the shop economy rather than adding another destination beside it.

### E118 — Your previous hand becomes the enemy

At the next round, an illustrated rival displays a simplified echo of the
table you just built. Its public challenge asks you to surpass or reinterpret
one feature: answer your previous triplet-heavy table with sequences, or beat
its strongest group using a different suit.

- **The delicious choice:** Keep specializing in a powerful build and accept
  a harder optional challenge, or pivot because your own history made the
  alternative attractive.
- **Smallest prototype:** One optional rival challenge derived from the prior
  round's committed groups. Offer two readable ways to meet it and preserve
  the normal round-clear condition. No online opponent or account is needed.
- **Risk / reject if:** Success punishes players by automatically countering
  everything they built. Cap challenge difficulty, award only an extra reward,
  and never let the rival inspect hidden draws. Unlike E60's recorded ghost,
  this transforms the player's own last table into a new objective.

### A filter for choosing, not accumulating

Do not prototype all six. First decide which problem the session should test:

- **“I never care what comes next.”** Try E113 with two persistent groups and
  one connector. Ask the player which tile they want before the next draw.
- **“Scoring does not feel like I caused anything.”** Try E114 or E116,
  separately. Ask the player to predict the board or boss change before acting.
- **“I cannot influence a bad hand.”** Try E115. Check whether the split creates
  a genuine choice rather than one obviously superior repair.
- **“The interruptions are more work than the game.”** Try E117 and compare
  decision time and voluntary replay with the ordinary shop loop.
- **“Runs have no story.”** Try E118 and ask whether the player remembers the
  decision that created the rival's challenge.

My first comparison would still be the ordinary-play payoff bridge in section
16 against the existing Table Loop. If that produces understandable decisions
but little desire to replay, test one radical alternative above. Keep the art
direction, accessible controls, and tutorial assistance comparable so a new
illustration does not get mistaken for evidence that the mechanic works.

The goal is **interesting agency and a satisfying stopping point**, not daily
obligations, streak anxiety, paid random rewards, or endless progression that
withholds the enjoyable part. A player voluntarily asking for another run is
more useful evidence than a longer feature list.

## 18. Fun-first prototype brief

### The pitch in one sentence

**Build a little machine out of beautiful tiles, bend one of its rules, and
decide when to unleash it.** This is a proposed identity for Tensho, not a claim
that the current game already delivers it.

### The first experiment to hand to an implementer

Use the existing three-round Table Loop as the baseline. Add only E71's
wind-up shrine as a separate, explicitly labelled variant. Do not simultaneously
change the draw rules, progression curve, tutorial, and shop pool: we need to
know whether the new decision itself helps.

A concrete candidate rule to test:

- Placing a Bamboo sequence adds one visible charge, up to three.
- Before a later group placement, the player can arm the shrine. That placement
  consumes all charges and adds a clearly previewed flat reward per charge.
- Saving charges earns no automatic interest. Charges expire at round end,
  and arming can be cancelled before committing the placement.
- A triggered shrine cannot charge or retrigger itself through its bonus.
  Revising an already rewarded group cannot farm new charges.

The reward amount is a tuning parameter, not an established balance value.
Start with a flat reward to test timing and anticipation without also testing
a new multiplier formula. Show current charges and the projected contribution
beside the existing score preview; do not introduce another currency panel.

The intended decision is: **“Cash this in to clear safely, or keep a Bamboo
sequence available so I can charge it further?”** If holding charges until the
last placement is always best, the experiment has failed to create a timing
choice. Do not hide that failure with a larger reward or a longer animation.

### What counts as a promising result

Watch both newcomers and experienced players in labelled practice and ordinary
seeded rounds. Look for an unprompted plan, a deliberate change of plan, an
upgrade affecting a tile choice, and a payoff the player can explain. Ask
whether they want another run; record declines as readily as enthusiasm.
These are qualitative signals, not proof of retention or universal appeal.

Keep the variant small until those signals appear. More illustrated scrolls,
longer runs, and additional rarity tiers are expansion work, not the success
criteria for this experiment.

### If it still is not fun

If players understand the shrine but find placement itself dull, stop expanding
the scoring engine. Choose **one** separate core-loop test: E114's predictable
avalanche board for spatial setup, or E97's heist for pattern-driven objectives.
Keep the existing game available for comparison and preserve its saved runs.

All 118 ideas stay in this document as a creative reserve. Rejecting one
prototype does not require deleting the art direction, discarding the whole
project, or quietly turning every unused idea into another feature requirement.
