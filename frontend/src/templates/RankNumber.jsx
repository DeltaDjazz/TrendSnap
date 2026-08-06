const PLACEMENT_STYLES = {
  beside: {
    className:
      'pointer-events-none absolute bottom-8 left-0 z-0 flex items-end font-black leading-none text-stroke-rank select-none',
    getFontSize: (isPortrait, isDouble, size) =>
      size ?? (isPortrait ? (isDouble ? '5.5rem' : '7rem') : isDouble ? '4.5rem' : '5.5rem'),
  },
  overlay: {
    className:
      'pointer-events-none absolute top-1.5 left-1.5 z-20 flex items-center justify-center font-bold leading-none text-white bg-red-600 rounded-sm select-none',
    getFontSize: (_isPortrait, isDouble) => (isDouble ? '0.6rem' : '0.7rem'),
    getBoxSize: (_isPortrait, isDouble) => (isDouble ? '1.375rem' : '1.25rem'),
  },
}

export function RankNumber({
  number,
  variant = 'portrait',
  size,
  placement = 'beside',
  className = '',
}) {
  const isPortrait = variant === 'portrait'
  const isDouble = String(number).length > 1
  const styles = PLACEMENT_STYLES[placement]
  const fontSize = styles.getFontSize(isPortrait, isDouble, size)
  const boxSize = styles.getBoxSize?.(isPortrait, isDouble)

  return (
    <div
      className={`${styles.className} ${className}`.trim()}
      style={{
        fontSize,
        ...(boxSize ? { width: boxSize, height: boxSize } : {}),
      }}
      aria-hidden="true"
    >
      {number}
    </div>
  )
}
