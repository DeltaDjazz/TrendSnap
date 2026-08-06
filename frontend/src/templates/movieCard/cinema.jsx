export const config = {
  cardWidth: 200,
  cardHeight: 314,
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
      <h2 className="font-semibold text-sm text-zinc-100 truncate">{movie.title}</h2>
      {genre && (
        <p className="mt-1 text-xs text-zinc-400 truncate">{genre}</p>
      )}
    </div>
  )
}
