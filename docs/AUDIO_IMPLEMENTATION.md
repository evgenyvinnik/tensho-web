# Audio implementation and asset provenance

Updated November 1, 2026. Audio is now connected to the live application, not just an unused system definition.

## Assets

`public/assets/sfx/` holds 55 cues covering every declared sound ID, built by `scripts/generate-sfx.mjs` from two kinds of material:

- **Recordings** in `scripts/sfx-sources/`, outside `public/` so the raw packs are not served. [SOURCES.md](../scripts/sfx-sources/SOURCES.md) lists every file, its origin, licence and the cue it feeds.
  - Kenney "Casino Audio" (CC0): clay-chip clacks played 15–25% slow for every tile action, the hand-played slap and the shop reroll, plus gold, chips and card-pack paper.
  - Kenney "Interface Sounds" (CC0) for button clicks and ticks.
  - The game shows rewarded ads, so non-commercial licences (CC BY-NC and similar) are off the table even with credit. A CC BY-NC mahjong recording was tried for tiles and removed for that reason.
- **Synthesis** for payoffs and refusals: Karplus-Strong koto in the *yo* pentatonic (D E G A B, *in* scale for losses), rin bells and glass, taiko, hyoshigi clappers, a felt thump under landing tiles, and a two-knock woodblock for illegal actions, so refusals never buzz.

Every recording is credited in-game under **Settings → Credits** (title, author and licence; for a CC BY work, also the changes made), in all thirteen languages, although CC0 does not require it. The entries come from `src/config/creditsDefinitions.ts`.

The four music tracks are unchanged; this work does not establish new licensing provenance for them, so they are not yet listed in Credits.

Six more songs come from PeriTune's [Konohana](https://peritune.itch.io/konohana) collection (Shizima 2, Otogi 3, Minamo, Amenoshita 3, Otogi 4, Shizima 4; commercial use and editing allowed, no credit required, so not yet in Credits either). They live in `public/assets/music/`, re-encoded from 192 to 128 kbps MP3 and scaled to the original tracks' RMS level (about −20 dBFS, roughly 7–9 dB down), so every song plays at element volume 0.7 and the balance holds on iOS. They are precached for offline play under their own 24 MiB budget in `scripts/verify-asset-delivery.mjs`, apart from the 40 MiB core payload.

History: the first palette built every cue from pitched sine partials, so all seven tile sounds were near-identical ~800 Hz beeps and every button played a 620 Hz blip. A second, fully synthesized pass modelled tile clacks physically; the current pass uses recorded chip clacks instead.

The `sample` voice skips silence before each hit (some sources open with up to 120 ms of it, which would read as input lag), can resample a slice slower or faster, high-passes away DC offset and rumble, can gate room hiss between transients, and fades the slice out.

Loudness is matched on a K-weighted 50 ms RMS (a short-term loudness proxy) with a soft-knee ceiling, so a 30 ms click and a one-second phrase land at intended levels rather than at equal peaks. **The category balance is baked into the files** (interface −8 dB, tiles −0.9 dB relative to game cues) and every cue plays at one element volume of 0.5, because iOS ignores `HTMLMediaElement.volume` and plays each file at its own level. 0.5 also matches music's 0.7 × 0.7, so music and effects keep the same balance on iPhone, where both play at file level. On iOS the in-game volume sliders still cannot change levels; only mute works there.

- Mono, 32 kHz, 16-bit PCM WAV: content up to 16 kHz, more than phone speakers reproduce, and crisper than the former 24 kHz. A 44.1 kHz build pushed the precached payload past the 40 MiB core budget enforced by `scripts/verify-asset-delivery.mjs`.
- Approximately 1,970 KiB across all 55 files; tails are trimmed below −54 dBFS, and the three optional ambient beds (not triggered by the game) are 1.2 s. Sources add about 0.5 MiB under `scripts/`.
- Tile and interface cues are under 0.25 s (most 30–120 ms); payoffs run up to 2.4 s.
- Percussive cues (tiles, interface, coins, score beads, hand played) vary pitch by a few percent per play with `preservesPitch` disabled, so repeats do not machine-gun and clicks are never time-stretched. Tonal phrases stay at concert pitch.
- All tile cues and the most frequent payoffs preload, so their first play is not delayed by a fetch.
- Deterministic generation, bounded peaks, and a short tail fade avoid clipped samples and abrupt waveform endings.
- `node scripts/generate-sfx.mjs` rebuilds the files.
- `node scripts/generate-sfx.mjs --check` compares every asset byte-for-byte against its recipe and sources without writing files.

