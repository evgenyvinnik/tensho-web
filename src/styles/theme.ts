/**
 * Theme constants for Tensho Mahjong Roguelike
 * Based on ARCHITECTURE.MD color palette
 */

export const colors = {
  // Primary palette
  forestGreen: '#2D5F4A',
  vibrantOrange: '#FF5722',
  goldenYellow: '#FFD54F',
  deepOrange: '#D84315',
  darkForest: '#1C3A2E',
  beigeWhite: '#F5F5DC',
  saddleBrown: '#8B4513',
  metallicGold: '#C8B273',
} as const;

// Rarity colors for items and cards
export const rarityColors = {
  common: '#9E9E9E', // Gray
  uncommon: '#4CAF50', // Green
  rare: '#2196F3', // Blue
  epic: '#9C27B0', // Purple
  legendary: '#FFD54F', // Gold
  mythic: '#FF5722', // Orange
} as const;

// Semantic colors for game states
export const semanticColors = {
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  disabled: '#757575',
} as const;

// Tile suit colors
export const suitColors = {
  manzu: '#D32F2F', // Red for characters
  pinzu: '#1976D2', // Blue for circles
  souzu: '#388E3C', // Green for bamboo
  wind: '#5D4037', // Brown for winds
  dragon: '#6A1B9A', // Purple for dragons
  flower: '#E91E63', // Pink for flowers
  season: '#00796B', // Teal for seasons
} as const;

// Font families
export const fonts = {
  tile: "'LongCang', serif",
  ui: "'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif",
  decorative: "'Go3v2', cursive",
} as const;

// Spacing scale (based on 4px grid)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

// Tile dimensions
export const tileSizes = {
  small: { width: 35, height: 49 },
  medium: { width: 50, height: 70 },
  large: { width: 70, height: 98 },
  xlarge: { width: 90, height: 126 },
} as const;

// Touch target minimum size (44x44 pixels)
export const touchTargetMinSize = 44;

// Reference resolution for mobile-first design
export const referenceResolution = {
  width: 1080,
  height: 1920,
};

// Z-index layers
export const zIndex = {
  background: 0,
  tiles: 10,
  hand: 20,
  ui: 30,
  modal: 40,
  tooltip: 50,
  overlay: 100,
} as const;

// Animation durations
export const animationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Border radii
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  round: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  tile: '2px 2px 4px rgba(0, 0, 0, 0.3)',
  button: '0 4px 8px rgba(0, 0, 0, 0.2)',
} as const;

// Combined theme export
export const theme = {
  colors,
  rarityColors,
  semanticColors,
  suitColors,
  fonts,
  spacing,
  tileSizes,
  touchTargetMinSize,
  referenceResolution,
  zIndex,
  animationDurations,
  borderRadius,
  shadows,
} as const;

export default theme;
