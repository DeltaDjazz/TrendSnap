export const config = {
  cardWidth: 200,
  cardHeight: 240,
  posterAspect: '2/3',
  showNumber: true,
  rankNumberVariant: 'portrait',
  numberSize: '6.5rem',
  borderClass: 'border border-white/30',
}

function firstGenre(movie) {
  if (Array.isArray(movie.genres)) return movie.genres[0]
  return movie.genre || null
}

export function CardInfo({ movie }) {
  const genre = firstGenre(movie)

  return (
    <div className="p-3">
      {genre && (
        <p className=" font-semibold text-xs text-center text-white truncate">{genre}</p>
      )}
    </div>
  )
}
