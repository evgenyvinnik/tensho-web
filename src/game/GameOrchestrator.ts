/**
 * Game Orchestrator for Tensho Mahjong Roguelike
 *
 * Central controller that owns the game loop and connects:
 * - ActionProcessor (validation + execution)
 * - Stores (state management)
 * - Game Systems (Decree, Flower, Season, RoundManager)
 * - EventBus (decoupled communication)
 * - ScoringEngine (score calculation)
 *
 * This is the missing piece that makes the game playable end-to-end.
 */

import { Tile, TileSuit, FlowerType, SeasonType, WindType, DragonType } from '../core/Tile'
import { Hand, ParsedHand } from '../core/Hand'
import { Meld } from '../core/Meld'
import { calculateScore, createScoringContext, ScoreBreakdown } from '../rules/ScoringEngine'
import { eventBus, GameEventData } from './EventBus'
import {
  ActionProcessor,
  PlayerAction,
  ActionResult,
  Effect,
  GameStateSnapshot,
  createActionProcessor,
} from './ActionProcessor'
import { RoundManager } from '../systems/RoundManager'
import { DecreeSystem, STARTER_DECREES } from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { SeasonSystem } from '../systems/SeasonSystem'

// =============================================================================
// GAME ORCHESTRATOR STATE
// =============================================================================

/**
 * Complete game state managed by the orchestrator
 */
export interface OrchestratorState {
  // Session
  isRunActive: boolean
  seed: number
  stake: number

  // Progression
  currentAct: number
  currentRound: number

  // Resources
  score: number
  gold: number

  // Round state
  handsRemaining: number
  discardsRemaining: number
  redrawsRemaining: number
  targetScore: number

  // Hand state
  handTiles: Tile[]
  melds: Meld[]
  selectedTileIds: Set<string>

  // Wall state
  wall: Tile[]
  deadWall: Tile[]
  discards: Tile[]
  drawIndex: number

  // Systems
  decreeSystem: DecreeSystem
  flowerSystem: FlowerSystem
  seasonSystem: SeasonSystem
  roundManager: RoundManager

  // Phase
  phase: 'menu' | 'gameplay' | 'shop' | 'gameOver'
}

/**
 * Round configuration
 */
interface RoundConfig {
  handsPerRound: number
  discardsPerRound: number
  redrawsPerRound: number
  startingHandSize: number
}

const DEFAULT_ROUND_CONFIG: RoundConfig = {
  handsPerRound: 4,
  discardsPerRound: 3,
  redrawsPerRound: 3,
  startingHandSize: 13,
}

// =============================================================================
// GAME ORCHESTRATOR CLASS
// =============================================================================

/**
 * Central game loop controller
 */
export class GameOrchestrator {
  private state: OrchestratorState
  private actionProcessor: ActionProcessor
  private config: RoundConfig

