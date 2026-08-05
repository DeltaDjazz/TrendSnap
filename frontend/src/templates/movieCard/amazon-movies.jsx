export const config = {
  cardWidth: 220,
  cardHeight: 145,
  posterAspect: '16/9',
  showNumber: true,
  rankNumberVariant: 'landscape',
  numberSize: '5rem',
  borderClass: 'border border-white/15',
}

export function CardInfo({ movie }) {
  return (
    <div className="px-2 py-1.5">
      <h2 className="font-semibold text-xs text-center text-white truncate">{movie.genre}</h2>
    </div>
  )
}
