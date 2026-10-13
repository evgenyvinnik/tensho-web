/**
 * Records left by retired modes. The game no longer reads or writes them, and
 * never deletes them on its own: only Reset All Progress removes them, along
 * with everything else the player asked to forget.
 */

/** The retired Table Loop mode's saved run. */
export const LEGACY_TABLE_LOOP_SAVE_KEY = 'tensho-table-loop-v1'
