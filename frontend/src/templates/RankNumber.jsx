export function RankNumber({
  number,
  variant = 'portrait',
  position = 'bottom',
  offset = '8px',
  size,
}) {
  const isPortrait = variant === 'portrait'
  const fontSize = size ?? (isPortrait ? '3.75rem' : '3rem')

  return (
    <div
      className={`absolute left-0 flex items-center justify-center font-black text-black shadow-lg pointer-events-none text-stroke-white z-10 ${
        isPortrait ? 'w-12 h-12' : 'w-8 h-8'
      }`}
      style={{ [position]: offset, fontSize }}
    >
      {number}
    </div>
  )
}
