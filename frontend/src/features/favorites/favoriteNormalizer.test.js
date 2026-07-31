import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveDisplayFormat,
  getFavoriteDisplayFormat,
  normalizeFavorite,
  favoriteToContent,
} from './favoriteNormalizer'
import { FAVORITES_VERSION } from './constants'

describe('favoriteNormalizer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-31T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('resolveDisplayFormat', () => {
    it('retourne landscape pour un poster 16/9', () => {
      expect(
        resolveDisplayFormat({ poster: 'p.jpg' }, 'amazon-movies'),
      ).toBe('landscape')
    })

    it('retourne portrait pour un poster 2/3', () => {
      expect(resolveDisplayFormat({ poster: 'p.jpg' }, 'cinema')).toBe('portrait')
    })

    it('retourne portrait si seul le poster modal est présent', () => {
      expect(
        resolveDisplayFormat({ imgVertical: 'v.jpg' }, 'cinema'),
      ).toBe('portrait')
    })

    it('retourne landscape par défaut sans image', () => {
      expect(resolveDisplayFormat({}, 'cinema')).toBe('landscape')
    })
  })

  describe('getFavoriteDisplayFormat', () => {
    it('utilise displayFormat s’il est déjà défini', () => {
      expect(
        getFavoriteDisplayFormat({
          content: { displayFormat: 'landscape' },
          source: { template: 'cinema' },
        }),
      ).toBe('landscape')
    })

    it('recalcule le format à partir du contenu', () => {
      expect(
        getFavoriteDisplayFormat({
          content: { poster: 'p.jpg', modalPoster: '' },
          source: { template: 'cinema' },
        }),
      ).toBe('portrait')
    })
  })

  describe('normalizeFavorite', () => {
    it('normalise un contenu tendance en FavoriteItem', () => {
      const result = normalizeFavorite({
        movie: {
          id: 7,
          title: 'Test',
          poster: 'poster.jpg',
          imgVertical: 'vertical.jpg',
          description: 'Desc',
          genres: ['SF'],
          stars: ['A'],
          year: '2025',
          originCountry: 'US',
          trailerUrl: 'https://t',
        },
        template: 'netflix-movies',
        snapshotDate: '2026-07-31',
      })

      expect(result).toMatchObject({
        key: 'netflix-movies|id:7',
        version: FAVORITES_VERSION,
        addedAt: '2026-07-31T10:00:00.000Z',
        source: { template: 'netflix-movies', snapshotDate: '2026-07-31' },
        content: {
          title: 'Test',
          poster: 'poster.jpg',
          modalPoster: 'vertical.jpg',
          displayFormat: 'landscape',
          description: 'Desc',
          genre: ['SF'],
          stars: ['A'],
          year: '2025',
          originCountry: 'US',
          trailerUrl: 'https://t',
        },
      })
    })
  })

  describe('favoriteToContent', () => {
    it('reconstruit un content utilisable par la modale et les favoris', () => {
      const favorite = normalizeFavorite({
        movie: {
          id: 3,
          title: 'Retour',
          poster: 'p.jpg',
          imgVertical: 'v.jpg',
          description: 'D',
          genre: ['Action'],
          stars: ['X'],
          year: '2022',
          dateDeSortie: '2022-01-01',
          nbSaisons: 2,
          nbEpisodes: 10,
          originCountry: 'FR',
          trailerUrl: 'https://trailer',
        },
        template: 'cinema',
        snapshotDate: '2026-07-20',
      })

      const content = favoriteToContent(favorite)

      expect(content).toMatchObject({
        key: favorite.key,
        template: 'cinema',
        snapshotDate: '2026-07-20',
        movie: {
          title: 'Retour',
          poster: 'p.jpg',
          imgVertical: 'v.jpg',
          description: 'D',
          genre: ['Action'],
          nbSaisons: 2,
          nbEpisodes: 10,
        },
      })
    })
  })
})
