import type { ReactNode } from 'react'
import {
  getCelestialOrbByYaku,
  type YakuCategory,
} from '../../systems/CelestialOrbSystem'
import { getItemArt } from '../../utils/itemArt'

type TileMark =
  | 'dot'
  | 'twoDots'
  | 'threeDots'
  | 'bamboo'
  | 'character'
  | '東'
  | '中'
  | '1'
  | '2'
  | '5'
  | '8'
  | '9'

interface PatternEmblem {
  tiles: TileMark[]
  /** A span or a repeated family, rather than the token's upgrade level. */
  caption?: string
}

const PATTERNS: Record<YakuCategory, PatternEmblem> = {
  Pairs: { tiles: ['twoDots', 'twoDots'] },
  Tanyao: { tiles: ['2', '8'], caption: '2–8' },
  Yakuhai: { tiles: ['東', '中'] },
  Pinfu: { tiles: ['dot', 'twoDots', 'threeDots'] },
  Ittsu: { tiles: ['1', '5', '9'], caption: '1–9' },
  Honitsu: { tiles: ['dot', 'twoDots', '東'] },
  Toitoi: { tiles: ['twoDots', 'twoDots', 'twoDots'] },
  Chinitsu: { tiles: ['dot', 'threeDots', 'twoDots'] },
  Sanshoku: { tiles: ['dot', 'bamboo', 'character'] },
  SevenPairs: { tiles: ['twoDots', 'twoDots'], caption: '×7' },
  Chanta: { tiles: ['1', '9', '東'] },
  Kokushi: { tiles: ['1', '東', '中'], caption: '13' },
  All: { tiles: ['dot', 'bamboo', 'character'], caption: '✦' },
}

function TileFace({ mark }: { mark: TileMark }) {
  let face: ReactNode
  switch (mark) {
    case 'dot':
      face = <circle cx="10" cy="15" r="4.2" />
      break
    case 'twoDots':
      face = (
        <>
          <circle cx="10" cy="9" r="3.2" />
          <circle cx="10" cy="21" r="3.2" />
        </>
      )
      break
    case 'threeDots':
      face = (
        <>
          <circle cx="6" cy="8" r="2.7" />
          <circle cx="10" cy="15" r="2.7" />
          <circle cx="14" cy="22" r="2.7" />
        </>
      )
      break
    case 'bamboo':
      face = (
        <path
          d="M10 5v21M6 9h8M6 16h8M6 23h8"
          fill="none"
          stroke="#24734e"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      )
      break
    default:
      face = (
        <text
          x="10"
          y="22"
          textAnchor="middle"
          fontSize="20"
          fontWeight="900"
          fontFamily="Georgia, 'Noto Serif CJK JP', serif"
          fill={mark === '中' || mark === 'character' ? '#b73931' : '#173e3d'}
        >
          {mark === 'character' ? '萬' : mark}
        </text>
      )
  }
  return (
    <>
      <rect y="3" width="20" height="31" rx="3" fill="#275b4b" />
      <rect
        width="20"
        height="30"
        rx="3"
        fill="#fff4d8"
        stroke="#b99859"
        strokeWidth="1.2"
      />
      <g fill="#236b62" stroke="#16483f" strokeWidth="0.7">
        {face}
      </g>
    </>
  )
}

/** Pairs has its own badge; other families retain their Orb and tile pattern. */
export function YakuUpgradeArtwork({ family }: { family: YakuCategory }) {
  const orb = getCelestialOrbByYaku(family)
  const pattern = PATTERNS[family]
  return (
    <span
      aria-hidden="true"
      data-upgrade-art={family}
      className="relative block h-full w-full"
    >
      <img
        src={
          family === 'Pairs'
            ? getItemArt('yakuUpgrades', family).src
            : getItemArt('orbs', orb?.id ?? '').src
        }
        data-upgrade-orb={orb?.id}
        alt=""
        draggable={false}
        className="game-illustration absolute inset-0 h-full w-full rounded-md object-contain p-0.5"
      />
      {family !== 'Pairs' && (
        <svg
          data-upgrade-pattern={family}
          viewBox="0 0 76 40"
          focusable="false"
          className="absolute inset-x-0 bottom-1.5 h-[49%] w-full drop-shadow-md"
        >
          {pattern.tiles.map((mark, index) => (
            <g
              key={index}
              transform={`translate(${(76 - pattern.tiles.length * 24 + 4) / 2 + index * 24} 3)`}
            >
              <TileFace mark={mark} />
            </g>
          ))}
        </svg>
      )}
      {pattern.caption && (
        <span
          className="absolute left-0.5 top-0.5 rounded-sm border border-[#e9c681]/70 bg-[#142c2a]/95 px-0.5 text-[9px] font-black leading-3 text-[#fff4d8] shadow-sm"
          data-upgrade-pattern-caption=""
        >
          {pattern.caption}
        </span>
      )}
    </span>
  )
}
