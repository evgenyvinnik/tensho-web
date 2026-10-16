/**
 * TileBack: a face-down tile.
 *
 * Drawn to the tile art's geometry (569×711: the face fills the top-left
 * 525×661, the thickness layers sit 22 and 44px below and right). A flipped
 * tile shows its red back on top, so it never reads as a blank face — the
 * art kit's empty template looks exactly like one.
 */
export function TileBack({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      data-tile-back
      viewBox="0 0 569 711"
      className="h-full w-full select-none pointer-events-none"
    >
      <rect x="44" y="50" width="525" height="661" rx="56" fill="#E9DACB" />
      <rect x="22" y="25" width="525" height="661" rx="56" fill="#B9A28B" />
      <rect x="0" y="0" width="525" height="661" rx="56" fill="#A3473A" />
      <rect x="10" y="6" width="492" height="630" rx="48" fill="#B55242" />
      <rect
        x="48"
        y="46"
        width="416"
        height="550"
        rx="30"
        fill="none"
        stroke="#E7A08F"
        strokeOpacity="0.6"
        strokeWidth="10"
      />
      <path
        d="M256 206 L376 326 L256 446 L136 326 Z"
        fill="none"
        stroke="#E7A08F"
        strokeOpacity="0.6"
        strokeWidth="10"
      />
      <path
        d="M256 270 L312 326 L256 382 L200 326 Z"
        fill="#E7A08F"
        fillOpacity="0.45"
      />
    </svg>
  )
}
