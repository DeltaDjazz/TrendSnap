import { FavoriteCard } from './FavoriteCard'

export function FavoritesGrid({ favorites, onOpen, onRemove }) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {favorites.map((favorite) => (
        <FavoriteCard
          key={favorite.key}
          favorite={favorite}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
