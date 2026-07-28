import { FAVORITES_VERSION } from './constants'
import { buildFavoriteKey } from './favoriteKey'

/**
 * Transforme une source tendance en objet favori persistant.
 *
 * Format FavoriteItem :
 * - key, version, addedAt
 * - source: { template, snapshotDate }
 * - content: { title, poster, modalPoster, description, genre, stars, year, dateDeSortie, saison, episodes, originCountry, trailerUrl }
 *
 * @param {{ movie: object, template: string, snapshotDate?: string | null }} content
 * @returns {object}
 */
export function normalizeFavorite(content) {
  const { movie, template, snapshotDate = null } = content

  return {
    key: buildFavoriteKey(content),
    version: FAVORITES_VERSION,
    addedAt: new Date().toISOString(),
    source: {
      template,
      snapshotDate,
    },
    content: {
      title: movie.title ?? '',
      poster: movie.poster ?? '',
      modalPoster: movie.imgVertical ?? '',
      description: movie.description ?? '',
      genre: movie.genre ?? movie.genres ?? [],
      stars: Array.isArray(movie.stars) ? movie.stars : [],
      year: movie.year ?? '',
      dateDeSortie: movie.dateDeSortie ?? '',
      saison: movie.saison ?? movie.nbSaisons ?? '',
      episodes: movie.nbEpisodes ?? '',
      originCountry: movie.originCountry ?? '',
      trailerUrl: movie.trailerUrl ?? '',
    },
  }
}

/**
 * Reconstruit un objet content utilisable par useFavorites et MovieModal.
 * @param {object} favorite
 */
export function favoriteToContent(favorite) {
  const { content, source } = favorite

  return {
    movie: {
      title: content.title,
      poster: content.poster,
      imgVertical: content.modalPoster,
      description: content.description,
      genre: content.genre,
      genres: content.genre,
      stars: content.stars,
      year: content.year,
      dateDeSortie: content.dateDeSortie,
      saison: content.saison,
      nbSaisons: content.saison,
      nbEpisodes: content.episodes,
      originCountry: content.originCountry,
      trailerUrl: content.trailerUrl,
    },
    template: source.template,
    snapshotDate: source.snapshotDate,
  }
}
