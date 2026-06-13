import { NeoWSAsteroid, DonkiEvent, FirmsHotspot } from '../types';

// Helper to get NASA API key from environment
function getApiKey(): string {
  const envKey = process.env.NASA_API_KEY;
  return !envKey || envKey.trim() === '' ? 'DEMO_KEY' : envKey;
}

/**
 * Fetches today's Near-Earth Objects (asteroids) from NASA's NeoWS API.
 */
export async function fetchNeoWS(): Promise<NeoWSAsteroid[]> {
  try {
    const apiKey = getApiKey();
    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`NeoWS fetch failed with status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const asteroids: NeoWSAsteroid[] = [];
    const days = data.near_earth_objects || {};

    for (const date in days) {
      const dayList = days[date];
      if (Array.isArray(dayList)) {
        for (const neo of dayList) {
          const approach = neo.close_approach_data?.[0];
          const estimatedDiameterMin = neo.estimated_diameter?.meters?.estimated_diameter_min || 0;
          const estimatedDiameterMax = neo.estimated_diameter?.meters?.estimated_diameter_max || 0;

          asteroids.push({
            id: neo.id,
            name: neo.name,
            estimatedDiameterMeters: (estimatedDiameterMin + estimatedDiameterMax) / 2,
            relativeVelocityKmS: parseFloat(approach?.relative_velocity?.kilometers_per_second || '0'),
            missDistanceKm: parseFloat(approach?.miss_distance?.kilometers || '0'),
            isPotentiallyHazardous: !!neo.is_potentially_hazardous_asteroid
          });
        }
      }
    }

    return asteroids;
  } catch (error) {
    console.error('Error fetching NeoWS data:', error);
    return [];
  }
}

/**
 * Fetches space weather events from NASA's DONKI notifications API for the last 7 days.
 */
export async function fetchDonki(): Promise<DonkiEvent[]> {
  try {
    const apiKey = getApiKey();
    const todayDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(todayDate.getDate() - 7);
    
    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = todayDate.toISOString().split('T')[0];
    const url = `https://api.nasa.gov/DONKI/notifications?startDate=${startDate}&endDate=${endDate}&type=all&api_key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`DONKI fetch failed with status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: { messageBody?: string; messageID?: string; messageType?: string; messageIssueTime?: string }) => {
      const body = item.messageBody || '';
      
      // Parse Geomagnetic Scale: look for G1 to G5 in the message body
      let geomagneticScale = 'none';
      const scaleMatch = body.match(/\b(G[1-5])\b/i);
      if (scaleMatch) {
        geomagneticScale = scaleMatch[1].toUpperCase();
      }

      // Parse Plasma Velocity: look for velocity/speed km/s details in the message body
      let plasmaVelocityKmS: number | null = null;
      const velocityMatch = body.match(/(?:speed|velocity|speed of)\D*(\d+)(?:\s*km\/s|\s*km\/sec)/i) 
                            || body.match(/(\d+)\s*km\/s/i);
      if (velocityMatch) {
        plasmaVelocityKmS = parseFloat(velocityMatch[1]);
      }

      return {
        id: item.messageID || Math.random().toString(36).substring(7),
        eventType: item.messageType || 'Unknown Alert',
        startTime: item.messageIssueTime || new Date().toISOString(),
        geomagneticScale,
        plasmaVelocityKmS
      };
    });
  } catch (error) {
    console.error('Error fetching DONKI data:', error);
    return [];
  }
}

/**
 * Fetches active wildfire hotspot coordinates from NASA's FIRMS area CSV API for the last 24h.
 */
export async function fetchFirms(): Promise<FirmsHotspot[]> {
  try {
    // FIRMS requires its own free MAP_KEY. If NASA_API_KEY is not set or is DEMO_KEY, 
    // we use DEMO_KEY or a public download fallback.
    const apiKey = getApiKey();
    const today = new Date().toISOString().split('T')[0];

    // If apiKey is DEMO_KEY, the FIRMS endpoint will return 401.
    // In that case, we can return an empty array or simulate/use dummy data for testing.
    if (apiKey === 'DEMO_KEY') {
      console.warn('Using NASA DEMO_KEY - FIRMS API is bypassed to prevent authentication errors.');
      return [];
    }

    // Coordinates: global bounding box -180,-90,180,90
    // Querying last 24h data (1 day)
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/MODIS_NRT/-180,-90,180,90/1`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`FIRMS fetch failed with status: ${res.status}`);
      return [];
    }

    const csvText = await res.text();
    const lines = csvText.split('\n');
    const hotspots: FirmsHotspot[] = [];

    // Skip the header row and iterate
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = line.split(',');
      if (!row || row.length < 7) continue; // Ensures index 5 (frp) and 6 (date) safely exist

      const latitude = parseFloat(row[0]);
      const longitude = parseFloat(row[1]);
      const frpMegawatts = parseFloat(row[5]);
      const acquiredDate = row[6]?.trim() || today;

      if (!isNaN(latitude) && !isNaN(longitude)) {
        hotspots.push({
          latitude,
          longitude,
          frpMegawatts: isNaN(frpMegawatts) ? 0 : frpMegawatts,
          acquiredDate
        });
      }
    }

    return hotspots;
  } catch (error) {
    console.error('Error fetching FIRMS data:', error);
    return [];
  }
}
