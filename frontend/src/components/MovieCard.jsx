import { getCardTemplate } from '../templates'
import { RankNumber } from '../templates/RankNumber'

export function MovieCard({ movie, number, template = 'cinema', cardWidth, cardHeight }) {
  const { config, CardInfo } = getCardTemplate(template)
  const width = cardWidth ?? config.cardWidth
  const height = cardHeight ?? config.cardHeight
  const aspectClass = config.posterAspect === '16/9' ? 'aspect-video' : 'aspect-[2/3]'
  const borderClass = config.cardBorderClass ?? ''

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
        className={`relative bg-zinc-900 rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden ${borderClass}`}
        style={{ minHeight: `${height}px` }}
      >
        <img
          src={movie.poster}
          alt={movie.title}
          className={`w-full ${aspectClass} object-cover`}
        />
        <CardInfo movie={movie} />
      </div>
    </div>
  )
}
