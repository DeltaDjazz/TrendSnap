import activeDate from './active-date.json'

// Inclut tous les JSON sous snapshots/<date>/<fichier>.json au build.
const modules = import.meta.glob('./snapshots/*/*.json', {
  eager: true,
  import: 'default',
})

export const dateDuJour = activeDate.dateDuJour

function extractDateFromPath(path) {
  const match = path.match(/\.\/snapshots\/(\d{4}-\d{2}-\d{2})\//)
  return match?.[1] ?? null
}

export function formatSnapshotDate(isoDate) {
  if (!isoDate) return ''
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * @param {string} filename
 * @returns {{ data: unknown[], snapshotDate: string | null, isFallback: boolean }}
 */
export function loadSnapshot(filename) {
  const path = `./snapshots/${dateDuJour}/${filename}`
  const data = modules[path]

  if (data) {
    return { data, snapshotDate: dateDuJour, isFallback: false }
  }

  const suffix = `/${filename}`
  const fallbackPath = Object.keys(modules)
    .filter((key) => key.endsWith(suffix))
    .sort()
    .at(-1)

  if (fallbackPath) {
    const snapshotDate = extractDateFromPath(fallbackPath)
    console.warn(`Snapshot introuvable : ${path} → fallback ${fallbackPath}`)
    return { data: modules[fallbackPath], snapshotDate, isFallback: true }
  }

  console.warn(`Snapshot introuvable : ${path} (section vide)`)
  return { data: [], snapshotDate: null, isFallback: false }
}
