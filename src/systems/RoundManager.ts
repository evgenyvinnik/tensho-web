/**
 * Round Manager for Tensho Mahjong Roguelike
 *
 * Manages the round/act flow of the game:
 * - Acts contain multiple rounds (Small, Large, Boss)
 * - Score targets increase per act
 * - Boss rounds have mandates (special restrictions)
 * - Handles win/loss conditions
 * - Integrates with Table Stakes for difficulty scaling
 */

import {
  RoundState,
  ActState,
  RoundType,
  BossMandate,
  ROUND_MULTIPLIERS,
  ScoreRequirements,
} from './types'

import {
  calculateCombinedModifiers,
  type CombinedStakeModifiers,
} from '../config/stakeDefinitions'

// =============================================================================
// SCORE REQUIREMENTS
// =============================================================================

/**
 * Score targets by act (base requirements)
 * Each act has 3 rounds: Small (1.0x), Large (1.5x), Boss (2.0x)
 */
export const BASE_SCORE_TARGETS: Record<number, number[]> = {
  1: [300, 800, 2000],
  2: [5000, 11000, 20000],
  3: [35000, 60000, 100000],
  4: [150000, 250000, 400000],
  5: [600000, 1000000, 1600000],
  6: [2400000, 4000000, 6000000],
  7: [9000000, 15000000, 25000000],
  8: [40000000, 70000000, 100000000],
}

/**
 * Score scaling for higher stakes
 * @deprecated Use calculateCombinedModifiers from stakeDefinitions instead
 */
export const STAKE_SCORE_MULTIPLIERS: Record<number, number> = {
  1: 1.0, // White Stake
  2: 1.0, // Red Stake
  3: 1.3, // Green Stake
  4: 1.3, // Black Stake
  5: 1.3, // Blue Stake
  6: 1.6, // Purple Stake (1.3 * 1.5 = 1.95, rounded)
  7: 1.6, // Orange Stake
  8: 2.0, // Gold Stake (1.3 * 1.5 = 1.95, rounded to 2.0)
}

/**
 * Default hands per round
 */
export const DEFAULT_HANDS_PER_ROUND = 4

/**
 * Default discards per round
 */
export const DEFAULT_DISCARDS_PER_ROUND = 3

// =============================================================================
// BOSS MANDATES
// =============================================================================

/**
 * Standard boss mandates
 */
