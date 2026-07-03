import * as cinema from './cinema'
import * as netflixSeries from './netflix-series'
import * as appleSeries from './apple-series'
import * as amazonSeries from './amazon-series'


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
