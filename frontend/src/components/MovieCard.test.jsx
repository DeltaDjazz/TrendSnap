import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MovieCard } from './MovieCard'
import { createMovie } from '../test/testUtils'

describe('MovieCard', () => {
  it('affiche le poster, le titre et le rang', () => {
    render(
      <MovieCard
        movie={createMovie({ title: 'Interstellar' })}
        number={3}
        template="cinema"
      />,
    )

    expect(screen.getByAltText('Interstellar')).toBeInTheDocument()
    expect(screen.getByText('Interstellar')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('appelle onSelect au clic et via Entrée', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const movie = createMovie({ title: 'Dune' })

    render(
      <MovieCard movie={movie} number={1} template="cinema" onSelect={onSelect} />,
    )

    await user.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(movie, 'cinema')

    onSelect.mockClear()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(movie, 'cinema')
  })

  it('empêche le menu contextuel', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <MovieCard
        movie={createMovie()}
        number={1}
        template="cinema"
        onSelect={onSelect}
      />,
    )

    const card = screen.getByRole('button')
    await user.pointer({ keys: '[MouseRight>]', target: card })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
