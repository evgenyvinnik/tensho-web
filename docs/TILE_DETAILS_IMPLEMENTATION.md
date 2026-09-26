# Localized tile identities and teaching details

Updated September 26, 2026. Local implementation; publication pending.

## Corrected behavior

The live tile popup previously hard-coded English identities and prose. Summer
claimed a gold reward, Winter claimed defensive bonuses, and Spring promised
extra draws despite the unconnected mechanic. These were player-facing defects,
not merely untranslated source comments.

- Shared tile identity now labels images, Classic staging/return controls, Table
  Loop rack buttons and public shop/river rewards. Red fives remain distinct.
  Hidden Classic tiles expose only the localized face-down label, without the
  underlying name, modifiers or popup.
- Numbered tiles explain matching pairs/triplets and same-suit sequences; Honors
  explain matching rather than sequences. Base points come from the scoring
  engine and are explicitly before group bonuses, discounts and other effects.
  The popup does not promise that a loose tile pays its full base value.
- Flower explanations use the shared base percentages and distinguish those
  base rules from the active collection/suppression effects in the Flora
  inspector. Season explanations reuse that inspector's implemented rule text.
  Spring remains explicitly unconnected; this does not choose its pending rule.
- Tile Marks, Seals and Editions use localized catalog text, including badge
  titles. Added the missing catalog entries in Indonesian, Italian, Russian,
  Thai, Tagalog and Turkish. The shared identity/teaching/action copy is present
  in all thirteen locales, with placeholder and catalog-key coverage.
- Removed the duplicate, unconditional modifier-total summary: it could imply a
  held Steel bonus was paid just by playing the tile. Each modifier retains its
  own condition in the rule text. No scoring or timing rule changed.
- Existing portal positioning, Escape dismissal, touch selection and artwork
  are preserved. Names/rules stay accessible text; no additional bitmap is
  needed to teach the actual tile faces already illustrated in the game.

## Evidence and limitations

- Initial five component regressions: **1 passed / 4 failed**, reproducing
  English names, stale Summer/Spring prose, and failure to update identity after
  changing language. Concealed identity protection already passed and is retained.
- First combined check: **60/65**. The five failures were existing pack/river
  assertions expecting old short labels rather than the newly shared tile names.
  Assertions now verify the full localized identities; actions and prices remain
  unchanged. The next check passed **64/65**, with the existing pack test hitting
  its unchanged five-second deadline (5.174 seconds). Host load was about 30–34.
  Do not relabel that timeout as a passing run.
- Initial strict TypeScript found six new test fixtures missing their required
  Tile IDs. Fixtures now supply explicit IDs; production constructors are unchanged.
- Final full regression: **1,333/1,333 in 114 files**, two workers, 170.82 seconds.
  Strict TypeScript and Pages-base production/PWA build passed (358 modules,
  268 precache entries, 67,861.76 KiB). Existing chunk-size and Browserslist
  warnings remain. Targeted ESLint passed without errors or warnings.
- The first native browser command executed no tests: Node required JSON import
  attributes in the new fixture. After fixing those imports, **26/32** passed.
  The six new Classic checks compared entire saved envelopes; a diagnostic diff
  proved only `revision` and `updatedAt` changed, while the complete authoritative
  snapshot stayed identical. The tests now compare that full snapshot rather
  than incorrectly forbidding routine checkpoint metadata updates.
- Final native browser regression passed **36/36**, followed by **6/6 tile-pack,
  keyboard and localized reward checks**, without retries or deadline changes.
  Coverage includes English/Spanish Merchant purchase/swap/reload; Classic
  staging/return in Spanish/French/Japanese; short-phone tooltip geometry and
  keyboard dismissal; Russian/Thai stacked modifiers without clipped content;
  existing tap/drag and hidden-information forecast regressions.
- Reviewed Russian and Thai stacked-modifier screenshots. Browser artifacts:
  `/tmp/tensho-tile-details-browser-2`, `/tmp/tensho-tile-details-browser-final`,
  `/tmp/tensho-tile-details-packs`. Owned servers were shut down before edits.
  Publication remains pending.

This does not certify all catalog translations or native-speaker quality. It does
not implement the unresolved Negative-tile, Spring/Autumn/Winter, mutation or
Flower–Season design choices. Physical-device/screen-reader review and observing
whether a newcomer can explain a play remain separate completion requirements.
