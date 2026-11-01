# Sound effect sources

`scripts/generate-sfx.mjs` mixes these recordings into the shipped cues in
`public/assets/sfx/`. They live here, outside `public/`, so the raw packs are
neither served nor precached. Each file was converted once with:

```sh
ffmpeg -i <original> -map_metadata -1 -bitexact -ac 1 -ar 44100 \
  -sample_fmt s16 -c:a pcm_s16le <name>.wav
```

The generator reads them as mono 16-bit PCM at 44.1 kHz and fails on anything else.

## mahjong/

| File | Original | Author | Licence |
| --- | --- | --- | --- |
| `mahjong-tiles.wav` | "Mahjong Tiles Sound Effect" (`Mahjong-tiles-sound-effect.mp3`), https://orangefreesounds.com/mahjong-tiles-sound-effect/ | Orange Free Sounds | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |

Used for every tile cue (select, deselect, draw, discard, place, slide, flip),
the hand-played slap and the shop reroll. Changes: mixed to mono, sliced into
single hits and runs, high-passed, hiss-gated, level-matched, and in some cues
layered with a synthesized felt thump.

**Attribution is required, and the licence is non-commercial.** It fits the
game while the game is free with no ads or payments. If Tensho is ever
monetized, replace this recording first. The tile recipes are the only users
of `MAHJONG` in the generator.

## kenney-interface/

Kenney, "Interface Sounds" 1.0, https://kenney.nl/assets/interface-sounds,
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (see `License.txt`).
Credit is appreciated but not required.

| File | Cue |
| --- | --- |
| `click_001.wav` | `ui_button_click` |
| `tick_001.wav` | `ui_button_hover` |
| `tick_002.wav` | `ui_slider` |
| `click_005.wav` | `ui_navigate` |
| `click_002.wav` | `ui_tab_switch` |
| `switch_002.wav` | `ui_toggle` |
| `maximize_001.wav` / `minimize_001.wav` | `ui_menu_open` / `ui_menu_close` |
| `back_002.wav` | `feedback_cancel` |
| `glass_001.wav` | `feedback_notification` |

## kenney-casino/

Kenney, "Casino Audio" 1.1, https://kenney.nl/assets/casino-audio,
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (see `License.txt`).

| File | Cue |
| --- | --- |
| `chips-stack-3.wav` | `game_gold_earned` |
| `chips-handle-3.wav` | `game_gold_spent` |
| `chips-collide-4.wav` | `game_score_chip` |
| `chips-handle-4.wav` | `game_score_tally` |
| `chips-collide-2.wav` | `shop_purchase` (with a synthesized koto note) |
| `chips-handle-1.wav` | `shop_sell` |
| `chip-lay-3.wav` | `shop_cant_afford` (with a synthesized woodblock) |
| `cards-pack-open-2.wav` | `special_pack_opening` |

## Still synthesized

Payoffs (Yaku, Yakuman, round and Act results, Decrees, Flowers, Seasons,
reveals, consumables), the shop entrance and exit, and the woodblock refusals
(`feedback_invalid`, `feedback_error`, `feedback_warning`) come from the
generator's own voices.
