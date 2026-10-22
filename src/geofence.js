import { APP_CONFIG } from './config.js';

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function findActiveGeofence(latitude, longitude, geofences = APP_CONFIG.geofences) {
  if (latitude == null || longitude == null) {
    return null;
  }

  const matches = geofences
    .map((geofence) => {
      const distanceMeters = haversineDistanceMeters(
        latitude,
        longitude,
        geofence.latitude,
        geofence.longitude,
      );

      return {
        ...geofence,
        distanceMeters,
        insideRadius: distanceMeters <= geofence.radiusMeters,
      };
    })
    .filter((item) => item.insideRadius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return matches[0] || null;
}

export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}
