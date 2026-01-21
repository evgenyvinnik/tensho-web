/**
 * Shared types for decree icon components
 */

import type React from 'react'

/** Icon function type - renders SVG content */
export type IconFn = (props: { color: string }) => React.ReactNode

/** Props for the DecreeUniqueIcon component */
export interface DecreeIconProps {
  decreeId: string
  size?: number
  color?: string
  className?: string
}

/** Map of decree IDs to their icon functions */
export type DecreeIconMap = Record<string, IconFn>
