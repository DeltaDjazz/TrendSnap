import { useState } from 'react'
import { Header } from '../../components/Header'
import { MovieModal } from '../../components/MovieModal'
import { useFavorites } from './useFavorites'
import { favoriteToContent } from './favoriteNormalizer'
import { FavoritesGrid } from './components/FavoritesGrid'
import { FavoritesEmptyState } from './components/FavoritesEmptyState'
import { MAX_FAVORITES } from './constants'

export function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites()
  const [selectedFavorite, setSelectedFavorite] = useState(null)

  const handleCloseModal = () => {
    setSelectedFavorite(null)
  }

  const selectedContent = selectedFavorite ? favoriteToContent(selectedFavorite) : null
  const selectedMovie = selectedContent?.movie

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="px-6 pt-24 pb-16 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Mes favoris</h1>
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
            onRemove={removeFavorite}
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
        onClose={handleCloseModal}
      />
    </div>
  )
}
