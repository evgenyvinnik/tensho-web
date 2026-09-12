# Audio implementation and asset provenance

Updated September 9, 2026. Audio is now connected to the live application, not just an unused system definition.

## Assets

`public/assets/sfx/` contains 55 original synthesized cues covering every declared sound ID. These are dependency-free procedural sounds, not recordings or AI-generated music. No third-party samples were downloaded or incorporated. The existing four music tracks are unchanged; this work does not establish new licensing provenance for those pre-existing tracks.

The sound palette uses short wood-like resonances/noise for tiles and interfaces, pentatonic bell phrases for rewards, and descending phrases for negative feedback. Ordinary actions stay short; dramatic cues are reserved for larger payoffs. This is a first-pass mix, not a claim of professional sound mastering or verified listener preference.

- Mono, 24 kHz, 16-bit PCM WAV.
- Approximately 1,438 KiB across all 55 files.
- Cues run from 80 ms to 2.4 seconds; the longest are optional ambient assets, not routine interactions.
- Deterministic generation, bounded peaks, and a short tail fade avoid clipped samples and abrupt waveform endings.
- `node scripts/generate-sfx.mjs` rebuilds the files.
- `node scripts/generate-sfx.mjs --check` compares every asset byte-for-byte against its recipe without writing files.

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
- Music continues across screen navigation. Menu, game, shop, and result contexts select from the existing track library.
- Music mute/pause/stop cancels pending fades and pauses both media elements. A late rejected/resolved play promise cannot mark muted audio as playing.
- Volume changes affect both sides of a crossfade and effects already playing.
- Effects are limited by per-cue capacity, a 45 ms repeated-event throttle, and a ten-voice priority budget. A fourteen-tile deal does not play fourteen simultaneous draw sounds.
- Failed effects release their pooled voice so later attempts remain usable.
- Synchronous media-property failures during SFX setup/release are caught as well as rejected `play()` promises; optional audio cannot throw through tile selection.
- Hidden tabs pause music and stop effects. Returning resumes permitted music but never replays old effects.
- The music toast animates inward without expanding the page, ignores pointer input, and respects reduced motion.

## Verification

- Thirteen audio-system tests cover assets, native-format headers/peak bounds, initialization/cleanup, gesture gating, pooling, rejected playback, synchronous setter failures, mute/volume changes, crossfade races, visibility, and settings synchronization. The interaction browser suite additionally injects a failing native tile-SFX setter and verifies selection still succeeds.
- Four Table Loop audio tests cover escalating intensity and the live-action versus forecast/reload boundary.
- Six browser checks across desktop Chromium and mobile Chrome observe real `HTMLMediaElement.play()` promises, not a fake audio implementation. They verify decoded scoring sound, music continuity, persisted mute, independent SFX enabling, and silent saved-run restoration.
- The original audio pass ran 442 unit/component tests in 41 files, plus TypeScript and production builds. See [the wrap-up ledger](IMPLEMENTATION_WRAP_UP.md) for the latest full-suite evidence.

Remaining validation: listening on representative speakers/headphones and iOS/Safari devices; balancing the mix during long sessions. Headless playback proves decoding and control behavior, not acoustic quality or player enjoyment.
