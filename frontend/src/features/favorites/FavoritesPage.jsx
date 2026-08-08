import { useState } from 'react'
import { Header } from '../../components/Header'
import { MovieModal } from '../../components/MovieModal'
import { useFavorites } from './useFavorites'
import { favoriteToContent } from './favoriteNormalizer'
import { FavoritesGrid } from './components/FavoritesGrid'
import { FavoritesEmptyState } from './components/FavoritesEmptyState'
import { RemoveFavoriteConfirm } from './components/RemoveFavoriteConfirm'
import { MAX_FAVORITES } from './constants'

export function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites()
  const [selectedFavorite, setSelectedFavorite] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)

  const handleCloseModal = () => {
    setSelectedFavorite(null)
  }

  const requestRemove = (favorite) => {
    setPendingRemoval(favorite)
  }

  const handleCancelRemove = () => {
    setPendingRemoval(null)
  }

  const handleConfirmRemove = () => {
    if (!pendingRemoval) return

    removeFavorite(pendingRemoval.key)

    if (selectedFavorite?.key === pendingRemoval.key) {
      setSelectedFavorite(null)
    }

    setPendingRemoval(null)
  }

  const selectedContent = selectedFavorite ? favoriteToContent(selectedFavorite) : null
  const selectedMovie = selectedContent?.movie

  return (
    <div className="app-main">
      <Header />

      <main className="px-6 pt-8 pb-16 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-fuchsia-500">Mes favoris</h1>
          <p className="mt-2 text-zinc-400">
            {favorites.length} / {MAX_FAVORITES} favoris enregistres
          </p>
        </div>

        {favorites.length === 0 ? (
          <FavoritesEmptyState />
        ) : (
          <FavoritesGrid
            favorites={favorites}
            onOpen={setSelectedFavorite}
            onRemove={requestRemove}
          />
        )}
      </main>

      <MovieModal
        isOpen={selectedFavorite !== null}
        title={selectedMovie?.title ?? ''}
        description={selectedMovie?.description}
        poster={selectedMovie?.poster}
        modalPoster={selectedMovie?.imgVertical ?? ''}
        year={selectedMovie?.year}
        dateDeSortie={selectedMovie?.dateDeSortie}
        genre={selectedMovie?.genre ?? selectedMovie?.genres}
        stars={selectedMovie?.stars ?? []}
        saison={selectedMovie?.saison ?? selectedMovie?.nbSaisons}
        episodes={selectedMovie?.nbEpisodes ?? ''}
        originCountry={selectedMovie?.originCountry ?? ''}
        trailerUrl={selectedMovie?.trailerUrl ?? ''}
        template={selectedContent?.template}
        favoriteContent={selectedContent}
        onFavoriteRemoveRequest={() => selectedFavorite && requestRemove(selectedFavorite)}
        onClose={handleCloseModal}
      />

      <RemoveFavoriteConfirm
        isOpen={pendingRemoval !== null}
        title={pendingRemoval?.content.title}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </div>
  )
}
