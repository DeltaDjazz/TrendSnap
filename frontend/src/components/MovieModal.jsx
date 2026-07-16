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
        {/* si label est différent de"Acteurs", alors sur les ecrans petits on affiche pas le label */}
        {label == "Acteurs" && (
          <div className="mt-5">
            <span className="font-semibold uppercase tracking-wider text-zinc-500">{label} : </span>
          </div>
        )}  
        {value}
      </p>
      <p className="hidden md:block text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="hidden md:block mt-1 text-sm text-zinc-300">{value}</p>
    </div>
  )
}

export function MovieModal({ isOpen, title, description, poster, modalPoster, year, genre, saison, episodes, stars, originCountry, trailerUrl, template = 'cinema', onClose }) {
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

  //si modalPoster est egale "", alors isWide est true
  const isWide = modalPoster === "" ? true : false
  const genreLabel = formatGenre(genre)

  const handleBackdropClick = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-mist-600/80"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="flex min-h-full items-center justify-center p-4">
      <div
        className="relative isolate flex w-full max-w-4xl flex-col items-start rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
  
        {/* L'effet lumineux avec z-[-1] ou z-0 */}
        <div className="absolute top-[-3px] left-[-3px] z-[-1] w-[273px] h-[249px] rounded-tl-[20px] rounded-br-[200px] bg-gradient-to-br from-[#3ca2f6] to-transparent filter blur-[5px]" />
        <div className="absolute bottom-[-6px] right-[-6px] z-[-1] w-[273px] h-[249px] rounded-br-[20px] rounded-tl-[200px] bg-gradient-to-br from-[#3ca2f6] to-transparent filter blur-[5px]" />
        {/*<div className="modal-glass-panel">*/}
        <div className="w-full bg-zinc-950 rounded-2xl pb-5">
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className=" z-10 rounded-full  p-2 pr-4 text-2xl text-zinc-400 backdrop-blur-sm transition hover:text-white"
              aria-label="Fermer la modale"
            >
              ×
            </button>
          </div>  

          <div className="flex flex-rows">
            <div className="shrink-0 p-4 ">
              {poster && (
                <img
                  src={modalPoster !== "" ? modalPoster : poster}
                  alt={title}
                  className={`w-36 md:w-60 rounded-lg object-cover ${
                    isWide ? 'aspect-video' : 'aspect-[2/3]'
                  }`}
                />
              )}
              {trailerUrl && (
                <div className="flex flex-col gap-2">
                  <a className="text-sm text-zinc-300 text-center  bg-[#1A2E3E] border border-blue-700/50 px-4 py-2 mt-4 rounded-md" href={trailerUrl} target="_blank" rel="noopener noreferrer">Bande annonce</a>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 p-2 md:p-6 pr-4 md:pr-6 pt-5">
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">{title}</h3>
              <div className="flex flex-col md:flex-row  gap-2">
                <InfoField label="Année" value={year} />
                <InfoField label="Genre" value={genreLabel} />
                {saison && (
                  <InfoField
                    label="saisons & eps"
                    value={
                      <>
                        {saison}
                        <br />
                        {episodes}
                      </>
                    }
                  />
                )}
                <InfoField label="Pays d'origine" value={originCountry} />  
              </div>
              



              {/* on affiche les noms des stars */}
              <InfoField label="Acteurs" value={stars.join(', ')} />
              

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
      </div>
    </div>
  )
}
