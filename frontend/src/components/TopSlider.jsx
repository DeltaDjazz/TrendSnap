import { useState, useRef, useEffect } from 'react'
import { MovieCard } from './MovieCard'
import { getCardTemplate } from '../templates'

const GAP = 36
const SWIPE_THRESHOLD = 80
const DRAG_THRESHOLD = 5
const MOBILE_BREAKPOINT = 768
const MOBILE_GAP = 10
const DEFAULT_MOBILE_SCALE = 0.5

function getMaxStartIndex(totalCards, visibleCount) {
  return Math.max(0, totalCards - visibleCount)
}

export function TopSlider({ movies, template = 'cinema', cardWidth, cardHeight, backgroundColor, onMovieSelect }) {
  const { config } = getCardTemplate(template)
  const resolvedWidth = cardWidth ?? config.cardWidth
  const resolvedHeight = cardHeight ?? config.cardHeight
  const mobileScale = config.mobileCardScale ?? DEFAULT_MOBILE_SCALE
  const sliderStyle = {
    maxWidth: config.maxWidth ?? '1600px',
    backgroundColor: backgroundColor ?? 'transparent',
  }

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  const [visibleCount, setVisibleCount] = useState(1)
  const [isSliding, setIsSliding] = useState(false)
  const [dragOffsetX, setDragOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [positionOffset, setPositionOffset] = useState(0)
  const containerRef = useRef(null)
  const viewportRef = useRef(null)
  const dragStartXRef = useRef(0)
  const pointerIdRef = useRef(null)
  const didDragRef = useRef(false)
  const effectiveWidth = isMobile ? Math.round(resolvedWidth * mobileScale) : resolvedWidth
  const effectiveHeight = isMobile ? Math.round(resolvedHeight * mobileScale) : resolvedHeight
  const effectiveGap = isMobile ? MOBILE_GAP : GAP
  const cardStep = effectiveWidth + effectiveGap

  const totalCards = movies.length
  const maxStartIndex = getMaxStartIndex(totalCards, visibleCount)
  const maxOffset = Math.max(0, maxStartIndex * cardStep)
  const visualOffsetX = positionOffset - dragOffsetX
  const canGoPrev = positionOffset > 0
  const canGoNext = positionOffset < maxOffset

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const updateIsMobile = (event) => setIsMobile(event.matches)

    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateIsMobile)

    return () => mediaQuery.removeEventListener('change', updateIsMobile)
  }, [])

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
    const nextMaxOffset = Math.max(0, getMaxStartIndex(movies.length, visibleCount) * cardStep)
    setPositionOffset((offset) => Math.min(offset, nextMaxOffset))
  }, [visibleCount, movies.length, cardStep])

  const resetDrag = () => {
    setIsDragging(false)
    setDragOffsetX(0)

    const viewport = viewportRef.current
    if (viewport && pointerIdRef.current !== null && viewport.hasPointerCapture(pointerIdRef.current)) {
      viewport.releasePointerCapture(pointerIdRef.current)
    }

    pointerIdRef.current = null
  }

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (isSliding) return

    dragStartXRef.current = event.clientX
    pointerIdRef.current = event.pointerId
    didDragRef.current = false
    setDragOffsetX(0)
  }

  const handlePointerMove = (event) => {
    if (pointerIdRef.current === null || event.pointerId !== pointerIdRef.current) return

    const nextOffset = event.clientX - dragStartXRef.current

    if (!didDragRef.current) {
      if (Math.abs(nextOffset) < DRAG_THRESHOLD) return

      didDragRef.current = true
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    setDragOffsetX(nextOffset)
  }

  const handlePointerEnd = (event) => {
    if (pointerIdRef.current === null || event.pointerId !== pointerIdRef.current) return

    if (!didDragRef.current) {
      resetDrag()
      return
    }

    const deltaX = event.clientX - dragStartXRef.current

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const nextPosition = Math.min(maxOffset, Math.max(0, positionOffset - deltaX))
      setPositionOffset(nextPosition)
    } else {
      setPositionOffset((offset) => Math.min(maxOffset, Math.max(0, offset - dragOffsetX)))
    }

    setDragOffsetX(0)
    resetDrag()
  }

  const handleClickCapture = (event) => {
    if (!didDragRef.current) return

    event.preventDefault()
    event.stopPropagation()
    didDragRef.current = false
  }

  const slide = (direction) => {
    if (isSliding) return

    const container = containerRef.current
    if (!container) return

    const nextOffset = direction === 'right'
      ? Math.min(positionOffset + visibleCount * cardStep, maxOffset)
      : Math.max(positionOffset - visibleCount * cardStep, 0)

    if (nextOffset === positionOffset) return

    setIsSliding(true)
    container.style.transition = 'transform 500ms ease-in-out'
    container.style.transform = `translateX(-${nextOffset}px)`

    setTimeout(() => {
      container.style.transition = 'none'
      container.style.removeProperty('transform')
      setPositionOffset(nextOffset)
      setIsSliding(false)
    }, 500)
  }

  return (
    <div className="flex items-center justify-center mx-auto relative" style={{ maxWidth: '1680px' }}>
      <button
        onClick={() => slide('left')}
        disabled={!canGoPrev}
        className="shrink-0 w-8 h-12 flex items-center justify-center absolute left-0 top-[-20px] md:top-1/2 -translate-y-1/2 pb-5 z-99
                   text-6xl text-blue-500 hover:text-white bg-black/40
                   disabled:opacity-0 disabled:pointer-events-none transition-opacity z-99"
      >
        ‹
      </button>

      <div className="flex-1 mx-2 rounded-3xl overflow-hidden py-8" style={sliderStyle}>
        <div
          ref={viewportRef}
          className="min-w-0 overflow-clip select-none"
          style={{
            overflowClipMargin: config.numberBleed ?? '2rem',
            touchAction: 'pan-y',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClickCapture={handleClickCapture}
        >
          <div
            ref={containerRef}
            className="grid"
            style={{
              gap: `${effectiveGap}px`,
              gridTemplateColumns: `repeat(${totalCards}, ${effectiveWidth}px)`,
              transform: `translateX(-${visualOffsetX}px)`,
            }}
          >
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className="overflow-visible"
                style={{ width: `${effectiveWidth}px` }}
              >
                <MovieCard
                  movie={movie}
                  number={index + 1}
                  template={template}
                  cardWidth={effectiveWidth}
                  cardHeight={effectiveHeight}
                  onSelect={onMovieSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => slide('right')}
        disabled={!canGoNext}
        className="shrink-0 w-8 h-12 flex items-center justify-center absolute right-0 top-[-20px] md:top-1/2 -translate-y-1/2 pb-5 z-99
                   text-6xl text-blue-400 hover:text-white bg-black/70
                   disabled:opacity-0 disabled:pointer-events-none transition-opacity z-99"
      >
        ›
      </button>
    </div>
  )
}
