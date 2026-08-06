import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { FavoritesProvider } from './FavoritesContext'
import { useFavorites } from './useFavorites'
import { MAX_FAVORITES, LOCAL_STORAGE_KEY } from './constants'
import { createFavoriteContent } from '../../test/testUtils'

function wrapper({ children }) {
  return <FavoritesProvider>{children}</FavoritesProvider>
}

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lève une erreur hors FavoritesProvider', () => {
    expect(() => renderHook(() => useFavorites())).toThrow(
      /FavoritesProvider/,
    )
  })

  it('ajoute, détecte et retire un favori', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })
    const content = createFavoriteContent({ movie: { id: 11, title: 'Ajout' } })

    expect(result.current.count).toBe(0)

    act(() => {
      result.current.addFavorite(content)
    })

    expect(result.current.count).toBe(1)
    expect(result.current.isFavorite(content)).toBe(true)
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))).toHaveLength(1)

    act(() => {
      result.current.removeFavorite(result.current.favorites[0].key)
    })

    expect(result.current.count).toBe(0)
    expect(result.current.isFavorite(content)).toBe(false)
  })

  it('toggleFavorite ajoute puis retire', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })
    const content = createFavoriteContent({ movie: { id: 22, title: 'Toggle' } })

    act(() => {
      result.current.toggleFavorite(content)
    })
    expect(result.current.isFavorite(content)).toBe(true)

    act(() => {
      result.current.toggleFavorite(content)
    })
    expect(result.current.isFavorite(content)).toBe(false)
  })

  it('n’ajoute pas de doublon', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })
    const content = createFavoriteContent({ movie: { id: 33, title: 'Doublon' } })

    act(() => {
      result.current.addFavorite(content)
      result.current.addFavorite(content)
    })

    expect(result.current.count).toBe(1)
  })

  it('respecte la limite MAX_FAVORITES', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      for (let i = 0; i < MAX_FAVORITES; i += 1) {
        result.current.addFavorite(
          createFavoriteContent({ movie: { id: i + 1, title: `Film ${i}` } }),
        )
      }
    })

    expect(result.current.count).toBe(MAX_FAVORITES)
    expect(result.current.isAtLimit).toBe(true)

    act(() => {
      result.current.addFavorite(
        createFavoriteContent({ movie: { id: 999, title: 'Trop' } }),
      )
    })

    expect(result.current.count).toBe(MAX_FAVORITES)
  })

  it('clearFavorites vide la liste', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper })

    act(() => {
      result.current.addFavorite(
        createFavoriteContent({ movie: { id: 1, title: 'A' } }),
      )
      result.current.clearFavorites()
    })

    expect(result.current.count).toBe(0)
  })
})
