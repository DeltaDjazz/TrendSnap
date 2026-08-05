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
    <section
      id={id}
      className={`platform-section py-8 pl-4 md:pl-6 ${className}`}
      style={{ borderLeftColor: platform?.colorHex ?? '#52525b' }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 px-2 md:px-4">
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
    </section>
  )
}
