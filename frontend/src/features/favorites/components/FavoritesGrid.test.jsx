import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FavoritesGrid } from './FavoritesGrid'
import { normalizeFavorite } from '../favoriteNormalizer'
import { createFavoriteContent, createMovie } from '../../../test/testUtils'

describe('FavoritesGrid', () => {
  it('rend une carte par favori', () => {
    const favorites = [
      normalizeFavorite(
        createFavoriteContent({ movie: createMovie({ id: 1, title: 'Un' }) }),
      ),
      normalizeFavorite(
        createFavoriteContent({ movie: createMovie({ id: 2, title: 'Deux' }) }),
      ),
    ]

    render(
      <FavoritesGrid favorites={favorites} onOpen={vi.fn()} onRemove={vi.fn()} />,
    )

    expect(screen.getByAltText('Un')).toBeInTheDocument()
    expect(screen.getByAltText('Deux')).toBeInTheDocument()
  })
})
