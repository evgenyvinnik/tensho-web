/**
 * Effects Components Index for Tensho Mahjong Roguelike
 *
 * Central export point for all visual effect components.
 */

// Animated Background
export {
  AnimatedBackground,
  WaveBackground,
  FloatingParticles,
} from './AnimatedBackground';

// Particle Effects
export {
  ParticleEffect,
  ConfettiBurst,
  StarBurst,
  SparkleTrail,
  GoldRain,
  useParticleEffect,
  type ParticleType,
  type ParticleEffectProps,
  type ConfettiBurstProps,
  type StarBurstProps,
  type SparkleTrailProps,
  type GoldRainProps,
} from './ParticleEffect';

// Glow Effects
export {
  GlowEffect,
  GlowOverlay,
  BorderGlow,
  useGlowEffect,
  type GlowVariant,
  type GlowEffectProps,
  type GlowOverlayProps,
  type BorderGlowProps,
} from './GlowEffect';

// Score Popups
export {
  ScorePopup,
  ChipsMultPopup,
  ScoreCounter,
  ComboDisplay,
  StackingScorePopup,
  TotalScoreReveal,
  RetriggerPopup,
  useScorePopups,
  type ScorePopupProps,
  type ChipsMullPopupProps,
  type ScoreCounterProps,
  type ComboDisplayProps,
  type StackingScorePopupProps,
  type TotalScoreRevealProps,
  type RetriggerPopupProps,
  type ScoreDisplayStyle,
} from './ScorePopup';

// Yaku Reveal
export {
  YakuReveal,
  YakuRevealSequence,
  YakuBanner,
  type YakuRevealProps,
  type YakuRevealSequenceProps,
  type YakuBannerProps,
} from './YakuReveal';

// Screen Flash
export {
  ScreenFlash,
  YakumanFlash,
  VignetteFlash,
  GameOverOverlay,
  useScreenFlash,
  type FlashVariant,
  type ScreenFlashProps,
  type YakumanFlashProps,
  type VignetteFlashProps,
  type GameOverOverlayProps,
} from './ScreenFlash';
