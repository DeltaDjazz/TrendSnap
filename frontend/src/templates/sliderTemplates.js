import * as cinema from './topSlider/cinema'
import * as netflixSeries from './topSlider/netflix-series'
import * as appleSeries from './topSlider/apple-series'
import * as amazonSeries from './topSlider/amazon-series'
import * as paramount from './topSlider/paramount'
import * as hbo from './topSlider/hbo'

export const SLIDER_TEMPLATES = {
  cinema,
  'netflix-series': netflixSeries,
  'apple-series': appleSeries,
  'apple-movies': appleSeries,
  'amazon-series': amazonSeries,
  'paramount-series': paramount,
  'hbo-series': hbo,
}

export function getSliderTemplate(name) {
  return SLIDER_TEMPLATES[name] ?? SLIDER_TEMPLATES.cinema
}
