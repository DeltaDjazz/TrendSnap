import { useEffect, useState } from 'react'
import { useFavorites } from '../features/favorites/useFavorites'
import { MAX_FAVORITES } from '../features/favorites/constants'

const AUTO_MS = 7000
const TRANSITION_MS = 500

function IconPlay({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  )
}

function IconHeart({ className = 'w-4 h-4', filled = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428a5 5 0 1 1 7.5-6.572 5 5 0 1 1 7.5 6.572z" />
    </svg>
  )
}

function formatSaisons(value) {
  if (value == null || value === '') return null
  if (!isNaN(Number(value))) {
    return `${value} ${Number(value) === 1 ? 'saison' : 'saisons'}`
  }
  return String(value)
}

function MetaRow({ slide }) {
  const genre = Array.isArray(slide.genres) ? slide.genres[0] : slide.genre
  const parts = [
    slide.year || null,
    genre || null,
    formatSaisons(slide.nbSaisons),
    slide.runtimeMinutes ? `${slide.runtimeMinutes} min` : null,
    slide.certification || null,
  ].filter(Boolean)

  if (parts.length === 0) return null

  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-200/90">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 && <span className="text-zinc-500" aria-hidden="true">·</span>}
          {part === slide.certification ? (
            <span className="rounded border border-white/40 px-1.5 py-0.5 text-xs font-semibold tracking-wide">
              {part}
            </span>
          ) : (
            part
          )}
        </span>
      ))}
    </p>
  )
}

function slideToMovie(slide) {
  return {
    title: slide.title,
    description: slide.description,
    poster: slide.poster || slide.posterUrl,
    imgVertical: slide.imgVertical || slide.posterUrl,
    backdropUrl: slide.backdropUrl,
    year: slide.year,
    dateDeSortie: slide.dateDeSortie,
    genres: slide.genres,
    genre: slide.genres,
    stars: slide.stars || [],
    nbSaisons: slide.nbSaisons,
    nbEpisodes: slide.nbEpisodes,
    originCountry: slide.originCountry,
    trailerUrl: slide.trailerUrl,
    pageInfosUrl: slide.pageInfosUrl,
  }
}

function SlidePanel({
  slide,
  snapshotDate,
  onOpenSlide,
  limitMessage,
  onLimitMessage,
}) {
  const { toggleFavorite, isFavorite, isAtLimit } = useFavorites()
  const template = slide.template || 'cinema'
  const movie = slideToMovie(slide)
  const favoriteContent = { movie, template, snapshotDate }
  const favorited = isFavorite(favoriteContent)
  const backdrop = slide.backdropUrl || slide.posterUrl || slide.poster

  const handleFavorite = () => {
    if (favorited) {
      toggleFavorite(favoriteContent)
      onLimitMessage(false)
      return
    }
    if (isAtLimit) {
      onLimitMessage(true)
      return
    }
    onLimitMessage(false)
    toggleFavorite(favoriteContent)
  }

  return (
    <div className="relative h-[480px] w-full shrink-0 grow-0 basis-full overflow-hidden bg-black border-3 border-white/25 rounded-2xl">
      <img
        src={backdrop}
        alt=""
        className="absolute top-0 right-0 h-full w-auto max-w-none"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-app)] via-transparent to-black/30" />

      <div className="absolute inset-0 flex flex-col justify-end px-5 pb-14 pt-16 md:px-10 md:pb-16 md:pt-20">
        {slide.badge && (
          <span className="mb-3 inline-flex w-fit rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
            {slide.badge}
          </span>
        )}

        <h2 className="max-w-3xl text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
          {slide.title}
        </h2>

        <MetaRow slide={slide} />

        {slide.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-200 line-clamp-3 md:text-base md:line-clamp-4">
            {slide.description}
          </p>
        )}

        {limitMessage && (
          <p className="mt-3 text-sm text-amber-400">
            Limite de {MAX_FAVORITES} favoris atteinte.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onOpenSlide?.(movie, template, snapshotDate)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-red)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <IconPlay />
            Regarder
          </button>
          <button
            type="button"
            onClick={handleFavorite}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              favorited
                ? 'border-[var(--accent-red)]/50 bg-[var(--accent-red)]/15 text-[var(--accent-red)]'
                : 'border-white/30 bg-black/30 text-white hover:bg-white/10'
            }`}
          >
            <IconHeart filled={favorited} />
            {favorited ? 'Dans les favoris' : 'Ajouter aux favoris'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function HeroCarousel({ slides = [], snapshotDate = null, onOpenSlide }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [limitMessage, setLimitMessage] = useState(false)

  const safeSlides = Array.isArray(slides)
    ? slides.filter((s) => s?.title && (s.backdropUrl || s.posterUrl))
    : []

  useEffect(() => {
    setIndex(0)
  }, [safeSlides.length])

  useEffect(() => {
    if (safeSlides.length < 2 || paused) return undefined
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSlides.length)
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [safeSlides.length, paused])

  if (safeSlides.length === 0) return null

  return (
    <section
      className="relative mb-6 overflow-hidden md:mb-8 md:mx-[30px] md:rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Tendances à la une"
    >
      <p className="absolute top-4 left-5 z-10 text-sm font-semibold tracking-wide text-white/90 md:top-5 md:left-10 md:text-base">
        Notre sélection du jour
      </p>

      <div className="h-[480px] overflow-hidden">
        <div
          className="flex h-full ease-out"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: `transform ${TRANSITION_MS}ms`,
          }}
        >
          {safeSlides.map((slide, i) => (
            <SlidePanel
              key={`${slide.slot ?? i}-${slide.title}`}
              slide={slide}
              snapshotDate={snapshotDate}
              onOpenSlide={onOpenSlide}
              limitMessage={limitMessage && i === index}
              onLimitMessage={setLimitMessage}
            />
          ))}
        </div>
      </div>

      {safeSlides.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
          role="tablist"
          aria-label="Slides hero"
        >
          {safeSlides.map((item, i) => (
            <button
              key={`${item.slot ?? i}-${item.title}-dot`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1} : ${item.title}`}
              onClick={() => setIndex(i)}
              className={`h-3 rounded-sm transition-all ${
                i === index
                  ? 'w-10 bg-[var(--accent-red)]'
                  : 'w-8 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
