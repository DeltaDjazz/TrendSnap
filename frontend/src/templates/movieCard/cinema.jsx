export const config = {
  cardWidth: 180,
  cardHeight: 340,
  posterAspect: '2/3',
  showNumber: true,
  rankNumberVariant: 'portrait',
  numberPosition: 'top',
  numberOffset: '-20px',
  numberSize: '2.7rem',
}

export function CardInfo({ movie }) {
  return (
    <div className="p-3">
      <h2 className="font-semibold text-sm text-zinc-100 truncate">{movie.title}</h2>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-zinc-400 text-center">{movie.dateDeSortie}</span>
      </div>
    </div>
  )
}
