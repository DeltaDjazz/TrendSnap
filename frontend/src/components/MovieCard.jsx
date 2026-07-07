import { useState } from 'react'
import { getCardTemplate } from '../templates'
import { RankNumber } from '../templates/RankNumber'
import { MovieModal } from './MovieModal'

export function MovieCard({ movie, number, template = 'cinema', cardWidth, cardHeight }) {
  const { config, CardInfo } = getCardTemplate(template)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const width = cardWidth ?? config.cardWidth
  const height = cardHeight ?? config.cardHeight
  const aspectClass = config.posterAspect === '16/9' ? 'aspect-video' : 'aspect-[2/3]'
  const borderClass = config.cardBorderClass ?? ''

  const openModal = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    setIsModalOpen(true)
  }

  const closeModal = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsModalOpen(false)
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
        onClick={openModal}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setIsModalOpen(true)
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

        <MovieModal
          isOpen={isModalOpen}
          title={movie.title}
          description={movie.description || 'Aucune description disponible.'}
          onClose={closeModal}
        />
      </div>
    </div>
  )
}
