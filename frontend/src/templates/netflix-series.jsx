export const config = {
  maxWidth: '1600px',
  cardWidth: 240,
  cardHeight: 145,
  posterAspect: '16/9',
  showNumber: true,
  rankNumberVariant: 'landscape',
  numberPosition: 'top',
  numberOffset: '-8px',
  numberBleed: '3rem',
  borderClass: 'border-2 border-white/50',
}

export function CardInfo({ movie }) {
  const genres = Array.isArray(movie.genre) ? movie.genre.join(' · ') : movie.genre

  return (
    <div className="px-2 py-1.5">
      <h2 className="font-semibold text-xs text-center text-white truncate">{movie.nbSaisons}</h2>
    </div>
  )
}
