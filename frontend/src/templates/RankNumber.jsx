export function RankNumber({
  number,
  variant = 'portrait',
  size,
}) {
  const isPortrait = variant === 'portrait'
  const isDouble = String(number).length > 1
  const fontSize = size ?? (isPortrait ? (isDouble ? '5.5rem' : '7rem') : isDouble ? '4.5rem' : '5.5rem')

  return (
    <div
      className="pointer-events-none absolute bottom-8 left-0 z-0 flex items-end font-black leading-none text-stroke-rank select-none"
      style={{ fontSize }}
      aria-hidden="true"
    >
      {number}
    </div>
  )
}
