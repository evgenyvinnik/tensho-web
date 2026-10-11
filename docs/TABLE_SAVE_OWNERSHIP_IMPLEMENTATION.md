# Table Loop save ownership and coordinated reset

October 8, 2026. Implementation checkpoint; release verification is recorded below.

## Contract

Table Loop actions still resolve synchronously in the authoritative engine. Their
journal is saved asynchronously under the origin-wide `tensho-table-loop-write`
Web Lock. A writer compares the exact journal and reset marker it originally
observed before replacing storage. Two simultaneous branches cannot both win:
the rejected window retains its local state and visibly pauses. Storage and
visibility notifications also detect stale windows before their next action.
There is no automatic merge, reward replay or overwrite on retry/restart.

The illustrated pause screen offers an explicit, cancelable confirmation to load
the latest durable run. Missing storage opens a fresh table; invalid or unreadable
storage leaves the local branch unchanged. All fallible reads finish before even
the private journal changes. Transient tile selection is cleared only on successful
replacement. Copy is present in all thirteen locales; buttons remain at least 44px.
The existing guidebook artwork is reused, not newly generated for this checkpoint.

Version-1 and version-2 gameplay journals remain readable. New writes add a unique
`checkpointId`, separate from seeded gameplay randomness, so restarting the same
seed and repeating the same moves cannot recreate an obsolete checkpoint's bytes.
The `tensho-run-save-epoch` marker fences queued first-ever saves across an
empty-to-empty reset. It is coordination metadata, not earned progress.

Full progress reset takes the Classic write lock followed by the Table Loop lock,
captures rollback data inside both locks, changes the marker, then resets the
explicit profile/tutorial keys and removes both journals. Only durable success
cancels the local writers and replaces the live engines. A failed reset restores
and verifies the marker as well as the previous keys and profile states. Classic
operations also compare the reset marker across their lock wait. No unlocked
fallback is used when Web Locks are unavailable.

The exported single-mode Table Loop deletion helper also fences queued Table Loop
writes; the actual Settings full-reset coordinator uses both locks. Reload guards
wait for dirty checkpoints, reject dirty conflicted branches, and allow a safely
durable stale window to reload. Failed writes retain in-memory play and expose an
explicit retry. Pending reset leaves its opener focusable, but action-disabled,
so dialog dismissal can restore keyboard focus.

## Verification

Evidence directory: `/tmp/tensho-table-save-iQpNr5` (local, not a repository asset).

- Eleven store concurrency cases cover stale actions/restarts, competing writes,
  invalid/deleted records, recovered permissions, notification cancellation,
  unsupported locking, identical replay identity, empty-reset fencing and a
  failed metadata read during load. Component tests cover all-locale copy and
  confirmation/cancellation/failure recovery. Classic and reset tests exercise
  queued first saves, exact rollback and denied marker writes.
- Final native browser batch: **26/26 passed**, no retries, one worker. Includes
  six Settings reset journeys, four complete seeded run journeys, and sixteen
  English/Spanish desktop/touch two-window journeys. The latter use real UI and
  Web Locks, including forced simultaneous saves and reset-before-first-save.
- **10/10 actual old-to-new PWA upgrades passed**, using the clean previous main
  release as the old bundle. Exact saves survive, separate windows block unsafe
  updates, unavailable-storage paths recover, and all 52 optimized illustrations
  decode offline. These are fresh test profiles, not the user's browser data.
- Production build and asset coverage/budget checks pass: 37,826,980 precached
  bytes, below the 40 MiB limit. Thirteen release-workflow tests pass.
- Full regression: **2,836/2,836 tests in 201 files pass**, with two workers.
  TypeScript and lint pass (0 errors, 211 existing warnings). Publication and
  hosted verification remain pending; local checks alone are not a release claim.

Earlier attempts are retained. Initial unit failures included a mistaken rack
index/collection-index assertion. Making reset asynchronous exposed a real focus
restoration bug, corrected with a guarded `aria-disabled` opener. Development
browser runs while files were changing produced stale-store comparisons and
timeouts; the final helpers resolve the loaded module URL, retain enough resource
timing entries, await Settings readiness and await durable checkpoints before
reload. An intermediate resolver attempt ran before lazy modules were loaded and
failed explicitly. Other intermediate click/lock-count timeouts are not erased
or conclusively attributed; the final unchanged-source run passes the original
assertions without retries or longer deadlines. The first baseline fixture build
ran before its dependency link existed and failed; its completed rerun is the
fixture used by the successful upgrade suite.

## Limits

This does not make multi-key localStorage operations crash-atomic, provide cloud
sync, merge conflicting moves, or coordinate every lifetime-profile writer in
other tabs. Older installed versions that do not honor these locks can still
write; a current window detects changed bytes but cannot prevent an old writer.
Physical devices, Safari, assistive technology, native-speaker copy review and
human enjoyment remain separate work. See [wrap-up](IMPLEMENTATION_WRAP_UP.md).
