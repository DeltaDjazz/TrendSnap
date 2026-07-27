import { formatSnapshotDate } from '../data/loadSnapshots'

export function SnapshotNotice({ snapshotDate, isFallback }) {
  if (!isFallback || !snapshotDate) return null

  return (
    <p className="mx-auto mb-4 max-w-3xl px-4 text-center text-sm italic text-zinc-400/90">
      Données datant du {formatSnapshotDate(snapshotDate)}
    </p>
  )
}
