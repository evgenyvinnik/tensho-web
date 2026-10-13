/**
 * CollectibleToken
 *
 * One owned thing — a Flower, a Season, an Orb, a Seal, a Script, a Yaku
 * upgrade — as one icon with its own small details panel. Every token shares
 * one height (`--collectible-h`), so the inventory reads as a single row of
 * equal items whatever their art's shape, and every token is at least a
 * 44×44 tap target.
 *
 * Mouse hover previews the panel, a tap or click pins it, and the keyboard
 * opens it and moves focus inside. Escape or a press outside closes it.
 *
 * @module components/ui/CollectibleToken
 */

import type { ReactNode } from 'react'
import { AnchoredPopover } from './AnchoredPopover'
import { usePreviewPopover } from './usePreviewPopover'

export interface CollectibleTokenProps {
  /** Accessible name; also the details panel's title. */
  label: string
  /** Artwork. Without it, `icon` (or a neutral placeholder) is shown. */
  art?: string
  icon?: ReactNode
  /** Small corner badge: a level, a count. */
  badge?: ReactNode
  /** Border/glow colour for the item's family. */
  tone?: string
  /** Inactive (for example a suppressed Flower or a corrupted Season). */
  dimmed?: boolean
  /** Wider frame for portrait-format art such as scrolls. */
  shape?: 'square' | 'portrait'
  /** Panel content. */
  children: ReactNode
  /** Stable selector for tests and tours. */
  testId?: string
  /** Extra data attributes for the trigger. */
  data?: Record<`data-${string}`, string | undefined>
  /** Opened state is controlled by the caller when supplied. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CollectibleToken({
  label,
  art,
  icon,
  badge,
  tone = 'var(--color-metallic-gold)',
  dimmed = false,
  shape = 'square',
  children,
  testId,
  data,
  open: controlledOpen,
  onOpenChange,
}: CollectibleTokenProps) {
  const { anchorRef, triggerProps, popoverProps } = usePreviewPopover({
    open: controlledOpen,
    onOpenChange,
  })

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-testid={testId}
        data-collectible-token=""
        {...data}
        aria-label={label}
        {...triggerProps}
        className={`collectible-token relative flex shrink-0 items-center justify-center rounded-lg border-2 bg-black/30 shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] ${
          shape === 'portrait' ? 'collectible-token--portrait' : ''
        } ${dimmed ? 'opacity-60 grayscale' : ''}`}
        style={{ borderColor: tone, boxShadow: `0 0 10px ${tone}40` }}
      >
        {art ? (
          <img
            src={art}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="game-illustration h-full w-full rounded-md object-contain p-0.5"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center"
          >
            {icon ?? (
              <span
                data-art-placeholder
                className="h-3/5 w-3/5 rounded-full border border-dashed border-current opacity-50"
              />
            )}
          </span>
        )}
        {badge !== undefined && badge !== null && (
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 min-w-[1.1rem] rounded-full border border-black/40 bg-[var(--color-golden-yellow)] px-1 text-center text-[10px] font-black leading-4 text-[#1b1206] shadow"
          >
            {badge}
          </span>
        )}
      </button>
      <AnchoredPopover {...popoverProps} title={label}>
        {children}
      </AnchoredPopover>
    </>
  )
}

export default CollectibleToken
