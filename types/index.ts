export interface NeoWSAsteroid {
  id: string;
  name: string;
  estimatedDiameterMeters: number;
  relativeVelocityKmS: number;
  missDistanceKm: number;
  isPotentiallyHazardous: boolean;
}

export interface DonkiEvent {
  id: string;
  eventType: string;
  startTime: string;
  geomagneticScale: string; // e.g. "G1"-"G5" or "none"
  plasmaVelocityKmS: number | null;
}

export interface FirmsHotspot {
  latitude: number;
  longitude: number;
  frpMegawatts: number;
  acquiredDate: string;
}

export interface StressIndexResult {
  globalStressIndex: number;
  riskSummary: string;
  vulnerableSector: string;
}
