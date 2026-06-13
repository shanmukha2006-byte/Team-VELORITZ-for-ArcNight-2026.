'use client';

import React, { useEffect, useState } from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';

export default function RightPanel() {
  const riskSummary = useTelemetryStore((state) => state.riskSummary);
  const vulnerableSector = useTelemetryStore((state) => state.vulnerableSector);
  const loading = useTelemetryStore((state) => state.loading);
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    setTimestamp(new Date().toLocaleTimeString());
  }, [loading, riskSummary]);

  return (
    <div className="flex flex-col h-full bg-[#02040a] border border-slate-900 rounded-md p-4 font-mono text-xs text-green-400 overflow-hidden shadow-[inset_0_0_20px_rgba(34,197,94,0.02)]">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-200">
        <span className="font-bold tracking-widest text-[#fbbf24]">⚡ TEAM VELORITZ :: AI LOG EVALUATOR</span>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
        {loading ? (
          <div className="space-y-2 text-slate-500">
            <p className="animate-pulse">[{timestamp}] SEARCHING QUANTUM GEO-CHANNELS...</p>
            <p className="animate-pulse delay-150">[{timestamp}] COLLECTING SATELLITE ARRAYS...</p>
          </div>
        ) : (
          <div className="space-y-3 transition-all duration-500 animate-fadeIn">
            <div className="p-2.5 bg-[#070d14] border border-slate-900 rounded text-slate-300">
              <span className="text-blue-400 font-bold">[{timestamp}] SECURE VECTOR STATUS:</span>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{riskSummary || "Telemetry array processing standard. No critical anomalies intercepted by core models."}</p>
            </div>

            <div className="p-2.5 bg-[#0f0b08] border border-amber-950/40 rounded text-slate-300">
              <span className="text-amber-400 font-bold">[{timestamp}] MAXIMUM EXPOSURE SECTOR:</span>
              <p className="mt-1 text-xs font-black uppercase tracking-wider text-amber-300">{vulnerableSector || "ORBITAL COMMS ASSETS"}</p>
            </div>

            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-600 space-y-1">
              <p>&gt; COGNITIVE ENGINE: Mistral-7B-Instruct-v0.2</p>
              <p>&gt; SECURE SYSTEM INTEGRITY: 100% OPERATIONAL</p>
              <p>&gt; COCKPIT REFRESH THREAD: 300S RE-COOLDOWN SECURED</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
