import activeDate from './active-date.json'

// Inclut tous les JSON sous snapshots/<date>/<fichier>.json au build.
const modules = import.meta.glob('./snapshots/*/*.json', {
  eager: true,
  import: 'default',
})

export const dateDuJour = activeDate.dateDuJour

export function loadSnapshot(filename) {
  const path = `./snapshots/${dateDuJour}/${filename}`
  const data = modules[path]

  if (!data) {
    throw new Error(`Snapshot introuvable : ${path}`)
  }

  return data
}
