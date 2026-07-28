function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {{ key?: string, movie: object, template: string }} content
 * @returns {string}
 */
export function buildFavoriteKey(content) {
  if (content.key) return content.key

  const { movie, template } = content

  if (movie?.id != null) {
    return `${template}|id:${movie.id}`
  }

  const title = slugify(movie?.title ?? 'unknown')
  const datePart = movie?.dateDeSortie || movie?.year || ''
  return `${template}|${title}|${datePart}`
}
