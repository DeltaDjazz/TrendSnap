import logoNetflix from './assets/logo-netflix.png'
import logoApple from './assets/logo-apple-tv.png'
import logoAmazon from './assets/platforms/amazon.svg'
import logoParamount from './assets/platforms/paramount.svg'
import logoMax from './assets/platforms/max.svg'
import logoCinema from './assets/platforms/cinema.svg'

/** Templates → plateforme (badge modale, etc.) */
export const TEMPLATE_PLATFORM = {
  'netflix-movies': 'netflix',
  'netflix-series': 'netflix',
  'apple-movies': 'apple',
  'apple-series': 'apple',
  'amazon-movies': 'amazon',
  'amazon-series': 'amazon',
  'paramount-series': 'paramount',
  'hbo-series': 'max',
  cinema: 'cinema',
}

export const PLATFORMS = [
  {
    id: 'netflix',
    label: 'Netflix',
    color: 'var(--platform-netflix)',
    colorHex: '#E50914',
    logo: logoNetflix,
    anchor: 'netflix',
  },
  {
    id: 'apple',
    label: 'Apple TV+',
    color: 'var(--platform-apple)',
    colorHex: '#A2AAAD',
    logo: logoApple,
    anchor: 'apple',
  },
  {
    id: 'amazon',
    label: 'Prime Video',
    color: 'var(--platform-amazon)',
    colorHex: '#00A8E1',
    logo: logoAmazon,
    anchor: 'amazon',
  },
  {
    id: 'paramount',
    label: 'Paramount+',
    color: 'var(--platform-paramount)',
    colorHex: '#0064FF',
    logo: logoParamount,
    anchor: 'paramount-hbo',
  },
  {
    id: 'max',
    label: 'Max',
    color: 'var(--platform-max)',
    colorHex: '#B12A9A',
    logo: logoMax,
    anchor: 'paramount-hbo',
  },
  {
    id: 'cinema',
    label: 'Cinéma',
    color: 'var(--platform-cinema)',
    colorHex: '#C9A227',
    logo: logoCinema,
    anchor: 'cinema',
  },
]

export function getPlatformById(id) {
  return PLATFORMS.find((p) => p.id === id) ?? null
}

export function getPlatformForTemplate(template) {
  const id = TEMPLATE_PLATFORM[template]
  return id ? getPlatformById(id) : null
}
