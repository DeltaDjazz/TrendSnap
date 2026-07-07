import { useState } from 'react'
import movies from './data/movies.json'
import netflixSeries from './data/netflix-series.json'
import appleSeries from './data/apple-series.json'
import amazonSeries from './data/amazon-series.json'
import appleMovies from './data/apple-movies.json'
import { TopSlider } from './components/TopSlider'
import { MovieModal } from './components/MovieModal'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="px-6 py-4 border-b border-zinc-600 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">TrendSnap</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          Ouvrir la modale de test
        </button>
      </header>
      <main className="px-0 py-10">
        <h2 className="text-lg text-center font-semibold mb-6">Top 10 des films du moment</h2>
        <TopSlider movies={movies.slice(0, 10)} template="cinema"/>

        <div className="bg-color-red bg-zinc-700/50 pb-10">
          <h2 className="text-lg text-center font-semibold mb-6 mt-10">Top 10 des séries Netflix</h2>
          <TopSlider movies={netflixSeries.slice(0, 10)} template="netflix-series"/>
        </div>

        <div className="">
          <h2 className="text-lg text-center font-semibold  mt-10">Top 10 des séries Apple TV+</h2>
          <TopSlider movies={appleSeries.slice(0, 10)} template="apple-series"/>
        </div>

        <div className="bg-color-red pb-10">
          <h2 className="text-lg text-center font-semibold ">Top 10 des films Apple TV+</h2>
          <TopSlider movies={appleMovies.slice(0, 10)} template="apple-movies"/>
        </div>

        <div className="bg-zinc-700/50 py-10 ">
          <h2 className="text-lg text-center font-semibold mb-6 mt-10">Top 10 des séries Amazon Prime</h2>
          <TopSlider movies={amazonSeries.slice(0, 10)} template="amazon-series"/>
        </div>

      </main>

      <MovieModal
        isOpen={isModalOpen}
        title="Modale de test"
        description="Cette modale est ouverte depuis le bouton en haut de la page."
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default App
