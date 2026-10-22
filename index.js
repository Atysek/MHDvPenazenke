import { ensureGtfsDataLoaded } from './src/gtfs.js';
import { startServer } from './src/server.js';

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  console.log('Starting MHD Košice Wallet backend...');

  // Ensure the GTFS zip is downloaded and unpacked before the server starts.
  await ensureGtfsDataLoaded();

  startServer(PORT);
}

bootstrap().catch((error) => {
  console.error('Unable to start application:', error);
  process.exit(1);
});
