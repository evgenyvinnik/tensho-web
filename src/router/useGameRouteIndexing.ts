import { useEffect } from 'react'
import { gameRouteRobots } from '../publicSite/gameRoutes'

/** Keep SPA navigation consistent with the initial static entry's robots tag. */
export function useGameRouteIndexing(pathname: string): void {
  useEffect(() => {
    let robots = document.head.querySelector<HTMLMetaElement>(
      'meta[name="robots"]'
    )
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = gameRouteRobots(pathname)
  }, [pathname])
}
