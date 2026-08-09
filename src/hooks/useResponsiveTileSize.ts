/**
 * useResponsiveTileSize Hook
 *
 * Determines tile size from both viewport width and height. Height matters on
 * laptop screens where x-large tiles can otherwise push the action bar below
 * the fixed game viewport.
 */

import { useLayoutEffect, useState } from 'react'
import type { TileSize } from '../components/tiles/TileImage'

/**
 * Calculate tile size based on viewport width
 */
function calculateTileSize(): TileSize {
  if (typeof window === 'undefined') return 'medium'
  if (window.innerWidth >= 1440 && window.innerHeight >= 900) return 'xlarge'
  if (window.innerWidth >= 900 && window.innerHeight >= 680) return 'large'
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
