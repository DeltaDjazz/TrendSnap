import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopSlider } from './TopSlider'
import { createMovie } from '../test/testUtils'

const movies = [
  createMovie({ id: 1, title: 'Film Un' }),
  createMovie({ id: 2, title: 'Film Deux' }),
  createMovie({ id: 3, title: 'Film Trois' }),
]

describe('TopSlider', () => {
  it('affiche les cartes du carrousel', () => {
    render(
      <TopSlider movies={movies} template="cinema" snapshotDate="2026-07-31" />,
    )

    expect(screen.getByAltText('Film Un')).toBeInTheDocument()
    expect(screen.getByAltText('Film Deux')).toBeInTheDocument()
    expect(screen.getByAltText('Film Trois')).toBeInTheDocument()
  })

  it('notifie la sélection d’un film', async () => {
    const user = userEvent.setup()
    const onMovieSelect = vi.fn()

    render(
      <TopSlider
        movies={movies}
        template="cinema"
        snapshotDate="2026-07-31"
        onMovieSelect={onMovieSelect}
      />,
    )

    await user.click(screen.getByAltText('Film Un'))
    expect(onMovieSelect).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Film Un' }),
      'cinema',
      '2026-07-31',
    )
  })

  it('désactive le bouton précédent au démarrage', () => {
    render(<TopSlider movies={movies} template="cinema" />)

    expect(screen.getByRole('button', { name: '‹' })).toBeDisabled()
  })
})
