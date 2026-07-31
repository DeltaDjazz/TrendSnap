import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MovieModal } from './MovieModal'
import { renderWithProviders, createFavoriteContent, createMovie } from '../test/testUtils'
import { MAX_FAVORITES, LOCAL_STORAGE_KEY } from '../features/favorites/constants'
import { normalizeFavorite } from '../features/favorites/favoriteNormalizer'

const baseProps = {
  isOpen: true,
  title: 'Film Modal',
  description: 'Description détaillée',
  poster: 'https://example.com/poster.jpg',
  modalPoster: 'https://example.com/vertical.jpg',
  year: '2024',
  dateDeSortie: '2024-06-01',
  genre: ['Action'],
  saison: '',
  episodes: '',
  stars: ['Acteur A'],
  originCountry: 'France',
  trailerUrl: 'https://example.com/trailer',
  onClose: vi.fn(),
}

describe('MovieModal', () => {
  beforeEach(() => {
    localStorage.clear()
    baseProps.onClose = vi.fn()
  })

  it('ne rend rien lorsque fermée', () => {
    const { container } = renderWithProviders(
      <MovieModal {...baseProps} isOpen={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche les informations principales', () => {
    renderWithProviders(<MovieModal {...baseProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Film Modal')).toBeInTheDocument()
    expect(screen.getAllByText('Description détaillée').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Bande annonce/i })).toHaveAttribute(
      'href',
      'https://example.com/trailer',
    )
  })

  it('ferme la modale via le bouton et le backdrop', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MovieModal {...baseProps} />)

    await user.click(screen.getByRole('button', { name: /Fermer la modale/i }))
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('presentation'))
    expect(baseProps.onClose).toHaveBeenCalledTimes(2)
  })

  it('ajoute un favori depuis le bouton étoile', async () => {
    const user = userEvent.setup()
    const favoriteContent = createFavoriteContent({
      movie: createMovie({ id: 55, title: 'Film Modal' }),
    })

    renderWithProviders(
      <MovieModal {...baseProps} favoriteContent={favoriteContent} />,
    )

    await user.click(screen.getByRole('button', { name: /Ajouter aux favoris/i }))
    expect(screen.getByRole('button', { name: /Retirer des favoris/i })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))).toHaveLength(1)
  })

  it('appelle onFavoriteRemoveRequest pour un retrait confirmé', async () => {
    const user = userEvent.setup()
    const favoriteContent = createFavoriteContent({
      movie: createMovie({ id: 56, title: 'À retirer' }),
    })
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify([normalizeFavorite(favoriteContent)]),
    )
    const onFavoriteRemoveRequest = vi.fn()

    renderWithProviders(
      <MovieModal
        {...baseProps}
        favoriteContent={favoriteContent}
        onFavoriteRemoveRequest={onFavoriteRemoveRequest}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Retirer des favoris/i }))
    expect(onFavoriteRemoveRequest).toHaveBeenCalledTimes(1)
  })

  it('affiche un message lorsque la limite de favoris est atteinte', async () => {
    const user = userEvent.setup()
    const favorites = Array.from({ length: MAX_FAVORITES }, (_, i) =>
      normalizeFavorite(
        createFavoriteContent({ movie: createMovie({ id: i + 1, title: `F${i}` }) }),
      ),
    )
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites))

    renderWithProviders(
      <MovieModal
        {...baseProps}
        favoriteContent={createFavoriteContent({
          movie: createMovie({ id: 9999, title: 'Nouveau' }),
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Ajouter aux favoris/i }))
    expect(
      screen.getByText(new RegExp(`limite de ${MAX_FAVORITES} favoris`)),
    ).toBeInTheDocument()
  })
})
