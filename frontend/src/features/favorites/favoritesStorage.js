import { LOCAL_STORAGE_KEY } from './constants'

function isValidFavorite(item) {
  return (
    item &&
    typeof item.key === 'string' &&
    item.content &&
    typeof item.content.title === 'string'
  )
}

/**
 * Charge les favoris depuis le Local Storage.
 * Retourne un tableau vide en cas d'erreur ou de donnees invalides.
 * @returns {object[]}
 */
export function loadFavorites() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.warn('Favoris invalides en Local Storage : format attendu tableau.')
      return []
    }

    return parsed.filter(isValidFavorite)
  } catch {
    console.warn('Favoris invalides en Local Storage, reinitialisation.')
    return []
  }
}

/**
 * Sauvegarde les favoris dans le Local Storage.
 * @param {object[]} favorites
 */
export function saveFavorites(favorites) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites))
  } catch (error) {
    console.warn('Impossible de sauvegarder les favoris:', error)
  }
}
