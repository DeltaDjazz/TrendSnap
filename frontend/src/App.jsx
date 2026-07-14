import { useState } from 'react'
import movies from './data/movies.json'
import netflixSeries from './data/netflix-series.json'
import appleSeries from './data/apple-series.json'
import amazonSeries from './data/amazon-series.json'
import appleMovies from './data/apple-movies.json'
import { TopSlider } from './components/TopSlider'
import { MovieModal } from './components/MovieModal'

function App() {
  const [selection, setSelection] = useState(null)

  const handleMovieSelect = (movie, template) => {
    setSelection({ movie, template })
  }

  const handleCloseModal = () => {
    setSelection(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="px-6 py-4 border-b border-zinc-600 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">TrendSnap</h1>
      </header>
      <main className="px-0 py-10">
        <h2 className="text-lg text-center font-semibold mb-6">Top 10 des films du moment</h2>
        <TopSlider movies={movies.slice(0, 10)} template="cinema" onMovieSelect={handleMovieSelect} />

        <div className="bg-color-red bg-zinc-700/50 pb-10">
          <h2 className="text-lg text-center font-semibold mb-6 mt-10">Top 10 des séries Netflix</h2>
          <TopSlider movies={netflixSeries.slice(0, 10)} template="netflix-series" onMovieSelect={handleMovieSelect} />
        </div>

        <div className="">
          <h2 className="text-lg text-center font-semibold  mt-10">Top 10 des séries Apple TV+</h2>
          <TopSlider movies={appleSeries.slice(0, 10)} template="apple-series" onMovieSelect={handleMovieSelect} />
        </div>

        <div className="bg-color-red pb-10">
          <h2 className="text-lg text-center font-semibold ">Top 10 des films Apple TV+</h2>
          <TopSlider movies={appleMovies.slice(0, 10)} template="apple-movies" onMovieSelect={handleMovieSelect} />
        </div>

        <div className="bg-zinc-700/50 py-10 ">
          <h2 className="text-lg text-center font-semibold mb-6 mt-10">Top 10 des séries Amazon Prime</h2>
          <TopSlider movies={amazonSeries.slice(0, 10)} template="amazon-series" onMovieSelect={handleMovieSelect} />
        </div>

      </main>

      <MovieModal
        isOpen={selection !== null}
        title={selection?.movie.title ?? ''}
        description={selection?.movie.description}
        poster={selection?.movie.poster}
        year={selection?.movie.year}
        genre={selection?.movie.genre ?? selection?.movie.genres}
        stars={selection?.movie.stars ?? []}
        saison={selection?.movie.saison ?? selection?.movie.nbSaisons}
        episodes={selection?.movie.nbEpisodes ?? ""}
        originCountry={selection?.movie.originCountry ?? ""}
        trailerUrl={selection?.movie.trailerUrl ?? ""}  
        template={selection?.template}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default App
