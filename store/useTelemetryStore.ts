import { create } from 'zustand';
import { useEffect } from 'react';
import { NeoWSAsteroid, DonkiEvent, FirmsHotspot } from '../types';

interface TelemetryState {
  neows: NeoWSAsteroid[];
  donki: DonkiEvent[];
  firms: FirmsHotspot[];
  stressIndex: number;
  riskSummary: string;
  vulnerableSector: string;
  loading: boolean;
  error: string | null;
  fetchAllTelemetry: () => Promise<void>;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  neows: [],
  donki: [],
  firms: [],
  stressIndex: 0,
  riskSummary: '',
  vulnerableSector: '',
  loading: true,
  error: null,

  fetchAllTelemetry: async () => {
    set({ loading: true, error: null });
    try {
      // Execute multi-threaded API requests in parallel
      const [neoRes, donkiRes, firmsRes] = await Promise.all([
        fetch('/api/neows'),
        fetch('/api/donki'),
        fetch('/api/firms')
      ]);

      if (!neoRes.ok || !donkiRes.ok || !firmsRes.ok) {
        throw new Error('One or more telemetry streaming channels failed to sync.');
      }

      const neowsData = await neoRes.json();
      const donkiData = await donkiRes.json();
      const firmsData = await firmsRes.json();

      set({
        neows: neowsData,
        donki: donkiData,
        firms: firmsData,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Unknown network sync discrepancy', loading: false });
    }
  }
}));

/**
 * Anti-Gravity Custom Hook: Managed Network Polling
 * Automates 5-minute background sweeps to refresh dashboard state safely.
 */
export function useTelemetryPolling() {
  const fetchAllTelemetry = useTelemetryStore((state) => state.fetchAllTelemetry);

  useEffect(() => {
    fetchAllTelemetry();

    const intervalId = setInterval(() => {
      console.log('--- COCKPIT SYNCHRONIZATION RUNNING ---');
      fetchAllTelemetry();
    }, 5 * 60 * 1000); // Strict 5-minute cooldown loop

    return () => clearInterval(intervalId);
  }, [fetchAllTelemetry]);
}
