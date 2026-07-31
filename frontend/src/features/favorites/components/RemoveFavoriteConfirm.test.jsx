import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RemoveFavoriteConfirm } from './RemoveFavoriteConfirm'

describe('RemoveFavoriteConfirm', () => {
  it('ne rend rien lorsque fermée', () => {
    const { container } = render(
      <RemoveFavoriteConfirm isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche le titre concerné et gère confirmer / annuler', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <RemoveFavoriteConfirm
        isOpen
        title="Mon Film"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Mon Film')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Retirer' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
