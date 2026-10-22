import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const GTFS_ZIP_PATH = path.join(DATA_DIR, 'gtfs.zip');
const GTFS_EXTRACT_DIR = path.join(DATA_DIR, 'gtfs');
const DEMO_GTFS_DIR = path.join(DATA_DIR, 'demo_gtfs');

// Default source for Košice GTFS. Replace this URL if the provider changes.
const DEFAULT_GTFS_URL = process.env.GTFS_URL || 'https://opendata.cityofkosice.sk/gtfs.zip';

let cachedStops = null;
let cachedStopTimes = null;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function parseTimeToSeconds(value) {
  if (!value || typeof value !== 'string') {
    return 0;
  }

  const [hours, minutes, seconds = '0'] = value.split(':').map(Number);
  return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
}

function formatSecondsToTime(totalSeconds) {
  const safe = Number(totalSeconds) || 0;
  const hours = Math.floor(safe / 3600) % 24;
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

async function downloadFile(url, destination) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GTFS download failed with status ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destination, Buffer.from(arrayBuffer));
  console.log(`Downloaded GTFS archive to ${destination}`);
}

function extractZipArchive(zipPath, extractDir) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractDir, true);
  console.log(`Extracted GTFS files to ${extractDir}`);
}

function parseCsvFile(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records;
}

function writeDemoGtfsFiles() {
  const now = new Date();
  const baseMinutes = now.getMinutes();
  const nextTimes = [5, 12, 22, 35, 48, 61].map((offset) => {
    const totalMinutes = baseMinutes + offset;
    const hours = Math.floor(totalMinutes / 60) + now.getHours();
    const minutes = totalMinutes % 60;
    const h = (hours % 24 + 24) % 24;
    const m = minutes;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  });

  const stopsCsv = [
    'stop_id,stop_name,stop_lat,stop_lon,location_type',
    '101,Main Square,48.7202,21.2611,0',
    '102,City Hall,48.7188,21.2589,0',
  ].join('\n');

  const stopTimesCsv = [
    'trip_id,arrival_time,departure_time,stop_id,stop_sequence',
    ...[
      ['T1', nextTimes[0], nextTimes[0], '101', '1'],
      ['T1', nextTimes[1], nextTimes[1], '101', '2'],
      ['T2', nextTimes[2], nextTimes[2], '101', '1'],
      ['T2', nextTimes[3], nextTimes[3], '102', '1'],
      ['T3', nextTimes[4], nextTimes[4], '101', '1'],
      ['T4', nextTimes[5], nextTimes[5], '102', '1'],
    ].map((row) => row.join(',')),
  ].join('\n');

  fs.mkdirSync(DEMO_GTFS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DEMO_GTFS_DIR, 'stops.txt'), stopsCsv);
  fs.writeFileSync(path.join(DEMO_GTFS_DIR, 'stop_times.txt'), stopTimesCsv);

  return { stopsPath: path.join(DEMO_GTFS_DIR, 'stops.txt'), stopTimesPath: path.join(DEMO_GTFS_DIR, 'stop_times.txt') };
}

function resolveGtfsPaths() {
  const extractedStops = path.join(GTFS_EXTRACT_DIR, 'stops.txt');
  const extractedStopTimes = path.join(GTFS_EXTRACT_DIR, 'stop_times.txt');

  if (fs.existsSync(extractedStops) && fs.existsSync(extractedStopTimes)) {
    return { stopsPath: extractedStops, stopTimesPath: extractedStopTimes };
  }

  const demoStops = path.join(DEMO_GTFS_DIR, 'stops.txt');
  const demoStopTimes = path.join(DEMO_GTFS_DIR, 'stop_times.txt');

  if (fs.existsSync(demoStops) && fs.existsSync(demoStopTimes)) {
    return { stopsPath: demoStops, stopTimesPath: demoStopTimes };
  }

  return { stopsPath: extractedStops, stopTimesPath: extractedStopTimes };
}