export const BOSS_MANDATES: BossMandate[] = [
  {
    id: 'the_hook',
    name: 'The Hook',
    japaneseName: '鉤',
    description: '2 random tiles discarded from hand after each draw',
    effect: { type: 'discard_after_draw', value: 2 },
    minAct: 1,
  },
  {
    id: 'the_wall',
    name: 'The Wall',
    japaneseName: '壁',
    description: 'Extra large score requirement (4x instead of 2x)',
    effect: { type: 'score_multiplier', value: 4 },
    minAct: 2,
  },
  {
    id: 'the_eye',
    name: 'The Eye',
    japaneseName: '目',
    description: 'No repeat yaku this round (each yaku only scores once)',
    effect: { type: 'no_repeat_yaku' },
    minAct: 3,
  },
  {
    id: 'the_mouth',
    name: 'The Mouth',
    japaneseName: '口',
    description: 'Only one yaku type can be scored this round',
    effect: { type: 'single_yaku_type' },
    minAct: 2,
  },
  {
    id: 'the_flint',
    name: 'The Flint',
    japaneseName: '火打石',
    description: 'Base points and Mult halved for entire round',
    effect: { type: 'halve_score', value: 0.5 },
    minAct: 2,
  },
  {
    id: 'the_needle',
    name: 'The Needle',
    japaneseName: '針',
    description: 'Must complete hand in exactly 1 hand (no retries)',
    effect: { type: 'single_hand' },
    minAct: 2,
  },
  {
    id: 'the_pillar',
    name: 'The Pillar',
    japaneseName: '柱',
    description: 'Tiles used in previous rounds this Act are debuffed',
    effect: { type: 'debuff_used_tiles' },
    minAct: 1,
  },
  {
    id: 'the_water',
    name: 'The Water',
    japaneseName: '水',
    description: 'Start with 0 discards this round',
    effect: { type: 'no_discards' },
    minAct: 2,
  },
  {
    id: 'the_arm',
    name: 'The Arm',
    japaneseName: '腕',
    description: 'Yaku tier decreased by 1 for scoring',
    effect: { type: 'decrease_yaku_tier', value: 1 },
    minAct: 2,
  },
  {
    id: 'the_psychic',
    name: 'The Psychic',
    japaneseName: '霊能者',
    description: 'Must play exactly 5 tiles per hand',
    effect: { type: 'fixed_hand_size', value: 5 },
    minAct: 1,
  },
  {
    id: 'the_club',
    name: 'The Club',
    japaneseName: '棍',
    description: 'All Souzu tiles are debuffed',
    effect: { type: 'debuff_suit', target: 'souzu' },
    minAct: 1,
  },
  {
    id: 'the_goad',
    name: 'The Goad',
    japaneseName: '突棒',
    description: 'All Pinzu tiles are debuffed',
    effect: { type: 'debuff_suit', target: 'pinzu' },
    minAct: 1,
  },
  {
    id: 'the_window',
    name: 'The Window',
    japaneseName: '窓',
    description: 'All Manzu tiles are debuffed',
    effect: { type: 'debuff_suit', target: 'manzu' },
    minAct: 1,
  },
  {
    id: 'the_head',
    name: 'The Head',
    japaneseName: '頭',
    description: 'All Dragon tiles are debuffed',
    effect: { type: 'debuff_tile_type', target: 'dragon' },
    minAct: 1,
  },
  {
    id: 'the_plant',
    name: 'The Plant',
    japaneseName: '草',
    description: 'All Honor tiles are debuffed',
    effect: { type: 'debuff_tile_type', target: 'honor' },
    minAct: 4,
  },
]

/**
 * Showdown mandates (Act 8+)
 */
export const SHOWDOWN_MANDATES: BossMandate[] = [
  {
    id: 'amber_acorn',
    name: 'Amber Acorn',
    japaneseName: '琥珀の実',
    description: 'All Decrees are shuffled and face-down',
    effect: { type: 'shuffle_decrees' },
    minAct: 8,
  },
  {
    id: 'verdant_leaf',
    name: 'Verdant Leaf',
    japaneseName: '翠緑の葉',
    description: 'All tiles debuffed until 1 Decree is sold',
    effect: { type: 'debuff_until_sell' },
    minAct: 8,
  },
  {
    id: 'violet_vessel',
    name: 'Violet Vessel',
    japaneseName: '紫水瓶',
    description: 'Extra-extra large target (6x instead of 2x)',
    effect: { type: 'score_multiplier', value: 6 },
    minAct: 8,
  },
  {
    id: 'crimson_heart',
    name: 'Crimson Heart',
    japaneseName: '深紅の心',
    description: 'One random Decree disabled every hand cycle',
    effect: { type: 'disable_random_decree' },
    minAct: 8,
  },
  {
    id: 'cerulean_bell',
    name: 'Cerulean Bell',
    japaneseName: '青藍の鈴',
    description: 'One tile is force-locked every draw',
    effect: { type: 'lock_random_tile' },
    minAct: 8,
  },
]

// =============================================================================
// ROUND MANAGER CLASS
// =============================================================================

/**
 * Manages round/act progression and score tracking
 */
export class RoundManager {
  private currentAct: ActState | null = null
  private currentRound: RoundState | null = null
  private stake: number = 1
  private bonusHands: number = 0
  private bonusDiscards: number = 0
  private usedTileIds: Set<string> = new Set()
  private stakeModifiers: CombinedStakeModifiers

  constructor(stake: number = 1) {
    this.stake = stake
    this.stakeModifiers = calculateCombinedModifiers(stake)
  }

