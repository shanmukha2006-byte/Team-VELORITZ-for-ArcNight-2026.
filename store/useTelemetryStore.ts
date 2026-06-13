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
  runAIAnalysis: () => Promise<void>; // Explicit type alignment fix
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
      // Parallel stream acquisition loop
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
        firms: firmsData
      });
      
      // Safe internal call now supported by interface types
      await useTelemetryStore.getState().runAIAnalysis();
    } catch (err: any) {
      set({ error: err.message || 'Unknown network sync discrepancy', loading: false });
    }
  },

  runAIAnalysis: async () => {
    const { neows, donki, firms } = useTelemetryStore.getState();
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neows, donki, firms })
      });
      if (!res.ok) throw new Error('AI analysis path rejected request');
      const data = await res.json();
      set({
        stressIndex: data.globalStressIndex,
        riskSummary: data.riskSummary,
        vulnerableSector: data.vulnerableSector,
        loading: false
      });
    } catch (err) {
      set({ loading: false });
    }
  }
}));

export function useTelemetryPolling() {
  const fetchAllTelemetry = useTelemetryStore((state) => state.fetchAllTelemetry);

  useEffect(() => {
    fetchAllTelemetry();

    const intervalId = setInterval(() => {
      console.log('--- COCKPIT SYNCHRONIZATION RUNNING ---');
      fetchAllTelemetry();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchAllTelemetry]);
}
