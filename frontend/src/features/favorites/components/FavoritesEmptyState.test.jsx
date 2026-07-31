import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { FavoritesEmptyState } from './FavoritesEmptyState'
import { renderWithProviders } from '../../../test/testUtils'

describe('FavoritesEmptyState', () => {
  it('affiche le message vide et le lien de retour', () => {
    renderWithProviders(<FavoritesEmptyState />)

    expect(screen.getByText('Aucun favori')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Retour aux tendances/i }),
    ).toHaveAttribute('href', '/')
  })
})
