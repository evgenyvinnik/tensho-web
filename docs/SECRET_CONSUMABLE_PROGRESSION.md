# Secret consumable progression

Status: locally verified October 8, 2026; publication verification pending.

## Evidence and decision

`ITEM_LIBRARIES.md` lists two secret Seals and four secret Orbs with unlock
conditions. The prior release had no corresponding profile definitions or live
pool gates. A fresh forced-legendary Arcana roll produced Void/Immortal; Celestial
produced Black Hole/Eris. Direct acquisition of Ceres also succeeded unearned.

The [resolved rules](RULE_RESOLUTION.md#secret-consumables-earned-families-and-run-scoped-mastery)
now connect all six conditions. Paid Yakuman events additionally record their
original Yaku family once, fixing missing Kokushi/ascended-family progression.
Canonical catalog parity tests protect the 21-family and twelve-other-Orb lists.

## Implementation boundaries

- Profile conditions, event tracking, old-profile defaults and Full Unlock.
- Live eligibility in ordinary random rewards, shop stock, packs and Star Chart.
- Direct grant and stale unpaid-stock preflight; failed purchase changes nothing.
- Actual historical acquisitions, existing inventory, Fool history and paid pack
  rewards retained, including strict run restoration and exactly-once claiming.
- Archive eligibility reconciliation and six unlock explanations in all 13 locales.
- No new rarity distribution, balance promise, artwork or gameplay experiment.

## Verification record

- First targeted engine/bridge batch: 23/23 passed.
- Paid ordinary/ascended family and localized-dialog batch: 17/17 passed.
- First full regression: 2,552 passed, nine failed in three files. All failures
  were existing fixtures directly granting now-secret items on fresh profiles.
  They now explicitly supply earned-item eligibility; original effect assertions
  remain intact. Separate recheck of these affected effect tests: 35/35 passed.
- Added resolver test initially assumed two seeds would generate an ordinary Orb
  shop offer; neither did. Replaced that chance-based assertion with direct
  observation of resolver installation across construction/reset/restoration.
- Initial typecheck caught ES2020 `Object.hasOwn` incompatibility and a test
  calling a private helper. Corrected to the supported own-property check and
  actual Fool use through the public action path.
- The public Fool test then exposed a real legacy-copy regression: Seal use
  updates copy history before reward settlement. A private, capacity-checked
  grant path now honors that already-owned reward without weakening ordinary
  acquisition gates. Follow-up copy/unlock tests pass 23/23. The full run that
  began before this fix retains its result: 2,578 passed, one Fool failure.
- Native desktop/touch unlock and Archive journeys pass 8/8, without retries.
  Eris/Immortal are earned only at payment and survive reload; Archive ES/RU
  layouts retain their previous guarantees. Controlled Orb-use browser fixtures
  now explicitly provide already-earned eligibility, as their unit equivalents do.

Final local verification:

- **2,579/2,579** unit/component tests pass in 186 files.
- TypeScript and production build pass; PWA precaches 434 entries, 71,103.31 KiB.
  Existing large-chunk warning remains.
- Full lint: zero errors, 211 warnings. Final changed-file lint: zero errors.
- Release workflow tests: **13/13** pass.
- Native unlock/Archive journeys: **8/8** pass, desktop and 320px touch.
- Existing Orb-use/Wildcard/ledger journeys: **28/28** pass across EN/ES/RU
  where covered by each suite, without retries or altered deadlines.
- Built-production unlock/Archive replay: **8/8** pass, without retries.

Evidence directory: `/tmp/tensho-secret-consumables-6kSpr4` (local logs/replays).
The passing full regression follows the Fool fix; both earlier failures remain
above. Publication/independent CI/hosted checks are separate from local success.
No real-player claim about fun, mastery difficulty, translation quality or
whole-project completion follows from these checks.
