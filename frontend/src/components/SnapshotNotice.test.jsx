import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SnapshotNotice } from './SnapshotNotice'

vi.mock('../data/loadSnapshots', () => ({
  formatSnapshotDate: (isoDate) => `FORMATTED:${isoDate}`,
}))

describe('SnapshotNotice', () => {
  it('ne rend rien hors fallback', () => {
    const { container } = render(
      <SnapshotNotice snapshotDate="2026-07-31" isFallback={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('ne rend rien sans date', () => {
    const { container } = render(
      <SnapshotNotice snapshotDate={null} isFallback />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche la date formatée en fallback', () => {
    render(<SnapshotNotice snapshotDate="2026-07-20" isFallback />)
    expect(screen.getByText(/Données datant du FORMATTED:2026-07-20/)).toBeInTheDocument()
  })
})
