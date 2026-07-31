import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { renderWithProviders } from '../test/testUtils'

describe('Header', () => {
  it('affiche la marque et les liens principaux', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('TrendSnap')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Favoris/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Films/Séries').length).toBeGreaterThan(0)
  })

  it('ouvre et ferme le menu mobile', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header />)

    const toggle = screen.getByRole('button', { name: /Toggle menu/i })
    const overlay = document.querySelector('.fixed.inset-0.z-40')

    expect(overlay).toHaveClass('opacity-0')

    await user.click(toggle)
    expect(overlay).toHaveClass('opacity-100')

    await user.click(toggle)
    expect(overlay).toHaveClass('opacity-0')
  })

  it('affiche les catégories désactivées comme non cliquables', () => {
    renderWithProviders(<Header />)

    expect(screen.getAllByText('Mangas')[0].closest('span')).toHaveClass('cursor-not-allowed')
    expect(screen.getAllByText('Musiques')[0].closest('span')).toHaveClass('cursor-not-allowed')
    expect(screen.getAllByText('Livres')[0].closest('span')).toHaveClass('cursor-not-allowed')
  })
})
