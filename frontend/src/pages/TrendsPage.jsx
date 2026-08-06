import { useState } from 'react'
import { loadSnapshot } from '../data/loadSnapshots'
import { Header } from '../components/Header'
import { HeroCarousel } from '../components/HeroCarousel'
import { PlatformSection } from '../components/PlatformSection'
import { MovieModal } from '../components/MovieModal'

const cinemaMovies = loadSnapshot('cinema-movies.json')
const cinemaUpcoming = loadSnapshot('cinema-upcoming.json')
const netflixSeries = loadSnapshot('netflix-series.json')
const netflixMovies = loadSnapshot('netflix-movies.json')
const appleSeries = loadSnapshot('apple-series.json')
const appleMovies = loadSnapshot('apple-movies.json')
const amazonSeries = loadSnapshot('amazon-series.json')
const amazonMovies = loadSnapshot('amazon-movies.json')
const paramountSeries = loadSnapshot('paramount-series.json')
const hboSeries = loadSnapshot('hbo-series.json')
const heroSnapshot = loadSnapshot('hero-slides.json')

function extractHeroSlides(snapshot) {
  const raw = snapshot?.data
  if (Array.isArray(raw?.slides)) return raw.slides
  if (Array.isArray(raw)) return raw
  return []
}

export function TrendsPage() {
  const [selection, setSelection] = useState(null)
  const heroSlides = extractHeroSlides(heroSnapshot)

  const handleMovieSelect = (movie, template, snapshotDate) => {
    setSelection({ movie, template, snapshotDate })
  }

  const handleCloseModal = () => {
    setSelection(null)
  }

  return (
    <div className="app-main">
      <Header />

      <main className="px-0 py-6 md:py-8">
        <div className="mb-4 px-4 md:mb-6 md:mx-[30px] md:px-4">
          <h1 className="bg-linear-to-r from-red-500   to-violet-500 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            Retrouvez ici les tendances des plateformes de streaming et de cinéma.
          </h1>
          <p className="text-white/70 mt-2">
            Les tendances sont mises à jour quotidiennement.
          </p>
        </div>
        <HeroCarousel
          slides={heroSlides}
          snapshotDate={heroSnapshot.snapshotDate}
          onOpenSlide={handleMovieSelect}
        />

        

        <div id="netflix" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="netflix"
            title="Top 10 nouveautés films"
            snapshot={netflixMovies}
            template="netflix-movies"
            onMovieSelect={handleMovieSelect}
          />
          <hr className="my-0 border-white/10" />
          <PlatformSection
            platformId="netflix"
            title="Top 10 nouveautés séries"
            snapshot={netflixSeries}
            template="netflix-series"
            onMovieSelect={handleMovieSelect}
          />
        </div>

        <div id="apple" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="apple"
            title="Top 10 nouveautés séries"
            snapshot={appleSeries}
            template="apple-series"
            onMovieSelect={handleMovieSelect}
          />
          <hr className="my-0 border-white/10" />
          <PlatformSection
            platformId="apple"
            title="Top 10 nouveautés films"
            snapshot={appleMovies}
            template="apple-movies"
            onMovieSelect={handleMovieSelect}
          />
        </div>

        <div id="amazon" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="amazon"
            title="Top 10 nouveautés séries"
            snapshot={amazonSeries}
            template="amazon-series"
            onMovieSelect={handleMovieSelect}
          />
          <hr className="my-0 border-white/10" />
          <PlatformSection
            platformId="amazon"
            title="Top 10 nouveautés films"
            snapshot={amazonMovies}
            template="amazon-movies"
            onMovieSelect={handleMovieSelect}
          />
        </div>

        <div id="paramount" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="paramount"
            title="Top 10 nouveautés séries"
            snapshot={paramountSeries}
            template="paramount-series"
            onMovieSelect={handleMovieSelect}
          />
        </div>
        <div id="hbo-max" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="max"
            title="Top 10 nouveautés séries"
            snapshot={hboSeries}
            template="hbo-series"
            onMovieSelect={handleMovieSelect}
          />
        </div>

        <div id="cinema" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="cinema"
            title="Top 10 des films cinéma du moment"
            snapshot={cinemaMovies}
            template="cinema"
            onMovieSelect={handleMovieSelect}
          />
        </div>
        <div id="cinema-upcoming" className="media-section scroll-mt-[calc(var(--header-height)+1rem)]">
          <PlatformSection
            platformId="cinema"
            title="Top 10 des films cinéma à venir"
            snapshot={cinemaUpcoming}
            template="cinema"
            onMovieSelect={handleMovieSelect}
          />
        </div>
      </main>

      <MovieModal
        isOpen={selection !== null}
        title={selection?.movie.title ?? ''}
        description={selection?.movie.description}
        poster={selection?.movie.poster}
        modalPoster={selection?.movie.imgVertical ?? ''}
        year={selection?.movie.year}
        dateDeSortie={selection?.movie.dateDeSortie}
        genre={selection?.movie.genre ?? selection?.movie.genres}
        stars={selection?.movie.stars ?? []}
        saison={selection?.movie.saison ?? selection?.movie.nbSaisons}
        episodes={selection?.movie.nbEpisodes ?? ''}
        originCountry={selection?.movie.originCountry ?? ''}
        trailerUrl={selection?.movie.trailerUrl ?? ''}
        template={selection?.template}
        backdropUrl={selection?.movie.backdropUrl ?? ''}
        favoriteContent={
          selection
            ? {
                movie: selection.movie,
                template: selection.template,
                snapshotDate: selection.snapshotDate ?? null,
              }
            : null
        }
        onClose={handleCloseModal}
      />
    </div>
  )
}
