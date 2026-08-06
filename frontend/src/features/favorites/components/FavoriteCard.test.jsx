import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FavoriteCard } from './FavoriteCard'
import { normalizeFavorite } from '../favoriteNormalizer'
import { createFavoriteContent, createMovie } from '../../../test/testUtils'

describe('FavoriteCard', () => {
  const favorite = normalizeFavorite(
    createFavoriteContent({
      movie: createMovie({ id: 8, title: 'Carte Favorite' }),
    }),
  )

  it('affiche l’image du favori', () => {
    render(<FavoriteCard favorite={favorite} onOpen={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByAltText('Carte Favorite')).toBeInTheDocument()
  })

  it('appelle onOpen au clic sur la carte', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()

    render(<FavoriteCard favorite={favorite} onOpen={onOpen} onRemove={vi.fn()} />)
    await user.click(screen.getByAltText('Carte Favorite'))

    expect(onOpen).toHaveBeenCalledWith(favorite)
  })

  it('appelle onRemove via le bouton de retrait', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(<FavoriteCard favorite={favorite} onOpen={vi.fn()} onRemove={onRemove} />)
    await user.click(
      screen.getByRole('button', { name: /Retirer Carte Favorite des favoris/i }),
    )

    expect(onRemove).toHaveBeenCalledWith(favorite)
  })
})
