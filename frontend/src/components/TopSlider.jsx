import { useState, useRef, useEffect } from 'react'
import { MovieCard } from './MovieCard'
import { getCardTemplate } from '../templates'

const GAP = 36

function getMaxStartIndex(totalCards, visibleCount) {
  return Math.max(0, totalCards - visibleCount)
}

export function TopSlider({ movies, template = 'cinema', cardWidth, cardHeight, backgroundColor }) {
  const { config } = getCardTemplate(template)
  const resolvedWidth = cardWidth ?? config.cardWidth
  const resolvedHeight = cardHeight ?? config.cardHeight
  const cardStep = resolvedWidth + GAP
  const sliderStyle = {
    maxWidth: config.maxWidth ?? '1600px',
    backgroundColor: backgroundColor ?? 'transparent',
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(1)
  const [isSliding, setIsSliding] = useState(false)
  const containerRef = useRef(null)
  const viewportRef = useRef(null)

  const totalCards = movies.length
  const maxStartIndex = getMaxStartIndex(totalCards, visibleCount)
  const offsetX = currentIndex * cardStep
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < maxStartIndex

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateVisibleCount = () => {
      const sliderWidth = viewport.clientWidth
      const nbCardAffichables = Math.max(1, Math.floor(sliderWidth / cardStep))
      setVisibleCount(nbCardAffichables)
    }

    updateVisibleCount()
    const observer = new ResizeObserver(updateVisibleCount)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [cardStep])

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, getMaxStartIndex(movies.length, visibleCount)))
  }, [visibleCount, movies.length])

  const slide = (direction) => {
    if (isSliding) return

    const container = containerRef.current
    if (!container) return

    const nextIndex = direction === 'right'
      ? Math.min(currentIndex + visibleCount, maxStartIndex)
      : Math.max(currentIndex - visibleCount, 0)

    const delta = Math.abs(nextIndex - currentIndex)
    if (delta === 0) return

    const targetOffset = currentIndex * cardStep + (direction === 'right' ? delta * cardStep : -delta * cardStep)

    setIsSliding(true)
    container.style.transition = 'transform 500ms ease-in-out'
    container.style.transform = `translateX(-${targetOffset}px)`

    setTimeout(() => {
      container.style.transition = 'none'
      container.style.removeProperty('transform')
      setCurrentIndex(nextIndex)
      setIsSliding(false)
    }, 500)
  }

  return (
    <div className="flex items-center justify-center mx-auto" style={{ maxWidth: '1800px' }}>
      <button
        onClick={() => slide('left')}
        disabled={!canGoPrev}
        className="shrink-0 w-8 h-12 flex items-center justify-center
                   text-6xl text-zinc-400 hover:text-white
                   disabled:opacity-0 disabled:pointer-events-none transition-opacity z-99"
      >
        ‹
      </button>

      <div className="flex-1 mx-2 rounded-3xl overflow-hidden py-8" style={sliderStyle}>
        <div
          ref={viewportRef}
          className="min-w-0 overflow-clip"
          style={{ overflowClipMargin: config.numberBleed ?? '2rem' }}
        >
          <div
            ref={containerRef}
            className="grid"
            style={{
              gap: `${GAP}px`,
              gridTemplateColumns: `repeat(${totalCards}, ${resolvedWidth}px)`,
              transform: `translateX(-${offsetX}px)`,
            }}
          >
            {movies.map((movie, index) => (
              <div key={movie.id} className="overflow-visible" style={{ width: `${resolvedWidth}px` }}>
                <MovieCard
                  movie={movie}
                  number={index + 1}
                  template={template}
                  cardWidth={resolvedWidth}
                  cardHeight={resolvedHeight}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => slide('right')}
        disabled={!canGoNext}
        className="shrink-0 w-8 h-12 flex items-center justify-center
                   text-6xl text-zinc-400 hover:text-white
                   disabled:opacity-0 disabled:pointer-events-none transition-opacity z-99"
      >
        ›
      </button>
    </div>
  )
}
