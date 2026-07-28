function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {{ movie: object, template: string }} content
 * @returns {string}
 */
export function buildFavoriteKey(content) {
  const { movie, template } = content

  if (movie?.id != null) {
    return `${template}|id:${movie.id}`
  }

  const title = slugify(movie?.title ?? 'unknown')
  const datePart = movie?.dateDeSortie || movie?.year || ''
  return `${template}|${title}|${datePart}`
}
