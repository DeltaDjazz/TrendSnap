import { useEffect, useState } from 'react'
import { useFavorites } from '../features/favorites/useFavorites'
import { MAX_FAVORITES } from '../features/favorites/constants'
import { getPlatformForTemplate } from '../platforms'
import { getCardTemplate } from '../templates/cardTemplates'

function formatGenre(genre) {
  if (!genre) return null
  if (Array.isArray(genre)) return genre.join(', ')
  return genre
}

function trailerHost(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube'
    if (host.includes('dailymotion')) return 'dailymotion'
    return 'other'
  } catch {
    return 'other'
  }
}

function trailerButtonClass(host) {
  if (host === 'youtube') {
    return 'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-red)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110'
  }
  if (host === 'dailymotion') {
    return 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#00A8E1] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110'
  }
  return 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15'
}

function MetaChip({ children }) {
  if (!children) return null
  return (
    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300">
      {children}
    </span>
  )
}

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

export function MovieModal({
  isOpen,
  title,
  description,
  poster,
  modalPoster,
  year,
  dateDeSortie,
  genre,
  saison,
  episodes,
  stars = [],
  originCountry,
  trailerUrl,
  backdropUrl = '',
  template = 'cinema',
  favoriteContent,
  onFavoriteRemoveRequest,
  onClose,
}) {
  const { toggleFavorite, isFavorite, isAtLimit } = useFavorites()
  const [limitMessage, setLimitMessage] = useState(false)

  useEffect(() => {
    if (!isOpen) setLimitMessage(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const platform = getPlatformForTemplate(template)
  const genreLabel = formatGenre(genre)
  const posterAspect = getCardTemplate(template).config.posterAspect
  const resolvedBackdropUrl =
    backdropUrl || (posterAspect === '16/9' ? poster || '' : '')
  const isRich = Boolean(resolvedBackdropUrl)
  const posterSrc = modalPoster || poster
  const host = trailerHost(trailerUrl)
  const favorited = favoriteContent ? isFavorite(favoriteContent) : false

  const saisonLabel = saison
    ? !isNaN(Number(saison))
      ? `${saison} ${Number(saison) === 1 ? 'saison' : 'saisons'}`
      : String(saison)
    : null

  const episodesLabel = episodes
    ? !isNaN(Number(episodes))
      ? `${episodes} ${Number(episodes) === 1 ? 'épisode' : 'épisodes'}`
      : String(episodes)
    : null

  const handleToggleFavorite = () => {
    if (!favoriteContent) return
    if (favorited) {
      if (onFavoriteRemoveRequest) {
        onFavoriteRemoveRequest()
        return
      }
      toggleFavorite(favoriteContent)
      return
    }
    if (isAtLimit) {
      setLimitMessage(true)
      return
    }
    setLimitMessage(false)
    toggleFavorite(favoriteContent)
  }

  const infoRows = [
    dateDeSortie ? { label: 'Date de sortie', value: dateDeSortie } : year ? { label: 'Année', value: year } : null,
    genreLabel ? { label: 'Genre', value: genreLabel } : null,
    saisonLabel ? { label: 'Saison(s)', value: saisonLabel } : null,
    episodesLabel ? { label: 'Épisodes', value: episodesLabel } : null,
    originCountry ? { label: 'Pays', value: originCountry } : null,
    platform ? { label: 'Plateforme', value: platform.label } : null,
  ].filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-center justify-center p-3 md:p-6">
        <div
          className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg-elevated)] shadow-2xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {isRich && (
            <div className="relative h-36 w-full md:h-52">
              <img src={resolvedBackdropUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-[var(--bg-elevated)]/50 to-transparent" />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-20 rounded-full bg-black/50 px-3 py-1 text-xl text-zinc-300 backdrop-blur-sm transition hover:text-white"
            aria-label="Fermer la modale"
          >
            ×
          </button>

          <div className={`relative px-4 pb-6 md:px-6 ${isRich ? '-mt-10 md:-mt-14' : 'pt-10'}`}>
            <div className="flex flex-col gap-5 md:flex-row md:gap-6">
              {posterSrc && (
                <div className="mx-auto w-36 shrink-0 md:mx-0 md:w-44">
                  <img
                    src={posterSrc}
                    alt={title}
                    className="w-full rounded-xl border border-white/10 object-cover shadow-lg aspect-[2/3]"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold text-white md:text-3xl">{title}</h3>
                  {platform && (
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ borderColor: platform.colorHex, backgroundColor: `${platform.colorHex}22` }}
                    >
                      {platform.label}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <MetaChip>{dateDeSortie || year}</MetaChip>
                  <MetaChip>{genreLabel}</MetaChip>
                  <MetaChip>{saisonLabel}</MetaChip>
                  <MetaChip>{episodesLabel}</MetaChip>
                  <MetaChip>{originCountry}</MetaChip>
                </div>

                {limitMessage && (
                  <p className="mt-3 text-sm text-amber-400">
                    Vous avez atteint la limite de {MAX_FAVORITES} favoris.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {trailerUrl && (
                    <a
                      href={trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={trailerButtonClass(host)}
                    >
                      <IconPlay />
                      Bande-annonce
                    </a>
                  )}
                  {favoriteContent && (
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                        favorited
                          ? 'border-[var(--accent-red)]/50 bg-[var(--accent-red)]/15 text-[var(--accent-red)]'
                          : 'border-white/20 bg-transparent text-white hover:bg-white/5'
                      }`}
                    >
                      <IconHeart filled={favorited} className="h-4 w-4" />
                      {favorited ? 'Dans les favoris' : 'Ajouter aux favoris'}
                    </button>
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Synopsis</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                    {description || 'Aucune description disponible.'}
                  </p>
                </div>

                {isRich ? (
                  Array.isArray(stars) && stars.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Acteurs principaux
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">{stars.join(', ')}</p>
                    </div>
                  )
                ) : (
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Informations disponibles
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
                      {infoRows.map((row) => (
                        <li key={row.label}>
                          <span className="text-zinc-500">{row.label} : </span>
                          {row.value}
                        </li>
                      ))}
                    </ul>
                    {infoRows.length < 4 && (
                      <p className="mt-3 text-xs text-zinc-500">
                        Certaines informations ne sont pas encore disponibles pour ce titre.
                      </p>
                    )}
                    {Array.isArray(stars) && stars.length > 0 && (
                      <p className="mt-3 text-sm text-zinc-300">
                        <span className="text-zinc-500">Acteurs : </span>
                        {stars.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
