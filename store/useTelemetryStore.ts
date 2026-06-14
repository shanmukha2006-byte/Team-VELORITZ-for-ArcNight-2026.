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
  source: 'ai' | 'fallback';
  loading: boolean;
  error: string | null;
  viewportFocus: 'SOLAR' | 'EARTH';
  selectedAsteroidId: string | null;
  
  fetchAllTelemetry: () => Promise<void>;
  runAIAnalysis: () => Promise<void>;
  logToHistory: () => Promise<void>;
  setViewportFocus: (focus: 'SOLAR' | 'EARTH') => void;
  setSelectedAsteroidId: (id: string | null) => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  neows: [],
  donki: [],
  firms: [],
  stressIndex: 0,
  riskSummary: '',
  vulnerableSector: '',
  source: 'fallback',
  loading: true,
  error: null,
  viewportFocus: 'EARTH',
  selectedAsteroidId: null,

  setViewportFocus: (focus) => set({ viewportFocus: focus }),
  setSelectedAsteroidId: (id) => set({ selectedAsteroidId: id }),

  fetchAllTelemetry: async () => {
    set({ loading: true, error: null });
    try {
      const [neowsRes, donkiRes, firmsRes] = await Promise.all([
        fetch('/api/neows'),
        fetch('/api/donki'),
        fetch('/api/firms')
      ]);

      const neowsData = neowsRes.ok ? await neowsRes.json() : [];
      const donkiData = donkiRes.ok ? await donkiRes.json() : [];
      const firmsData = firmsRes.ok ? await firmsRes.json() : [];

      set({ neows: neowsData, donki: donkiData, firms: firmsData });

      // Trigger AI Analysis with the newly stored data
      await get().runAIAnalysis();
    } catch (err: any) {
      console.error('Error fetching telemetry:', err);
      set({ error: err.message || 'Failed to fetch telemetry data' });
    } finally {
      set({ loading: false });
    }
  },

  runAIAnalysis: async () => {
    const { neows, donki, firms } = get();
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ neows, donki, firms })
      });

      if (!res.ok) {
        throw new Error('AI analysis proxy request failed');
      }

      const data = await res.json();
      set({
        stressIndex: data.globalStressIndex,
        riskSummary: data.riskSummary,
        vulnerableSector: data.vulnerableSector,
        source: data.source || 'fallback'
      });

      // Automatically push result to historical log
      await get().logToHistory();
    } catch (err) {
      console.error('Error triggering AI analysis:', err);
      // Local client-side fallback if the API route itself completely errors out (e.g. network failure)
      const baseScore = 10;
      const hazardousAsteroids = neows.filter(a => a.isPotentiallyHazardous);
      const asteroidsContribution = Math.min(hazardousAsteroids.length * 15, 45);
      const hasG3Plus = donki.some(e => (e.geomagneticScale || '').match(/G[3-5]/i));
      const donkiContribution = hasG3Plus ? 20 : 0;
      const extremeFires = firms.filter(f => f.frpMegawatts > 50);
      const firmsContribution = Math.min(extremeFires.length * 1, 25);
      
      const score = Math.min(Math.max(baseScore + asteroidsContribution + donkiContribution + firmsContribution, 0), 100);
      
      let sector = 'Satellite Communications';
      if (firmsContribution > donkiContribution && firmsContribution > asteroidsContribution) {
        sector = 'Power Grid Infrastructure';
      } else if (asteroidsContribution > donkiContribution && asteroidsContribution > firmsContribution) {
        sector = 'Orbital Assets';
      }

      set({
        stressIndex: score,
        riskSummary: 'Fallback analysis: stress level calculated from raw telemetry due to client-side connection error.',
        vulnerableSector: sector,
        source: 'fallback'
      });

      await get().logToHistory();
    }
  },

  logToHistory: async () => {
    const { stressIndex, riskSummary, vulnerableSector, source } = get();
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stress_index: stressIndex,
          risk_summary: riskSummary,
          vulnerable_sector: vulnerableSector,
          source: source
        })
      });
      if (!res.ok) {
        console.error('SQLite history logging failed:', res.statusText);
      }
    } catch (err) {
      console.error('Database connection error in logToHistory:', err);
    }
  }
}));

export function useTelemetryPolling() {
  const fetchAllTelemetry = useTelemetryStore(state => state.fetchAllTelemetry);

  useEffect(() => {
    // Initial fetch
    fetchAllTelemetry();

    // Set polling interval: 5 minutes (300000ms)
    const interval = setInterval(() => {
      fetchAllTelemetry();
    }, 300000);

    return () => clearInterval(interval);
  }, [fetchAllTelemetry]);
}
