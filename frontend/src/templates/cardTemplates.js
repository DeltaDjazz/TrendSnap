import * as cinema from './movieCard/cinema'
import * as netflixSeries from './movieCard/netflix-series'
import * as netflixMovies from './movieCard/netflix-movies'
import * as appleSeries from './movieCard/apple-series'
import * as appleMovies from './movieCard/apple-movies'
import * as amazonSeries from './movieCard/amazon-series'
import * as amazonMovies from './movieCard/amazon-movies'

export const CARD_TEMPLATES = {
  cinema,
  'netflix-series': netflixSeries,
  'netflix-movies': netflixMovies,
  'apple-series': appleSeries,
  'apple-movies': appleMovies,
  'amazon-series': amazonSeries,
  'amazon-movies': amazonMovies
}

export function getCardTemplate(name) {
  return CARD_TEMPLATES[name] ?? CARD_TEMPLATES.cinema
}
