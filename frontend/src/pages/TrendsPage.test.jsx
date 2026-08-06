import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrendsPage } from './TrendsPage'
import { renderWithProviders } from '../test/testUtils'

vi.mock('../assets/netflix-bgRB.png', () => ({ default: 'netflix-bg.png' }))

vi.mock('../data/loadSnapshots', () => {
  const movie = {
    id: 1,
    title: 'Tendance Test',
    poster: 'https://example.com/poster.jpg',
    imgVertical: 'https://example.com/vertical.jpg',
    description: 'Description tendance',
    genre: ['Action'],
    stars: ['Acteur'],
    year: '2026',
    dateDeSortie: '2026-01-01',
    originCountry: 'FR',
    trailerUrl: '',
  }

  const snapshot = {
    data: [movie],
    snapshotDate: '2026-07-31',
    isFallback: false,
  }

  return {
    loadSnapshot: () => snapshot,
    formatSnapshotDate: (iso) => iso,
  }
})

vi.mock('../components/TopSlider', () => ({
  TopSlider: ({ movies, onMovieSelect, template, snapshotDate }) => (
    <button
      type="button"
      onClick={() => onMovieSelect?.(movies[0], template, snapshotDate)}
    >
      Ouvrir {movies[0]?.title} ({template})
    </button>
  ),
}))

describe('TrendsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('affiche les sections de tendances principales', () => {
    renderWithProviders(<TrendsPage />)

    expect(screen.getByText('Top 10 des films Netflix')).toBeInTheDocument()
    expect(screen.getByText('Top 10 des séries Netflix')).toBeInTheDocument()
    expect(screen.getByText('Top 10 des films cinéma du moment')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TrendSnap' })).toBeInTheDocument()
  })

  it('ouvre la modale au clic sur un film', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TrendsPage />)

    await user.click(screen.getAllByRole('button', { name: /Ouvrir Tendance Test/i })[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tendance Test' })).toBeInTheDocument()
  })
})
