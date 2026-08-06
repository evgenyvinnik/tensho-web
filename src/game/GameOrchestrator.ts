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
import { validateHand } from '../rules/HandValidator'
import { eventBus } from './EventBus'
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
import { ScoringContext as SystemScoringContext, ScoreBreakdown as SystemScoreBreakdown } from '../systems/types'
import { ConsumableSystem } from '../systems/ConsumableSystem'
import { CelestialOrbSystem, CelestialOrb, YakuCategory } from '../systems/CelestialOrbSystem'
import { FateSealSystem, FateSeal, FateSealContext } from '../systems/FateSealSystem'
import { VoidScriptSystem, VoidScript, VoidScriptContext } from '../systems/VoidScriptSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'

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
  consumableSystem: ConsumableSystem
  celestialOrbSystem: CelestialOrbSystem
  fateSealSystem: FateSealSystem
  voidScriptSystem: VoidScriptSystem
  omenSystem: OmenTagSystem

  // Consumable inventory (owned items)
  fateSeals: FateSeal[]
  celestialOrbs: CelestialOrb[]
  voidScripts: VoidScript[]

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
  discardsPerRound: 14, // Can discard up to entire hand
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
      consumableSystem: new ConsumableSystem(),
      celestialOrbSystem: new CelestialOrbSystem(),
      fateSealSystem: new FateSealSystem(),
      voidScriptSystem: new VoidScriptSystem(),
      omenSystem: new OmenTagSystem(),
      fateSeals: [],
      celestialOrbs: [],
      voidScripts: [],
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

  /** Reset the authoritative run state and return to the menu phase. */
  resetGame(): void {
    const previousPhase = this.state.phase
    this.state = this.createInitialState()
    eventBus.emit('phaseChanged', {
      previousPhase,
      newPhase: 'menu',
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
   * Refill hand to standard size (13 tiles) by drawing from wall
   */
  private refillHand(effects: Effect[]): void {
    const STANDARD_HAND_SIZE = 13

    while (this.state.handTiles.length < STANDARD_HAND_SIZE) {
      const tile = this.drawTileInternal()

      if (!tile) {
        // No more tiles in wall
        break
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
        // Bonus tiles don't count toward hand size, continue drawing
      } else {
        this.state.handTiles.push(tile)

        effects.push({
          type: 'tile_added',
          description: `Drew tile: ${tile.displayName}`,
          tile,
        })

        eventBus.emit('tileDrawn', {
          tileId: tile.id,
          tilesRemaining: this.state.wall.length - this.state.drawIndex,
        })
      }
    }

    // Sort hand after all draws
    this.state.handTiles.sort(Tile.compare)
  }

  /**
   * Handle bonus tile (flower or season)
   */
  private handleBonusTile(tile: Tile): void {
    if (tile.isFlower) {
      // FlowerSystem.addFlower expects a Tile object
      this.state.flowerSystem.addFlower(tile)
      eventBus.emit('flowerCollected', {
        flowerType: String(tile.flowerType ?? 'plum'),
        totalFlowers: this.state.flowerSystem.getFlowerCount(),
      })
    } else if (tile.isSeason) {
      // SeasonSystem.addSeason expects a Tile object
      this.state.seasonSystem.addSeason(tile)
      eventBus.emit('seasonActivated', {
        seasonType: String(tile.seasonType ?? 'spring'),
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
    console.log('[GameOrchestrator] processAction:', action.type)

    // Create state snapshot for validation
    const snapshot = this.createStateSnapshot()
    console.log('[GameOrchestrator] Snapshot - handTiles:', snapshot.handTiles.length, 'handsRemaining:', snapshot.handsRemaining)

    // Validate action
    const validation = this.actionProcessor.validate(action, snapshot)
    if (!validation.isValid) {
      console.error('[GameOrchestrator] Validation failed:', validation.errors)
      return {
        success: false,
        effects: [],
        errors: validation.errors,
      }
    }

    console.log('[GameOrchestrator] Validation passed, executing action')
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

      case 'useSeal':
        return this.executeUseSeal(action.sealId, action.targets, effects)

      case 'useScript':
        return this.executeUseScript(action.scriptId, action.targets, effects)

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
    console.log('[executePlay] Starting with', tileIds.length, 'tile IDs')

    // Get selected tiles
    const selectedTiles = this.state.handTiles.filter((t) => tileIds.includes(t.id))
    console.log('[executePlay] Found', selectedTiles.length, 'matching tiles in hand')

    // Check boss mandate: fixed_hand_size
    const fixedHandMandate = this.state.roundManager.checkMandateEffect('fixed_hand_size')
    if (fixedHandMandate.active && selectedTiles.length !== fixedHandMandate.value) {
      return {
        success: false,
        effects,
        errors: [`Boss Mandate: Must play exactly ${fixedHandMandate.value} tiles`],
      }
    }

    // Check boss mandate: single_hand (only one hand allowed)
    const singleHandMandate = this.state.roundManager.checkMandateEffect('single_hand')
    if (singleHandMandate.active && this.config.handsPerRound - this.state.handsRemaining > 0) {
      return {
        success: false,
        effects,
        errors: ['Boss Mandate: Only one hand allowed this round'],
      }
    }

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

    // Parse the tiles the player actually chose. The old implementation parsed
    // the entire hand, which made a five-tile selection score as a hidden
    // fourteen-tile hand and broke the core selection loop.
    const tilesToScore = [...selectedTiles]
    const hand = new Hand()
    for (const tile of tilesToScore) {
      hand.addTile(tile)
    }

    // Check if hand is valid (can form a winning hand)
    const validation = validateHand(hand)
    const parsedHand = validation.parsedHands.length > 0 ? validation.parsedHands[0] : null
    console.log('[executePlay] Parsed hand:', parsedHand ? 'valid' : 'partial')

    if (!parsedHand) {
      // Even without a complete winning hand, we can still score
      // This is the Tensho roguelike twist - you can play partial hands
      console.log('[executePlay] No complete hand, executing partial play')
      return this.executePartialPlay(selectedTiles, effects)
    }

    console.log('[executePlay] Complete hand found, calculating score')
    // Calculate score for complete hand
    const scoreResult = this.calculateHandScore(tilesToScore, parsedHand)

    // Apply score
    const previousScore = this.state.score
    this.state.score += scoreResult.finalScore
    this.state.handsRemaining--

    // Remove played tiles and add to discards
    for (const tileId of tileIds) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (idx !== -1) {
        const [tile] = this.state.handTiles.splice(idx, 1)
        this.state.discards.push(tile)
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

    // Auto-draw to refill hand if not round completed
    if (this.state.phase === 'gameplay') {
      this.refillHand(effects)
    }

    return { success: true, effects }
  }

  /**
   * Execute partial play (for when hand doesn't form a complete winning hand)
   */
  private executePartialPlay(selectedTiles: Tile[], effects: Effect[]): ActionResult {
    console.log('[executePartialPlay] Starting with', selectedTiles.length, 'tiles')

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
    console.log('[executePartialPlay] Calculated score - basePoints:', basePoints, 'finalScore:', finalScore)

    // Apply score
    const previousScore = this.state.score
    this.state.score += finalScore
    this.state.handsRemaining--
    console.log('[executePartialPlay] Score updated from', previousScore, 'to', this.state.score, 'handsRemaining:', this.state.handsRemaining)

    // Remove played tiles and add to discards
    for (const tile of selectedTiles) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tile.id)
      if (idx !== -1) {
        this.state.handTiles.splice(idx, 1)
        this.state.discards.push(tile)
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
        modifierChips: 0,
        modifierMult: 0,
        modifierMultiplier: 1,
        redFiveCount: 0,
        redFiveChips: 0,
        detectedYaku: [],
        yakuMultiplier: 1,
        additiveBonus: 0,
        retriggeredTiles: [],
        shatteredTiles: [],
        goldEarned: 0,
        subtotal: basePoints,
        finalScore,
      },
    })

    console.log('[executePartialPlay] Emitting handPlayed event')
    eventBus.emit('handPlayed', {
      tiles: selectedTiles.map((t) => t.id),
      score: finalScore,
      yakuIds: [],
    })

    console.log('[executePartialPlay] Emitting scoreUpdate event')
    eventBus.emit('scoreUpdate', {
      previousScore,
      newScore: this.state.score,
      delta: finalScore,
    })

    console.log('[executePartialPlay] Checking round completion')
    this.checkRoundCompletion(effects)

    if (this.state.phase === 'gameplay') {
      this.refillHand(effects)
    }

    console.log('[executePartialPlay] Returning success')
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

    // Skip the round and award the documented Omen reward.
    const skipResult = this.state.omenSystem.handleRoundSkip(roundState.roundType)
    this.state.roundManager.skipRound()

    if (skipResult.immediateGold > 0) {
      this.state.gold += skipResult.immediateGold
      eventBus.emit('goldChanged', {
        previousGold: this.state.gold - skipResult.immediateGold,
        newGold: this.state.gold,
        delta: skipResult.immediateGold,
        reason: 'Omen skip reward',
      })
    }

    eventBus.emit('roundSkipped', {
      roundType: roundState.roundType,
      omenTagGranted: 'skip_reward',
    })

    // Advance to next round
    this.advanceRound()

    return { success: true, effects }
  }

  /**
   * Execute use seal action - use a Fate Seal consumable
   */
  private executeUseSeal(
    sealId: string,
    targets: string[] | undefined,
    effects: Effect[]
  ): ActionResult {
    // Find the seal in inventory
    const sealIndex = this.state.fateSeals.findIndex((s) => s.instanceId === sealId)
    if (sealIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Seal not found in inventory'],
      }
    }

    const seal = this.state.fateSeals[sealIndex]

    // Build the context for seal usage
    const selectedTiles = targets
      ? this.state.handTiles.filter((t) => targets.includes(t.id))
      : []

    const context: FateSealContext = {
      selectedTiles,
      currentGold: this.state.gold,
      totalDecreeSellValue: this.state.decreeSystem.getOwnedDecrees().reduce(
        (sum, d) => sum + (d.sellValue ?? Math.floor(d.cost / 2)),
        0
      ),
      currentHand: this.state.handTiles,
      currentMelds: this.state.melds,
      getAvailableSlots: () => 3, // Default slots available
    }

    // Use the seal
    const result = this.state.fateSealSystem.useSeal(seal, context)

    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    // Remove the seal from inventory
    this.state.fateSeals.splice(sealIndex, 1)

    // Apply effects from the seal
    for (const effectResult of result.effects) {
      // Handle gold changes
      if (effectResult.type === 'gold' && typeof effectResult.value === 'number') {
        this.state.gold += effectResult.value
      }

      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }

    eventBus.emit('fateSealUsed', {
      sealId: seal.id,
      effect: seal.effect.description,
    })

    return { success: true, effects }
  }

  /**
   * Execute use script action - use a Void Script consumable
   */
  private executeUseScript(
    scriptId: string,
    targets: string[] | undefined,
    effects: Effect[]
  ): ActionResult {
    // Find the script in inventory
    const scriptIndex = this.state.voidScripts.findIndex((s) => s.instanceId === scriptId)
    if (scriptIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Script not found in inventory'],
      }
    }

    const script = this.state.voidScripts[scriptIndex]

    // Build the context for script usage
    const selectedTiles = targets
      ? this.state.handTiles.filter((t) => targets.includes(t.id))
      : []

    const context: VoidScriptContext = {
      selectedTiles,
      currentGold: this.state.gold,
      currentHand: this.state.handTiles,
      getAvailableDecreeSlots: () => this.state.decreeSystem.getAvailableSlots(),
      getDecreeCount: () => this.state.decreeSystem.getOwnedDecrees().length,
    }

    // Use the script
    const result = this.state.voidScriptSystem.useScript(script, context)

    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    // Remove the script from inventory
    this.state.voidScripts.splice(scriptIndex, 1)

    // Apply effects from the script
    for (const effectResult of result.effects) {
      // Handle gold changes
      if (effectResult.type === 'gold' && typeof effectResult.value === 'number') {
        this.state.gold += effectResult.value
      }

      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }

    eventBus.emit('voidScriptUsed', {
      scriptId: script.id,
      effect: script.effect.description,
      downside: script.penalty.description,
    })

    return { success: true, effects }
  }

  /**
   * Calculate score for a complete hand
   */
  private calculateHandScore(tiles: Tile[], parsedHand: ParsedHand): ScoreBreakdown {
    // Build the full ScoringContext for system integrations
    const roundState = this.state.roundManager.getCurrentRound()

    const systemContext: SystemScoringContext = {
      hand: parsedHand,
      tiles,
      melds: parsedHand.melds,
      decrees: this.state.decreeSystem.getOwnedDecrees(),
      flowers: this.state.flowerSystem.getCollection(),
      season: this.state.seasonSystem.getState(),
      round: {
        actNumber: this.state.currentAct,
        roundNumber: this.state.currentRound,
        roundType: roundState?.roundType ?? 'Small',
        scoreTarget: this.state.targetScore,
        currentScore: this.state.score,
        handsPlayed: this.config.handsPerRound - this.state.handsRemaining,
        maxHands: this.config.handsPerRound,
        discardsRemaining: this.state.discardsRemaining,
        maxDiscards: this.config.discardsPerRound,
        bossMandate: roundState?.bossMandate,
        isCompleted: false,
        isWon: false,
      },
      yakuMultipliers: new Map(),
      isConcealed: true,
      winningTile: tiles[tiles.length - 1],
    }

    // Apply season modifiers (includes corrupted effects)
    const seasonModifiers = this.state.seasonSystem.applySeasonModifiers(systemContext)

    // Calculate flower bonus with season suppression check
    const flowerBonus = seasonModifiers.flowersSuppressed
      ? 1.0
      : this.state.flowerSystem.calculateFlowerBonus(systemContext)

    // Apply yaku bonus from seasons (Autumn: +20% to yaku multipliers)
    const yakuSeasonBonus = seasonModifiers.yakuBonus

    // Calculate Celestial Orb bonuses for detected yaku
    let celestialOrbMultBonus = 0
    let celestialOrbChipsBonus = 0

    // Map yaku IDs to categories for Celestial Orb system
    const yakuToCategoryMap: Record<string, YakuCategory> = {
      riichi: 'Riichi',
      tanyao: 'Tanyao',
      yakuhai: 'Yakuhai',
      pinfu: 'Pinfu',
      ikkitsuukan: 'Ittsu',
      honitsu: 'Honitsu',
      toitoi: 'Toitoi',
      chinitsu: 'Chinitsu',
      sanshoku_doujun: 'Sanshoku',
      sanshoku_doukou: 'Sanshoku',
      chiitoitsu: 'SevenPairs',
      junchan: 'Chanta',
      chanta: 'Chanta',
      kokushi_musou: 'Kokushi',
    }

    // Create scoring context with system bonuses
    const context = createScoringContext(tiles, parsedHand, {
      isConcealed: true,
      isTsumo: true,
      additiveBonus: 0,
      multiplicativeBonus: flowerBonus * seasonModifiers.scoreMultiplier,
    })

    // Calculate base score
    const baseBreakdown = calculateScore(context)

    // Apply celestial orb bonuses for each detected yaku
    for (const detectedYaku of baseBreakdown.detectedYaku) {
      const category = yakuToCategoryMap[detectedYaku.definition.id]
      if (category) {
        const orbBonus = this.state.celestialOrbSystem.calculateYakuBonus(category)
        celestialOrbMultBonus += orbBonus.mult
        celestialOrbChipsBonus += orbBonus.chips

        // Trigger yaku for leveling
        this.state.celestialOrbSystem.triggerYaku(category)
      }

      // Also check 'All' category (Black Hole Orb)
      const allBonus = this.state.celestialOrbSystem.calculateYakuBonus('All')
      celestialOrbMultBonus += allBonus.mult
      celestialOrbChipsBonus += allBonus.chips
    }

    // Build system breakdown for decree application
    const systemBreakdown: SystemScoreBreakdown = {
      basePoints: baseBreakdown.basePoints,
      tilePoints: baseBreakdown.tilePoints,
      structurePoints: baseBreakdown.structurePoints,
      additiveBonus: baseBreakdown.additiveBonus,
      yakuMultiplier: baseBreakdown.yakuMultiplier * (1 + yakuSeasonBonus),
      decreeMultiplier: 1.0,
      flowerMultiplier: flowerBonus,
      seasonMultiplier: seasonModifiers.scoreMultiplier,
      finalScore: baseBreakdown.finalScore,
      bonusGold: baseBreakdown.goldEarned ?? 0,
    }

    // Apply decree effects (with Frostbite halving if active)
    const decreeModifiedBreakdown = this.state.decreeSystem.applyDecreeEffects(
      systemContext,
      systemBreakdown
    )

    // Apply Frostbite modifier to decree effects if active
    let finalDecreeMultiplier = decreeModifiedBreakdown.decreeMultiplier
    if (seasonModifiers.decreeModifier !== 1.0) {
      // Frostbite: halve the decree bonus (not the entire multiplier)
      const decreeBonus = finalDecreeMultiplier - 1.0
      finalDecreeMultiplier = 1.0 + decreeBonus * seasonModifiers.decreeModifier
    }

    // Apply Decay penalty
    const decayPenalty = seasonModifiers.decayPenalty

    // Apply boss mandate effects
    let mandateMultiplier = 1.0

    // The Flint: Base points and Mult halved
    const halveScoreMandate = this.state.roundManager.checkMandateEffect('halve_score')
    if (halveScoreMandate.active) {
      mandateMultiplier *= halveScoreMandate.value as number
    }

    // The Wall: Extra large score requirement (already handled in RoundManager score targets)
    // but we can add it to the breakdown for visibility

    // Calculate final score with all multipliers
    // Formula: (Base + Additive + CelestialChips) * (Yaku + CelestialMult) * Flower * Season * Decree * Mandate - Decay
    const subtotal = baseBreakdown.basePoints + decreeModifiedBreakdown.additiveBonus + celestialOrbChipsBonus
    const finalMultiplier =
      (decreeModifiedBreakdown.yakuMultiplier + celestialOrbMultBonus) *
      flowerBonus *
      seasonModifiers.scoreMultiplier *
      finalDecreeMultiplier *
      mandateMultiplier

    const calculatedFinalScore = Math.max(0, Math.floor(subtotal * finalMultiplier) - decayPenalty)

    // Return the breakdown in the format expected by the rest of the system
    return {
      ...baseBreakdown,
      yakuMultiplier: decreeModifiedBreakdown.yakuMultiplier,
      additiveBonus: decreeModifiedBreakdown.additiveBonus,
      finalScore: calculatedFinalScore,
    }
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
    // Capture the completed round before RoundManager advances its cursor.
    const completedRound = this.state.roundManager.getCurrentRound()
    this.state.roundManager.submitScore(this.state.score)

    // Calculate gold reward
    const roundState = completedRound
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

    // Apply boss mandate effects on resources
    // The Water: Start with 0 discards
    const noDiscardsMandate = this.state.roundManager.checkMandateEffect('no_discards')
    if (noDiscardsMandate.active) {
      this.state.discardsRemaining = 0
    }

    // The Needle: Only 1 hand allowed
    const singleHandMandate = this.state.roundManager.checkMandateEffect('single_hand')
    if (singleHandMandate.active) {
      this.state.handsRemaining = 1
    }

    // Notify decree system of round start
    this.state.decreeSystem.onRoundStart()

    // Set act number for season corruption
    this.state.seasonSystem.setAct(this.state.currentAct)

    // Reinitialize wall for new round
    this.initializeWall(this.state.seed + this.state.currentAct * 100 + this.state.currentRound)
    this.drawStartingHand()

    eventBus.emit('roundStart', {
      actNumber: this.state.currentAct,
      roundNumber: this.state.currentRound,
      roundType: roundState.roundType,
      target: this.state.targetScore,
    })

    // Emit mandate info if boss round
    if (roundState.bossMandate) {
      eventBus.emit('mandateActivated', {
        mandateId: roundState.bossMandate.id,
        mandateName: roundState.bossMandate.name,
        effect: roundState.bossMandate.description,
      })
    }
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

  // ===========================================================================
  // CONSUMABLE MANAGEMENT
  // ===========================================================================

  /**
   * Add a Fate Seal to inventory
   */
  addFateSeal(seal: FateSeal): boolean {
    // Check if we have room (max 3 by default)
    if (this.state.fateSeals.length >= 3) {
      return false
    }
    this.state.fateSeals.push(seal)
    return true
  }

  /**
   * Add a Void Script to inventory
   */
  addVoidScript(script: VoidScript): boolean {
    // Check if we have room (max 3 by default)
    if (this.state.voidScripts.length >= 3) {
      return false
    }
    this.state.voidScripts.push(script)
    return true
  }

  /**
   * Add a Celestial Orb to inventory
   */
  addCelestialOrb(orb: CelestialOrb): boolean {
    // Check if we have room (max 3 by default)
    if (this.state.celestialOrbs.length >= 3) {
      return false
    }
    this.state.celestialOrbs.push(orb)
    return true
  }

  /**
   * Get Fate Seals in inventory
   */
  getFateSeals(): FateSeal[] {
    return [...this.state.fateSeals]
  }

  /**
   * Get Void Scripts in inventory
   */
  getVoidScripts(): VoidScript[] {
    return [...this.state.voidScripts]
  }

  /**
   * Get Celestial Orbs in inventory
   */
  getCelestialOrbs(): CelestialOrb[] {
    return [...this.state.celestialOrbs]
  }

  /**
   * Get consumable counts
   */
  getConsumableCounts(): { fateSeals: number; celestialOrbs: number; voidScripts: number } {
    return {
      fateSeals: this.state.fateSeals.length,
      celestialOrbs: this.state.celestialOrbs.length,
      voidScripts: this.state.voidScripts.length,
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global game orchestrator instance
 */
export const gameOrchestrator = new GameOrchestrator()
