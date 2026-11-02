# Sound effect sources

`scripts/generate-sfx.mjs` mixes these recordings into the shipped cues in
`public/assets/sfx/`. They live here, outside `public/`, so the raw packs are
neither served nor precached. Each file was converted once with:

```sh
ffmpeg -i <original> -map_metadata -1 -bitexact -ac 1 -ar 32000 \
  -sample_fmt s16 -c:a pcm_s16le <name>.wav
```

The generator reads them as mono 16-bit PCM at 32 kHz (its output rate) and fails on anything else.

Players see these credits under **Settings → Credits**, rendered from
`src/config/creditsDefinitions.ts`. A test fails if a folder here has no entry
there, or if an entry's links are missing from this file.

## kenney-interface/

Kenney, "Interface Sounds" 1.0, https://kenney.nl/assets/interface-sounds,
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (see `License.txt`).
Credit is appreciated but not required.

| File | Cue |
| --- | --- |
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

Tile cues play these chips 15–25% slow, which lowers them toward the
heavier clack of a mahjong tile; set-downs add a synthesized felt thump.

| File | Cue |
| --- | --- |
| `chips-collide-1.wav` | `tile_select`, `game_hand_played` |
| `chip-lay-1.wav` | `tile_deselect`, `game_hand_played` |
| `chips-stack-2.wav` | `tile_draw` |
| `chip-lay-2.wav` | `tile_discard` |
| `chips-collide-3.wav` | `tile_slide` |
| `chips-stack-6.wav` | `tile_flip` |
| `chips-stack-5.wav` | `game_hand_played` |
| `chips-handle-5.wav` | `shop_reroll` (tiles being washed) |
| `chips-collide-4.wav` | `game_score_chip` |
| `chips-handle-4.wav` | `game_score_tally` |
| `chips-collide-2.wav` | `shop_purchase` (with a synthesized koto note) |
| `chips-handle-1.wav` | `shop_sell` |
| `chip-lay-3.wav` | `shop_cant_afford` (with a synthesized woodblock) |
| `cards-pack-open-2.wav` | `special_pack_opening` |

## kenney-rpg/

Kenney, "RPG Audio" (50 RPG sound effects), https://kenney.nl/assets/rpg-audio,
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (see `License.txt`),
downloaded from its OpenGameArt mirror,
https://opengameart.org/content/50-rpg-sound-effects.

| File | Cue |
| --- | --- |
| `handleCoins.wav` | `game_gold_earned` (from the main clink) |
| `handleCoins2.wav` | `game_gold_spent` |
| `bookFlip3.wav` | `consumable_fate_seal` (with a synthesized rin bell) |

## Not used: non-commercial recordings

Tensho shows rewarded ads, so it is a commercial game. Recordings licensed
for non-commercial use only (for example CC BY-NC) cannot be used, even with
credit. A CC BY-NC mahjong recording was tried and removed for that reason.

## Still synthesized

Payoffs (Yaku, Yakuman, round and Act results, Decrees, Flowers, Seasons,
reveals, consumables), the shop entrance and exit, and the woodblock refusals
(`feedback_invalid`, `feedback_error`, `feedback_warning`) come from the
generator's own voices.

## Removed cues

Players found these grating or redundant, so they no longer exist: a Decree
firing while scoring (`special_decree_triggered`), a failed round
(`game_round_failed`), the button click (`ui_button_click`; buttons are silent)
and the unused tile-beside-tile clack (`tile_place`).
