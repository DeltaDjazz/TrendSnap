export const config = {
  cardWidth: 220,
  cardHeight: 145,
  posterAspect: '16/9',
  showNumber: true,
  rankNumberVariant: 'landscape',
  numberSize: '5rem',
  borderClass: 'border border-white/20',
}

export function CardInfo({ movie }) {
  const genre = Array.isArray(movie.genres) ? movie.genres[0] : movie.genre
  const label = genre || movie.nbSaisons
  if (!label) return null

  return (
    <div className="px-2 py-1.5">
      <h2 className="font-semibold text-xs text-center text-white truncate">{label}</h2>
    </div>
  )
}