All paths respect the app's deployment base. WAV files are included in the production service worker's precache; this is verified against the built manifest, not a claim that every PWA upgrade scenario has been audited.

## Live playback

`useAudioLifecycle` mounts above routing and owns initialization, settings synchronization, user-gesture handling, and cleanup. `AudioSystem` owns the actual media elements. The menu's `useAudio` is now a settings-backed adapter, not a second player whose tracks disappear on navigation.

| Interaction | Feedback |
| --- | --- |
| Classic selection, draw, discard, committed hand | Tile sounds and a brief placement cue |
| Classic Yaku/Yakuman, round/Act result, victory | Increasingly substantial result cues |
| Classic purchases, packs, Decrees, Flowers, Seasons, consumables | Corresponding acquisition/use cues from domain events |
| Table Loop ordinary placement | Brief hand-play cue |
| Table Loop new milestone | Yaku-level phrase |
| Table Loop table completion | Stronger completion phrase |
| Table Loop shops, exchange/recovery, run result | Purchase, tile, and result cues |
| Enabled button click | Quiet UI cue; no automatic hover chorus |

Table Loop feedback is emitted after a live action resolves. Forecasts, journal replay, reload, and component rerenders do not replay scoring sounds. The flourish level comes from the actual causal stages, matching the visual escalation. Reduced motion does not force sound on or off; sound has its own independent preference.

## Controls and lifecycle guarantees

- No automatic playback before a pointer/key gesture. Startup rewards are not queued to play later in a burst.
- Music and effects use their persisted mute/volume preferences. Starting a run does not override mute.
- Music continues across screen navigation. Menu, game, shop, and result contexts select from the existing track library. Every track is eligible on the menu, and each launch opens on a different melody than the previous launch (`tensho-launch-track` in localStorage; without storage the opening track is simply random). A song that is also in the next screen's playlist keeps playing; otherwise the new context crossfades to one of its own.
- Music mute/pause/stop cancels pending fades and pauses both media elements. A late rejected/resolved play promise cannot mark muted audio as playing.
- Volume changes affect both sides of a crossfade and effects already playing.
- Effects are limited by per-cue capacity, a 45 ms repeated-event throttle, and a ten-voice priority budget. A fourteen-tile deal does not play fourteen simultaneous draw sounds.
- Failed effects release their pooled voice so later attempts remain usable.
- Synchronous media-property failures during SFX setup/release are caught as well as rejected `play()` promises; optional audio cannot throw through tile selection.
- Hidden tabs pause music and stop effects, on `visibilitychange` and also on `pagehide`, which covers iOS exits that skip the visibility event (back-forward cache, home-screen app switches). A `play()` that settles after the page was hidden or muted is paused on arrival. Returning (`visibilitychange` or `pageshow`) resumes permitted music but never replays old effects; iOS may need one tap before audio restarts.
- On the website, a window `blur` (another window or app in front of a still-visible page) silences the game the same way; `focus` or the next tap/key resumes it. The iOS app skips window focus events and relies on `appinactive`/`appactive` for lock and background.
- The music toast animates inward without expanding the page, ignores pointer input, and respects reduced motion.

## Verification

- Twenty-one audio-system tests cover assets, native-format headers/peak bounds/tap-length bounds, per-play pitch variation, a different opening melody per launch, songs carried across screens, pagehide/pageshow, window blur/focus, a late `play()` after hiding, initialization/cleanup, gesture gating, pooling, rejected playback, synchronous setter failures, mute/volume changes, crossfade races, visibility, and settings synchronization. The interaction browser suite additionally injects a failing native tile-SFX setter and verifies selection still succeeds.
- Four Table Loop audio tests cover escalating intensity and the live-action versus forecast/reload boundary.
- Six browser checks across desktop Chromium and mobile Chrome observe real `HTMLMediaElement.play()` promises, not a fake audio implementation. They verify decoded scoring sound, music continuity, persisted mute, independent SFX enabling, and silent saved-run restoration.
- The original audio pass ran 442 unit/component tests in 41 files, plus TypeScript and production builds. See [the wrap-up ledger](IMPLEMENTATION_WRAP_UP.md) for the latest full-suite evidence.

Remaining validation: listening on representative speakers/headphones and iOS/Safari devices; balancing the mix during long sessions. Headless playback proves decoding and control behavior, not acoustic quality or player enjoyment.
