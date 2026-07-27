import { runFlixpatrolJob } from '../utils/flixpatrol.mjs';

runFlixpatrolJob({
    platform: 'hbo-max',
    snapshotFile: 'hbo-series.json',
    label: 'HBO Max',
});
