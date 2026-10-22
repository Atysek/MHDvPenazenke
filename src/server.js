import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { getUpcomingDepartures } from './gtfs.js';
import { APP_CONFIG } from './config.js';
import { findActiveGeofence } from './geofence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

export function startServer(port = 3000) {
  const app = express();

  app.use(express.json());
  app.use(express.static(PUBLIC_DIR));

  app.get('/health', (_, res) => {
    res.json({ ok: true, service: 'mhd-kosice-wallet-backend' });
  });

  app.get('/api/config', (_, res) => {
    res.json({
      appName: APP_CONFIG.appName,
      geofences: APP_CONFIG.geofences,
      defaultLocation: APP_CONFIG.defaultLocation,
    });
  });

  app.get('/api/departures/:stopId', async (req, res) => {
    try {
      const { stopId } = req.params;
      const departures = await getUpcomingDepartures(stopId);

      res.json({
        stopId,
        generatedAt: new Date().toISOString(),
        departures,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Unable to fetch upcoming departures',
        details: error.message,
      });
    }
  });

  app.get('/api/nearby-stop', async (req, res) => {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const activeGeofence = findActiveGeofence(latitude, longitude);

    if (!activeGeofence) {
      return res.json({
        status: 'outside_geofence',
        stopId: null,
        stopNameText: 'Mimo zóny',
        geofenceFound: false,
        activeGeofence: null,
        departures: [],
      });
    }

    try {
      const departures = await getUpcomingDepartures(activeGeofence.stopId);

      return res.json({
        status: 'inside_geofence',
        stopId: activeGeofence.stopId,
        stopNameText: activeGeofence.name,
        geofenceFound: true,
        activeGeofence,
        departures,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Unable to fetch departures for nearby geofence',
        details: error.message,
      });
    }
  });

  app.get('*', (_, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  return app;
}
