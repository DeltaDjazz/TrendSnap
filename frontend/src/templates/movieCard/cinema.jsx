export const config = {
  cardWidth: 220,
  cardHeight: 340,
  posterAspect: '2/3',
  showNumber: true,
  rankNumberVariant: 'portrait',
  numberPosition: 'bottom',
  numberOffset: '96px',
}

export function CardInfo({ movie }) {
  return (
    <div className="p-3">
      <h2 className="font-semibold text-sm text-zinc-100 truncate">{movie.title}</h2>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-zinc-400">{movie.year}</span>
        <span className="text-xs font-bold text-yellow-400">★ {movie.rating}</span>
      </div>
    </div>
  )
}
