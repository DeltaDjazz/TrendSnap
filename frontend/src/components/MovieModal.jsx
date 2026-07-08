import { useEffect } from 'react'
import { getCardTemplate } from '../templates'

function formatGenre(genre) {
  if (!genre) return null
  if (Array.isArray(genre)) return genre.join(', ')
  return genre
}

function InfoField({ label, value }) {
  if (!value) return null

  return (
    <div className="md:mt-4 md:border rounded-md border-zinc-700 md:p-4 md:bg-zinc-900/70">
      <p className="md:hidden text-sm text-zinc-300">
        <span className="font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="text-zinc-500"> : </span>
        {value}
      </p>
      <p className="hidden md:block text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="hidden md:block mt-1 text-sm text-zinc-300">{value}</p>
    </div>
  )
}

export function MovieModal({ isOpen, title, description, poster, year, genre, saison, template = 'cinema', onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const { config } = getCardTemplate(template)
  const isWide = config.posterAspect === '16/9'
  const genreLabel = formatGenre(genre)

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="relative flex w-full flex-col max-w-3xl items-start overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-zinc-950/80 p-2 text-zinc-400 backdrop-blur-sm transition hover:bg-zinc-800 hover:text-white"
          aria-label="Fermer la modale"
        >
          ×
        </button>

        <div className="flex flex-rows">
          <div className="shrink-0 p-4 ">
            {poster && (
              <img
                src={poster}
                alt={title}
                className={`w-36 rounded-lg object-cover ${
                  isWide ? 'aspect-video' : 'aspect-[2/3]'
                }`}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 p-6 pr-12 pt-5">
            <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
            <div className="flex flex-col md:flex-row  gap-2">
              <InfoField label="Année" value={year} />
              <InfoField label="Genre" value={genreLabel} />
              {saison && (
                <InfoField label="Nombre de saisons" value={saison} />
              )}
            </div>
            

            <div className="hidden md:block mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                {description || 'Aucune description disponible.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:hidden m-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            {description || 'Aucune description disponible.'}
          </p>
        </div>



      </div>   
    </div>
  )
}
