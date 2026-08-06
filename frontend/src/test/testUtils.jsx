import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { FavoritesProvider } from '../features/favorites/FavoritesContext'

/**
 * @param {import('react').ReactElement} ui
 * @param {{ route?: string, withFavorites?: boolean }} [options]
 */
export function renderWithProviders(ui, { route = '/', withFavorites = true } = {}) {
  const content = withFavorites ? (
    <FavoritesProvider>{ui}</FavoritesProvider>
  ) : (
    ui
  )

  return render(
    <MemoryRouter initialEntries={[route]}>
      {content}
    </MemoryRouter>,
  )
}

export function createMovie(overrides = {}) {
  return {
    id: 1,
    title: 'Film Test',
    poster: 'https://example.com/poster.jpg',
    imgVertical: 'https://example.com/vertical.jpg',
    description: 'Une description de test.',
    genre: ['Action', 'Drame'],
    stars: ['Acteur A', 'Acteur B'],
    year: '2024',
    dateDeSortie: '2024-01-15',
    saison: '',
    nbEpisodes: '',
    originCountry: 'France',
    trailerUrl: 'https://example.com/trailer',
    ...overrides,
  }
}

export function createFavoriteContent(overrides = {}) {
  return {
    movie: createMovie(overrides.movie),
    template: overrides.template ?? 'cinema',
    snapshotDate: overrides.snapshotDate ?? '2026-07-31',
    ...overrides,
  }
}
