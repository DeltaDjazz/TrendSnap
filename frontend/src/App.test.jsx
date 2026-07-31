import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './test/testUtils'

vi.mock('./pages/TrendsPage', () => ({
  TrendsPage: () => <div>Page Tendances</div>,
}))

vi.mock('./features/favorites/FavoritesPage', () => ({
  FavoritesPage: () => <div>Page Favoris</div>,
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('affiche TrendsPage sur la route racine', () => {
    renderWithProviders(<App />, { route: '/' })
    expect(screen.getByText('Page Tendances')).toBeInTheDocument()
  })

  it('affiche FavoritesPage sur /favoris', () => {
    renderWithProviders(<App />, { route: '/favoris' })
    expect(screen.getByText('Page Favoris')).toBeInTheDocument()
  })
})
