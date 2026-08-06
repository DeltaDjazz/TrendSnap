import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RankNumber } from './RankNumber'

describe('RankNumber', () => {
  it('affiche le numéro fourni', () => {
    render(<RankNumber number={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('applique les styles portrait par défaut', () => {
    const { container } = render(<RankNumber number={1} />)
    expect(container.firstChild).toHaveClass('w-12')
  })

  it('applique les styles landscape', () => {
    const { container } = render(<RankNumber number={2} variant="landscape" />)
    expect(container.firstChild).toHaveClass('w-8')
  })
})
