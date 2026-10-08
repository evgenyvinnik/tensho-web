# Copied abilities: physical costs and shared limits

October 7, 2026 local / October 8 UTC. Implementation checkpoint; publication
verification is pending. This does not declare the whole project complete.

## Decision under delegated authority

The user authorized resolving open mechanics while preserving prior confirmations.
Copying an effect also copies its cost, paid by the physical copier, not its source.
This extends the existing scoring/resource trade-off rule to defeat settlement.

- Resolve one level only, from complete physical inventory order. Suppressed or
  debuffed owners and sources cannot contribute copied powers. Copies never jump
  over an inactive neighbor or recursively copy another copying effect.
- Prefer permanent Immortal rescue to consuming Phoenix rescue. Among consuming
  rescues, spend copies before originals, then preserve inventory order. Otherwise
  spending the original first would invalidate every still-owned copy of it.
- Consume exactly the chosen physical owner. Eternal protection prevents payment,
  so an Eternal copier cannot grant a free Phoenix rescue. A spendable copier may
  borrow from a legacy Eternal Phoenix without destroying its protected source.
- Immortal rescue retains its owner and sets the existing global run score penalty
  to ×0.5. Multiple copies or repeated rescues do not multiply that penalty again.
- An active Glass Cannon copy inherits destruction on final Boss defeat. Snapshot
  all liabilities before removal, deduplicate by owner, and report destruction only
  when removal succeeds. Eternal protection still applies. Existing native Glass
  Cannon liability remains even while suppressed; a copy only borrows a currently
  active rule. This intentionally preserves the native item's prior lifecycle.
- Binary permissions use the same resolver. Dead Wall Writ and Whispering Merchant
  retain their single shared once-per-round budget; copies do not manufacture more
  charges. Writ use survives save/reload and resets on actual round entry.
- Existing rescue settlement, final-defeat Rental and win-only income are unchanged.
  Cerulean Bell's latest-only lock and Merchant's selected rack/river swap remain.

The resolver now retains both source and owner identity, avoiding guesses from
shared effect-object references. No new save schema or random draws are needed.

## Player explanation and art

All copy portraits expose an optional, initially collapsed “Copied powers and
costs” explanation inside the existing hover/focus/tap inspector. Four authored
strings cover the rules in all thirteen locales. Amber Acorn hides these details;
ordinary non-copy items do not show them. Existing scroll artwork is reused;
no new image or model provenance is claimed for this mechanics checkpoint.

## Verification ledger

Evidence root: `/tmp/tensho-copy-lifecycle-dnqutz`.

- Initial regression: **5/11 passed, six failed**, reproducing original-before-copy
  Phoenix consumption for all four copier types, missing rescue from an Eternal
  source, and missing copied Glass Cannon destruction. These were production
  defects, not weakened expectations.
- Initial fix: **21/21** including the ten existing loss-prevention tests.
- Expanded focused verification: **41/41 in three files**: seventeen lifecycle
  cases, fourteen UI/locale cases, and ten existing loss-prevention cases. Includes
  exact validated restoration, permanent-priority/nonstacking penalty, source and
  owner suppression, debuff/chaining boundaries, Eternal costs, snapshot destruction,
  and shared Writ use across reload and next round.
- Native browser first batch: **3/4**. One test captured `shop.opened: false` before
  the new shop initialized, then compared that transitional snapshot with the
  opened shop after reload. The harness now waits for the existing persisted
  `shop.opened` state before asserting exact shop recovery; no production saving
  behavior, assertion content, deadline or retry allowance was changed.
- Corrected native browser batch: **4/4**, 23.1 seconds. English/Spanish,
  1280×800 desktop and 320×568 touch. Actual UI opens the illustrated inspector,
  expands localized cost details, plays a losing hand, observes copier consumption,
  reloads the shop exactly, enters the next round, exhausts its hands, consumes the
  original Phoenix, and reloads that shop exactly. No page errors or horizontal
  overflow. Spanish short-phone inspector screenshot reviewed; long expanded
  details use the existing scrollable inspector.
- These controlled valid-save journeys prove integration, not organic acquisition
  frequency or player enjoyment. Production and hosted verification follow below.
- Full regression: **2,164/2,164 in 175 files**, 121.92 seconds, two workers and
  unchanged deadlines. Strict TypeScript, full lint (zero errors / 211 existing
  warnings), whitespace checks and all thirteen release-workflow tests pass.
  Pages-base production build passes, with 431 precache entries / 70,897.33 KiB.
  Existing chunk-size and stale-Browserslist warnings remain.
- Initial production browser launch: **0/4** because the verification preview
  server was started without the build's `/tensho-web/` base setting. Asset URLs
  returned the HTML fallback, leaving a blank app. Restarting the owned preview
  server with the matching `VITE_BASE_PATH` corrects this verification setup; the
  production bundle and test deadlines are unchanged.
- Correctly based production replay: **4/4**, 12.3 seconds, no retries. Reuses
  the exported valid native save and interacts only through public UI/save state.
  All two-rescue, localized-details, exact-reload, error and overflow checks pass.

Broader balance/fun validation, remaining item wording, native-language review,
physical-device accessibility and the large full offline cache remain open.
