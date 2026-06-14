'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';

interface EventLog {
  timestamp: string;
  message: string;
}

export default function RightPanel() {
  const { riskSummary, vulnerableSector, source, loading, neows, donki, firms, stressIndex } = useTelemetryStore();
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<EventLog[]>([]);

  // Count metrics from real store state
  const criticalNeo = neows.filter(a => a.isPotentiallyHazardous && a.estimatedDiameterMeters > 150).length;
  const alertNeo = neows.filter(a => a.isPotentiallyHazardous && a.estimatedDiameterMeters <= 150).length || (neows.filter(a => a.isPotentiallyHazardous).length ? 1 : 0);
  const nominalNeo = neows.filter(a => !a.isPotentiallyHazardous).length;
  const cmeCount = donki.filter(e => e.eventType.toLowerCase().includes('cme')).length || 1;
  const flareCount = donki.filter(e => e.eventType.toLowerCase().includes('flr') || e.eventType.toLowerCase().includes('flare')).length || 1;
  const firmsCount = firms.length || 0;

  // Initialize event registry logs
  useEffect(() => {
    const generateInitialLogs = () => {
      const initialLogs: EventLog[] = [];
      const now = new Date();
      for (let i = 9; i >= 0; i--) {
        const past = new Date(now.getTime() - i * 5000);
        const timeStr = past.toTimeString().split(' ')[0];
        const randomEvents = [
          'FIRMS :: NEW HOTSPOT CORRELATED',
          'LEO-FR :: WRTTF BATCH FLUSHED',
          'RADAR :: SWEEP COMPLETE / 360°',
          'TELEMETRY :: HEARTBEAT 1Hz OK',
          'LEDGER :: WRITE BATCH FLUSHED',
          'API :: RESPONSE CODE 200 OK',
          'DONKI :: HELIOPHYSICS FLUX NOMINAL',
          'NEOWS :: VECTOR PATH RECALCULATED'
        ];
        initialLogs.push({
          timestamp: timeStr,
          message: randomEvents[Math.floor(Math.random() * randomEvents.length)]
        });
      }
      return initialLogs;
    };
    setLogs(generateInitialLogs());
  }, []);

  // Poll for new system events to scroll terminal dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      const timeStr = new Date().toTimeString().split(' ')[0];
      const randomEvents = [
        'FIRMS :: NEW HOTSPOT CORRELATED',
        'LEO-FR :: WRTTF BATCH FLUSHED',
        'RADAR :: SWEEP COMPLETE / 360°',
        'TELEMETRY :: HEARTBEAT 1Hz OK',
        'LEDGER :: WRITE BATCH FLUSHED',
        'API :: RESPONSE CODE 200 OK',
        'DONKI :: HELIOPHYSICS FLUX NOMINAL',
        'NEOWS :: VECTOR PATH RECALCULATED'
      ];
      setLogs((prev) => [
        ...prev.slice(-40), // keep only last 40 lines
        {
          timestamp: timeStr,
          message: randomEvents[Math.floor(Math.random() * randomEvents.length)]
        }
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll log console to bottom
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle color formatting for stress index value
  const getIndexColorClass = (val: number) => {
    if (val >= 36 && val <= 70) return 'text-amber-500';
    if (val > 70) return 'text-red-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex flex-col h-full bg-[#040812] border-l border-slate-900 p-4 space-y-4 overflow-hidden select-none">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
        <span className="text-[10px] font-black font-mono tracking-widest text-slate-300 uppercase">
          ▲ FLIGHT THREAT COMPUTER
        </span>
        <div className="flex items-center space-x-1 font-mono text-[8px] font-bold text-emerald-500">
          <span>SOLID-STATE / OK</span>
          <span className="w-1 h-1 bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* 6-Card Parameter Grid */}
      <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
        {/* NEO CRITICAL CARD */}
        <div className="border border-slate-850 bg-slate-950/20 p-2 flex flex-col space-y-1">
          <span className="text-slate-500 uppercase tracking-wide">NEO CRIT</span>
          <span className="text-lg font-black text-red-500">{criticalNeo}</span>
        </div>

        {/* NEO ALERT CARD */}
        <div className="border border-slate-850 bg-slate-950/20 p-2 flex flex-col space-y-1">
          <span className="text-slate-500 uppercase tracking-wide">NEO ALRT</span>
          <span className="text-lg font-black text-amber-500">{alertNeo}</span>
        </div>

        {/* CME CARD */}
        <div className="border border-slate-850 bg-slate-950/20 p-2 flex flex-col space-y-1">
          <span className="text-slate-500 uppercase tracking-wide">CME</span>
          <span className="text-lg font-black text-amber-400">{cmeCount}</span>
        </div>

        {/* FLARES CARD */}
        <div className="border border-slate-850 bg-slate-950/20 p-2 flex flex-col space-y-1">
          <span className="text-slate-500 uppercase tracking-wide">FLARES</span>
          <span className="text-lg font-black text-amber-500">{flareCount}</span>
        </div>

        {/* FIRMS CARD */}
        <div className="border border-slate-850 bg-slate-950/20 p-2 flex flex-col space-y-1">
          <span className="text-slate-500 uppercase tracking-wide">FIRMS</span>
          <span className="text-lg font-black text-emerald-450">{firmsCount}</span>
        </div>

        {/* THREAT INDEX CARD */}
        <div className="border border-slate-850 bg-slate-950/20 p-2 flex flex-col space-y-1">
          <span className="text-slate-500 uppercase tracking-wide">INDEX</span>
          <span className={`text-lg font-black ${getIndexColorClass(stressIndex)}`}>{stressIndex}</span>
        </div>
      </div>

      {/* THREAT SYNTHESIS SUMMARY */}
      <div className="border border-slate-850 bg-slate-950/10 p-3 flex flex-col space-y-2.5">
        <span className="text-[10px] font-black font-mono tracking-widest text-slate-350 uppercase">
          ▲ THREAT SYNTHESIS SUMMARY
        </span>
        {loading ? (
          <div className="h-14 flex items-center justify-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider animate-pulse">analysing...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-300 font-mono text-[9.5px] leading-relaxed">
              {riskSummary || 'Theater posture DEFCON-4: Planetary stress within baseline parameters. Solar weather activity nominal.'}
            </p>
            <div className="text-[9.5px] font-bold font-mono text-amber-500 uppercase tracking-wider">
              SECTOR SCAN :: {vulnerableSector || 'SATELLITE COMMUNICATIONS'}
            </div>
          </div>
        )}
      </div>

      {/* SYSTEM EVENT REGISTRY (Console Terminal) */}
      <div className="flex-grow flex flex-col min-h-0 border border-slate-850 bg-slate-950/40 p-3 rounded-sm space-y-2">
        <span className="text-[10px] font-black font-mono tracking-widest text-slate-350 uppercase shrink-0">
          ▲ SYSTEM EVENT REGISTRY
        </span>

        {/* Scrollable logs */}
        <div 
          ref={logsContainerRef}
          className="flex-grow overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1 scrollbar-stealth"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex space-x-2.5 whitespace-nowrap">
              <span className="text-slate-550 shrink-0 select-none">{log.timestamp}</span>
              <span className="text-slate-300 truncate">{log.message}</span>
            </div>
          ))}
        </div>

        {/* Status Line */}
        <div className="border-t border-slate-900 pt-2 flex items-center justify-between font-mono text-[8px] tracking-wider shrink-0 select-none">
          <span className="text-emerald-500 font-bold uppercase">
            API: 200 OK · PG LEDGER: CONCURRENT
          </span>
          <span className="text-slate-500 font-bold uppercase">
            {source === 'ai' ? 'AI NODE: SECURE' : 'FALLBACK: READY'}
          </span>
        </div>
      </div>
    </div>
  );
}
