export const APP_CONFIG = {
  appName: 'MHD Košice Live',
  defaultLocation: {
    latitude: 48.7202,
    longitude: 21.2611,
  },
  geofences: [
    {
      id: 'main-square',
      name: 'Hlavná námestie',
      stopId: '101',
      latitude: 48.7202,
      longitude: 21.2611,
      radiusMeters: 120,
      accent: '#36d39a',
    },
    {
      id: 'city-hall',
      name: 'Radnica',
      stopId: '102',
      latitude: 48.7188,
      longitude: 21.2589,
      radiusMeters: 150,
      accent: '#7aa2ff',
    },
  ],
};

export function updateGeofenceSettings(newGeofences) {
  APP_CONFIG.geofences = Array.isArray(newGeofences) ? newGeofences : APP_CONFIG.geofences;
}
