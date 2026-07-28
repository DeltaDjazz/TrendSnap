export function FavoriteCard({ favorite, onOpen, onRemove }) {
  const { content } = favorite
  const hasVerticalPoster = content.modalPoster && content.modalPoster !== ''
  const aspectClass = hasVerticalPoster ? 'aspect-[2/3]' : 'aspect-video'

  return (
    <article className="mb-4 break-inside-avoid group relative">
      <button
        type="button"
        onClick={() => onOpen(favorite)}
        className="block w-full overflow-hidden rounded-xl bg-zinc-900 cursor-pointer transition hover:scale-[1.02]"
      >
        <img
          src={content.poster}
          alt={content.title}
          loading="lazy"
          className={`w-full ${aspectClass} object-cover`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
          <p className="text-sm font-medium text-white truncate">{content.title}</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onRemove(favorite.key)}
        className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 hover:text-white"
        aria-label={`Retirer ${content.title} des favoris`}
      >
        ×
      </button>
    </article>
  )
}
