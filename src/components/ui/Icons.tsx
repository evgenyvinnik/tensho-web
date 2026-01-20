/**
 * SVG Icon Components for Tensho Mahjong Roguelike
 * Centralized icon library for consistent styling
 */

import React from 'react';

export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

const defaultProps: IconProps = {
  className: 'w-6 h-6',
  color: 'currentColor',
};

/**
 * Volume On Icon - Speaker with sound waves
 */
export const VolumeOnIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

/**
 * Volume Muted Icon - Speaker with X
 */
export const VolumeMutedIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

/**
 * Settings/Gear Icon
 */
export const SettingsIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
  </svg>
);

/**
 * Trophy Icon - For achievements
 */
export const TrophyIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

/**
 * Close/X Icon
 */
export const CloseIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

/**
 * Menu/Hamburger Icon
 */
export const MenuIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

/**
 * Play Icon - Triangle pointing right
 */
export const PlayIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/**
 * Pause Icon - Two vertical bars
 */
export const PauseIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

/**
 * Refresh/Retry Icon
 */
export const RefreshIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

/**
 * Arrow Right Icon
 */
export const ArrowRightIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

/**
 * Arrow Left Icon
 */
export const ArrowLeftIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

/**
 * Info Icon
 */
export const InfoIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

/**
 * Gold/Coin Icon
 */
export const CoinIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
  </svg>
);

/**
 * Star Icon
 */
export const StarIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/**
 * Check/Checkmark Icon
 */
export const CheckIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

/**
 * Plus Icon
 */
export const PlusIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

/**
 * Minus Icon
 */
export const MinusIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19 13H5v-2h14v2z" />
  </svg>
);

// =============================================================================
// TILE MODIFIER ICONS - Enhancements
// =============================================================================

/**
 * Bonus Enhancement Icon - Plus with chip effect
 */
export const EnhancementBonusIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
  </svg>
);

/**
 * Mult Enhancement Icon - Multiplication symbol
 */
export const EnhancementMultIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

/**
 * Wild Enhancement Icon - Star/wildcard
 */
export const EnhancementWildIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/**
 * Glass Enhancement Icon - Crystal/diamond shape
 */
export const EnhancementGlassIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2L4 10l8 12 8-12L12 2zm0 3.5L17.5 10 12 17.5 6.5 10 12 5.5z" />
  </svg>
);

/**
 * Steel Enhancement Icon - Shield
 */
export const EnhancementSteelIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);

/**
 * Stone Enhancement Icon - Solid circle/rock
 */
export const EnhancementStoneIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

/**
 * Gold Enhancement Icon - Yen/coin
 */
export const EnhancementGoldIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h-2v-2h2v-1h-2v-2h1.5l-2-4h2.3l1.7 3.4 1.7-3.4h2.3l-2 4H15v2h2v2h-2v1h2v2h-2v2z" />
  </svg>
);

/**
 * Lucky Enhancement Icon - Four-leaf clover
 */
export const EnhancementLuckyIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 12c-1.1 0-2-.9-2-2 0-.55.22-1.05.59-1.41C10.22 8.22 10 7.72 10 7c0-1.66 1.34-3 3-3s3 1.34 3 3c0 .72-.22 1.22-.59 1.59.37.36.59.86.59 1.41 0 1.1-.9 2-2 2zm0 0c1.1 0 2 .9 2 2 0 .55-.22 1.05-.59 1.41.37.37.59.87.59 1.59 0 1.66-1.34 3-3 3s-3-1.34-3-3c0-.72.22-1.22.59-1.59-.37-.36-.59-.86-.59-1.41 0-1.1.9-2 2-2zm0 0c0-1.1-.9-2-2-2-.55 0-1.05.22-1.41.59C8.22 10.22 7.72 10 7 10c-1.66 0-3 1.34-3 3s1.34 3 3 3c.72 0 1.22-.22 1.59-.59.36.37.86.59 1.41.59 1.1 0 2-.9 2-2zm0 0c0 1.1.9 2 2 2 .55 0 1.05-.22 1.41-.59.37.37.87.59 1.59.59 1.66 0 3-1.34 3-3s-1.34-3-3-3c-.72 0-1.22.22-1.59.59-.36-.37-.86-.59-1.41-.59-1.1 0-2 .9-2 2z" />
  </svg>
);

// =============================================================================
// TILE MODIFIER ICONS - Seals
// =============================================================================

/**
 * Gold Seal Icon - Coin with shine
 */
export const SealGoldIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
    <circle cx="12" cy="12" r="6" />
  </svg>
);

/**
 * Red Seal Icon - Retrigger/refresh arrows
 */
export const SealRedIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
  </svg>
);

/**
 * Blue Seal Icon - Star/orb
 */
export const SealBlueIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6L12 2z" />
  </svg>
);

/**
 * Purple Seal Icon - Diamond
 */
export const SealPurpleIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M19 3H5L2 9l10 13L22 9l-3-6zm-7 14.3L6.5 9.5 8 6h8l1.5 3.5L12 17.3z" />
  </svg>
);

// =============================================================================
// TILE MODIFIER ICONS - Editions
// =============================================================================

/**
 * Foil Edition Icon - Sparkle
 */
export const EditionFoilIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 3l1.45 4.55L18 9l-4.55 1.45L12 15l-1.45-4.55L6 9l4.55-1.45L12 3zm6.5 6l.72 2.28L22 12l-2.78.72L18.5 15l-.72-2.28L15 12l2.78-.72L18.5 9zM7 14l.72 2.28L10.5 17l-2.78.72L7 20l-.72-2.28L3.5 17l2.78-.72L7 14z" />
  </svg>
);

/**
 * Holographic Edition Icon - Rainbow prism
 */
export const EditionHoloIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
    <path d="M12 8l-4 10h8l-4-10z" opacity="0.5" />
  </svg>
);

/**
 * Polychrome Edition Icon - Multi-color sphere
 */
export const EditionPolyIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.03-8-10-8z" opacity="0.7" />
  </svg>
);

/**
 * Negative Edition Icon - Half-filled circle (inverted)
 */
export const EditionNegativeIcon: React.FC<IconProps> = ({
  className = defaultProps.className,
  color = defaultProps.color,
}) => (
  <svg className={className} fill={color} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v16z" />
  </svg>
);

export default {
  VolumeOnIcon,
  VolumeMutedIcon,
  SettingsIcon,
  TrophyIcon,
  CloseIcon,
  MenuIcon,
  PlayIcon,
  PauseIcon,
  RefreshIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  InfoIcon,
  CoinIcon,
  StarIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  // Enhancement Icons
  EnhancementBonusIcon,
  EnhancementMultIcon,
  EnhancementWildIcon,
  EnhancementGlassIcon,
  EnhancementSteelIcon,
  EnhancementStoneIcon,
  EnhancementGoldIcon,
  EnhancementLuckyIcon,
  // Seal Icons
  SealGoldIcon,
  SealRedIcon,
  SealBlueIcon,
  SealPurpleIcon,
  // Edition Icons
  EditionFoilIcon,
  EditionHoloIcon,
  EditionPolyIcon,
  EditionNegativeIcon,
};
