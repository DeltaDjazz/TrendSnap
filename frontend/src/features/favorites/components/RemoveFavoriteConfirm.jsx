export function RemoveFavoriteConfirm({ isOpen, title, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-favorite-title"
      >
        <h2 id="remove-favorite-title" className="text-lg font-semibold text-white">
          Retirer des favoris ?
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          {title ? (
            <>
              Voulez-vous retirer <span className="text-zinc-200">{title}</span> de vos favoris ?
            </>
          ) : (
            'Voulez-vous retirer ce contenu de vos favoris ?'
          )}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            Retirer
          </button>
        </div>
      </div>
    </div>
  )
}
