# Current all-table, all-Stake run sweep

October 7 UTC / October 6 local start, 2026. This is **pre-Drought-repair** engine
evidence, not a post-change balance or human-playability claim.

Two matched policies ran all eight tables and eight Stakes with seeds 21–23:
192 runs each. Both use observed-build shopping and conservative consumables;
one adds the existing structural hand planner. Source stayed fixed throughout
both measurements: commit `01b0b64fddeccbeb3537ff7ba2dbd54466f9689e`, fingerprint
`66061e476d6b68f36510be6c9d0f4a93fb5416ec6f233643ae61bb37197b73cb` over 312 files,
Bun 1.3.3. Tests added during the control run do not enter this source fingerprint.

Raw reports retain every run, exact commands, dirty paths and policy limitations:

- [Control](balance/2026-10-07-current-all-stakes-control.json)
- [Structural planning](balance/2026-10-07-current-all-stakes-structural.json)

| Measure | Control | Structural |
| --- | ---: | ---: |
| Runs | 192 | 192 |
| Diagnostic stops | 0 | 0 |
| Victories | 3 | 0 |
| Cleared rounds | 915 | 838 |
| Plays | 3,307 | 3,105 |
| Complete hands | 3 | 0 |
| Runs reaching Act 8 | 10 | 7 |
| Losses before clearing round one | 62 | 63 |
| Purchases | 1,675 | 1,761 |
| Consumable uses | 736 | 769 |
| Structural planning exchanges | 0 | 4,366 |
| Loss-prevention rescues | 0 | 0 |

Structural planning clears more rounds on 34 matched rows, fewer on 43, and the
same on 115. The three control victories are Green Felt/Stake 2/seed 22 (no
complete hand), Green Felt/Stake 3/seed 22 (one), and Dragon's Den/Stake 2/seed 22
(one). These are small matched samples, not independent people or evidence that
Stake 3 is easier than Stake 1.

The sweep verifies that these 384 runs terminate as genuine wins/losses rather
than invalid actions, no-advice stops or guards. It does **not** verify every
item/Season combination. It also argues against promoting the current structural
planner into the live coach unchanged: more exchange effort did not yield more
complete hands in this sample. Planning/resource cost and actual player decisions
remain important work; cosmetic changes cannot resolve that concern.

The reports were completed before repairing Drought empowerment. Do not relabel
them as a measurement of that later candidate or claim a tuning improvement.
No targets, prices, coach policy or default mode changed during the sweep.
