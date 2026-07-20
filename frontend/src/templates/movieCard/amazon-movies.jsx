export const config = {
    cardWidth: 220,
    cardHeight: 145,
    posterAspect: '16/9',
    showNumber: true,
    rankNumberVariant: 'landscape',
    numberPosition: 'top',
    numberOffset: '-8px',
    borderClass: 'border-2 border-white/50',
  }
  
  export function CardInfo({ movie }) {
    //si movie.genres est un tableau, alors on affiche le premier genre
    return (
      <div className="px-2 py-1.5">
        <h2 className="font-semibold text-xs text-center text-white truncate">{movie.genre}</h2>
      </div>
    )
  }