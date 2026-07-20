export const config = {
  cardWidth: 182,
  cardHeight: 273,
  cardBorderClass: 'border-2 border-zinc-500/50',
  posterAspect: '2/3',
  showNumber: true,
  rankNumberVariant: 'portrait',
  numberPosition: 'top',
  numberOffset: '10px',
  borderClass: 'border-2 border-black/20',
}

export function CardInfo({ movie }) {
  return (
    <div
      className="absolute inset-0 p-3 flex flex-col justify-end pointer-events-none"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))' }}
    >
      <div className="w-full pointer-events-auto">
        <img
          src={movie.logo}
          alt={movie.title
            
          }
          draggable={false}
          className="w-full h-6 object-contain select-none"
        />
        <div className="flex items-center justify-center mt-1">
          <span className="text-xs text-zinc-100">{movie.genre || (movie.genres && movie.genres[0]) || "Genre inconnu"}</span>
        </div>
      </div>
    </div>
  )
}
