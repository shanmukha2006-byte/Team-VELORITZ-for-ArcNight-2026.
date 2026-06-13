import { NeoWSAsteroid, DonkiEvent, FirmsHotspot } from '../types';

/**
 * NASA NeoWS (Near-Earth Object Web Service) Ingestion
 * Parses daily nested hazard tracking streams into flat TypeScript objects.
 */
export async function fetchNeoWS(): Promise<NeoWSAsteroid[]> {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  const today = new Date().toISOString().split('T')[0];
  try {
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const rawAsteroids = data.near_earth_objects?.[today] || [];
    return rawAsteroids.map((ast: any) => ({
      id: ast.id,
      name: ast.name,
      estimatedDiameterMeters: ast.estimated_diameter?.meters?.estimated_diameter_max || 0,
      relativeVelocityKmS: parseFloat(ast.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '0'),
      missDistanceKm: parseFloat(ast.close_approach_data?.[0]?.miss_distance?.kilometers || '0'),
      isPotentiallyHazardous: ast.is_potentially_hazardous_asteroid || false,
    }));
  } catch (e) {
    return [];
  }
}

/**
 * NASA DONKI (Space Weather Notification) Ingestion
 * Scans loose text message structures with Regex to isolate Kp indices and solar speeds.
 */
export async function fetchDonki(): Promise<DonkiEvent[]> {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 7);
  const startDate = targetDate.toISOString().split('T')[0];
  try {
    const res = await fetch(`https://api.nasa.gov/DONKI/notifications?startDate=${startDate}&type=all&api_key=${apiKey}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 15).map((item: any) => {
      const msgBody = item.messageBody || '';
      let geoScale = 'none';
      const kpMatch = msgBody.match(/G[1-5]/i);
      if (kpMatch) geoScale = kpMatch[0].toUpperCase();
      let velocity: number | null = null;
      const speedMatch = msgBody.match(/speed\s*=\s*([0-9.]+)\s*km\/s/i);
      if (speedMatch) velocity = parseFloat(speedMatch[1]);
      return {
        id: item.messageId,
        eventType: item.messageType,
        startTime: item.messageIssueTime,
        geomagneticScale: geoScale,
        plasmaVelocityKmS: velocity
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * NASA FIRMS (Fire Information for Resource Management System) Ingestion
 * Converts streaming comma-separated values (CSV) lines cleanly into a structural matrix.
 */
export async function fetchFirms(): Promise<FirmsHotspot[]> {
  const today = new Date().toISOString().split('T')[0];
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/8ff9bebc7cb7bf010534da54f3b7e7b5/MODIS_NRT/world/1/${today}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const csvText = await res.text();
    const lines = csvText.split('\n');
    const hotspots: FirmsHotspot[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < 6) continue;
      const latitude = parseFloat(row[0]);
      const longitude = parseFloat(row[1]);
      const frpMegawatts = parseFloat(row[5]);
      const acquiredDate = row[6];
      if (!isNaN(latitude) && !isNaN(longitude)) {
        hotspots.push({ latitude, longitude, frpMegawatts, acquiredDate });
      }
    }
    return hotspots;
  } catch (e) {
    return [];
  }
}
