/**
 * Reusable Button Component for Tensho Mahjong Roguelike
 * Uses game assets for styling and supports various sizes and variants
 */

import React from 'react';
import { useSpring, animated } from '@react-spring/web';

export type ButtonVariant = 'primary' | 'secondary' | 'menu' | 'game';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Custom background image path */
  backgroundImage?: string;
  /** Whether to show press animation */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
  children: React.ReactNode;
}

/**
 * Size configurations for the button
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] min-w-[80px] px-4 py-2 text-sm',
  md: 'min-h-[48px] min-w-[120px] px-6 py-3 text-base',
  lg: 'min-h-[56px] min-w-[160px] px-8 py-4 text-lg',
};

/**
 * Variant styles for the button
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-vibrant-orange hover:bg-deep-orange
    text-beige-white font-semibold
    shadow-button hover:shadow-lg
    border-2 border-golden-yellow
  `,
  secondary: `
    bg-forest-green hover:bg-dark-forest
    text-beige-white font-semibold
    shadow-button hover:shadow-lg
    border-2 border-metallic-gold
  `,
  menu: `
    bg-cover bg-center bg-no-repeat
    text-beige-white font-bold
    drop-shadow-lg
  `,
  game: `
    bg-cover bg-center bg-no-repeat
    text-golden-yellow font-bold
    drop-shadow-lg
  `,
};

/**
 * Button component with game-themed styling and animations
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  backgroundImage,
  animate = true,
  className = '',
  disabled = false,
  children,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const springProps = useSpring({
    scale: animate && isPressed ? 0.95 : 1,
    config: { tension: 300, friction: 10 },
  });

  const handleMouseDown = () => {
    if (!disabled) setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  const backgroundStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : {};

  const baseStyles = `
    relative
    rounded-lg
    cursor-pointer
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none
    font-ui
  `;

  return (
    <animated.button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `.trim()}
      style={{
        ...backgroundStyle,
        transform: springProps.scale.to((s) => `scale(${s})`),
      }}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onClick={handleClick}
      {...props}
    >
      {children}
    </animated.button>
  );
};

/**
 * Image-based button for menu screens (uses asset images as backgrounds)
 */
export interface ImageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  animate?: boolean;
  className?: string;
}

export const ImageButton: React.FC<ImageButtonProps> = ({
  src,
  alt,
  width,
  height,
  animate = true,
  className = '',
  disabled = false,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const springProps = useSpring({
    scale: animate && isPressed ? 0.95 : 1,
    config: { tension: 300, friction: 10 },
  });

  const handleMouseDown = () => {
    if (!disabled) setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <animated.button
      className={`
        relative
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        min-w-[44px] min-h-[44px]
        ${className}
      `.trim()}
      style={{
        transform: springProps.scale.to((s) => `scale(${s})`),
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
      }}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onClick={handleClick}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
    </animated.button>
  );
};

export default Button;
