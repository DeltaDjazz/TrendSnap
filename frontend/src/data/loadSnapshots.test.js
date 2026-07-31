import { describe, it, expect } from 'vitest'
import { formatSnapshotDate } from './loadSnapshots'

describe('formatSnapshotDate', () => {
  it('retourne une chaîne vide sans date', () => {
    expect(formatSnapshotDate(null)).toBe('')
    expect(formatSnapshotDate('')).toBe('')
  })

  it('formate une date ISO en français', () => {
    const formatted = formatSnapshotDate('2026-07-20')
    expect(formatted).toMatch(/2026/)
    expect(formatted.toLowerCase()).toMatch(/juillet|july/)
  })
})