export async function ensureGtfsDataLoaded(forceReload = false) {
  ensureDataDir();

  const { stopsPath, stopTimesPath } = resolveGtfsPaths();

  if (forceReload || !fs.existsSync(stopsPath) || !fs.existsSync(stopTimesPath)) {
    try {
      if (forceReload || !fs.existsSync(GTFS_ZIP_PATH)) {
        await downloadFile(DEFAULT_GTFS_URL, GTFS_ZIP_PATH);
      }

      if (!fs.existsSync(GTFS_EXTRACT_DIR)) {
        fs.mkdirSync(GTFS_EXTRACT_DIR, { recursive: true });
      }

      extractZipArchive(GTFS_ZIP_PATH, GTFS_EXTRACT_DIR);
    } catch (error) {
      console.warn('GTFS remote download failed. Falling back to local demo GTFS data.', error.message);
      writeDemoGtfsFiles();
    }
  }

  const finalPaths = resolveGtfsPaths();

  if (!fs.existsSync(finalPaths.stopsPath) || !fs.existsSync(finalPaths.stopTimesPath)) {
    writeDemoGtfsFiles();
  }

  if (!cachedStops || !cachedStopTimes) {
    cachedStops = parseCsvFile(finalPaths.stopsPath);
    cachedStopTimes = parseCsvFile(finalPaths.stopTimesPath);
  }

  return {
    stops: cachedStops,
    stopTimes: cachedStopTimes,
  };
}

export async function getUpcomingDepartures(stopId, now = new Date()) {
  const { stopTimes, stops } = await ensureGtfsDataLoaded();

  const stopLookup = new Map(
    stops.map((stop) => [String(stop.stop_id), stop])
  );

  const currentSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const candidates = stopTimes
    .filter((entry) => String(entry.stop_id) === String(stopId))
    .map((entry) => {
      const departureTime = entry.departure_time || entry.arrival_time || '00:00:00';
      let departureSeconds = parseTimeToSeconds(departureTime);

      // GTFS time values can cross midnight. The next valid occurrence is usually
      // the upcoming one, so we shift by a full day when the schedule time is already
      // behind the current clock.
      if (departureSeconds < currentSeconds) {
        departureSeconds += 24 * 3600;
      }

      return {
        tripId: entry.trip_id,
        departureTime,
        departureSeconds,
        minutesUntil: Math.max(0, Math.round((departureSeconds - currentSeconds) / 60)),
        stopName: stopLookup.get(String(stopId))?.stop_name || null,
      };
    })
    .sort((a, b) => a.departureSeconds - b.departureSeconds)
    .slice(0, 5);

  return candidates.map((departure) => ({
    tripId: departure.tripId,
    stopId,
    stopName: departure.stopName,
    departureTime: departure.departureTime,
    departureAt: formatSecondsToTime(departure.departureSeconds),
    minutesUntil: departure.minutesUntil,
  }));
}

// Simple CLI usage for manual testing and later migration to real GTFS-RT.
async function runCli() {
  const action = process.argv[2];

  if (action === 'download') {
    ensureDataDir();
    await downloadFile(DEFAULT_GTFS_URL, GTFS_ZIP_PATH);
    extractZipArchive(GTFS_ZIP_PATH, GTFS_EXTRACT_DIR);
    return;
  }

  if (action === 'sample') {
    const { stopTimes } = await ensureGtfsDataLoaded();
    const exampleStopId = stopTimes[0]?.stop_id || '1';

    console.log('Example stop_id from stop_times.txt:', exampleStopId);
    console.log('Upcoming departures for that stop:');
    console.log(JSON.stringify(await getUpcomingDepartures(exampleStopId), null, 2));
    return;
  }

  console.log('Usage: node src/gtfs.js [download|sample]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli().catch((error) => {
    console.error('GTFS CLI error:', error);
    process.exit(1);
  });
}
