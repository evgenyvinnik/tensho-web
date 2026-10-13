/**
 * One pictogram per Boss Mandate effect, so a boss is recognizable at a glance
 * by what it does to you rather than by a generic padlock. Drawn as SVG so it
 * stays crisp at the header's small size; generated artwork, where a boss has
 * it, is shown in the details panel.
 */

import type { MandateEffectType } from '../../config/mandateDefinitions'

const PATHS: Record<MandateEffectType, string> = {
  // Two tiles falling away from a rack.
  discard_after_draw: 'M4 6h6v9H4zM14 3h6v9h-6zM7 18l-2 3M17 15l2 3',
  // A tall wall of bricks.
  score_multiplier: 'M3 20h18M4 20V8h16v12M4 12h16M4 16h16M9 8v4M15 12v4M9 16v4',
  // An eye with a single pupil.
  no_repeat_yaku: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  // A mouth that allows one word.
  single_yaku_type: 'M4 12c3 4 13 4 16 0M8 12h8',
  // A circle cut in half.
  halve_score: 'M12 3a9 9 0 1 0 0 18zM12 3v18',
  // A needle and thread: one stitch.
  single_hand: 'M18 3 6 15l-2 6 6-2L22 7zM15 6l3 3',
  // A pillar with cracks.
  debuff_used_tiles: 'M7 3h10M7 21h10M9 3v18M15 3v18M9 9l3 2-3 2',
  // A crossed-out redraw arrow.
  no_discards: 'M20 7v5h-5M4 17v-5h5M5.5 8a7 7 0 0 1 12-2L20 9M4 15l2.5 3a7 7 0 0 0 12-2M3 3l18 18',
  // An arm with a downward arrow.
  decrease_yaku_tier: 'M12 4v12M7 11l5 5 5-5M5 20h14',
  // A hand showing five fingers: exactly five tiles.
  fixed_hand_size: 'M5 10V5M9 10V3M13 10V3M17 10V5M5 10c0 6 3 10 7 10s7-4 7-10V8',
  // A suit crossed out.
  debuff_suit: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h6M3 21 21 3',
  debuff_tile_type: 'M6 4h12v16H6zM12 8v8M8 12h8M3 21 21 3',
  // A shackle: the rack holds one tile fewer.
  hand_size_reduction: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2',
  // A tooth biting a coin.
  gold_per_tile: 'M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 13v4M7 3l2 4h6l2-4',
  // An ox's horns over an empty purse.
  most_played_yaku_zeroes_gold: 'M4 6c2 4 5 4 8 4s6 0 8-4M8 12h8l1 8H7z',
  // A house with a closed door.
  first_hand_face_down: 'M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6',
  // A wheel with seven spokes.
  tiles_face_down_ratio: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M3.5 9l17 6M3.5 15l17-6',
  // A fish.
  tiles_face_down_after_play: 'M3 12c4-6 12-6 16 0-4 6-12 6-16 0zM19 12l3-3v6zM8 11h.01',
  // A coiled serpent drawing three.
  fixed_draw_count: 'M5 18c0-4 14-2 14-6S5 10 5 6s10-3 12-1M8 21h2M11 21h2M14 21h2',
  // A mark hiding an honor.
  honor_tiles_face_down: 'M6 4h12v16H6zM9 9l6 6M15 9l-6 6',
  // Shuffled face-down scrolls.
  shuffle_decrees: 'M4 6h7v12H4zM13 6h7v12h-7zM6 12h3M15 12h3M9 3l6 0M15 21H9',
  // A leaf over a scroll.
  debuff_until_sell: 'M5 19C5 9 12 4 20 4c0 8-5 15-15 15zM5 19l8-8',
  // A heart with a gap.
  disable_random_decree: 'M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11zM12 8v6',
  // A bell.
  lock_random_tile: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
}

export function MandateEffectIcon({
  type,
  className = 'h-6 w-6',
}: {
  type: MandateEffectType
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      data-mandate-icon={type}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATHS[type]} />
    </svg>
  )
}
