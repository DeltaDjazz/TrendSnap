import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import { loadFavorites, saveFavorites } from './favoritesStorage'
import { normalizeFavorite } from './favoriteNormalizer'
import { buildFavoriteKey } from './favoriteKey'
import { MAX_FAVORITES, LOCAL_STORAGE_KEY } from './constants'

export const FavoritesContext = createContext(null)

function sortByAddedAtDesc(favorites) {
  return [...favorites].sort(
    (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
  )
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => sortByAddedAtDesc(loadFavorites()))

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === LOCAL_STORAGE_KEY) {
        setFavorites(sortByAddedAtDesc(loadFavorites()))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addFavorite = useCallback((content) => {
    const key = buildFavoriteKey(content)

    setFavorites((prev) => {
      if (prev.some((f) => f.key === key)) return prev
      if (prev.length >= MAX_FAVORITES) return prev
      return sortByAddedAtDesc([...prev, normalizeFavorite(content)])
    })
  }, [])

  const removeFavorite = useCallback((key) => {
    setFavorites((prev) => prev.filter((f) => f.key !== key))
  }, [])

  const toggleFavorite = useCallback((content) => {
    const key = buildFavoriteKey(content)

    setFavorites((prev) => {
      if (prev.some((f) => f.key === key)) {
        return prev.filter((f) => f.key !== key)
      }
      if (prev.length >= MAX_FAVORITES) return prev
      return sortByAddedAtDesc([...prev, normalizeFavorite(content)])
    })
  }, [])

  const isFavorite = useCallback(
    (content) => {
      const key = buildFavoriteKey(content)
      return favorites.some((f) => f.key === key)
    },
    [favorites],
  )

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  const value = useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      clearFavorites,
      count: favorites.length,
      isAtLimit: favorites.length >= MAX_FAVORITES,
    }),
    [favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, clearFavorites],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
