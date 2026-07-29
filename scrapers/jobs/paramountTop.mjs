import { PROVIDER_IDS, runTmdbProviderSeriesJob } from '../utils/tmdbWatchProviders.mjs';

runTmdbProviderSeriesJob({
    providerId: PROVIDER_IDS.paramountPlus,
    snapshotFile: 'paramount-series.json',
    label: 'Paramount+',
});
