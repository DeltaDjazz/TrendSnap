import { getPlatformById } from '../platforms'
import { SnapshotNotice } from './SnapshotNotice'
import { TopSlider } from './TopSlider'

export function PlatformSection({
  id,
  platformId,
  title,
  snapshot,
  template,
  onMovieSelect,
  className = '',
}) {
  const platform = getPlatformById(platformId)

  return (
    <div
      id={id}
      className={`platform-section py-0 pt-4  ${className}`}
      style={{ borderLeftColor: platform?.colorHex ?? '#52525b' }}
    >
      <div className="flex flex-col items-center gap-3 px-2 md:flex-row md:items-center md:px-4">
        {platform?.logo && (
          <img
            src={platform.logo}
            alt=""
            className="h-7 w-auto max-w-[8rem] object-contain object-left opacity-95"
          />
        )}
        <h2 className="text-lg font-semibold text-zinc-100 md:text-xl">{title}</h2>
      </div>
      <SnapshotNotice {...snapshot} />
      <TopSlider
        movies={snapshot.data.slice(0, 10)}
        template={template}
        snapshotDate={snapshot.snapshotDate}
        onMovieSelect={onMovieSelect}
      />
    </div>
  )
}
