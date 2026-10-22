const statusPill = document.getElementById('statusPill');
const stopName = document.getElementById('stopName');
const stopCode = document.getElementById('stopCode');
const geoStatus = document.getElementById('geoStatus');
const updatedAt = document.getElementById('updatedAt');
const departuresList = document.getElementById('departuresList');
const locateButton = document.getElementById('locateButton');

function renderDepartures(items) {
  departuresList.innerHTML = '';

  if (!items || items.length === 0) {
    departuresList.innerHTML = '<li class="departures-empty">Žiadne odchody v najbližšom čase.</li>';
    return;
  }

  items.forEach((departure, index) => {
    const item = document.createElement('li');
    item.className = 'departure-item';

    const line = document.createElement('div');
    line.className = 'departure-line';
    line.textContent = `L${index + 1}`;

    const main = document.createElement('div');
    main.className = 'departure-main';
    main.innerHTML = `
      <strong>${departure.tripId || 'Linka'}</strong>
      <span>${departure.stopName || 'Zastávka'}</span>
    `;

    const time = document.createElement('div');
    time.className = 'departure-time';
    time.innerHTML = `
      <strong>${departure.minutesUntil} min</strong>
      <span>${departure.departureTime}</span>
    `;

    item.append(line, main, time);
    departuresList.appendChild(item);
  });
}

async function fetchNearbyStop(latitude, longitude) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  const response = await fetch(`/api/nearby-stop?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Nepodarilo sa načítať údaje');
  }

  return response.json();
}

function updateCard(data) {
  const { stopId, stopNameText, activeGeofence, departures } = data;

  stopName.textContent = activeGeofence?.name || stopNameText || 'Zastávka mimo dosahu';
  stopCode.textContent = stopId || '—';
  geoStatus.textContent = activeGeofence ? 'V geofence' : 'Mimo zóny';
  updatedAt.textContent = new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

  statusPill.textContent = activeGeofence ? `V dosahu: ${activeGeofence.name}` : 'Mimo geofence';
  renderDepartures(departures || []);
}

locateButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    statusPill.textContent = 'Geolokácia nie je podporovaná';
    return;
  }

  statusPill.textContent = 'Získavam polohu…';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const payload = await fetchNearbyStop(position.coords.latitude, position.coords.longitude);
        updateCard(payload);
      } catch (error) {
        statusPill.textContent = 'Chyba pri načítaní';
        console.error(error);
      }
    },
    () => {
      statusPill.textContent = 'Povolenie polohy bolo zamietnuté';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

(async () => {
  try {
    statusPill.textContent = 'Načítavam demo kartu…';
    const defaultPayload = await fetchNearbyStop(48.7202, 21.2611);
    updateCard(defaultPayload);
  } catch (error) {
    statusPill.textContent = 'Chyba demo režimu';
    console.error(error);
  }
})();
