import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoritesPage } from './FavoritesPage'
import { renderWithProviders, createFavoriteContent, createMovie } from '../../test/testUtils'
import { LOCAL_STORAGE_KEY, MAX_FAVORITES } from './constants'
import { normalizeFavorite } from './favoriteNormalizer'

describe('FavoritesPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('affiche l’état vide sans favoris', () => {
    renderWithProviders(<FavoritesPage />, { route: '/favoris' })

    expect(screen.getByRole('heading', { name: 'Mes favoris' })).toBeInTheDocument()
    expect(screen.getByText(`0 / ${MAX_FAVORITES} favoris enregistres`)).toBeInTheDocument()
    expect(screen.getByText('Aucun favori')).toBeInTheDocument()
  })

  it('ouvre une modale au clic sur un favori', async () => {
    const user = userEvent.setup()
    const favorite = normalizeFavorite(
      createFavoriteContent({
        movie: createMovie({ id: 77, title: 'À ouvrir' }),
      }),
    )
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([favorite]))

    renderWithProviders(<FavoritesPage />, { route: '/favoris' })

    expect(screen.getByText(`1 / ${MAX_FAVORITES} favoris enregistres`)).toBeInTheDocument()
    await user.click(screen.getByAltText('À ouvrir'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'À ouvrir' })).toBeInTheDocument()
  })

  it('confirme le retrait d’un favori depuis la grille', async () => {
    const user = userEvent.setup()
    const favorite = normalizeFavorite(
      createFavoriteContent({
        movie: createMovie({ id: 78, title: 'À supprimer' }),
      }),
    )
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([favorite]))

    renderWithProviders(<FavoritesPage />, { route: '/favoris' })

    await user.click(
      screen.getByRole('button', { name: /Retirer À supprimer des favoris/i }),
    )
    expect(screen.getByRole('heading', { name: 'Retirer des favoris ?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retirer' }))
    expect(screen.getByText('Aucun favori')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')).toEqual([])
  })
})
