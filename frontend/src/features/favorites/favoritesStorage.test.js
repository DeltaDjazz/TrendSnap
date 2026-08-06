import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadFavorites, saveFavorites } from './favoritesStorage'
import { LOCAL_STORAGE_KEY } from './constants'

const validFavorite = {
  key: 'cinema|id:1',
  content: { title: 'Film Test' },
}

describe('favoritesStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('loadFavorites', () => {
    it('retourne un tableau vide si le storage est vide', () => {
      expect(loadFavorites()).toEqual([])
    })

    it('charge et filtre les favoris valides', () => {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify([validFavorite, { key: 1 }, null, { key: 'x', content: {} }]),
      )

      expect(loadFavorites()).toEqual([validFavorite])
    })

    it('retourne un tableau vide si le JSON n’est pas un tableau', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ bad: true }))

      expect(loadFavorites()).toEqual([])
      expect(warn).toHaveBeenCalled()
    })

    it('retourne un tableau vide si le JSON est invalide', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorage.setItem(LOCAL_STORAGE_KEY, '{invalid')

      expect(loadFavorites()).toEqual([])
      expect(warn).toHaveBeenCalled()
    })
  })

  describe('saveFavorites', () => {
    it('persiste les favoris dans le Local Storage', () => {
      saveFavorites([validFavorite])

      expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))).toEqual([validFavorite])
    })

    it('ne lève pas d’erreur si le storage est indisponible', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota')
      })

      expect(() => saveFavorites([validFavorite])).not.toThrow()
      expect(warn).toHaveBeenCalled()
    })
  })
})