  /**
   * Update stake and recalculate modifiers
   */
  setStake(stake: number): void {
    this.stake = stake
    this.stakeModifiers = calculateCombinedModifiers(stake)
  }

  /**
   * Get current stake tier
   */
  getStake(): number {
    return this.stake
  }

  /**
   * Get current stake modifiers
   */
  getStakeModifiers(): CombinedStakeModifiers {
    return this.stakeModifiers
  }

  /**
   * Set bonus hands from charters/decrees
   */
  setBonusHands(bonus: number): void {
    this.bonusHands = bonus
  }

  /**
   * Set bonus discards from charters/decrees
   */
  setBonusDiscards(bonus: number): void {
    this.bonusDiscards = bonus
  }

  /**
   * Get effective discards per round (accounting for stake penalties)
   */
  getEffectiveDiscards(): number {
    const base = DEFAULT_DISCARDS_PER_ROUND + this.bonusDiscards
    const penalty = this.stakeModifiers.redrawPenalty
    return Math.max(0, base - penalty)
  }

  /**
   * Start a new run at Act 1
   */
  startNewRun(): ActState {
    return this.startAct(1)
  }

  /**
   * Start a specific act
   */
  startAct(actNumber: number): ActState {
    const baseTargets = this.getScoreTargetsForAct(actNumber)
    // Use cumulative score scaling from stake modifiers
    const stakeMultiplier = this.stakeModifiers.scoreScaling

    const rounds: RoundState[] = [
      this.createRound(actNumber, 1, 'Small', Math.floor(baseTargets[0] * stakeMultiplier)),
      this.createRound(actNumber, 2, 'Large', Math.floor(baseTargets[1] * stakeMultiplier)),
      this.createRound(actNumber, 3, 'Boss', Math.floor(baseTargets[2] * stakeMultiplier)),
    ]

    // Add boss mandate to the boss round
    rounds[2].bossMandate = this.selectBossMandate(actNumber)

    this.currentAct = {
      actNumber,
      rounds,
      currentRoundIndex: 0,
      isCompleted: false,
      baseScoreTarget: baseTargets[0],
    }

    this.currentRound = rounds[0]
    this.usedTileIds.clear()

    return this.currentAct
  }

  /**
   * Create a round state
   */
  private createRound(
    actNumber: number,
    roundNumber: number,
    roundType: RoundType,
    scoreTarget: number
  ): RoundState {
    return {
      actNumber,
      roundNumber,
      roundType,
      scoreTarget,
      currentScore: 0,
      handsPlayed: 0,
      maxHands: DEFAULT_HANDS_PER_ROUND + this.bonusHands,
      discardsRemaining: DEFAULT_DISCARDS_PER_ROUND + this.bonusDiscards,
      maxDiscards: DEFAULT_DISCARDS_PER_ROUND + this.bonusDiscards,
      isCompleted: false,
      isWon: false,
    }
  }

  /**
   * Get score targets for an act
   */
  private getScoreTargetsForAct(actNumber: number): number[] {
    if (BASE_SCORE_TARGETS[actNumber]) {
      return BASE_SCORE_TARGETS[actNumber]
    }

    // Endless mode scaling for acts beyond 8
    const baseAct8 = BASE_SCORE_TARGETS[8]
    const actDiff = actNumber - 8
    const scalingFactor = Math.pow(1.6 + 0.75 * actDiff, actDiff * (1 + 0.2 * actDiff))

    return baseAct8.map((target) => Math.floor(target * scalingFactor))
  }

  /**
   * Select a boss mandate for the current act
   */
  private selectBossMandate(actNumber: number): BossMandate {
    let availableMandates: BossMandate[]

    if (actNumber >= 8 && actNumber % 8 === 0) {
      // Showdown mandate every 8 acts
      availableMandates = SHOWDOWN_MANDATES
    } else {
      availableMandates = BOSS_MANDATES.filter((m) => m.minAct <= actNumber)
    }

    if (availableMandates.length === 0) {
      availableMandates = BOSS_MANDATES.filter((m) => m.minAct === 1)
    }

    return availableMandates[Math.floor(Math.random() * availableMandates.length)]
  }

