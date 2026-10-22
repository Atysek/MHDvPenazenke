# MHD Košice Wallet Backend

Tento projekt je základ pre backend pre dynamickú kartu v Apple Wallet a Google Wallet, ktorá zobrazuje živé odchody autobusov MHD Košice v podobnom štýle ako "smart card" na uzamknutej obrazovke.

## Obsah

- stiahnutie a rozbalenie statického GTFS zip balíčka z Open Data mesta Košice
- načítanie súborov `stops.txt` a `stop_times.txt`
- funkcia `getUpcomingDepartures(stopId)` pre najbližších 5 odchodov
- geofencing so zónami, ktoré je jednoduché upraviť v konfiguračnom súbore
- jednoduchý preview dizajn karty v prehliadači
- API pre ďalšie rozšírenie o GTFS-RT, Apple Wallet a Google Wallet

## Inštalácia

```bash
npm install
```

## Spustenie aplikácie

```bash
npm start
```

Aplikácia potom beží na porte `3000`.

## API príklad

```bash
curl http://localhost:3000/api/departures/101
curl "http://localhost:3000/api/nearby-stop?latitude=48.7202&longitude=21.2611"
```

## Konfigurácia geofencingu

Súbor [src/config.js](src/config.js) obsahuje zoznam zón:

```js
export const APP_CONFIG = {
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
  ],
};
```

- zmeň `latitude`, `longitude` a `radiusMeters`
- zmeň `stopId` na ID zastávky z GTFS
- pridaj ďalšie geofence jednoducho do poľa `geofences`

## Dizajn karty

Preview karty sa nachádza v [public/index.html](public/index.html) a štýly v [public/styles.css](public/styles.css). Je navrhnutá ako "smart card" so:

- glassmorphism efektom
- farebným akcentom pre aktivnú zastávku
- zoznamom odchodov
- tlačidlom na lokalizáciu používateľa

## Firebase deployment

### 1) Nainštaluj Firebase CLI

```bash
npm install -g firebase-tools
```

### 2) Prihlás sa do Firebase

```bash
firebase login
```

### 3) Inicializuj hosting

```bash
firebase init hosting
```

Pri výbere zvoľ:
- `Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys`
- public directory: `public`
- nastavenie ako single-page app: `No`

### 4) Deploy

```bash
firebase deploy --only hosting
```

### 5) Ak chceš deploy aj Node.js backend

Najjednoduchšie je nasadiť Express API cez Firebase Functions alebo Cloud Run. Pre backend v tomto projekte odporúčam:

- Firebase Functions: export Express app z `src/server.js`
- Cloud Run: JavaScript build a Docker image

Pre tento projekt je momentálne pripravený front-end preview a backend API na lokálnom spustení. Pre produkciu odporúčam Cloud Run, pretože je jednoduchší pre pravidelné polling GTFS + GTFS-RT a prácu s Wallet API.

## Štruktúra projektu

```text
.
├── index.js                  # vstupný bod aplikácie
├── src/
│   ├── config.js             # geofencing konfig, rádio, súradnice
│   ├── geofence.js           # výpočet polohy a vzdialenosti
│   ├── gtfs.js               # stiahnutie GTFS, parsing CSV, getUpcomingDepartures()
│   └── server.js             # Express server a endpointy
├── public/
│   ├── index.html            # smart card UI
│   ├── app.js                # front-end logika
│   └── styles.css            # dizajn karty
├── data/                     # GTFS zip a rozbalené súbory sa uložia sem
├── package.json
├── firebase.json             # Firebase hosting konfigurácia
├── README.md
├── .gitignore
└── .env.example             # príklad pre environment variables
```

## Potrebné npm balíčky

```bash
npm install express adm-zip csv-parse
```

## Ťažiská pre budúce rozšírenie

- GTFS-RT TripUpdates pre meškania a skutočné odchody
- výpočet najbližšej zastávky podľa GPS polohy
- Apple Wallet pass generation (`passkit` / `walletpass`)
- Google Wallet object generation (`google-wallet` / JWT podpisovanie)
- push notifikácie cez APNs a Google push API

## Poznámka

Tento projekt je pripravený ako praktický základ pre ďalší rozvoj. V ďalšom kroku pridáme GTFS-RT integáciu, real-time meškania a vzniknutú Wallet kartu do finálnej podoby pre Apple a Google.
