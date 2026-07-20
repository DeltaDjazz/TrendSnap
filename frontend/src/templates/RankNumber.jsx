export function RankNumber({
  number,
  variant = 'portrait',
  position = 'bottom',
  offset = '8px',
}) {
  const isPortrait = variant === 'portrait'

  return (
    <div
      className={`absolute left-0 flex items-center justify-center font-black text-black shadow-lg pointer-events-none text-stroke-white z-10 ${
        isPortrait ? 'w-12 h-12 text-6xl' : 'w-8 h-8 text-5xl'
      }`}
      style={{ [position]: offset }}
    >
      {number}
    </div>
  )
}
