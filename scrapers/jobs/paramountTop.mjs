import { runFlixpatrolJob } from '../utils/flixpatrol.mjs';

runFlixpatrolJob({
    platform: 'paramount-plus',
    snapshotFile: 'paramount-series.json',
    label: 'Paramount+',
});
