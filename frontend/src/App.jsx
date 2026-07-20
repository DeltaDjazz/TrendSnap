import { useState } from 'react'
import movies from './data/movies.json'
import { loadSnapshot } from './data/loadSnapshots'
import { Header } from './components/Header'
import { TopSlider } from './components/TopSlider'
import { MovieModal } from './components/MovieModal'
import { getSliderTemplate } from './templates/sliderTemplates'

import netflixBg from './assets/netflix-bgRB.png'

const netflixSeries = loadSnapshot('netflix-series.json')
const netflixMovies = loadSnapshot('netflix-movies.json')
const appleSeries = loadSnapshot('apple-series.json')
const appleMovies = loadSnapshot('apple-movies.json')
const amazonSeries = loadSnapshot('amazon-series.json')
const amazonMovies = loadSnapshot('amazon-movies.json')

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
      <Header />

      <main className="px-0 py-10">
        <section className="bg-[#620051] py-10">
          <h2 className={`${getSliderTemplate('cinema').config.titleClass}`}>Top 10 des films du moment</h2>
          <TopSlider movies={movies.slice(0, 10)} template="cinema" onMovieSelect={handleMovieSelect} />
        </section>

        {/* Netflix Section */}
        <section
          className="relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${netflixBg})` }}
        >
          <div className="absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <div className="pt-10">
              <h2 className={getSliderTemplate('netflix-series').config.titleClass}>Top 10 des films Netflix</h2>
              <TopSlider movies={netflixMovies.slice(0, 10)} template="netflix-movies" onMovieSelect={handleMovieSelect} />
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FFFFFF] to-transparent" />
            <div className="pt-10">
              <h2 className={getSliderTemplate('netflix-series').config.titleClass}>Top 10 des séries Netflix</h2>
              <TopSlider movies={netflixSeries.slice(0, 10)} template="netflix-series" onMovieSelect={handleMovieSelect} />
            </div>
          </div>
        </section>

        {/* Apple Section */}
        <section className="bg-gray-400">
          <div className="pt-5">
            <h2 className={`${getSliderTemplate('apple-series').config.titleClass} mt-10`}>Top 10 des séries Apple TV+</h2>
            <TopSlider movies={appleSeries.slice(0, 10)} template="apple-series" onMovieSelect={handleMovieSelect} />
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#000] to-transparent" />
          <div className="pb-10 mt-10">
            <h2 className={getSliderTemplate('apple-movies').config.titleClass}>Top 10 des films Apple TV+</h2>
            <TopSlider movies={appleMovies.slice(0, 10)} template="apple-movies" onMovieSelect={handleMovieSelect} />
          </div>
        </section>

        {/* Amazon Section */}
        <section className="bg-blue-700/50">
          <div className="pt-5">
            <h2 className={`${getSliderTemplate('amazon-series').config.titleClass} mt-10`}>Top 10 des séries Amazon Prime</h2>
            <TopSlider movies={amazonSeries.slice(0, 10)} template="amazon-series" onMovieSelect={handleMovieSelect} />
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#000] to-transparent" />
          <div className="pb-10 mt-10 ">
            <h2 className={`${getSliderTemplate('amazon-movies').config.titleClass} mt-10`}>Top 10 des films Amazon Prime</h2>
            <TopSlider movies={amazonMovies.slice(0, 10)} template="amazon-movies" onMovieSelect={handleMovieSelect} />
          </div>
        </section>


      </main>

      <MovieModal
        isOpen={selection !== null}
        title={selection?.movie.title ?? ''}
        description={selection?.movie.description}
        poster={selection?.movie.poster}
        modalPoster={selection?.movie.imgVertical ?? ""}
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
