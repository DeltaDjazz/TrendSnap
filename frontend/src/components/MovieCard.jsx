import { getCardTemplate } from '../templates/cardTemplates'
import { RankNumber } from '../templates/RankNumber'

export function MovieCard({ movie, number, template = 'cinema', cardWidth, cardHeight, onSelect }) {
  const { config, CardInfo } = getCardTemplate(template)
  const width = cardWidth ?? config.cardWidth
  const height = cardHeight ?? config.cardHeight
  const aspectClass = config.posterAspect === '16/9' ? 'aspect-video' : 'aspect-[2/3]'
  const borderClass = config.borderClass ?? ''
  const showNumber = config.showNumber && number != null
  const rankInset = showNumber ? (String(number).length > 1 ? '2.75rem' : '2rem') : '0px'

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
    <div className="relative overflow-visible" style={{ width: `${width}px` }}>
      {showNumber && (
        <RankNumber
          number={number}
          variant={config.rankNumberVariant}
          size={config.numberSize}
        />
      )}
      <div
        className={`relative z-10 bg-zinc-900 rounded-xl md:hover:scale-105 transition-transform duration-300 overflow-hidden cursor-pointer ${borderClass}`}
        style={{ minHeight: `${height}px`, marginLeft: rankInset }}
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
