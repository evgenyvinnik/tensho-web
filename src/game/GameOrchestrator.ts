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
import { EditionType, EnhancementType, SealType } from '../core/TileModifier'
import { Hand, ParsedHand, WaitType } from '../core/Hand'
import { Meld, MeldType } from '../core/Meld'
import { calculateScore, createScoringContext, ScoreBreakdown } from '../rules/ScoringEngine'
import { findOneAwayCompletion, validateHand } from '../rules/HandValidator'
import { parsePartialHand, toPartialParsedHand } from '../rules/PartialHandParser'
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
import { ALL_DECREES, DecreeSystem, STARTER_DECREES } from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import {
  ScoringContext as SystemScoringContext,
  ScoreBreakdown as SystemScoreBreakdown,
  type Decree,
  type DecreeEdition,
  type ImperialCharter,
  type RoundType,
} from '../systems/types'
import {
  BaseConsumable,
  ConsumableEffectResult,
  ConsumableSystem,
  ConsumableType,
} from '../systems/ConsumableSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
  CelestialOrb,
  YakuCategory,
} from '../systems/CelestialOrbSystem'
import {
  FATE_SEALS,
  FateSealSystem,
  FateSeal,
  FateSealContext,
} from '../systems/FateSealSystem'
import {
  VOID_SCRIPTS,
  VoidScriptSystem,
  VoidScript,
  VoidScriptContext,
} from '../systems/VoidScriptSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import { CharterSystem } from '../systems/CharterSystem'
import { DebuffSystem } from './DebuffSystem'
import type { TeaHouseVisitModifiers } from '../systems/TeaHouseSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { getMandateById } from '../config/mandateDefinitions'

// =============================================================================
// GAME ORCHESTRATOR STATE
// =============================================================================

/** Transparent payout and progression context retained for the Tea House. */
export interface RoundCashOutSummary {
  actNumber: number
  roundNumber: number
  roundType: RoundType
  score: number
  target: number
  baseReward: number
  interest: number
  decreeGold: number
  heldGoldMarkReward: number
  rentalCost: number
  netGoldChange: number
  goldBefore: number
  goldAfter: number
  nextRoundType: RoundType | null
  nextTarget: number | null
}

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
  /** Score accumulated across every round in this run. */
  runScore: number
  /** True after the Act 8 Showdown has been defeated. */
  hasWonRun: boolean

  // Resources
  score: number
  gold: number

  // Round state
  handsRemaining: number
  /**
   * Hands granted at the start of this round. Charters, Decrees and Mandates
   * all move the allowance off the config default, so hands-played must be
   * measured against this rather than against `config.handsPerRound`.
   */
  handsAllowance: number
  /**
   * Permanent score multiplier charged by a Decree that refused a loss
   * (Immortal Decree). 1 while no such rescue has happened.
   */
  lossPreventionScorePenalty: number
  discardsRemaining: number
  redrawsRemaining: number
  targetScore: number

  // Hand state
  handTiles: Tile[]
  melds: Meld[]
  selectedTileIds: Set<string>
  /** Tile identities currently hidden from the player by a mandate. */
  faceDownTileIds: Set<string>

  // Wall state
  wallTemplate: Tile[]
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
  charterSystem: CharterSystem
  debuffSystem: DebuffSystem
  mandateEffectSystem: MandateEffectSystem

  // Consumable inventory (owned items)
  fateSeals: FateSeal[]
  celestialOrbs: CelestialOrb[]
  voidScripts: VoidScript[]

  // Transition context retained while the between-round shop is open
  lastCompletedRoundType: RoundType | null
  lastRoundSummary: RoundCashOutSummary | null

  // Void Script capacity loss that lasts for the currently active round.
  temporaryDecreeSlotPenalty: number

  // One-round Omen resource modifiers, consumed when the round begins.
  omenHandSizeBonus: number
  omenDiscardBonus: number
  omenRedrawBonus: number

  // Run-wide yaku history used by late-Act mandate effects.
  yakuPlayCounts: Map<string, number>
  /** Yaku scored in the active round and in the immediately previous round. */
  currentRoundYakuIds: Set<string>
  previousRoundYakuIds: Set<string>
  /** Once-per-round interaction granted by Dead Wall Writ. */
  deadWallWritUsedThisRound: boolean
  /** One-shot Act reduction queued by Ancient/Stone Script acquisition. */
  pendingActReduction: number

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
  startingHandSize: 14,
}

/**
 * Score a simple (2-8) as though it were a terminal, for Transmuter.
 *
 * Returns a scoring stand-in rather than mutating the tile: the player's wall
 * keeps its real tiles, and the promotion lasts only for this hand. Rank 1 is
 * the terminal the tile is promoted to; the id is preserved so retriggers,
 * debuffs, and modifier lookups still resolve.
 */
