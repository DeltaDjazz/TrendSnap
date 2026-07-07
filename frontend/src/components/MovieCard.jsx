import { getCardTemplate } from '../templates'
import { RankNumber } from '../templates/RankNumber'

export function MovieCard({ movie, number, template = 'cinema', cardWidth, cardHeight, onSelect }) {
  const { config, CardInfo } = getCardTemplate(template)
  const width = cardWidth ?? config.cardWidth
  const height = cardHeight ?? config.cardHeight
  const aspectClass = config.posterAspect === '16/9' ? 'aspect-video' : 'aspect-[2/3]'
  const borderClass = config.cardBorderClass ?? ''

  const handleSelect = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    onSelect?.(movie, template)
  }

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className="relative"
      style={{ width: `${width}px` }}
    >
      {config.showNumber && number != null && (
        <RankNumber
          number={number}
          variant={config.rankNumberVariant}
          position={config.numberPosition ?? 'bottom'}
          offset={config.numberOffset ?? '8px'}
        />
      )}
      <div
        className={`relative bg-zinc-900 rounded-xl md:hover:scale-105 transition-transform duration-300 overflow-hidden cursor-pointer ${borderClass}`}
        style={{ minHeight: `${height}px` }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect?.(movie, template)
          }
        }}
      >
        <img
          src={movie.poster}
          alt={movie.title}
          draggable={false}
          className={`w-full ${aspectClass} object-cover select-none`}
        />
        <CardInfo movie={movie} />
      </div>
    </div>
  )
}
