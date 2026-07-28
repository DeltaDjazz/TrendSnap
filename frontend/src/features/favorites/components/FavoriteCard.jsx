import { getFavoriteDisplayFormat } from '../favoriteNormalizer'

const ASPECT_CLASSES = {
  landscape: 'aspect-video',
  portrait: 'aspect-[2/3]',
}

export function FavoriteCard({ favorite, onOpen, onRemove }) {
  const { content } = favorite
  const imageSrc = content.poster || content.modalPoster
  const aspectClass = ASPECT_CLASSES[getFavoriteDisplayFormat(favorite)]

  return (
    <article className="mb-4 break-inside-avoid group relative">
      <button
        type="button"
        onClick={() => onOpen(favorite)}
        className="block w-full overflow-hidden rounded-xl bg-zinc-900 cursor-pointer transition hover:scale-[1.02]"
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt={content.title}
            loading="lazy"
            className={`w-full ${aspectClass} object-cover`}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
          <p className="text-sm font-medium text-white truncate">{content.title}</p>
        </div>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onRemove(favorite)
        }}
        className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 hover:text-white"
        aria-label={`Retirer ${content.title} des favoris`}
      >
        ×
      </button>
    </article>
  )
}