function promoteSimpleToTerminal(tile: Tile): Tile {
  if (!tile.isSimple) return tile

  return new Tile(tile.suit, 1, tile.id, tile.isRed, tile.modifiers)
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
  private runtimeItemCounter = 0

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
    const debuffSystem = new DebuffSystem()
    const mandateEffectSystem = new MandateEffectSystem()
    mandateEffectSystem.setDebuffSystem(debuffSystem)

    return {
      isRunActive: false,
      seed: Date.now(),
      stake: 1,
      currentAct: 1,
      currentRound: 1,
      runScore: 0,
      hasWonRun: false,
      score: 0,
      gold: 4,
      handsRemaining: this.config.handsPerRound,
      handsAllowance: this.config.handsPerRound,
      lossPreventionScorePenalty: 1,
      discardsRemaining: this.config.discardsPerRound,
      redrawsRemaining: this.config.redrawsPerRound,
      targetScore: 300,
      handTiles: [],
      melds: [],
      selectedTileIds: new Set(),
      faceDownTileIds: new Set(),
      wallTemplate: [],
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
      charterSystem: new CharterSystem(),
      debuffSystem,
      mandateEffectSystem,
      fateSeals: [],
      celestialOrbs: [],
      voidScripts: [],
      lastCompletedRoundType: null,
      lastRoundSummary: null,
      temporaryDecreeSlotPenalty: 0,
      omenHandSizeBonus: 0,
      omenDiscardBonus: 0,
      omenRedrawBonus: 0,
      yakuPlayCounts: new Map(),
      currentRoundYakuIds: new Set(),
      previousRoundYakuIds: new Set(),
      deadWallWritUsedThisRound: false,
      pendingActReduction: 0,
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
        source: 'starting',
      })
    }
  }

  /**
   * Start a new run
   */
  startNewRun(seed?: number, stake: number = 1, wallVariant = 'green_felt'): void {
    const actualSeed = seed ?? Date.now()

    // Reset state
    this.state = this.createInitialState()
    this.state.seed = actualSeed
    this.runtimeItemCounter = 0
    this.state.mandateEffectSystem.setSeed(actualSeed)
    this.state.omenSystem.setSeed(actualSeed + 0x0a11ce)
    this.state.stake = stake
    this.state.isRunActive = true
    this.state.phase = 'gameplay'

    // Initialize round manager
    this.state.roundManager = new RoundManager(stake, actualSeed)
    this.state.roundManager.startNewRun()

    // Start meta-progression before starter items are granted so they remain in
    // the current-run Archive ledger.
    eventBus.emit('runStart', {
      seed: actualSeed,
      stake,
      wallVariant,
    })

    // Give starter decrees (2 random from the starter pool)
    this.initializeStarterDecrees(actualSeed)

    // Update target score from round manager
    const roundState = this.state.roundManager.getCurrentRound()
    if (roundState) {
      this.state.targetScore = roundState.scoreTarget
      this.state.currentAct = roundState.actNumber
      this.state.currentRound = roundState.roundNumber
      this.state.omenSystem.setRoundInfo(this.state.currentAct, this.state.currentRound)
    }

    this.state.charterSystem.updateProgress(this.state.currentAct, this.state.currentRound)
    this.state.decreeSystem.onRoundStart()
    this.state.consumableSystem.onRoundStart()
    this.initializeRoundResources()

    // Initialize the first round in a ready-to-play state.
    this.initializeWall(actualSeed)
    this.applyMandateDebuffs()
    this.drawStartingHand()

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
    this.runtimeItemCounter = 0
    eventBus.emit('phaseChanged', {
      previousPhase,
      newPhase: 'menu',
    })
  }

  /** Calculate the resources granted for the active round. */
  private initializeRoundResources(): void {
    const charterEffects = this.state.charterSystem.calculateEffects()
    const stakePenalty = this.state.roundManager.getStakeModifiers().redrawPenalty
    this.state.deadWallWritUsedThisRound = false

    this.state.handsRemaining = Math.max(
      1,
      this.config.handsPerRound +
        charterEffects.additionalHands -
        charterEffects.handsPenalty +
        this.state.decreeSystem.getAdditionalDraws()
    )
    this.state.discardsRemaining = Math.max(
      0,
      this.config.discardsPerRound +
        this.state.omenDiscardBonus +
        this.state.decreeSystem.getAdditionalDiscards()
    )
    this.state.redrawsRemaining = Math.max(
      0,
      this.config.redrawsPerRound +
        this.state.omenRedrawBonus +
        charterEffects.additionalRedraws -
        charterEffects.redrawsPenalty -
        stakePenalty
    )

    const singleHandMandate = this.state.roundManager.checkMandateEffect('single_hand')
    if (singleHandMandate.active) {
      this.state.handsRemaining = 1
    }

    const noDiscardsMandate = this.state.roundManager.checkMandateEffect('no_discards')
    if (noDiscardsMandate.active) {
      this.state.redrawsRemaining = 0
    }

    this.state.handsAllowance = this.state.handsRemaining
  }

  /** Structural exceptions the active Decrees grant to hand validation. */
  private getValidationOptions() {
    return {
      allowSequenceSkip: this.isDecreeRuleActive('sequence_skip'),
      meldMayServeAsPair: this.isDecreeRuleActive('meld_as_pair'),
      wildcardCount: this.isDecreeRuleActive('wildcard_tile') ? 1 : 0,
      suitsMatchForSequences: this.isDecreeRuleActive('suits_match'),
    }
  }

  /**
   * Reality Warp: every tile counts as every suit and rank, so any fourteen
   * tiles already form a winning hand.
   *
   * The decomposition is built directly rather than searched. With no tile
   * identity left to constrain it, a search would grind through equivalent
   * permutations to reach the same answer this returns immediately.
   */
  private parseAsAllWild(tiles: Tile[]): ParsedHand | null {
    if (!this.isDecreeRuleActive('all_wild')) return null
    if (tiles.length !== 14) return null

    const melds: Meld[] = []
    for (let i = 0; i < 4; i++) {
      melds.push(new Meld(MeldType.Triplet, tiles.slice(i * 3, i * 3 + 3), true))
    }

    return {
      melds,
      pair: new Meld(MeldType.Pair, tiles.slice(12, 14), true),
      waitType: WaitType.Tanki,
      winningTile: tiles[tiles.length - 1],
      isConcealed: true,
    }
  }

  private getHandSizeLimit(): number {
    return Math.max(
      2,
      this.config.startingHandSize +
        this.state.charterSystem.calculateEffects().handSizeBonus -
        this.state.voidScriptSystem.getHandSizePenalty() +
        this.state.omenHandSizeBonus -
        this.state.mandateEffectSystem.getHandSizeReduction() +
        this.state.decreeSystem.getHandSizeBonus()
    )
  }

  private getConsumableCapacity(): number {
    return 3 + this.state.charterSystem.calculateEffects().consumableSlots
  }

  /** Resolve a Decree rule while respecting per-hand mandate suppression. */
  private isDecreeRuleActive(ruleId: string): boolean {
    return this.state.decreeSystem.getActiveDecrees().some(
      (decree) =>
        decree.effect.type === 'rule_modification' &&
        decree.effect.ruleId === ruleId &&
        !this.state.mandateEffectSystem.isDecreeDisabled(decree.id)
    )
  }

  /** Apply the current Boss Mandate to this round's tile instances. */
  private applyMandateDebuffs(): void {
    this.state.debuffSystem.clearAllDebuffs()
    this.state.mandateEffectSystem.deactivateMandate()
    const allTiles = [...this.state.wall, ...this.state.deadWall]
    const round = this.state.roundManager.getCurrentRound()
    const mandate = round?.bossMandate

    if (!mandate) return

    const definition = getMandateById(mandate.id)
    if (definition) {
      this.state.mandateEffectSystem.activateMandate(
        definition,
        allTiles,
        this.state.decreeSystem.getOwnedDecrees()
      )
    }

    if (mandate.effect.type === 'debuff_suit' && mandate.effect.target) {
      this.state.debuffSystem.applyMandateRestriction(allTiles, mandate.effect.target)
      return
    }

    if (mandate.effect.type === 'debuff_tile_type') {
      for (const tile of allTiles) {
        const shouldDebuff =
          mandate.effect.target === 'dragon'
            ? tile.suit === TileSuit.Dragon
            : tile.isHonor
        if (shouldDebuff) {
          this.state.debuffSystem.debuffTile(tile.id, {
            type: 'mandate',
            mandateId: mandate.id,
          })
        }
      }
      return
    }

    if (mandate.effect.type === 'debuff_used_tiles') {
      for (const tile of allTiles) {
        if (this.state.roundManager.wasTileUsed(tile.id)) {
          this.state.debuffSystem.debuffTile(tile.id, {
            type: 'mandate',
            mandateId: mandate.id,
          })
        }
      }
    }
  }

  /**
   * Initialize the tile wall
   */
  private initializeWall(seed: number): void {
    // The wall composition persists for the run so pack additions and tile
    // transformations survive the round reshuffle.
    if (this.state.wallTemplate.length === 0) {
      this.state.wallTemplate = this.createFullTileSet()
    }

    // Shuffle with seed
    const shuffled = this.seededShuffle(this.state.wallTemplate, seed)

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
    this.state.faceDownTileIds.clear()

    for (let i = 0; i < this.getHandSizeLimit(); i++) {
      const tile = this.drawTileInternal()
      if (tile) {
        // Handle bonus tiles
        if (tile.isFlower || tile.isSeason) {
          this.handleBonusTile(tile)
        } else {
          this.state.handTiles.push(tile)
        }
      }
    }

    // Sort hand
    this.state.handTiles.sort(Tile.compare)
    this.applyMandateDrawState(this.state.handTiles, [], {
      isStartingHand: true,
    })
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
  private refillHand(effects: Effect[], afterHandPlay: boolean = false): void {
    const previousTileIds = new Set(this.state.handTiles.map((tile) => tile.id))
    const handSizeLimit = this.getHandSizeLimit()

    while (this.state.handTiles.length < handSizeLimit) {
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
    this.applyMandateDrawState(
      this.state.handTiles.filter((tile) => !previousTileIds.has(tile.id)),
      effects,
      { afterHandPlay }
    )
  }

  /** Resolve the documented post-play/discard draw rule for the active mandate. */
  private refillAfterCycle(
    effects: Effect[],
    afterHandPlay: boolean = false
  ): void {
    const fixedDrawCount = this.state.mandateEffectSystem.getFixedDrawCount()
    if (fixedDrawCount === null) {
      this.refillHand(effects, afterHandPlay)
      return
    }

    const previousTileIds = new Set(this.state.handTiles.map((tile) => tile.id))

    for (let i = 0; i < fixedDrawCount; i++) {
      const tile = this.drawTileInternal()
      if (!tile) break

      if (tile.isFlower || tile.isSeason) {
        this.handleBonusTile(tile)
        effects.push({
          type: 'bonus_tile_drawn',
          description: `Drew bonus tile: ${tile.displayName}`,
          tile,
          isFlower: tile.isFlower,
        })
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

    this.state.handTiles.sort(Tile.compare)
    this.applyMandateDrawState(
      this.state.handTiles.filter((tile) => !previousTileIds.has(tile.id)),
      effects,
      { afterHandPlay }
    )
  }

  /** Apply hidden-information and post-draw mandate effects to a draw cycle. */
  private applyMandateDrawState(
    drawnTiles: Tile[],
    effects: Effect[],
    context: { isStartingHand?: boolean; afterHandPlay?: boolean } = {}
  ): void {
    if (drawnTiles.length === 0) return

    for (const tile of drawnTiles) {
      if (this.state.mandateEffectSystem.shouldTileBeFaceDown(tile, context)) {
        this.state.faceDownTileIds.add(tile.id)
      }
    }

    this.applyPostDrawMandate(drawnTiles[drawnTiles.length - 1], effects)
  }

  /**
   * Handle bonus tile (flower or season)
   */
  private handleBonusTile(tile: Tile): void {
    if (tile.isFlower) {
      const previousBonusSlots = this.state.flowerSystem.getBonusDecreeSlots()
      // FlowerSystem.addFlower expects a Tile object
      this.state.flowerSystem.addFlower(tile)
      const nextBonusSlots = this.state.flowerSystem.getBonusDecreeSlots()
      for (let i = previousBonusSlots; i < nextBonusSlots; i++) {
        this.state.decreeSystem.addSlot()
      }
      eventBus.emit('flowerCollected', {
        flowerType: String(tile.flowerType ?? 'plum'),
        totalFlowers: this.state.flowerSystem.getFlowerCount(),
      })
    } else if (tile.isSeason) {
      const lockedSeason = this.state.omenSystem.applyLockedSeason()
      if (lockedSeason) {
        this.state.seasonSystem.forceSetSeason(lockedSeason)
      } else {
        this.state.seasonSystem.addSeason(tile)
      }
      eventBus.emit('seasonActivated', {
        seasonType: lockedSeason ?? String(tile.seasonType ?? 'spring'),
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
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') {
      return {
        success: false,
        effects: [],
        errors: ['Gameplay actions are only available during an active round'],
      }
    }

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
      fateSealIds: this.state.fateSeals.flatMap((seal) => [seal.instanceId, seal.id]),
      celestialOrbIds: this.state.celestialOrbs.flatMap((orb) => [orb.instanceId, orb.id]),
      voidScriptIds: this.state.voidScripts.flatMap((script) => [
        script.instanceId,
        script.id,
      ]),
      fateSealUsesRemaining:
        this.state.consumableSystem.getFateSealUsesRemaining(),
      voidScriptUsesRemaining:
        this.state.consumableSystem.getVoidScriptUsesRemaining(),
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

      case 'useOrb':
        return this.executeUseOrb(action.orbId, effects)

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
    const previousTileIds = new Set(this.state.handTiles.map((handTile) => handTile.id))
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

    this.applyMandateDrawState(
      this.state.handTiles.filter((handTile) => !previousTileIds.has(handTile.id)),
      effects
    )

    return { success: true, effects }
  }

  /**
   * Execute discard action
   */
  private executeDiscard(tileId: string, effects: Effect[]): ActionResult {
    if (this.state.mandateEffectSystem.isTileLocked(tileId)) {
      return {
        success: false,
        effects,
        errors: ['Locked tiles cannot be discarded'],
      }
    }

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
    this.state.faceDownTileIds.delete(tileId)

    const decreeGold = this.state.decreeSystem.calculateDiscardGold(1)
    if (decreeGold > 0) {
      const previousGold = this.state.gold
      this.state.gold += decreeGold
      effects.push({
        type: 'gold_changed',
        description: `Earned ${decreeGold} gold from discard effects`,
        delta: decreeGold,
        newTotal: this.state.gold,
      })
      eventBus.emit('goldChanged', {
        previousGold,
        newGold: this.state.gold,
        delta: decreeGold,
        reason: 'Discard Decree effect',
      })
    }

    effects.push({
      type: 'tile_removed',
      description: `Discarded tile: ${tile.displayName}`,
      tileId,
    })

    eventBus.emit('tileDiscarded', {
      tileId,
      toDeadPool: true,
    })

    if (tile.modifiers.seal === SealType.Purple) {
      this.createRandomConsumable('FateSeal', effects)
    }

    // A discard is a complete cycle: immediately draw its replacement so the
    // game loop works independently of React timing/effects.
    this.refillAfterCycle(effects)
    this.enforcePlayability(effects)

    return { success: true, effects }
  }

  /**
   * Score a prospective selection without playing it.
   *
   * Runs the same pipeline the play itself will run - the same partial parse,
   * the same Decrees, modifiers, Flowers, Seasons and Orbs - so the number the
   * player sees before committing is the number they get. Chance-based tile
   * effects resolve to their guaranteed outcome, making the preview a floor
   * rather than a promise the roll might not keep.
   *
   * Returns null when the selection can't be scored (fewer than two tiles).
   */
  previewScore(tileIds: string[]): ScoreBreakdown | null {
    const selectedTiles = this.state.handTiles.filter((tile) => tileIds.includes(tile.id))
    if (selectedTiles.length < 2) return null

    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]

    const validationOptions = this.getValidationOptions()
    const hand = new Hand()
    for (const tile of tilesToScore) {
      hand.addTile(tile)
    }
    const validation = validateHand(hand, undefined, validationOptions)
    const parsedHand =
      this.parseAsAllWild(tilesToScore) ??
      (validation.parsedHands.length > 0 ? validation.parsedHands[0] : null)

    if (parsedHand) {
      const complete = this.calculateHandScore(tilesToScore, parsedHand, undefined, true)
      if (this.state.voidScriptSystem.isBaseScoreHalved()) {
        complete.finalScore = Math.floor(complete.finalScore / 2)
      }
      return complete
    }

    const parse = parsePartialHand(tilesToScore)
    const partial = this.calculateHandScore(
      tilesToScore,
      toPartialParsedHand(parse, tilesToScore),
      parse.groups,
      true
    )
    if (this.state.voidScriptSystem.isBaseScoreHalved()) {
      partial.finalScore = Math.floor(partial.finalScore / 2)
    }
    return partial
  }

  /**
   * Execute play action (play hand)
   */
  private executePlay(tileIds: string[], effects: Effect[]): ActionResult {
    // Get selected tiles
    const selectedTiles = this.state.handTiles.filter((t) => tileIds.includes(t.id))

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
    if (singleHandMandate.active && this.state.handsAllowance - this.state.handsRemaining > 0) {
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

    const mandateValidation = this.state.mandateEffectSystem.validateHandPlay(tileIds)
    if (!mandateValidation.valid) {
      return {
        success: false,
        effects,
        errors: [mandateValidation.error ?? 'Boss Mandate blocks this play'],
      }
    }

    // For Tensho, we use a simplified hand model:
    // The entire hand (or selected tiles) is played at once
    // We need at least a valid structure to score

    // Parse the tiles the player actually chose. The old implementation parsed
    // the entire hand, which made a five-tile selection score as a hidden
    // fourteen-tile hand and broke the core selection loop.
    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]
    const hand = new Hand()
    for (const tile of tilesToScore) {
      hand.addTile(tile)
    }

    // Check if hand is valid (can form a winning hand)
    const validationOptions = this.getValidationOptions()
    const validation = validateHand(hand, undefined, validationOptions)
    let parsedHand =
      this.parseAsAllWild(tilesToScore) ??
      (validation.parsedHands.length > 0 ? validation.parsedHands[0] : null)
    let tilesToScoreWithRules = tilesToScore
    let usedShantenClemency = false

    if (
      this.isDecreeRuleActive('honor_as_suited') &&
      selectedTiles.some((tile) => tile.isHonor)
    ) {
      effects.push({
        type: 'decree_triggered',
        description: 'Honor Transmutation treated honors as dominant-suit tiles',
      })
    }

    if (!parsedHand && this.isDecreeRuleActive('shanten_clemency')) {
      const completion = findOneAwayCompletion(
        tilesToScore,
        this.state.melds,
        validationOptions
      )
      if (completion) {
        parsedHand = completion.parsedHand
        tilesToScoreWithRules = [...tilesToScore, completion.completionTile]
        usedShantenClemency = true
      }
    }
    if (!parsedHand) {
      // Even without a complete winning hand, we can still score
      // This is the Tensho roguelike twist - you can play partial hands
      return this.executePartialPlay(selectedTiles, effects)
    }

    // Calculate score for complete hand
    const scoreResult = this.calculateHandScore(tilesToScoreWithRules, parsedHand)
    if (usedShantenClemency) {
      scoreResult.finalScore = Math.floor(scoreResult.finalScore * 0.5)
      effects.push({
        type: 'decree_triggered',
        description: 'Shanten Clemency completed the hand at a 50% score penalty',
      })
    }
    if (this.state.voidScriptSystem.isBaseScoreHalved()) {
      scoreResult.finalScore = Math.floor(scoreResult.finalScore / 2)
    }
    this.applyOmenScoreBonuses(scoreResult)

    // Apply score
    const previousScore = this.state.score
    this.state.score += scoreResult.finalScore
    this.state.runScore += scoreResult.finalScore
    this.state.handsRemaining--

    if (scoreResult.goldEarned > 0) {
      const previousGold = this.state.gold
      this.state.gold += scoreResult.goldEarned
      effects.push({
        type: 'gold_changed',
        description: `Earned ${scoreResult.goldEarned} gold from tile effects`,
        delta: scoreResult.goldEarned,
        newTotal: this.state.gold,
      })
      eventBus.emit('goldChanged', {
        previousGold,
        newGold: this.state.gold,
        delta: scoreResult.goldEarned,
        reason: 'Scoring tile effect',
      })
    }

    this.applyPlayedTileMandates(
      tileIds,
      scoreResult.detectedYaku.map((yaku) => yaku.definition.id),
      effects
    )

    if (scoreResult.shatteredTiles.length > 0) {
      this.destroyTiles(scoreResult.shatteredTiles, effects)
    }

    if (
      this.state.score >= this.state.targetScore &&
      selectedTiles.some((tile) => tile.modifiers.seal === SealType.Blue)
    ) {
      this.createRandomConsumable('CelestialOrb', effects)
    }

    // Remove played tiles and add to discards
    for (const tileId of tileIds) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (idx !== -1) {
        const [tile] = this.state.handTiles.splice(idx, 1)
        this.state.discards.push(tile)
        this.state.faceDownTileIds.delete(tileId)
      }
    }

    this.state.selectedTileIds.clear()
    this.state.roundManager.trackUsedTiles(tileIds)

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

    this.state.voidScriptSystem.onHandEnd()

    // Check round completion
    this.checkRoundCompletion(effects)

    // Auto-draw to refill hand if not round completed
    if (this.state.phase === 'gameplay') {
      this.refillAfterCycle(effects, true)
      this.enforcePlayability(effects)
    }

    return { success: true, effects }
  }

  /**
   * Execute partial play (for when the selection isn't a complete winning hand).
   *
   * This is the common case in Tensho: the player is paid for whatever
   * structure the selection contains. It runs the same scoring pipeline as a
   * complete hand so Decrees, tile modifiers, Flowers, Seasons and Celestial
   * Orbs all apply - only yaku are withheld, since those need a winning hand.
   */
  private executePartialPlay(selectedTiles: Tile[], effects: Effect[]): ActionResult {
    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]

    const parse = parsePartialHand(tilesToScore)
    const parsedHand = toPartialParsedHand(parse, tilesToScore)

    const scoreResult = this.calculateHandScore(tilesToScore, parsedHand, parse.groups)
    if (this.state.voidScriptSystem.isBaseScoreHalved()) {
      scoreResult.finalScore = Math.floor(scoreResult.finalScore / 2)
    }
    this.applyOmenScoreBonuses(scoreResult)

    const finalScore = scoreResult.finalScore
    const previousScore = this.state.score
    this.state.score += finalScore
    this.state.runScore += finalScore
    this.state.handsRemaining--

    if (scoreResult.goldEarned > 0) {
      const previousGold = this.state.gold
      this.state.gold += scoreResult.goldEarned
      effects.push({
        type: 'gold_changed',
        description: `Earned ${scoreResult.goldEarned} gold from tile effects`,
        delta: scoreResult.goldEarned,
        newTotal: this.state.gold,
      })
      eventBus.emit('goldChanged', {
        previousGold,
        newGold: this.state.gold,
        delta: scoreResult.goldEarned,
        reason: 'Scoring tile effect',
      })
    }

    const tileIds = selectedTiles.map((tile) => tile.id)
    this.applyPlayedTileMandates(tileIds, [], effects)

    if (scoreResult.shatteredTiles.length > 0) {
      this.destroyTiles(scoreResult.shatteredTiles, effects)
    }

    if (
      this.state.score >= this.state.targetScore &&
      selectedTiles.some((tile) => tile.modifiers.seal === SealType.Blue)
    ) {
      this.createRandomConsumable('CelestialOrb', effects)
    }

    // Remove played tiles and add to discards
    for (const tile of selectedTiles) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tile.id)
      if (idx !== -1) {
        this.state.handTiles.splice(idx, 1)
        this.state.discards.push(tile)
        this.state.faceDownTileIds.delete(tile.id)
      }
    }

    this.state.selectedTileIds.clear()
    this.state.roundManager.trackUsedTiles(tileIds)

    effects.push({
      type: 'score_added',
      description: `Scored ${finalScore} points (partial hand)`,
      score: finalScore,
      breakdown: scoreResult,
    })

    eventBus.emit('handPlayed', {
      tiles: tileIds,
      score: finalScore,
      yakuIds: [],
    })

    eventBus.emit('scoreUpdate', {
      previousScore,
      newScore: this.state.score,
      delta: finalScore,
    })

    this.state.voidScriptSystem.onHandEnd()

    this.checkRoundCompletion(effects)

    if (this.state.phase === 'gameplay') {
      this.refillAfterCycle(effects, true)
      this.enforcePlayability(effects)
    }

    return { success: true, effects }
  }

  private applyOmenScoreBonuses(score: ScoreBreakdown): void {
    const omenScore = this.state.omenSystem.triggerHandScoredOmens()
    const passiveOmenMult = this.state.omenSystem.getPassiveMultBonus()
    score.additiveBonus += omenScore.scoreBonus
    score.finalScore = Math.floor(
      (score.finalScore + omenScore.scoreBonus) *
        (omenScore.multBonus > 0 ? omenScore.multBonus : 1) *
        (1 + passiveOmenMult)
    )
    this.state.omenSystem.recordHandPlayed()
  }

  private applyPlayedTileMandates(
    tileIds: string[],
    yakuIds: string[],
    effects: Effect[]
  ): void {
    const previousCounts = new Map(this.state.yakuPlayCounts)
    this.state.mandateEffectSystem.onHandPlayed(
      tileIds,
      this.state.decreeSystem.getOwnedDecrees()
    )

    const goldPerTile = this.state.mandateEffectSystem.getGoldPenaltyPerTile()
    if (goldPerTile > 0) {
      this.changeGold(-goldPerTile * tileIds.length, 'The Tooth', effects)
    }

    if (this.state.mandateEffectSystem.shouldZeroGoldForMostPlayedYaku()) {
      const mostPlayedCount = Math.max(0, ...previousCounts.values())
      const mostPlayedYaku = new Set(
        [...previousCounts.entries()]
          .filter(([, count]) => count === mostPlayedCount && count > 0)
          .map(([id]) => id)
      )
      if (yakuIds.some((id) => mostPlayedYaku.has(id))) {
        this.changeGold(-this.state.gold, 'The Ox', effects)
      }
    }

    for (const yakuId of yakuIds) {
      this.state.yakuPlayCounts.set(
        yakuId,
        (this.state.yakuPlayCounts.get(yakuId) ?? 0) + 1
      )
      this.state.currentRoundYakuIds.add(yakuId)
    }
  }

  /**
   * Execute redraw action
   */
  private executeRedraw(tileIds: string[], effects: Effect[]): ActionResult {
    if (tileIds.some((tileId) => this.state.mandateEffectSystem.isTileLocked(tileId))) {
      return {
        success: false,
        effects,
        errors: ['Locked tiles cannot be redrawn'],
      }
    }

    // Remove selected tiles
    const removedTiles: Tile[] = []
    const previousTileIds = new Set(this.state.handTiles.map((tile) => tile.id))
    for (const tileId of tileIds) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (idx !== -1) {
        removedTiles.push(this.state.handTiles[idx])
        this.state.handTiles.splice(idx, 1)
        this.state.selectedTileIds.delete(tileId)
        this.state.faceDownTileIds.delete(tileId)
      }
    }

    // Draw replacements
    for (let i = 0; i < removedTiles.length; i++) {
      const tile = this.drawTileInternal()
      if (tile) {
        if (tile.isFlower || tile.isSeason) {
          this.handleBonusTile(tile)
        } else {
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

    for (const tile of removedTiles) previousTileIds.delete(tile.id)
    this.applyMandateDrawState(
      this.state.handTiles.filter((tile) => !previousTileIds.has(tile.id)),
      effects
    )

    this.enforcePlayability(effects)

    return { success: true, effects }
  }

  /** Apply mandate effects that resolve after one completed draw cycle. */
  private applyPostDrawMandate(drawnTile: Tile, effects: Effect[]): void {
    const mandateResult = this.state.mandateEffectSystem.onDraw(
      this.state.handTiles,
      drawnTile
    )

    for (const tileId of mandateResult.discardedTileIds) {
      const index = this.state.handTiles.findIndex((tile) => tile.id === tileId)
      if (index === -1) continue
      const [tile] = this.state.handTiles.splice(index, 1)
      this.state.discards.push(tile)
      this.state.selectedTileIds.delete(tile.id)
      this.state.faceDownTileIds.delete(tile.id)
      effects.push({
        type: 'tile_removed',
        description: `Boss Mandate discarded ${tile.displayName}`,
        tileId: tile.id,
      })
      eventBus.emit('tileDiscarded', {
        tileId: tile.id,
        toDeadPool: true,
      })
    }

    if (mandateResult.lockedTileId) {
      effects.push({
        type: 'consumable_effect',
        description: `Boss Mandate locked ${mandateResult.lockedTileId}`,
      })
    }
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
    this.state.previousRoundYakuIds = new Set()
    this.state.currentRoundYakuIds.clear()

    for (let i = 0; i < skipResult.decreeSlotBonus; i++) {
      this.state.decreeSystem.addSlot()
    }
    if (skipResult.immediateDecreeEdition) {
      const edition = this.normalizeDecreeEdition(skipResult.immediateDecreeEdition)
      if (edition) this.applyRandomDecreeEdition(edition)
    }

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
      omenTagGranted: skipResult.omen?.id,
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
    const sealIndex = this.state.fateSeals.findIndex(
      (seal) => seal.instanceId === sealId || seal.id === sealId
    )
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

    const selectionError = this.validateConsumableSelection(
      seal.effect.requiresSelection,
      seal.effect.selectionCount,
      selectedTiles.length
    )
    if (selectionError) {
      return { success: false, effects, errors: [selectionError] }
    }

    const context: FateSealContext = {
      selectedTiles,
      currentGold: this.state.gold,
      totalDecreeSellValue: this.state.decreeSystem.getOwnedDecrees().reduce(
        (sum, d) => sum + (d.sellValue ?? Math.floor(d.cost / 2)),
        0
      ),
      currentHand: this.state.handTiles,
      currentMelds: this.state.melds,
      // The Seal itself leaves inventory when the effect resolves.
      getAvailableSlots: () =>
        seal.id === 'seal_of_judgment' || seal.id === 'seal_of_the_immortal'
          ? this.state.decreeSystem.getAvailableSlots()
          : Math.max(
              0,
              this.getConsumableCapacity() - this.getTotalConsumableCount() + 1
            ),
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
    this.state.consumableSystem.markFateSealUsed()

    // Apply the system's effect descriptors to authoritative run state.
    for (const effectResult of result.effects) {
      this.applyFateSealEffect(seal, effectResult, effects)
      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }

    eventBus.emit('fateSealUsed', {
      sealId: seal.id,
      effect: seal.effect.description,
    })

    // Inspecting a tile through a consumable reveals it for the rest of the
    // current hand, as specified by the hidden-information rules.
    for (const tile of selectedTiles) {
      this.state.faceDownTileIds.delete(tile.id)
    }

    return { success: true, effects }
  }

  /** Use a held Celestial Orb and apply its permanent yaku upgrade. */
  private executeUseOrb(orbId: string, effects: Effect[]): ActionResult {
    const orbIndex = this.state.celestialOrbs.findIndex(
      (orb) => orb.instanceId === orbId || orb.id === orbId
    )
    if (orbIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Orb not found in inventory'],
      }
    }

    const orb = this.state.celestialOrbs[orbIndex]
    const result = this.state.celestialOrbSystem.useOrb(orb)
    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    this.state.celestialOrbs.splice(orbIndex, 1)
    this.state.fateSealSystem.setLastUsedConsumable(orb)
    for (const effectResult of result.effects) {
      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }

    eventBus.emit('celestialOrbUsed', {
      orbId: orb.id,
      yakuCategory: orb.effect.targetYaku,
      newLevel:
        orb.effect.targetYaku === 'All'
          ? 0
          : this.state.celestialOrbSystem.getYakuLevel(orb.effect.targetYaku),
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
    const scriptIndex = this.state.voidScripts.findIndex(
      (script) => script.instanceId === scriptId || script.id === scriptId
    )
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

    const selectionError = this.validateConsumableSelection(
      script.effect.requiresSelection,
      script.effect.selectionCount,
      selectedTiles.length
    )
    if (selectionError) {
      return { success: false, effects, errors: [selectionError] }
    }

    const context: VoidScriptContext = {
      selectedTiles,
      currentGold: this.state.gold,
      currentHand: this.state.handTiles,
      getAvailableDecreeSlots: () => this.state.decreeSystem.getAvailableSlots(),
      getDecreeCount: () => this.state.decreeSystem.getOwnedDecrees().length,
    }

    // Omen protection is checked before execution but consumed only after a
    // successful Script, so a failed target selection cannot waste it.
    const downsideProtected = this.state.omenSystem.hasVoidScriptDownsideProtection()
    const scriptToUse: VoidScript = downsideProtected
      ? {
          ...script,
          penalty: {
            type: 'none',
            description: 'Downside negated by Omen',
          },
        }
      : script

    const result = this.state.voidScriptSystem.useScript(scriptToUse, context)

    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    // Remove the script from inventory
    this.state.voidScripts.splice(scriptIndex, 1)
    this.state.consumableSystem.markVoidScriptUsed()
    this.state.fateSealSystem.setLastUsedConsumable(script)

    if (downsideProtected) {
      this.state.omenSystem.triggerVoidScriptOmens()
      effects.push({
        type: 'consumable_effect',
        description: 'Omen negated the Void Script downside',
      })
    }

    this.applyVoidScriptEffects(script, result.effects, effects)
    for (const effectResult of result.effects) {
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

    for (const tile of selectedTiles) {
      this.state.faceDownTileIds.delete(tile.id)
    }

    return { success: true, effects }
  }

  private validateConsumableSelection(
    requiresSelection: boolean | undefined,
    selectionCount: number | undefined,
    selectedCount: number
  ): string | null {
    if (!requiresSelection) return null

    const required = selectionCount ?? 1
    return selectedCount === required
      ? null
      : `Select exactly ${required} tile${required === 1 ? '' : 's'}`
  }

  private getTotalConsumableCount(): number {
    return (
      this.state.fateSeals.length +
      this.state.celestialOrbs.length +
      this.state.voidScripts.length
    )
  }

  private applyFateSealEffect(
    seal: FateSeal,
    result: ConsumableEffectResult,
    effects: Effect[]
  ): void {
    const tileIds = result.affectedTiles ?? []

    switch (result.type) {
      case 'enhancement_applied':
        if (typeof result.value === 'string') {
          this.transformTiles(tileIds, (tile) =>
            tile.withEnhancement(result.value as EnhancementType)
          )
        }
        break
      case 'wild_conversion':
        this.transformTiles(tileIds, (tile) => tile.withEnhancement(EnhancementType.Wild))
        break
      case 'suit_conversion':
        if (typeof result.value === 'string') {
          this.transformTiles(tileIds, (tile) =>
            tile.isSuited
              ? new Tile(
                  result.value as TileSuit,
                  tile.rank,
                  tile.id,
                  tile.isRed,
                  tile.modifiers
                )
              : tile
          )
        }
        break
      case 'rank_modified':
        if (typeof result.value === 'number') {
          const rankChange = result.value
          this.transformTiles(tileIds, (tile) =>
            tile.isSuited
              ? new Tile(
                  tile.suit,
                  tile.rank + rankChange,
                  tile.id,
                  tile.isRed,
                  tile.modifiers
                )
              : tile
          )
        }
        break
      case 'tiles_destroyed':
        this.destroyTiles(tileIds, effects)
        break
      case 'tile_copied': {
        const [targetId, sourceId] = tileIds
        const source = this.state.handTiles.find((tile) => tile.id === sourceId)
        if (targetId && source) {
          this.replaceTileById(
            targetId,
            new Tile(source.suit, source.rank, targetId, source.isRed, source.modifiers)
          )
        }
        break
      }
      case 'gold_generated':
        if (typeof result.value === 'number') {
          this.changeGold(result.value, seal.name, effects)
        }
        break
      case 'consumable_created':
        this.createFromFateSeal(seal, Number(result.value ?? 1), effects)
        break
      case 'consumable_duplicated':
        if (typeof result.value === 'string') {
          this.duplicateConsumable(result.value, effects)
        }
        break
      case 'all_yaku_upgraded':
        this.upgradeAllYaku()
        break
      case 'edition_applied':
        if (tileIds.length > 0 && typeof result.value === 'string') {
          this.transformTiles(tileIds, (tile) =>
            tile.withEdition(result.value as EditionType)
          )
        } else if (typeof result.value === 'string') {
          const edition = this.normalizeDecreeEdition(result.value)
          if (edition) this.applyRandomDecreeEdition(edition)
        }
        break
    }
  }

  private applyVoidScriptEffects(
    script: VoidScript,
    results: ConsumableEffectResult[],
    effects: Effect[]
  ): void {
    let copiedDecreeId: string | null = null

    for (const result of results) {
      const tileIds = result.affectedTiles ?? []

      switch (result.type) {
        case 'tiles_destroyed':
          this.destroyTiles(
            tileIds.length > 0
              ? tileIds
              : this.pickRandomHandTileIds(Number(result.value ?? 1)),
            effects
          )
          break
        case 'tile_destroyed':
          this.destroyTiles(this.pickRandomHandTileIds(1), effects)
          break
        case 'tiles_created':
          for (let i = 0; i < Number(result.value ?? 1); i++) {
            this.addCreatedTile(this.createVoidTile(script.effect.createType))
          }
          break
        case 'tile_duplicated': {
          const source = this.state.handTiles.find((tile) => tile.id === tileIds[0])
          if (source) {
            for (let i = 0; i < Number(result.value ?? 1); i++) {
              this.addCreatedTile(
                new Tile(
                  source.suit,
                  source.rank,
                  this.nextRuntimeTileId(),
                  source.isRed,
                  source.modifiers
                )
              )
            }
          }
          break
        }
        case 'seal_applied':
          if (typeof result.value === 'string') {
            this.transformTiles(tileIds, (tile) =>
              tile.withSeal(result.value as SealType)
            )
          }
          break
        case 'edition_applied':
          if (typeof result.value === 'string') {
            this.transformTiles(tileIds, (tile) =>
              tile.withEdition(result.value as EditionType)
            )
          }
          break
        case 'edition_applied_decree':
          if (typeof result.value === 'string') {
            const edition = this.normalizeDecreeEdition(result.value)
            if (edition) this.applyRandomDecreeEdition(edition)
          }
          break
        case 'suit_conversion':
          if (typeof result.value === 'string') {
            this.transformTiles(
              this.state.handTiles.map((tile) => tile.id),
              (tile) =>
                tile.isSuited
                  ? new Tile(
                      result.value as TileSuit,
                      tile.rank,
                      tile.id,
                      tile.isRed,
                      tile.modifiers
                    )
                  : tile
            )
          }
          break
        case 'rank_conversion':
          if (typeof result.value === 'number') {
            this.transformTiles(
              this.state.handTiles.map((tile) => tile.id),
              (tile) =>
                tile.isSuited
                  ? new Tile(
                      tile.suit,
                      result.value as number,
                      tile.id,
                      tile.isRed,
                      tile.modifiers
                    )
                  : tile
            )
          }
          break
        case 'gold_gained':
          if (typeof result.value === 'number') {
            this.changeGold(result.value, script.name, effects)
          }
          break
        case 'gold_lost':
          this.changeGold(-this.state.gold, script.name, effects)
          break
        case 'decree_created':
          this.createRandomDecree('ImperialDecree')
          break
        case 'legendary_decree_created':
          this.createRandomDecree('HeavenlyOrdinance')
          break
        case 'negative_edition_applied':
          this.applyRandomDecreeEdition('Negative')
          break
        case 'decree_copied':
          copiedDecreeId = this.copyRandomDecree()
          break
        case 'decrees_destroyed':
          this.destroyOtherDecrees(copiedDecreeId)
          break
        case 'all_yaku_upgraded':
          this.upgradeAllYaku()
          break
        case 'hand_size_reduced':
          this.trimHandToLimit(effects)
          break
        case 'tile_locked': {
          const [lockedId] = this.pickRandomHandTileIds(1)
          if (lockedId) this.moveHandTileToDeadPool(lockedId, effects)
          break
        }
      }
    }
  }

  private transformTiles(tileIds: string[], transform: (tile: Tile) => Tile): void {
    for (const tileId of tileIds) {
      const tile = this.state.handTiles.find((candidate) => candidate.id === tileId)
      if (tile) this.replaceTileById(tileId, transform(tile))
    }
    this.state.handTiles.sort(Tile.compare)
  }

  private replaceTileById(tileId: string, replacement: Tile): void {
    const replace = (tiles: Tile[]) =>
      tiles.map((tile) => (tile.id === tileId ? replacement : tile))

    this.state.handTiles = replace(this.state.handTiles)
    this.state.wallTemplate = replace(this.state.wallTemplate)
    this.state.wall = replace(this.state.wall)
    this.state.deadWall = replace(this.state.deadWall)
    this.state.discards = replace(this.state.discards)
  }

  private destroyTiles(tileIds: string[], effects: Effect[]): void {
    for (const tileId of new Set(tileIds)) {
      const tile = this.state.handTiles.find((candidate) => candidate.id === tileId)
      if (!tile) continue

      this.removeTileEverywhere(tileId)
      effects.push({
        type: 'tile_removed',
        description: `Destroyed ${tile.displayName}`,
        tileId,
      })
    }
  }

  private removeTileEverywhere(tileId: string): void {
    const wallIndex = this.state.wall.findIndex((tile) => tile.id === tileId)
    if (wallIndex !== -1) {
      this.state.wall.splice(wallIndex, 1)
      if (wallIndex < this.state.drawIndex) this.state.drawIndex--
    }

    this.state.handTiles = this.state.handTiles.filter((tile) => tile.id !== tileId)
    this.state.wallTemplate = this.state.wallTemplate.filter((tile) => tile.id !== tileId)
    this.state.deadWall = this.state.deadWall.filter((tile) => tile.id !== tileId)
    this.state.discards = this.state.discards.filter((tile) => tile.id !== tileId)
    this.state.selectedTileIds.delete(tileId)
    this.state.faceDownTileIds.delete(tileId)
  }

  private pickRandomHandTileIds(count: number): string[] {
    const candidates = [...this.state.handTiles]
    const selected: string[] = []

    while (selected.length < count && candidates.length > 0) {
      const index = Math.floor(Math.random() * candidates.length)
      selected.push(candidates.splice(index, 1)[0].id)
    }

    return selected
  }

  private nextRuntimeTileId(): string {
    return `runtime_${this.state.seed}_${this.runtimeItemCounter++}`
  }

  private createVoidTile(createType: string | undefined): Tile {
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    let tile: Tile

    if (createType === 'face') {
      if (Math.random() < 0.5) {
        tile = Tile.createWind(
          (Math.floor(Math.random() * 4) + 1) as WindType,
          this.nextRuntimeTileId()
        )
      } else {
        tile = Tile.createDragon(
          (Math.floor(Math.random() * 3) + 1) as DragonType,
          this.nextRuntimeTileId()
        )
      }
    } else {
      const suit = suits[Math.floor(Math.random() * suits.length)]
      const rank =
        createType === 'terminal'
          ? Math.random() < 0.5
            ? 1
            : 9
          : Math.floor(Math.random() * 7) + 2
      tile = new Tile(suit, rank, this.nextRuntimeTileId())
    }

    const enhancements = [
      EnhancementType.Bonus,
      EnhancementType.Mult,
      EnhancementType.Lucky,
    ]
    return tile.withEnhancement(
      enhancements[Math.floor(Math.random() * enhancements.length)]
    )
  }

  private addCreatedTile(tile: Tile): void {
    this.state.handTiles.push(tile)
    this.state.wallTemplate.push(tile)
    this.state.handTiles.sort(Tile.compare)
  }

  private moveHandTileToDeadPool(tileId: string, effects: Effect[]): void {
    const index = this.state.handTiles.findIndex((tile) => tile.id === tileId)
    if (index === -1) return

    const [tile] = this.state.handTiles.splice(index, 1)
    this.state.discards.push(tile)
    this.state.selectedTileIds.delete(tileId)
    this.state.faceDownTileIds.delete(tileId)
    effects.push({
      type: 'tile_removed',
      description: `Locked ${tile.displayName} in the Dead Pool`,
      tileId,
    })
  }

  private trimHandToLimit(effects: Effect[]): void {
    while (this.state.handTiles.length > this.getHandSizeLimit()) {
      const [tileId] = this.pickRandomHandTileIds(1)
      if (!tileId) break
      this.moveHandTileToDeadPool(tileId, effects)
    }
  }

  private changeGold(delta: number, reason: string, effects: Effect[]): void {
    if (delta === 0) return
    // Philosopher's Stone doubles gold gained; penalties are untouched, so a
    // gold multiplier can never deepen a loss.
    const amount =
      delta > 0
        ? Math.floor(delta * this.state.decreeSystem.getGoldMultiplier())
        : delta
    const previousGold = this.state.gold
    this.state.gold = Math.max(0, this.state.gold + amount)
    const actualDelta = this.state.gold - previousGold

    effects.push({
      type: 'gold_changed',
      description: `${reason} changed gold by ${actualDelta}`,
      delta: actualDelta,
      newTotal: this.state.gold,
    })
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: actualDelta,
      reason,
    })
  }

  private createFromFateSeal(seal: FateSeal, count: number, effects: Effect[]): void {
    if (seal.id === 'seal_of_judgment') {
      for (let i = 0; i < count; i++) this.createRandomDecree()
      return
    }

    if (seal.id === 'seal_of_the_immortal') {
      for (let i = 0; i < count; i++) this.createRandomDecree('HeavenlyOrdinance')
      return
    }

    const type = seal.effect.consumableType
    if (!type) return
    for (let i = 0; i < count; i++) this.createRandomConsumable(type, effects)
  }

  private createRandomConsumable(type: ConsumableType, effects: Effect[]): boolean {
    if (!this.canAddConsumable()) return false

    let consumable: BaseConsumable | null = null
    if (type === 'FateSeal') {
      const definition = FateSealSystem.getRandomFateSeal()
      if (definition) consumable = FateSealSystem.createFateSealInstance(definition)
    } else if (type === 'CelestialOrb') {
      const definition = CelestialOrbSystem.getRandomCelestialOrb()
      if (definition) consumable = CelestialOrbSystem.createCelestialOrbInstance(definition)
    } else {
      const definition = VoidScriptSystem.getRandomVoidScript()
      if (definition) consumable = VoidScriptSystem.createVoidScriptInstance(definition)
    }

    if (!consumable) return false
    const added =
      consumable.type === 'FateSeal'
        ? this.addFateSeal(consumable as FateSeal, 'generated')
        : consumable.type === 'CelestialOrb'
          ? this.addCelestialOrb(consumable as CelestialOrb, 'generated')
          : this.addVoidScript(consumable as VoidScript, 'generated')

    if (added) {
      effects.push({
        type: 'consumable_effect',
        description: `Created ${consumable.name}`,
      })
    }
    return added
  }

  private duplicateConsumable(definitionId: string, effects: Effect[]): boolean {
    const fateDefinition = Object.values(FATE_SEALS).find(
      (definition) => definition.id === definitionId
    )
    if (fateDefinition) {
      return this.addFateSeal(
        FateSealSystem.createFateSealInstance(fateDefinition),
        'generated'
      )
    }

    const orbDefinition = Object.values(CELESTIAL_ORBS).find(
      (definition) => definition.id === definitionId
    )
    if (orbDefinition) {
      return this.addCelestialOrb(
        CelestialOrbSystem.createCelestialOrbInstance(orbDefinition),
        'generated'
      )
    }

    const scriptDefinition = Object.values(VOID_SCRIPTS).find(
      (definition) => definition.id === definitionId
    )
    const duplicated = scriptDefinition
      ? this.addVoidScript(
          VoidScriptSystem.createVoidScriptInstance(scriptDefinition),
          'generated'
        )
      : false

    if (duplicated) {
      effects.push({
        type: 'consumable_effect',
        description: `Duplicated ${definitionId}`,
      })
    }
    return duplicated
  }

  private createRandomDecree(
    rarity?: 'ImperialDecree' | 'HeavenlyOrdinance'
  ): boolean {
    const pool = rarity
      ? ALL_DECREES.filter((decree) => decree.rarity === rarity)
      : ALL_DECREES
    if (pool.length === 0) return false
    const decree = pool[Math.floor(Math.random() * pool.length)]
    return this.addDecree(decree, 'generated')
  }

  private normalizeDecreeEdition(value: string): DecreeEdition | null {
    switch (value.toLowerCase()) {
      case 'foil':
        return 'Foil'
      case 'holographic':
      case 'holo':
        return 'Holographic'
      case 'polychrome':
      case 'prismatic':
        return 'Polychrome'
      case 'negative':
        return 'Negative'
      default:
        return null
    }
  }

  private applyRandomDecreeEdition(edition: DecreeEdition): boolean {
    const decrees = this.state.decreeSystem.getOwnedDecrees()
    if (decrees.length === 0) return false
    const decree = decrees[Math.floor(Math.random() * decrees.length)]
    return this.state.decreeSystem.applyEdition(decree.id, edition)
  }

  private copyRandomDecree(): string | null {
    const decrees = this.state.decreeSystem.getOwnedDecrees()
    if (decrees.length === 0 || this.state.decreeSystem.getAvailableSlots() <= 0) {
      return null
    }

    const decree = decrees[Math.floor(Math.random() * decrees.length)]
    return this.state.decreeSystem.acquireDecree(decree) ? decree.id : null
  }

  private destroyOtherDecrees(keepId: string | null): void {
    if (!keepId) return
    for (const decree of this.state.decreeSystem.getOwnedDecrees()) {
      if (decree.id !== keepId) this.state.decreeSystem.removeDecree(decree.id)
    }
  }

  private upgradeAllYaku(): void {
    const blackHole = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.black_hole_orb
    )
    this.state.celestialOrbSystem.useOrb(blackHole)
  }

  private transmuteHonorsToDominantSuit(tiles: Tile[]): Tile[] {
    const suitedCounts = new Map<TileSuit, number>([
      [TileSuit.Manzu, 0],
      [TileSuit.Pinzu, 0],
      [TileSuit.Souzu, 0],
    ])
    for (const tile of tiles) {
      if (tile.isSuited) {
        suitedCounts.set(tile.suit, (suitedCounts.get(tile.suit) ?? 0) + 1)
      }
    }
    const dominantSuit = [...suitedCounts.entries()].reduce(
      (dominant, candidate) =>
        candidate[1] > dominant[1] ? candidate : dominant,
      [TileSuit.Manzu, -1] as [TileSuit, number]
    )[0]

    return tiles.map((tile) =>
      tile.isHonor
        ? new Tile(
            dominantSuit,
            tile.rank,
            tile.id,
            tile.isRed,
            tile.modifiers
          )
        : tile
    )
  }

  /**
   * Calculate score for a played selection.
   *
   * `partialMelds` is supplied when the selection is not a complete winning
   * hand. Partial plays earn no yaku, but every other layer - tile modifiers,
   * Decrees, Flowers, Seasons, Celestial Orbs, Mandates - applies exactly as it
   * does for a complete hand.
   */
  private calculateHandScore(
    tiles: Tile[],
    parsedHand: ParsedHand,
    partialMelds?: Meld[],
    preview: boolean = false
  ): ScoreBreakdown {
    // Build the full ScoringContext for system integrations
    const roundState = this.state.roundManager.getCurrentRound()

    const systemContext: SystemScoringContext = {
      hand: parsedHand,
      tiles,
      melds: parsedHand.melds,
      decrees: this.state.decreeSystem
        .getOwnedDecrees()
        .filter(
          (decree) => !this.state.mandateEffectSystem.isDecreeDisabled(decree.id)
        ),
      flowers: this.state.flowerSystem.getCollection(),
      season: this.state.seasonSystem.getState(),
      round: {
        actNumber: this.state.currentAct,
        roundNumber: this.state.currentRound,
        roundType: roundState?.roundType ?? 'Small',
        scoreTarget: this.state.targetScore,
        currentScore: this.state.score,
        handsPlayed: this.state.handsAllowance - this.state.handsRemaining,
        maxHands: this.state.handsAllowance,
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

    // Calculate flower bonus with season suppression check. Eternal Garden's
    // protection outranks the Season that would otherwise silence Flowers -
    // Court authority overriding Heaven is the one exception the hierarchy
    // grants a Decree.
    const flowersProtected = this.isDecreeRuleActive('flowers_protected')
    const flowerBonus =
      seasonModifiers.flowersSuppressed && !flowersProtected
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

    // Transmuter rewrites simples into terminals before anything is counted,
    // so every downstream layer sees the promoted tiles.
    const scoredTiles = this.isDecreeRuleActive('simples_as_terminals')
      ? tiles.map((tile) => promoteSimpleToTerminal(tile))
      : tiles

    // Create scoring context with system bonuses
    const context = createScoringContext(scoredTiles, parsedHand, {
      isConcealed: true,
      isTsumo: true,
      additiveBonus: 0,
      multiplicativeBonus: flowerBonus * seasonModifiers.scoreMultiplier,
      debuffedTileIds: this.state.debuffSystem.getDebuffedTileIds(),
      tanyaoAllowsTerminals: this.isDecreeRuleActive('tanyao_terminals'),
      partialMelds,
      previewMode: preview,
      extraRetriggers: this.state.decreeSystem.calculateRetriggers(scoredTiles),
    })

    // Calculate base score
    const baseBreakdown = calculateScore(context)
    systemContext.yakuMultipliers = new Map(
      baseBreakdown.detectedYaku.map((yaku) => [
        yaku.definition.id,
        this.state.previousRoundYakuIds.has(yaku.definition.id) ? 1 : 0,
      ])
    )

    const mandateScoring = this.state.mandateEffectSystem.applyToScoring({
      basePoints: baseBreakdown.basePoints,
      multiplier: baseBreakdown.yakuMultiplier,
      yakuIds: baseBreakdown.detectedYaku.map((yaku) => yaku.definition.id),
      yakuTiers: new Map(
        baseBreakdown.detectedYaku.map((yaku) => [
          yaku.definition.id,
          yaku.definition.tier,
        ])
      ),
    })
    const allowedYakuIds = new Set(mandateScoring.yakuIds)
    baseBreakdown.detectedYaku = baseBreakdown.detectedYaku.filter((yaku) =>
      allowedYakuIds.has(yaku.definition.id)
    )
    baseBreakdown.basePoints = mandateScoring.basePoints
    // Yaku Nexus scores each yaku as if it ranked higher; Yaku Amplifier scales
    // the combined multiplier. Both are Court authority over Grammar.
    const yakuDecreeModifiers = this.state.decreeSystem.getYakuModifiers()
    baseBreakdown.yakuMultiplier = baseBreakdown.detectedYaku.reduce(
      (multiplier, yaku) => {
        const adjustedTier = mandateScoring.yakuTiers.get(yaku.definition.id)
        if (
          adjustedTier !== undefined &&
          adjustedTier < yaku.definition.tier
        ) {
          const tierRatio = adjustedTier / yaku.definition.tier
          return multiplier * (1 + (yaku.definition.multiplier - 1) * tierRatio)
        }
        if (yakuDecreeModifiers.tierBonus > 0) {
          // A tier is worth its share of the yaku's own multiplier, so a tier
          // bonus lifts weak yaku by the same proportion it lifts strong ones.
          const boostedTier = yaku.definition.tier + yakuDecreeModifiers.tierBonus
          const tierRatio = boostedTier / yaku.definition.tier
          return multiplier * (1 + (yaku.definition.multiplier - 1) * tierRatio)
        }
        return multiplier * yaku.definition.multiplier
      },
      1
    )
    if (baseBreakdown.detectedYaku.length > 0) {
      baseBreakdown.yakuMultiplier *= yakuDecreeModifiers.multiplier
    }
    if (this.state.roundManager.checkMandateEffect('halve_score').active) {
      baseBreakdown.yakuMultiplier *= 0.5
    }

    // Apply celestial orb bonuses for each detected yaku
    for (const detectedYaku of baseBreakdown.detectedYaku) {
      const category = yakuToCategoryMap[detectedYaku.definition.id]
      if (category) {
        const orbBonus = this.state.celestialOrbSystem.calculateYakuBonus(category)
        celestialOrbMultBonus += orbBonus.mult
        celestialOrbChipsBonus += orbBonus.chips

        // Trigger yaku for leveling (a preview must not advance progression)
        if (!preview) {
          this.state.celestialOrbSystem.triggerYaku(category)
        }
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

    // Calculate final score with all multipliers
    // Formula: (Base + Additive + CelestialChips) * (Yaku + CelestialMult) * Flower * Season * Decree * Mandate - Decay
    const subtotal = baseBreakdown.basePoints + decreeModifiedBreakdown.additiveBonus + celestialOrbChipsBonus
    const finalMultiplier =
      (decreeModifiedBreakdown.yakuMultiplier + celestialOrbMultBonus) *
      flowerBonus *
      seasonModifiers.scoreMultiplier *
      finalDecreeMultiplier *
      Math.pow(
        this.state.charterSystem.calculateEffects().orbMultiplier,
        this.state.celestialOrbs.length
      )

    const calculatedFinalScore = Math.max(
      0,
      Math.floor(subtotal * finalMultiplier * this.state.lossPreventionScorePenalty) -
        decayPenalty
    )

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
   * End the round when the player still has hands left but no legal play.
   *
   * A drained wall can leave the hand below the minimum a play requires. That
   * is mahjong's exhaustive draw: with no way left to score, the round is over
   * rather than stuck waiting for an action the player cannot take.
   */
  private enforcePlayability(effects: Effect[]): void {
    if (this.state.phase !== 'gameplay' || !this.state.isRunActive) return
    if (this.canMakeLegalPlay()) return

    if (this.state.score >= this.state.targetScore) {
      this.handleRoundWin(effects)
      return
    }

    effects.push({
      type: 'round_state_changed' as const,
      description: 'Wall exhausted - no legal play remains',
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
    })
    this.handleRoundLoss(effects)
  }

  /**
   * Let a loss-preventing Decree rescue the round.
   *
   * The round is treated as cleared and the run continues into the Tea House.
   * A single-use Decree (Phoenix) is spent doing it; a permanent one (Immortal
   * Decree) survives but applies its score penalty for the rest of the run.
   *
   * Returns true when the loss was prevented.
   */
  private tryPreventLoss(effects: Effect[]): boolean {
    const savers = this.state.decreeSystem.getLossPreventionDecrees()
    if (savers.length === 0) return false

    // Prefer a permanent saver so a one-shot is not burned unnecessarily.
    const permanent = savers.find((decree) =>
      this.lossPreventionRule(decree)?.consumedOnUse === false
    )
    const saver = permanent ?? savers[0]
    const rule = this.lossPreventionRule(saver)
    if (!rule) return false

    if (typeof rule.scorePenalty === 'number') {
      this.state.lossPreventionScorePenalty = rule.scorePenalty
    }

    if (rule.consumedOnUse) {
      this.state.decreeSystem.removeDecree(saver.id)
      effects.push({
        type: 'decree_triggered',
        description: `${saver.name} prevented the loss and was consumed`,
      })
    } else {
      effects.push({
        type: 'decree_triggered',
        description: `${saver.name} prevented the loss`,
      })
    }

    eventBus.emit('decreeTriggered', {
      decreeId: saver.id,
      effect: 'loss prevented',
    })

    // Treat the round as cleared so the run continues through the Tea House.
    this.state.score = Math.max(this.state.score, this.state.targetScore)
    this.handleRoundWin(effects)
    return true
  }

  /** The prevent_loss rule carried by a Decree, if it has one. */
  private lossPreventionRule(
    decree: Decree
  ): { consumedOnUse?: boolean; scorePenalty?: number } | null {
    const effects = decree.extraEffects
      ? [decree.effect, ...decree.extraEffects]
      : [decree.effect]

    for (const effect of effects) {
      if (effect.type !== 'rule_modification') continue
      if (effect.ruleId !== 'prevent_loss') continue
      return effect.modification as { consumedOnUse?: boolean; scorePenalty?: number }
    }

    return null
  }

  /** Destroy Decrees that do not survive a lost Boss round (Glass Cannon). */
  private destroyBossLossDecrees(effects: Effect[]): void {
    const roundState = this.state.roundManager.getCurrentRound()
    if (roundState?.roundType !== 'Boss') return

    for (const decree of this.state.decreeSystem.getOwnedDecrees()) {
      const doomed = (
        decree.extraEffects ? [decree.effect, ...decree.extraEffects] : [decree.effect]
      ).some(
        (effect) =>
          effect.type === 'rule_modification' &&
          effect.ruleId === 'destroy_on_boss_loss'
      )
      if (!doomed) continue

      this.state.decreeSystem.removeDecree(decree.id)
      effects.push({
        type: 'decree_triggered',
        description: `${decree.name} shattered with the lost Boss round`,
      })
    }
  }

  /** Whether any selection of the current hand could still be played. */
  private canMakeLegalPlay(): boolean {
    const available = this.state.handTiles.length
    if (available < 2) return false

    const fixedHandMandate = this.state.roundManager.checkMandateEffect('fixed_hand_size')
    if (
      fixedHandMandate.active &&
      typeof fixedHandMandate.value === 'number' &&
      available < fixedHandMandate.value
    ) {
      return false
    }

    return true
  }

  /**
   * Handle round win
   */
  private handleRoundWin(effects: Effect[]): void {
    // Capture the completed round before RoundManager advances its cursor.
    const completedRound = this.state.roundManager.getCurrentRound()
    this.state.roundManager.submitScore(this.state.score)
    if (!completedRound) return

    const roundState = completedRound
    let goldReward = 0

    if (roundState) {
      switch (roundState.roundType) {
        case 'Small':
          goldReward = this.state.roundManager.getStakeModifiers().noSmallRoundReward ? 0 : 3
          break
        case 'Large':
          goldReward = 5
          break
        case 'Boss':
          goldReward = 10
          break
      }
    }

    // Interest is calculated before payout, with Charter-modified caps.
    const interestCap =
      this.state.charterSystem.calculateEffects().interestCap +
      this.state.omenSystem.getInterestCapBonus()
    const goldHeldForInterest = this.state.gold
    const interest = this.state.omenSystem.isInterestBlocked()
      ? 0
      : this.state.roundManager.calculateInterest(goldHeldForInterest, interestCap)
    const decreeGold = this.state.decreeSystem.calculateRoundEndGold()
    const heldGoldMarkReward = this.state.handTiles.filter(
      (tile) => tile.modifiers.enhancement === EnhancementType.Gold
    ).length * 3
    const rentalCost = this.state.decreeSystem.calculateRentalCosts()
    // Philosopher's Stone doubles what the round pays in, before the costs it
    // charges out.
    const goldMultiplier = this.state.decreeSystem.getGoldMultiplier()
    const grossGold = Math.floor(
      (goldReward + interest + decreeGold + heldGoldMarkReward) * goldMultiplier
    )
    const netGoldChange = grossGold - rentalCost

    const goldBefore = this.state.gold
    this.state.gold += netGoldChange
    this.state.omenSystem.onRoundEnd()

    const upcomingRound = this.state.roundManager.getCurrentRound()
    const hasUpcomingRound =
      upcomingRound !== null &&
      (upcomingRound.actNumber !== roundState.actNumber ||
        upcomingRound.roundNumber !== roundState.roundNumber)
    this.state.lastRoundSummary = {
      actNumber: roundState.actNumber,
      roundNumber: roundState.roundNumber,
      roundType: roundState.roundType,
      score: this.state.score,
      target: this.state.targetScore,
      baseReward: goldReward,
      interest,
      decreeGold,
      heldGoldMarkReward,
      rentalCost,
      netGoldChange,
      goldBefore,
      goldAfter: this.state.gold,
      nextRoundType: hasUpcomingRound ? upcomingRound.roundType : null,
      nextTarget: hasUpcomingRound ? upcomingRound.scoreTarget : null,
    }

    eventBus.emit('roundEnd', {
      won: true,
      score: this.state.score,
      target: this.state.targetScore,
    })

    eventBus.emit('goldChanged', {
      previousGold: this.state.gold - netGoldChange,
      newGold: this.state.gold,
      delta: netGoldChange,
      reason: 'Round payout, interest, and Decree effects',
    })

    if (interest > 0) {
      eventBus.emit('interestEarned', {
        amount: interest,
        goldHeld: goldHeldForInterest,
      })
    }

    effects.push({
      type: 'gold_changed',
      description: `Round economy changed gold by ${netGoldChange}`,
      delta: netGoldChange,
      newTotal: this.state.gold,
    })

    this.state.lastCompletedRoundType = roundState.roundType
    this.state.previousRoundYakuIds = new Set(this.state.currentRoundYakuIds)
    this.state.currentRoundYakuIds.clear()

    // Seasons and mandate debuffs are round-scoped.
    this.state.seasonSystem.clear()
    this.state.debuffSystem.clearRoundScopedDebuffs()

    // Every completed round leads to the Tea House. Boss completion additionally
    // marks the Act complete and enables the Charter offering.
    if (roundState?.roundType === 'Boss') {
      eventBus.emit('actComplete', {
        actNumber: this.state.currentAct,
        totalScore: this.state.runScore,
      })
    }

    // Act 8 is the canonical victory milestone. Pause on a result screen and
    // let the player choose whether to bank the win or continue into Endless.
    if (
      roundState.roundType === 'Boss' &&
      this.state.currentAct === 8 &&
      this.state.roundManager.isGameWon(8) &&
      !this.state.hasWonRun
    ) {
      this.state.hasWonRun = true
      this.state.isRunActive = false
      this.state.phase = 'gameOver'

      eventBus.emit('gameOver', {
        reason: 'victory',
        finalScore: this.state.runScore,
      })
      eventBus.emit('runEnd', {
        victory: true,
        score: this.state.runScore,
        act: this.state.currentAct,
        round: this.state.currentRound,
      })
      eventBus.emit('phaseChanged', {
        previousPhase: 'gameplay',
        newPhase: 'gameOver',
      })

      effects.push({
        type: 'round_state_changed' as const,
        description: 'Showdown defeated - run victory achieved',
        handsRemaining: this.state.handsRemaining,
        discardsRemaining: this.state.discardsRemaining,
        redrawsRemaining: this.state.redrawsRemaining,
      })
      return
    }

    this.state.phase = 'shop'
    eventBus.emit('shopEntered', {
      isAfterBoss: roundState.roundType === 'Boss',
      gold: this.state.gold,
    })
    eventBus.emit('phaseChanged', {
      previousPhase: 'gameplay',
      newPhase: 'shop',
    })
  }

  /**
   * Handle round loss
   */
  private handleRoundLoss(effects: Effect[]): void {
    // A Decree may stand between the player and defeat. Phoenix spends itself
    // to do so; Immortal Decree keeps standing but halves what the run scores.
    if (this.tryPreventLoss(effects)) {
      return
    }

    this.destroyBossLossDecrees(effects)

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
      finalScore: this.state.runScore,
    })

    // A post-victory Endless loss closes the ascent but must not count as a
    // second completed run in lifetime progression.
    if (!this.state.hasWonRun) {
      eventBus.emit('runEnd', {
        victory: false,
        score: this.state.runScore,
        act: this.state.currentAct,
        round: this.state.currentRound,
      })
    }

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
    this.state.omenSystem.setRoundInfo(this.state.currentAct, this.state.currentRound)
    this.state.targetScore = roundState.scoreTarget
    this.state.score = 0

    // Restore the slot that was temporarily unavailable in the completed
    // round, then apply any new Void penalty to the incoming round.
    for (let i = 0; i < this.state.temporaryDecreeSlotPenalty; i++) {
      this.state.decreeSystem.addSlot()
    }
    const nextSlotPenalty = this.state.voidScriptSystem.getDecreeSlotsLostNextRound()
    this.state.decreeSystem.removeSlots(nextSlotPenalty)
    this.state.temporaryDecreeSlotPenalty = nextSlotPenalty
    this.state.voidScriptSystem.onRoundEnd()
    this.state.consumableSystem.onRoundEnd()
    this.state.consumableSystem.onRoundStart()

    const omenRoundBonuses = this.state.omenSystem.triggerRoundStartOmens()
    this.state.omenHandSizeBonus = omenRoundBonuses.handSizeBonus
    this.state.omenDiscardBonus = omenRoundBonuses.discardBonus
    this.state.omenRedrawBonus = omenRoundBonuses.drawBonus

    // Notify decree system of round start
    this.state.decreeSystem.onRoundStart()
    this.state.charterSystem.updateProgress(this.state.currentAct, this.state.currentRound)
    this.initializeRoundResources()

    // Set act number for season corruption
    this.state.seasonSystem.setAct(this.state.currentAct)

    // Reinitialize wall for new round
    this.initializeWall(this.state.seed + this.state.currentAct * 100 + this.state.currentRound)
    this.applyMandateDebuffs()
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

  /** Consume next-shop Omens and return their visit-scoped Tea House effects. */
  prepareShopVisit(): TeaHouseVisitModifiers {
    if (this.state.phase !== 'shop') return {}

    const omenEffects = this.state.omenSystem.triggerShopOmens()
    if (omenEffects.goldPenalty > 0) {
      this.changeGold(-omenEffects.goldPenalty, 'Omen trade-off', [])
    }

    return {
      discountPercentage: omenEffects.discount,
      freeRerolls: omenEffects.freeRerolls,
      guaranteedItemTypes: omenEffects.guaranteedItems.map(
        (guarantee) => guarantee.itemType
      ),
      decreeEdition: omenEffects.decreeEdition
        ? (omenEffects.decreeEdition.editionType as DecreeEdition)
        : undefined,
    }
  }

  /** Resume a completed Act 8 run in Endless Mode through its reward shop. */
  continueEndless(): boolean {
    if (
      this.state.phase !== 'gameOver' ||
      !this.state.hasWonRun ||
      this.state.currentAct !== 8 ||
      this.state.lastCompletedRoundType !== 'Boss'
    ) {
      return false
    }

    this.state.isRunActive = true
    this.state.phase = 'shop'
    eventBus.emit('shopEntered', {
      isAfterBoss: true,
      gold: this.state.gold,
    })
    eventBus.emit('phaseChanged', {
      previousPhase: 'gameOver',
      newPhase: 'shop',
    })
    return true
  }

  /**
   * Exit shop and continue to next act
   */
  exitShop(): void {
    if (this.state.phase !== 'shop' || !this.state.lastCompletedRoundType) {
      return
    }

    eventBus.emit('shopExited', {
      goldSpent: 0,
      itemsPurchased: 0,
    })

    this.state.phase = 'gameplay'

    if (this.state.lastCompletedRoundType === 'Boss') {
      if (this.state.pendingActReduction > 0) {
        const nextAct = Math.max(
          1,
          this.state.currentAct + 1 - this.state.pendingActReduction
        )
        this.state.pendingActReduction = 0
        this.state.roundManager.startAct(nextAct)
      } else {
        this.state.roundManager.advanceToNextAct()
      }
    }

    this.state.lastCompletedRoundType = null
    this.advanceRound()

    eventBus.emit('phaseChanged', {
      previousPhase: 'shop',
      newPhase: 'gameplay',
    })
  }

  /**
   * Purchase an item from the shop
   */
  purchaseItem(itemId: string, cost: number, itemType: string = 'Decree'): boolean {
    if (this.state.phase !== 'shop' || cost < 0 || this.state.gold < cost) {
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
      itemType,
      itemId,
      cost,
    })

    return true
  }

  /** Sell an owned Decree and resolve any mandate waiting on that sacrifice. */
  sellDecree(decreeId: string): ActionResult {
    if (!this.state.isRunActive || !['gameplay', 'shop'].includes(this.state.phase)) {
      return {
        success: false,
        effects: [],
        errors: ['Decrees can only be sold during an active run'],
      }
    }

    const decree = this.state.decreeSystem
      .getOwnedDecrees()
      .find((candidate) => candidate.id === decreeId)
    if (!decree) {
      return { success: false, effects: [], errors: ['Decree not found'] }
    }
    if (decree.sticker?.type === 'Eternal') {
      return {
        success: false,
        effects: [],
        errors: ['Eternal Decrees cannot be sold'],
      }
    }

    const sellValue = this.state.decreeSystem.sellDecree(decreeId)
    const previousGold = this.state.gold
    this.state.gold += sellValue
    const clearedMandateDebuff = this.state.mandateEffectSystem.onDecreeSold([
      ...this.state.wall,
      ...this.state.deadWall,
      ...this.state.handTiles,
    ])

    const effects: Effect[] = [
      {
        type: 'gold_changed',
        description: `Sold ${decree.name} for ${sellValue} gold`,
        delta: sellValue,
        newTotal: this.state.gold,
      },
    ]
    if (clearedMandateDebuff) {
      effects.push({
        type: 'mandate_cleared',
        description: 'Verdant Leaf lifted: tile debuffs cleared',
      })
    }

    eventBus.emit('itemSold', {
      itemType: 'decree',
      itemId: decree.id,
      value: sellValue,
    })
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: sellValue,
      reason: clearedMandateDebuff
        ? 'Decree sold; Verdant Leaf cleared'
        : 'Decree sold',
    })

    return { success: true, effects }
  }

  /** Add a purchased decree to the authoritative run inventory. */
  addDecree(
    decree: Decree,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    const acquired = this.state.decreeSystem.acquireDecree(decree)
    if (!acquired) return false

    eventBus.emit('decreeAcquired', {
      decreeId: acquired.id,
      decreeName: acquired.name,
      rarity: acquired.rarity,
      source,
    })
    return true
  }

  canAddDecree(decree: Decree): boolean {
    return this.state.decreeSystem.canAcquireDecree(
      decree,
      this.state.flowerSystem.getFlowerCount()
    )
  }

  /** Add a purchased Charter to the authoritative run and apply slot effects. */
  addImperialCharter(charter: ImperialCharter): boolean {
    const previousDecreeSlots = this.state.charterSystem.calculateEffects().decreeSlots
    const acquired = this.state.charterSystem.purchaseCharter(charter.id)
    if (!acquired) return false

    this.state.pendingActReduction += acquired.effects.reduce(
      (total, effect) =>
        effect.type === 'skip_act' ? total + Number(effect.value) : total,
      0
    )

    const nextDecreeSlots = this.state.charterSystem.calculateEffects().decreeSlots
    for (let i = previousDecreeSlots; i < nextDecreeSlots; i++) {
      this.state.decreeSystem.addSlot()
    }

    eventBus.emit('charterRedeemed', {
      charterId: acquired.id,
      charterName: acquired.name,
      actNumber: this.state.currentAct,
    })
    return true
  }

  canAddImperialCharter(charter: ImperialCharter): boolean {
    return this.state.charterSystem.canPurchaseCharter(charter.id)
  }

  canRerollBossMandate(): boolean {
    const currentRound = this.state.roundManager.getCurrentRound()
    return Boolean(
      this.state.isRunActive &&
        this.state.phase === 'gameplay' &&
        currentRound &&
        currentRound.roundType !== 'Boss' &&
        this.state.gold >= this.state.charterSystem.getMandateRerollCost() &&
        this.state.charterSystem.canRerollMandate()
    )
  }

  /** Spend a Charter reroll to replace the upcoming Boss Mandate. */
  rerollBossMandate(): ActionResult {
    if (!this.canRerollBossMandate()) {
      return {
        success: false,
        effects: [],
        errors: ['Boss Mandate cannot be rerolled right now'],
      }
    }

    const replacement = this.state.roundManager.rerollBossMandate()
    if (!replacement || !this.state.charterSystem.useMandateReroll()) {
      return {
        success: false,
        effects: [],
        errors: ['No alternate Boss Mandate is available'],
      }
    }

    const cost = this.state.charterSystem.getMandateRerollCost()
    const previousGold = this.state.gold
    this.state.gold -= cost
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: -cost,
      reason: `Boss Mandate rerolled to ${replacement.name}`,
    })

    return {
      success: true,
      effects: [
        {
          type: 'mandate_rerolled',
          description: `Upcoming Boss Mandate is now ${replacement.name}`,
        },
        {
          type: 'gold_changed',
          description: `Spent ${cost} gold to reroll the Boss Mandate`,
          delta: -cost,
          newTotal: this.state.gold,
        },
      ],
    }
  }

  canUseDeadWallWrit(tileId?: string): boolean {
    return Boolean(
      this.state.isRunActive &&
        this.state.phase === 'gameplay' &&
        this.isDecreeRuleActive('dead_wall_draw') &&
        !this.state.deadWallWritUsedThisRound &&
        this.state.deadWall.length > 0 &&
        tileId &&
        this.state.handTiles.some((tile) => tile.id === tileId) &&
        !this.state.mandateEffectSystem.isTileLocked(tileId)
    )
  }

  /** Swap one chosen hand tile for a Dead Wall draw, once per round. */
  useDeadWallWrit(tileId: string): ActionResult {
    if (!this.canUseDeadWallWrit(tileId)) {
      return {
        success: false,
        effects: [],
        errors: ['Dead Wall Writ requires one unlocked hand tile'],
      }
    }

    const replacement = this.drawFromDeadWall()
    if (!replacement) {
      return { success: false, effects: [], errors: ['Dead Wall is empty'] }
    }

    const tileIndex = this.state.handTiles.findIndex((tile) => tile.id === tileId)
    const [discarded] = this.state.handTiles.splice(tileIndex, 1)
    this.state.discards.push(discarded)
    this.state.faceDownTileIds.delete(tileId)
    this.state.selectedTileIds.clear()
    this.state.deadWallWritUsedThisRound = true

    const effects: Effect[] = [
      {
        type: 'tile_removed',
        description: `Returned ${discarded.displayName} for a Dead Wall draw`,
        tileId,
      },
    ]
    const previousTileIds = new Set(this.state.handTiles.map((tile) => tile.id))
    if (replacement.isFlower || replacement.isSeason) {
      this.handleBonusTile(replacement)
      effects.push({
        type: 'bonus_tile_drawn',
        description: `Drew bonus tile from Dead Wall: ${replacement.displayName}`,
        tile: replacement,
        isFlower: replacement.isFlower,
      })
    } else {
      this.state.handTiles.push(replacement)
      effects.push({
        type: 'tile_added',
        description: `Dead Wall Writ drew ${replacement.displayName}`,
        tile: replacement,
      })
    }
    this.state.handTiles.sort(Tile.compare)

    const drawnTiles = this.state.handTiles.filter(
      (tile) => !previousTileIds.has(tile.id)
    )
    this.applyMandateDrawState(drawnTiles, effects)
    eventBus.emit('tileDiscarded', { tileId, toDeadPool: true })
    for (const tile of drawnTiles) {
      eventBus.emit('tileDrawn', {
        tileId: tile.id,
        tilesRemaining: this.state.wall.length - this.state.drawIndex,
      })
    }

    return { success: true, effects }
  }

  /** Add a Tile Pack reward to the persistent wall composition. */
  addTileToWall(tile: Tile): boolean {
    if (!(tile instanceof Tile)) return false
    this.state.wallTemplate.push(tile)
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

  getFaceDownTileIds(): string[] {
    return Array.from(this.state.faceDownTileIds)
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
  addFateSeal(
    seal: FateSeal,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    if (!this.canAddConsumable()) {
      return false
    }
    this.state.fateSeals.push(seal)
    eventBus.emit('consumableAcquired', {
      consumableType: 'FateSeal',
      itemId: seal.id,
      instanceId: seal.instanceId,
      name: seal.name,
      source,
    })
    return true
  }

  /**
   * Add a Void Script to inventory
   */
  addVoidScript(
    script: VoidScript,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    if (!this.canAddConsumable()) {
      return false
    }
    this.state.voidScripts.push(script)
    eventBus.emit('consumableAcquired', {
      consumableType: 'VoidScript',
      itemId: script.id,
      instanceId: script.instanceId,
      name: script.name,
      source,
    })
    return true
  }

  /**
   * Add a Celestial Orb to inventory
   */
  addCelestialOrb(
    orb: CelestialOrb,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    if (!this.canAddConsumable()) {
      return false
    }
    this.state.celestialOrbs.push(orb)
    eventBus.emit('consumableAcquired', {
      consumableType: 'CelestialOrb',
      itemId: orb.id,
      instanceId: orb.instanceId,
      name: orb.name,
      source,
    })
    return true
  }

  canAddConsumable(): boolean {
    const total =
      this.state.fateSeals.length +
      this.state.celestialOrbs.length +
      this.state.voidScripts.length
    return total < this.getConsumableCapacity()
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
