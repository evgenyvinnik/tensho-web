/**
 * useResponsiveTileSize Hook
 *
 * Determines the appropriate tile size based on viewport width.
 * - Mobile (< 768px): medium tiles (50x70px)
 * - Tablet (768-1279px): large tiles (70x98px)
 * - Desktop (>= 1280px): xlarge tiles (90x126px)
 */

import { useLayoutEffect, useState } from 'react'
import type { TileSize } from '../components/tiles/TileImage'

/**
 * Calculate tile size based on viewport width
 */
function calculateTileSize(): TileSize {
  if (typeof window === 'undefined') return 'medium'
  if (window.innerWidth >= 1280) return 'xlarge'
  if (window.innerWidth >= 768) return 'large'
  return 'medium'
}

/**
 * Hook to determine responsive tile size based on viewport width
 */
export function useResponsiveTileSize(): TileSize {
  const [tileSize, setTileSize] = useState<TileSize>(calculateTileSize)

  // Use useLayoutEffect to ensure size is set before paint
  useLayoutEffect(() => {
    const handleResize = () => {
      setTileSize(calculateTileSize())
    }

    // Set initial value synchronously before paint
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return tileSize
}

export default useResponsiveTileSize
