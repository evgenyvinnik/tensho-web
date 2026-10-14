# Synthetic production replays

These are captured test fixtures, not player saves. They come from the explicit
seed-7 setup in `bamboo-summer.spec.ts`, `flower-mutations.spec.ts`, and
`frostbite-retriggers.spec.ts`. The fixtures set inventories, walls, effects and
targets to isolate their named interactions. Transport identifiers/timestamps
are synthetic browser-test metadata.

`echo.json` dates from the `6c8e408` baseline and still restores through the
saved-run upgrade. `quad.json`, `complete.json` and `mutations.json` were
regenerated for the shared Turns budget: a one-tile REDRAW now draws the next
live-wall tile (the old single discard), `mutations.json` grants four free
redraws in place of four discards, and each round target sits one point above
its first scored play so a later play clears the round instead of Skip.

The production browser gate restores them through the normal saved-run reader,
then performs real pointer/touch actions, scoring, spending and reloads. It never
imports development engine modules. `quad.json` and `complete.json` cover
Bamboo/Summer; `mutations.json` covers Flower rebloom/overlap; `echo.json` covers
Frostbite retriggers and fractional Treasure settlement.

Use the native setup to regenerate a fixture when rules legitimately change.
Do not edit expected payments or inventory just to make a failing test pass.
These controlled scenarios do not establish organic acquisition or game balance.
