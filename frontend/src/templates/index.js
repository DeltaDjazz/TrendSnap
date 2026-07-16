import * as cinema from './movieCard/cinema'
import * as netflixSeries from './movieCard/netflix-series'
import * as appleSeries from './movieCard/apple-series'
import * as amazonSeries from './movieCard/amazon-series'


export const CARD_TEMPLATES = {
  cinema,
  'netflix-series': netflixSeries,
  'apple-series': appleSeries,
  'apple-movies': appleSeries,
  'amazon-series': amazonSeries,
}

export function getCardTemplate(name) {
  return CARD_TEMPLATES[name] ?? CARD_TEMPLATES.cinema
}
