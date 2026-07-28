import { Link } from 'react-router-dom'

export function FavoritesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <p className="text-6xl mb-4" aria-hidden="true">
        ☆
      </p>
      <h2 className="text-xl font-semibold text-white mb-2">Aucun favori</h2>
      <p className="text-zinc-400 max-w-md mb-8">
        Ajoutez des films ou des series depuis les tendances pour les retrouver ici, meme apres leur disparition du top.
      </p>
      <Link
        to="/"
        className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Retour aux tendances
      </Link>
    </div>
  )
}
