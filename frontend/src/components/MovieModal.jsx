export function MovieModal({ isOpen, title, description, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Détails</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Fermer la modale"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          {description || 'Aucune description disponible.'}
        </p>
      </div>
    </div>
  )
}
