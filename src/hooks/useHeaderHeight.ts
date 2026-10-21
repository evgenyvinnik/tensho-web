import { useEffect, useState } from 'react'

/** The height of a screen's fixed header, so toasts can sit just below it. */
export function useHeaderHeight(selector: string): number {
  const [height, setHeight] = useState(64)
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(selector)
    if (!header) return
    const measure = () => setHeight(header.getBoundingClientRect().height)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [selector])
  return height
}