  /**
   * Get the current round
   */
  getCurrentRound(): RoundState | null {
    return this.currentRound
  }

  /**
   * Get the current act
   */
  getCurrentAct(): ActState | null {
    return this.currentAct
  }

  /**
   * Submit a score for the current round
   */
  submitScore(score: number): { success: boolean; isRoundWon: boolean; isActComplete: boolean } {
    if (!this.currentRound) {
      return { success: false, isRoundWon: false, isActComplete: false }
    }

    this.currentRound.currentScore += score
    this.currentRound.handsPlayed++

    // Check if round is won
    if (this.currentRound.currentScore >= this.currentRound.scoreTarget) {
      return this.completeRound(true)
    }

    // Check if round is lost (no more hands)
    if (this.currentRound.handsPlayed >= this.currentRound.maxHands) {
      return this.completeRound(false)
    }

    return { success: true, isRoundWon: false, isActComplete: false }
  }

  /**
   * Complete the current round
   */
  private completeRound(isWon: boolean): { success: boolean; isRoundWon: boolean; isActComplete: boolean } {
    if (!this.currentRound || !this.currentAct) {
      return { success: false, isRoundWon: false, isActComplete: false }
    }

    this.currentRound.isCompleted = true
    this.currentRound.isWon = isWon

    if (!isWon) {
      // Run ends on loss
      return { success: true, isRoundWon: false, isActComplete: false }
    }

    // Move to next round or complete act
    const nextRoundIndex = this.currentAct.currentRoundIndex + 1

    if (nextRoundIndex >= this.currentAct.rounds.length) {
      // Act is complete
      this.currentAct.isCompleted = true
      return { success: true, isRoundWon: true, isActComplete: true }
    }

    // Start next round
    this.currentAct.currentRoundIndex = nextRoundIndex
    this.currentRound = this.currentAct.rounds[nextRoundIndex]

    return { success: true, isRoundWon: true, isActComplete: false }
  }

  /**
   * Track used tiles for The Pillar mandate
   */
  trackUsedTiles(tileIds: string[]): void {
    for (const id of tileIds) {
      this.usedTileIds.add(id)
    }
  }

  /**
   * Check if a tile was used in previous rounds (for The Pillar)
   */
  wasTileUsed(tileId: string): boolean {
    return this.usedTileIds.has(tileId)
  }

  /**
   * Use a discard
   */
  useDiscard(): boolean {
    if (!this.currentRound || this.currentRound.discardsRemaining <= 0) {
      return false
    }

    this.currentRound.discardsRemaining--
    return true
  }

  /**
   * Skip to the next round (skip mechanic for Small/Large rounds)
   */
  skipRound(): { success: boolean; skippedRoundType: RoundType | null } {
    if (!this.currentRound || !this.currentAct) {
      return { success: false, skippedRoundType: null }
    }

    // Can only skip Small or Large rounds
    if (this.currentRound.roundType === 'Boss') {
      return { success: false, skippedRoundType: null }
    }

    const skippedType = this.currentRound.roundType

    // Mark as skipped (not won or lost)
    this.currentRound.isCompleted = true
    this.currentRound.isWon = true // Counts as passed for progression

    // Move to next round
    const nextRoundIndex = this.currentAct.currentRoundIndex + 1
    if (nextRoundIndex < this.currentAct.rounds.length) {
      this.currentAct.currentRoundIndex = nextRoundIndex
      this.currentRound = this.currentAct.rounds[nextRoundIndex]
    }

    return { success: true, skippedRoundType: skippedType }
  }

  /**
   * Get the reward for winning the current round
   */
  getRoundReward(): { gold: number; canSkip: boolean } {
    if (!this.currentRound) {
      return { gold: 0, canSkip: false }
    }

    let gold = 0
    switch (this.currentRound.roundType) {
      case 'Small':
        gold = this.stake >= 2 ? 0 : 3 // No reward at Red Stake+
        break
      case 'Large':
        gold = 5
        break
      case 'Boss':
        gold = 8
        break
    }

    const canSkip = this.currentRound.roundType !== 'Boss'

    return { gold, canSkip }
  }

