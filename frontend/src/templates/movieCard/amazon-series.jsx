export const config = {
  maxWidth: '1600px',
  cardWidth: 304,
  cardHeight: 170,
  posterAspect: '16/9',
  showNumber: true,
  rankNumberVariant: 'landscape',
  numberPosition: 'bottom',
  numberOffset: '20px',
  numberBleed: '2rem',
}

export function CardInfo({ movie }) {
  return (
    <div className="px-2 py-1.5">
      <h2 className="font-semibold text-xs text-center text-zinc-100 truncate">{movie.genre}</h2>
      
    </div>
  )
}