  constructor(config: Partial<RoundConfig> = {}) {
    this.config = { ...DEFAULT_ROUND_CONFIG, ...config }
    this.actionProcessor = createActionProcessor()
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Create initial orchestrator state
   */
  private createInitialState(): OrchestratorState {
    return {
      isRunActive: false,
      seed: Date.now(),
      stake: 1,
      currentAct: 1,
      currentRound: 1,
      score: 0,
      gold: 4,
      handsRemaining: this.config.handsPerRound,
      discardsRemaining: this.config.discardsPerRound,
      redrawsRemaining: this.config.redrawsPerRound,
      targetScore: 300,
      handTiles: [],
      melds: [],
      selectedTileIds: new Set(),
      wall: [],
      deadWall: [],
      discards: [],
      drawIndex: 0,
      decreeSystem: new DecreeSystem(),
      flowerSystem: new FlowerSystem(),
      seasonSystem: new SeasonSystem(),
      roundManager: new RoundManager(),
      phase: 'menu',
    }
  }

  /**
   * Initialize starter decrees for a new run
   * Gives player 2 random decrees from the starter pool
   */
  private initializeStarterDecrees(seed: number): void {
    // Create a seeded random for consistent decree selection
    let s = seed + 12345 // Offset to differ from wall shuffle

    const seededRandom = () => {
      s += 0x6d2b79f5
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    // Shuffle starter decrees and pick 2
    const shuffled = [...STARTER_DECREES]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Give player 2 starter decrees
    const starterCount = 2
    for (let i = 0; i < starterCount && i < shuffled.length; i++) {
      this.state.decreeSystem.acquireDecree(shuffled[i])
    }

    // Emit decree acquired events
    const ownedDecrees = this.state.decreeSystem.getOwnedDecrees()
    for (const decree of ownedDecrees) {
      eventBus.emit('decreeAcquired', {
        decreeId: decree.id,
        decreeName: decree.name,
        rarity: decree.rarity,
      })
    }
  }

  /**
   * Start a new run
   */
  startNewRun(seed?: number, stake: number = 1): void {
    const actualSeed = seed ?? Date.now()

    // Reset state
    this.state = this.createInitialState()
    this.state.seed = actualSeed
    this.state.stake = stake
    this.state.isRunActive = true
    this.state.phase = 'gameplay'

    // Initialize round manager
    this.state.roundManager = new RoundManager(stake)
    this.state.roundManager.startNewRun()

    // Give starter decrees (2 random from the starter pool)
    this.initializeStarterDecrees(actualSeed)

    // Initialize wall
    this.initializeWall(actualSeed)

    // Draw starting hand
    this.drawStartingHand()

    // Update target score from round manager
    const roundState = this.state.roundManager.getCurrentRound()
    if (roundState) {
      this.state.targetScore = roundState.scoreTarget
      this.state.currentAct = roundState.actNumber
      this.state.currentRound = roundState.roundNumber
    }

    // Emit events
    eventBus.emit('runStart', {
      seed: actualSeed,
      stake,
      wallVariant: 'standard',
    })

    eventBus.emit('roundStart', {
      actNumber: this.state.currentAct,
      roundNumber: this.state.currentRound,
      roundType: roundState?.roundType ?? 'Small',
      target: this.state.targetScore,
    })

    eventBus.emit('phaseChanged', {
      previousPhase: 'menu',
      newPhase: 'gameplay',
    })
  }

  /**
   * Initialize the tile wall
   */
  private initializeWall(seed: number): void {
    // Create full tile set
    const tiles = this.createFullTileSet()

    // Shuffle with seed
    const shuffled = this.seededShuffle(tiles, seed)

    // Separate dead wall (last 14 tiles)
    const deadWallSize = 14
    this.state.deadWall = shuffled.slice(-deadWallSize)
    this.state.wall = shuffled.slice(0, -deadWallSize)
    this.state.drawIndex = 0
    this.state.discards = []
  }

  /**
   * Create full 144-tile set
   */
  private createFullTileSet(): Tile[] {
    const tiles: Tile[] = []
    let idCounter = 0

    const generateId = () => `tile_${idCounter++}`

    // Numbered suits (1-9, 4 copies each)
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    for (const suit of suits) {
      for (let rank = 1; rank <= 9; rank++) {
        for (let copy = 0; copy < 4; copy++) {
          tiles.push(new Tile(suit, rank, generateId()))
        }
      }
    }

    // Winds (4 copies each)
    const winds = [WindType.East, WindType.South, WindType.West, WindType.North]
    for (const wind of winds) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push(Tile.createWind(wind, generateId()))
      }
    }

    // Dragons (4 copies each)
    const dragons = [DragonType.White, DragonType.Green, DragonType.Red]
    for (const dragon of dragons) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push(Tile.createDragon(dragon, generateId()))
      }
    }

    // Flowers (1 copy each)
    const flowers = [FlowerType.Plum, FlowerType.Orchid, FlowerType.Chrysanthemum, FlowerType.Bamboo]
    for (const flower of flowers) {
      tiles.push(Tile.createFlower(flower, generateId()))
    }

    // Seasons (1 copy each)
    const seasons = [SeasonType.Spring, SeasonType.Summer, SeasonType.Autumn, SeasonType.Winter]
    for (const season of seasons) {
      tiles.push(Tile.createSeason(season, generateId()))
    }

    return tiles
  }

  /**
   * Seeded shuffle using mulberry32
   */
  private seededShuffle<T>(array: T[], seed: number): T[] {
    const result = [...array]
    let s = seed

    const random = () => {
      s += 0x6d2b79f5
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }

    return result
  }

  /**
   * Draw starting hand
   */
  private drawStartingHand(): void {
    this.state.handTiles = []

    for (let i = 0; i < this.config.startingHandSize; i++) {
      const tile = this.drawTileInternal()
      if (tile) {
        // Handle bonus tiles
        if (tile.isFlower || tile.isSeason) {
          this.handleBonusTile(tile)
          i-- // Don't count bonus tiles
        } else {
          this.state.handTiles.push(tile)
        }
      }
    }

    // Sort hand
    this.state.handTiles.sort(Tile.compare)
  }

  /**
   * Draw a tile from the wall (internal)
   */
  private drawTileInternal(): Tile | null {
    if (this.state.drawIndex >= this.state.wall.length) {
      return null
    }

    const tile = this.state.wall[this.state.drawIndex]
    this.state.drawIndex++
    return tile
  }

  /**
   * Draw from dead wall
   */
  private drawFromDeadWall(): Tile | null {
    if (this.state.deadWall.length === 0) {
      return null
    }

    const tile = this.state.deadWall.shift()!

    // Replenish dead wall from main wall if possible
    const remaining = this.state.wall.length - this.state.drawIndex
    if (remaining > 0) {
      const replenish = this.state.wall[this.state.wall.length - 1]
      this.state.wall = this.state.wall.slice(0, -1)
      this.state.deadWall.push(replenish)
    }

    return tile
  }

  /**
   * Handle bonus tile (flower or season)
   */
  private handleBonusTile(tile: Tile): void {
    if (tile.isFlower) {
      // FlowerSystem.addFlower expects a Tile object
      this.state.flowerSystem.addFlower(tile)
      eventBus.emit('flowerCollected', {
        flowerType: tile.flowerType ?? 'plum',
        totalFlowers: this.state.flowerSystem.getFlowerCount(),
      })
    } else if (tile.isSeason) {
      // SeasonSystem.addSeason expects a Tile object
      this.state.seasonSystem.addSeason(tile)
      eventBus.emit('seasonActivated', {
        seasonType: tile.seasonType ?? 'spring',
        effect: 'Season effect activated',
      })
    }

    eventBus.emit('bonusTileDrawn', {
      tileId: tile.id,
      tileType: tile.isFlower ? 'flower' : 'season',
      replacementDrawn: true,
    })

    // Draw replacement from dead wall
    const replacement = this.drawFromDeadWall()
    if (replacement) {
      if (replacement.isFlower || replacement.isSeason) {
        this.handleBonusTile(replacement)
      } else {
        this.state.handTiles.push(replacement)
        this.state.handTiles.sort(Tile.compare)
      }
    }
  }

  // ===========================================================================
  // ACTION PROCESSING
  // ===========================================================================

  /**
   * Process a player action
   */
  processAction(action: PlayerAction): ActionResult {
    // Create state snapshot for validation
    const snapshot = this.createStateSnapshot()

    // Validate action
    const validation = this.actionProcessor.validate(action, snapshot)
    if (!validation.isValid) {
      return {
        success: false,
        effects: [],
        errors: validation.errors,
      }
    }

    // Execute action
    return this.executeAction(action)
  }

  /**
   * Create state snapshot for action validation
   */
  private createStateSnapshot(): GameStateSnapshot {
    return {
      handTiles: this.state.handTiles,
      melds: this.state.melds,
      selectedTileIds: Array.from(this.state.selectedTileIds),
      wallRemaining: this.state.wall.length - this.state.drawIndex,
      deadWallRemaining: this.state.deadWall.length,
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
      currentScore: this.state.score,
      targetScore: this.state.targetScore,
      gold: this.state.gold,
    }
  }

  /**
   * Execute a validated action
   */
  private executeAction(action: PlayerAction): ActionResult {
    const effects: Effect[] = []

    switch (action.type) {
      case 'draw':
        return this.executeDraw(effects)

      case 'discard':
        return this.executeDiscard(action.tileId, effects)

      case 'play':
        return this.executePlay(action.tileIds, effects)

      case 'redraw':
        return this.executeRedraw(action.tileIds, effects)

      case 'skip':
        return this.executeSkip(effects)

      default:
        return { success: false, effects, errors: ['Unknown action type'] }
    }
  }

  /**
   * Execute draw action
   */
  private executeDraw(effects: Effect[]): ActionResult {
    const tile = this.drawTileInternal()

    if (!tile) {
      return {
        success: false,
        effects,
        errors: ['No tiles remaining in wall'],
      }
    }

    // Check for bonus tile
    if (tile.isFlower || tile.isSeason) {
      this.handleBonusTile(tile)
      effects.push({
        type: 'bonus_tile_drawn',
        description: `Drew bonus tile: ${tile.displayName}`,
        tile,
        isFlower: tile.isFlower,
      })

      // After handling bonus tile, the hand already has a replacement
    } else {
      this.state.handTiles.push(tile)
      this.state.handTiles.sort(Tile.compare)

      effects.push({
        type: 'tile_added',
        description: `Drew tile: ${tile.displayName}`,
        tile,
      })
    }

    eventBus.emit('tileDrawn', {
      tileId: tile.id,
      tilesRemaining: this.state.wall.length - this.state.drawIndex,
    })

    return { success: true, effects }
  }

  /**
   * Execute discard action
   */
  private executeDiscard(tileId: string, effects: Effect[]): ActionResult {
    const tileIndex = this.state.handTiles.findIndex((t) => t.id === tileId)
    if (tileIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Tile not found in hand'],
      }
    }

    const tile = this.state.handTiles[tileIndex]
    this.state.handTiles.splice(tileIndex, 1)
    this.state.discards.push(tile)
    this.state.discardsRemaining--
    this.state.selectedTileIds.delete(tileId)

    effects.push({
      type: 'tile_removed',
      description: `Discarded tile: ${tile.displayName}`,
      tileId,
    })

    eventBus.emit('tileDiscarded', {
      tileId,
      toDeadPool: true,
    })

    return { success: true, effects }
  }

  /**
   * Execute play action (play hand)
   */
  private executePlay(tileIds: string[], effects: Effect[]): ActionResult {
    // Get selected tiles
    const selectedTiles = this.state.handTiles.filter((t) => tileIds.includes(t.id))

    if (selectedTiles.length < 2) {
      return {
        success: false,
        effects,
        errors: ['Must select at least 2 tiles to play'],
      }
    }

    // For Tensho, we use a simplified hand model:
    // The entire hand (or selected tiles) is played at once
    // We need at least a valid structure to score

    // Try to parse the hand
    const allTiles = [...this.state.handTiles]
    const hand = new Hand()
    for (const tile of allTiles) {
      hand.addTile(tile)
    }

    // Check if hand is valid (can form a winning hand)
    const parsedHand = hand.findBestParse()

    if (!parsedHand) {
      // Even without a complete winning hand, we can still score
      // This is the Tensho roguelike twist - you can play partial hands
      return this.executePartialPlay(selectedTiles, effects)
    }

    // Calculate score for complete hand
    const scoreResult = this.calculateHandScore(allTiles, parsedHand)

    // Apply score
    const previousScore = this.state.score
    this.state.score += scoreResult.finalScore
    this.state.handsRemaining--

    // Remove played tiles (in Tensho, the hand is depleted)
    for (const tileId of tileIds) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (idx !== -1) {
        this.state.handTiles.splice(idx, 1)
      }
    }

    this.state.selectedTileIds.clear()

    effects.push({
      type: 'score_added',
      description: `Scored ${scoreResult.finalScore} points`,
      score: scoreResult.finalScore,
      breakdown: scoreResult,
    })

    effects.push({
      type: 'yaku_detected',
      description: `Detected ${scoreResult.detectedYaku.length} yaku`,
      yaku: scoreResult.detectedYaku,
    })

    // Emit events
    eventBus.emit('handPlayed', {
      tiles: tileIds,
      score: scoreResult.finalScore,
      yakuIds: scoreResult.detectedYaku.map((y) => y.definition.id),
    })

    eventBus.emit('scoreUpdate', {
      previousScore,
      newScore: this.state.score,
      delta: scoreResult.finalScore,
    })

    // Check yaku events
    for (const yaku of scoreResult.detectedYaku) {
      if (yaku.definition.tier === 4) {
        eventBus.emit('yakumanScored', {
          yakuId: yaku.definition.id,
          yakuName: yaku.definition.name,
        })
      } else {
        eventBus.emit('yakuScored', {
          yakuId: yaku.definition.id,
          yakuName: yaku.definition.name,
          multiplier: yaku.definition.multiplier,
        })
      }
    }

    // Check round completion
    this.checkRoundCompletion(effects)

    return { success: true, effects }
  }

  /**
   * Execute partial play (for when hand doesn't form a complete winning hand)
   */
  private executePartialPlay(selectedTiles: Tile[], effects: Effect[]): ActionResult {
    // Calculate a simpler score based on tile values
    let basePoints = 0
    for (const tile of selectedTiles) {
      if (tile.isHonor) basePoints += 15
      else if (tile.isTerminal) basePoints += 10
      else if (tile.isSimple) basePoints += 5
    }

    // Apply basic multiplier
    const multiplier = 1.0
    const finalScore = Math.floor(basePoints * multiplier)

    // Apply score
    const previousScore = this.state.score
    this.state.score += finalScore
    this.state.handsRemaining--

    // Remove played tiles
    for (const tile of selectedTiles) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tile.id)
      if (idx !== -1) {
        this.state.handTiles.splice(idx, 1)
      }
    }

    this.state.selectedTileIds.clear()

    effects.push({
      type: 'score_added',
      description: `Scored ${finalScore} points (partial hand)`,
      score: finalScore,
      breakdown: {
        basePoints,
        tilePoints: basePoints,
        structurePoints: 0,
        detectedYaku: [],
        yakuMultiplier: 1,
        additiveBonus: 0,
        subtotal: basePoints,
        finalScore,
      },
    })

    eventBus.emit('handPlayed', {
      tiles: selectedTiles.map((t) => t.id),
      score: finalScore,
      yakuIds: [],
    })

    eventBus.emit('scoreUpdate', {
      previousScore,
      newScore: this.state.score,
      delta: finalScore,
    })

    this.checkRoundCompletion(effects)

    return { success: true, effects }
  }

  /**
   * Execute redraw action
   */
  private executeRedraw(tileIds: string[], effects: Effect[]): ActionResult {
    // Remove selected tiles
    const removedTiles: Tile[] = []
    for (const tileId of tileIds) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (idx !== -1) {
        removedTiles.push(this.state.handTiles[idx])
        this.state.handTiles.splice(idx, 1)
        this.state.selectedTileIds.delete(tileId)
      }
    }

    // Draw replacements
    const drawnTiles: Tile[] = []
    for (let i = 0; i < removedTiles.length; i++) {
      const tile = this.drawTileInternal()
      if (tile) {
        if (tile.isFlower || tile.isSeason) {
          this.handleBonusTile(tile)
          i-- // Bonus tiles don't count
        } else {
          drawnTiles.push(tile)
          this.state.handTiles.push(tile)
        }
      }
    }

    // Put removed tiles back into the wall (shuffle position)
    // In Tensho, redrawn tiles go to a limbo and aren't immediately drawable
    this.state.discards.push(...removedTiles)

    this.state.handTiles.sort(Tile.compare)
    this.state.redrawsRemaining--

    effects.push({
      type: 'round_state_changed',
      description: `Redrawn ${removedTiles.length} tiles`,
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
    })

    return { success: true, effects }
  }

  /**
   * Execute skip action
   */
  private executeSkip(effects: Effect[]): ActionResult {
    const roundState = this.state.roundManager.getCurrentRound()

    if (!roundState) {
      return {
        success: false,
        effects,
        errors: ['No active round'],
      }
    }

    // Can only skip Small and Large rounds
    if (roundState.roundType === 'Boss') {
      return {
        success: false,
        effects,
        errors: ['Cannot skip boss rounds'],
      }
    }

    // Skip the round
    this.state.roundManager.skipRound()

    eventBus.emit('roundSkipped', {
      roundType: roundState.roundType,
      omenTagGranted: 'skip_reward',
    })

    // Advance to next round
    this.advanceRound()

    return { success: true, effects }
  }

  /**
   * Calculate score for a complete hand
   */
  private calculateHandScore(tiles: Tile[], parsedHand: ParsedHand): ScoreBreakdown {
    // Calculate base multipliers from systems
    // FlowerSystem uses calculateFlowerBonus with a ScoringContext
    const flowerBonus = this.state.flowerSystem.getFlowerCount() > 0 ?
      1 + (this.state.flowerSystem.getFlowerCount() * 0.1) : 1

    // SeasonSystem provides score modifier
    const seasonMultiplier = this.state.seasonSystem.calculateScoreModifier()

    // DecreeSystem provides additional draws and rule modifications
    // For now, use a base multiplier
    const decreeMultiplier = 1.0

    // Create scoring context with system bonuses
    const context = createScoringContext(tiles, parsedHand, {
      isConcealed: true,
      isTsumo: true,
      additiveBonus: 0,
      multiplicativeBonus: flowerBonus * seasonMultiplier * decreeMultiplier,
    })

    return calculateScore(context)
  }

  /**
   * Check if round is complete
   */
  private checkRoundCompletion(effects: Effect[]): void {
    const roundWon = this.state.score >= this.state.targetScore
    const handsExhausted = this.state.handsRemaining <= 0

    if (roundWon) {
      this.handleRoundWin(effects)
    } else if (handsExhausted) {
      this.handleRoundLoss(effects)
    }
  }

  /**
   * Handle round win
   */
  private handleRoundWin(effects: Effect[]): void {
    // Submit score to round manager
    this.state.roundManager.submitScore(this.state.score)

    // Calculate gold reward
    const roundState = this.state.roundManager.getCurrentRound()
    let goldReward = 0

    if (roundState) {
      switch (roundState.roundType) {
        case 'Small':
          goldReward = 3
          break
        case 'Large':
          goldReward = 5
          break
        case 'Boss':
          goldReward = 10
          break
      }
    }

    // Add interest
    const interest = Math.min(5, Math.floor(this.state.gold / 5))
    goldReward += interest

    this.state.gold += goldReward

    eventBus.emit('roundEnd', {
      won: true,
      score: this.state.score,
      target: this.state.targetScore,
    })

    eventBus.emit('goldChanged', {
      previousGold: this.state.gold - goldReward,
      newGold: this.state.gold,
      delta: goldReward,
      reason: 'Round win + interest',
    })

    if (interest > 0) {
      eventBus.emit('interestEarned', {
        amount: interest,
        goldHeld: this.state.gold - goldReward,
      })
    }

    effects.push({
      type: 'gold_changed',
      description: `Earned ${goldReward} gold`,
      delta: goldReward,
      newTotal: this.state.gold,
    })

    // Check if this was boss round
    if (roundState?.roundType === 'Boss') {
      // Clear seasons for next act
      this.state.seasonSystem.clear()

      // Move to shop
      this.state.phase = 'shop'

      eventBus.emit('actComplete', {
        actNumber: this.state.currentAct,
        totalScore: this.state.score,
      })

      eventBus.emit('shopEntered', {
        isAfterBoss: true,
        gold: this.state.gold,
      })

      eventBus.emit('phaseChanged', {
        previousPhase: 'gameplay',
        newPhase: 'shop',
      })
    } else {
      // Advance to next round
      this.advanceRound()
    }
  }

  /**
   * Handle round loss
   */
  private handleRoundLoss(effects: Effect[]): void {
    eventBus.emit('roundEnd', {
      won: false,
      score: this.state.score,
      target: this.state.targetScore,
    })

    // Check if game is over
    this.state.isRunActive = false
    this.state.phase = 'gameOver'

    eventBus.emit('gameOver', {
      reason: 'defeat',
      finalScore: this.state.score,
    })

    eventBus.emit('runEnd', {
      victory: false,
      score: this.state.score,
      act: this.state.currentAct,
      round: this.state.currentRound,
    })

    eventBus.emit('phaseChanged', {
      previousPhase: 'gameplay',
      newPhase: 'gameOver',
    })

    effects.push({
      type: 'round_state_changed' as const,
      description: 'Game over - failed to meet score target',
      handsRemaining: 0,
      discardsRemaining: 0,
      redrawsRemaining: 0,
    })
  }

  /**
   * Advance to next round
   */
  private advanceRound(): void {
    // Get current round from manager (it auto-advances after submitScore)
    const roundState = this.state.roundManager.getCurrentRound()

    if (!roundState) {
      return
    }

    // Update state from round manager
    this.state.currentAct = roundState.actNumber
    this.state.currentRound = roundState.roundNumber
    this.state.targetScore = roundState.scoreTarget
    this.state.score = 0
    this.state.handsRemaining = this.config.handsPerRound
    this.state.discardsRemaining = this.config.discardsPerRound
    this.state.redrawsRemaining = this.config.redrawsPerRound

    // Apply season effects to resources
    const drawBonus = this.state.seasonSystem.getDrawBonus()
    this.state.handsRemaining += Math.floor(drawBonus / 2) // Spring adds extra draws

    // Apply decree effects
    const extraDraws = this.state.decreeSystem.getAdditionalDraws()
    this.state.handsRemaining += extraDraws

    // Reinitialize wall for new round
    this.initializeWall(this.state.seed + this.state.currentAct * 100 + this.state.currentRound)
    this.drawStartingHand()

    eventBus.emit('roundStart', {
      actNumber: this.state.currentAct,
      roundNumber: this.state.currentRound,
      roundType: roundState.roundType,
      target: this.state.targetScore,
    })
  }

  // ===========================================================================
  // SHOP ACTIONS
  // ===========================================================================

  /**
   * Exit shop and continue to next act
   */
  exitShop(): void {
    eventBus.emit('shopExited', {
      goldSpent: 0,
      itemsPurchased: 0,
    })

    // Advance to next act
    this.state.roundManager.advanceToNextAct()
    this.advanceRound()

    this.state.phase = 'gameplay'

    eventBus.emit('phaseChanged', {
      previousPhase: 'shop',
      newPhase: 'gameplay',
    })
  }

  /**
   * Purchase an item from the shop
   */
  purchaseItem(itemId: string, cost: number): boolean {
    if (this.state.gold < cost) {
      return false
    }

    this.state.gold -= cost

    eventBus.emit('goldChanged', {
      previousGold: this.state.gold + cost,
      newGold: this.state.gold,
      delta: -cost,
      reason: 'Purchase',
    })

    eventBus.emit('itemPurchased', {
      itemType: 'decree',
      itemId,
      cost,
    })

    return true
  }

  // ===========================================================================
  // TILE SELECTION
  // ===========================================================================

  /**
   * Select a tile
   */
  selectTile(tileId: string): void {
    if (this.state.handTiles.some((t) => t.id === tileId)) {
      this.state.selectedTileIds.add(tileId)

      eventBus.emit('tileSelected', {
        tileId,
        selectedCount: this.state.selectedTileIds.size,
      })
    }
  }

  /**
   * Deselect a tile
   */
  deselectTile(tileId: string): void {
    this.state.selectedTileIds.delete(tileId)

    eventBus.emit('tileDeselected', {
      tileId,
      selectedCount: this.state.selectedTileIds.size,
    })
  }

  /**
   * Toggle tile selection
   */
  toggleTileSelection(tileId: string): void {
    if (this.state.selectedTileIds.has(tileId)) {
      this.deselectTile(tileId)
    } else {
      this.selectTile(tileId)
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.state.selectedTileIds.clear()
  }

  /**
   * Select all tiles
   */
  selectAllTiles(): void {
    for (const tile of this.state.handTiles) {
      this.state.selectedTileIds.add(tile.id)
    }
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /**
   * Get current state (for UI binding)
   */
  getState(): Readonly<OrchestratorState> {
    return this.state
  }

  /**
   * Get hand tiles
   */
  getHandTiles(): Tile[] {
    return [...this.state.handTiles]
  }

  /**
   * Get selected tile IDs
   */
  getSelectedTileIds(): string[] {
    return Array.from(this.state.selectedTileIds)
  }

  /**
   * Get available actions
   */
  getAvailableActions(): PlayerAction['type'][] {
    return this.actionProcessor.getAvailableActions(this.createStateSnapshot())
  }

  /**
   * Check if an action is valid
   */
  canPerformAction(action: PlayerAction): boolean {
    return this.actionProcessor.canPerform(action, this.createStateSnapshot())
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global game orchestrator instance
 */
export const gameOrchestrator = new GameOrchestrator()