  /**
   * Check if the boss mandate affects a specific aspect
   */
  checkMandateEffect(effectType: string): { active: boolean; value?: unknown } {
    if (!this.currentRound?.bossMandate) {
      return { active: false }
    }

    const mandate = this.currentRound.bossMandate
    if (mandate.effect.type === effectType) {
      return { active: true, value: mandate.effect.value ?? mandate.effect.target }
    }

    return { active: false }
  }

  /**
   * Get hands remaining in current round
   */
  getHandsRemaining(): number {
    if (!this.currentRound) {
      return 0
    }
    return this.currentRound.maxHands - this.currentRound.handsPlayed
  }

  /**
   * Get progress percentage for current round
   */
  getProgressPercentage(): number {
    if (!this.currentRound) {
      return 0
    }
    return Math.min(
      100,
      (this.currentRound.currentScore / this.currentRound.scoreTarget) * 100
    )
  }

  /**
   * Calculate interest based on gold amount
   * 1 Gold per 5 Gold held, capped at 5 (or higher with charters)
   */
  calculateInterest(gold: number, interestCap: number = 5): number {
    const interest = Math.floor(gold / 5)
    return Math.min(interest, interestCap)
  }

  /**
   * Advance to next act
   */
  advanceToNextAct(): ActState | null {
    if (!this.currentAct || !this.currentAct.isCompleted) {
      return null
    }

    const nextActNumber = this.currentAct.actNumber + 1
    return this.startAct(nextActNumber)
  }

  /**
   * Check if the run is over (loss condition)
   */
  isRunOver(): boolean {
    if (!this.currentRound) {
      return true
    }
    return this.currentRound.isCompleted && !this.currentRound.isWon
  }

  /**
   * Check if the game has been won (reached a specific act)
   */
  isGameWon(targetAct: number = 8): boolean {
    if (!this.currentAct) {
      return false
    }
    return this.currentAct.actNumber >= targetAct && this.currentAct.isCompleted
  }

  /**
   * Get the total score for the current run
   */
  getTotalScore(): number {
    if (!this.currentAct) {
      return 0
    }

    let total = 0
    for (const round of this.currentAct.rounds) {
      if (round.isCompleted && round.isWon) {
        total += round.currentScore
      }
    }

    return total
  }

  /**
   * Serialize round manager state
   */
  toState(): {
    currentAct: ActState | null
    currentRound: RoundState | null
    stake: number
    bonusHands: number
    bonusDiscards: number
    usedTileIds: string[]
  } {
    return {
      currentAct: this.currentAct,
      currentRound: this.currentRound,
      stake: this.stake,
      bonusHands: this.bonusHands,
      bonusDiscards: this.bonusDiscards,
      usedTileIds: Array.from(this.usedTileIds),
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    currentAct: ActState | null
    currentRound: RoundState | null
    stake: number
    bonusHands: number
    bonusDiscards: number
    usedTileIds: string[]
  }): RoundManager {
    const manager = new RoundManager(state.stake)
    manager.currentAct = state.currentAct
    manager.currentRound = state.currentRound
    manager.bonusHands = state.bonusHands
    manager.bonusDiscards = state.bonusDiscards
    manager.usedTileIds = new Set(state.usedTileIds)
    return manager
  }
}

/**
 * Get score target label for display
 */
export function formatScoreTarget(score: number): string {
  if (score >= 1000000000) {
    return `${(score / 1000000000).toFixed(1)}B`
  }
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`
  }
  return score.toString()
}

/**
 * Get round type display name
 */
export function getRoundTypeDisplayName(roundType: RoundType): { english: string; japanese: string } {
  switch (roundType) {
    case 'Small':
      return { english: 'Small Round', japanese: '小局' }
    case 'Large':
      return { english: 'Large Round', japanese: '大局' }
    case 'Boss':
      return { english: 'Boss Round', japanese: '親局' }
  }
}
