/**
 * The level a player reads for an upgrade family: how many times it has been
 * upgraded. The engine counts from 1, its unupgraded baseline; the screen
 * counts from 0, so a family no Orb has reached reads 0 and each Orb adds 1.
 *
 * @module components/gameplay/yakuUpgradeLevel
 */

import { DEFAULT_ORB_MAX_LEVEL } from '../../systems/CelestialOrbSystem'

/** An engine level as the player reads it. */
export const shownUpgradeLevel = (level: number) => Math.max(0, level - 1)

/** The highest level a family can show. */
export const SHOWN_MAX_UPGRADE_LEVEL = shownUpgradeLevel(DEFAULT_ORB_MAX_LEVEL)
