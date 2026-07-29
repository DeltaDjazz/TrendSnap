import { PROVIDER_IDS, runTmdbProviderSeriesJob } from '../utils/tmdbWatchProviders.mjs';

runTmdbProviderSeriesJob({
    providerId: PROVIDER_IDS.max,
    snapshotFile: 'hbo-series.json',
    label: 'Max (HBO)',
});
