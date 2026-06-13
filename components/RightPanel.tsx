'use client';

import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { Shield, Cpu, HardDrive } from 'lucide-react';

export default function RightPanel() {
  const { riskSummary, vulnerableSector, source, loading, neows, donki, firms } = useTelemetryStore();
  const [logTime, setLogTime] = useState('');

  // Lock log timestamp on successful fetch
  useEffect(() => {
    if (!loading) {
      setLogTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }
  }, [loading]);

  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  // Calculate high-precision weight telemetry metrics
  const hazardousCount = neows.filter(a => a.isPotentiallyHazardous).length;
  const cmeCount = donki.length;
  const fireCount = firms.length;

  return (
    <div className="flex flex-col h-full bg-[#040812] border-l border-slate-900 p-4 space-y-4 overflow-hidden select-none">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
        <div className="flex items-center space-x-2">
          <Cpu className="w-3.5 h-3.5 text-slate-450" />
          <h2 className="text-[10px] font-black font-mono tracking-widest text-slate-300 uppercase">
            FLIGHT THREAT COMPUTER (MISTRAL-7B)
          </h2>
        </div>
        <div className="flex space-x-1">
          <span className="text-[8px] font-mono text-slate-500 uppercase">System Ready</span>
          <span className="w-1.5 h-1.5 bg-emerald-500 self-center" />
        </div>
      </div>

      {/* Main Glass Content Deck */}
      <div className="flex-grow flex flex-col space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* Core Readout Metrics Table */}
        <div className="border border-slate-900 bg-slate-950/20 p-3 font-mono text-[9px] text-slate-400 space-y-1">
          <div className="flex justify-between border-b border-slate-900/60 pb-1 mb-1">
            <span className="text-slate-500">PARAMETER</span>
            <span className="text-slate-500 text-right">VALUE / COUNT</span>
          </div>
          <div className="flex justify-between">
            <span>ASTEROID DETECTIONS (NEOWS)</span>
            <span className="text-slate-200">{neows.length} ({hazardousCount} HAZ)</span>
          </div>
          <div className="flex justify-between">
            <span>IONOSPHERIC CORONAL ALERTS (DONKI)</span>
            <span className="text-slate-200">{cmeCount} ACTIVE</span>
          </div>
          <div className="flex justify-between">
            <span>TERRESTRIAL THERMAL SENSORS (FIRMS)</span>
            <span className="text-slate-200">{fireCount} HOTSPOTS</span>
          </div>
        </div>

        {/* AI Analysis and Outputs */}
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-grow border border-dashed border-slate-900 p-6 space-y-2">
            <div className="w-4 h-4 border border-slate-400 border-t-transparent animate-spin" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">
              computing threat analysis...
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Risk Assessment Box */}
            <div className="border border-slate-850 bg-slate-950/10 p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-300 font-bold font-mono text-[9px] uppercase tracking-wider">
                <Shield className="w-3 h-3 text-slate-400" />
                <span>INTELLIGENCE RISK REPORT</span>
              </div>
              <p className="text-slate-400 font-mono text-[10px] leading-relaxed italic pl-4 border-l border-slate-800">
                &ldquo;{riskSummary}&rdquo;
              </p>
            </div>

            {/* Critical Exposure Box */}
            <div className="border border-slate-850 bg-slate-950/10 p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-300 font-bold font-mono text-[9px] uppercase tracking-wider">
                <Cpu className="w-3 h-3 text-slate-400" />
                <span>EXPOSED CORE SECTOR</span>
              </div>
              <div className="text-amber-500 font-black font-mono text-[11px] tracking-wider uppercase pl-4">
                {vulnerableSector}
              </div>
            </div>

            {/* Engine Source Badge */}
            <div className="border border-slate-850 bg-slate-950/10 p-2 text-[9px] font-mono flex items-center justify-between text-slate-400">
              <div className="flex items-center space-x-1.5">
                <HardDrive className="w-3 h-3 text-slate-500" />
                <span>CALCULATION ENGINE:</span>
              </div>
              <span className="font-bold tracking-wider uppercase border border-slate-800 px-2 py-0.5 bg-slate-900 text-slate-300">
                {source}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Flight Logs terminal footer */}
      <div className="border-t border-slate-900 pt-2 font-mono text-[9px] text-slate-500">
        <div>SYS LOG [{loading ? nowTime : logTime}]: TELEMETRY PARSED</div>
        <div>EXEC SOURCE: HACKATHON CONSOLE // ARC-2026</div>
      </div>

    </div>
  );
}
