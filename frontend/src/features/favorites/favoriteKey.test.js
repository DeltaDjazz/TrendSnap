import { describe, it, expect } from 'vitest'
import { buildFavoriteKey } from './favoriteKey'

describe('buildFavoriteKey', () => {
  it('retourne la clé fournie si elle est déjà présente', () => {
    expect(buildFavoriteKey({ key: 'custom-key', movie: { title: 'A' }, template: 'cinema' })).toBe(
      'custom-key',
    )
  })

  it('utilise l’id du film lorsque disponible', () => {
    expect(
      buildFavoriteKey({
        movie: { id: 42, title: 'Dune' },
        template: 'netflix-movies',
      }),
    ).toBe('netflix-movies|id:42')
  })

  it('construit une clé à partir du titre et de la date sans id', () => {
    expect(
      buildFavoriteKey({
        movie: { title: 'Étoile Filante', dateDeSortie: '2024-05-01' },
        template: 'cinema',
      }),
    ).toBe('cinema|etoile-filante|2024-05-01')
  })

  it('utilise l’année en secours si aucune date de sortie', () => {
    expect(
      buildFavoriteKey({
        movie: { title: 'Sans Date', year: '2023' },
        template: 'apple-movies',
      }),
    ).toBe('apple-movies|sans-date|2023')
  })

  it('gère un titre manquant', () => {
    expect(buildFavoriteKey({ movie: {}, template: 'cinema' })).toBe('cinema|unknown|')
  })
})
