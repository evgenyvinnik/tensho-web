import type { Tile } from '../core/Tile'
import type { ShantenResult } from '../rules/ShantenCalculator'

export type HandBuildingAdvice =
  | { kind: 'hidden' | 'unsupported' | 'complete' | 'clear' | 'unavailable' }
  | {
      kind: 'redraw'
      keep: Tile[]
      exchange: Tile[]
      improving: Tile[]
      needed: number
      form: ShantenResult['bestForm']
      redrawsRemaining: number
    }
