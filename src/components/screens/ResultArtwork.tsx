import { useState, type CSSProperties } from 'react'
import { useAnimationConfig } from '../../hooks/useReducedMotion'
import { illustrationAssets } from '../../utils/assets'
import './ResultArtwork.css'

type ResultKind = keyof typeof illustrationAssets.results

// Fixed positions keep the celebration consistent and avoid a render-time RNG.
const PETALS = [
  [8, 16, -16, 0],
  [23, 6, 24, 0.08],
  [42, 24, -20, 0.18],
  [61, 9, 18, 0.04],
  [79, 18, -28, 0.12],
  [90, 34, 16, 0.22],
] as const

/** A bounded, credit-free celebration; the original artwork never moves. */
export function ResultArtwork({ kind }: { kind: ResultKind }) {
  const [loaded, setLoaded] = useState(false)
  const { shouldReduceMotion, durationMultiplier } = useAnimationConfig()
  const celebrate = kind === 'victory' && loaded && !shouldReduceMotion
  // Even the slow setting ends before five seconds. No loop or blocking timer.
  const duration = Math.min(4800, 3600 * durationMultiplier)

  return (
    <div className="result-artwork mb-4 sm:mb-5">
      <img
        src={illustrationAssets.results[kind]}
        alt=""
        width={960}
        height={320}
        className="block aspect-[3/1] w-full object-cover"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        data-result-art
      />
      {celebrate && (
        <div
          aria-hidden="true"
          className="result-artwork__celebration"
          data-result-celebration
          style={{ '--celebration-duration': `${duration}ms` } as CSSProperties}
        >
          <span className="result-artwork__light result-artwork__light--lantern" />
          <span className="result-artwork__light result-artwork__light--sunrise" />
          {PETALS.map(([left, top, drift, delay], index) => (
            <span
              key={index}
              className="result-artwork__petal"
              style={
                {
                  left: `${left}%`,
                  top: `${top}%`,
                  '--petal-drift': `${drift}px`,
                  // Duration + delay never exceeds the overall celebration.
                  animationDuration: `${duration * (1 - delay)}ms`,
                  animationDelay: `${duration * delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
