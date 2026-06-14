'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTelemetryStore, useTelemetryPolling } from '@/store/useTelemetryStore';
import HeaderGauge from '@/components/HeaderGauge';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import Globe3D from '@/components/Globe3D';

export default function Home() {
  // Start the background telemetry polling synchronization (5m intervals)
  useTelemetryPolling();

  const { loading, error } = useTelemetryStore();
  const [lastUpdated, setLastUpdated] = useState('');
  const [utcTime, setUtcTime] = useState('');

  // Lock the last updated time when telemetry loading state switches to false
  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }
  }, [loading]);

  // Keep a live UTC clock ticking in the header to match the avionic node registry
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().split('T')[1].substring(0, 8);
      setUtcTime(`${timeStr}Z`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="relative flex flex-col h-screen w-screen bg-[#030712] text-slate-200 overflow-hidden select-none">
      
      {/* Subtle dotted crosshair background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#475569_1px,transparent_1px)] bg-[size:16px_16px] z-0" />

      {/* TOP HEADER: Full-Width avionic strip */}
      <header className="relative z-10 grid grid-cols-3 items-center px-5 py-2.5 bg-[#040812] border-b border-slate-900 shrink-0">
        
        {/* Left: Telemetry Sector metadata */}
        <div className="flex flex-col space-y-0.5 font-mono">
          <h1 className="text-[11px] font-black tracking-wider text-slate-100 uppercase">
            TERRAGUARD 3D // INTERCEPT DECK
          </h1>
          <p className="text-[8px] text-slate-500 tracking-wider uppercase truncate max-w-[400px]">
            SYSTEM STATE: ACTIVE // RADAR LINK 100% SECURE // NEOWS FEED SYNC // DONKI ALERTS ONLINE
          </p>
        </div>

        {/* Center: Planetary Stress Index Dial */}
        <div className="flex justify-center">
          <HeaderGauge />
        </div>

        {/* Right: Operational Status / History Register Navigation */}
        <div className="flex items-center justify-end space-x-6 font-mono text-[9px]">
          <div className="text-slate-500 uppercase tracking-wider">
            DPS-NODE / <span className="text-slate-300 font-bold tabular-nums">{utcTime || '00:00:00Z'}</span>
          </div>

          <Link
            href="/history"
            className="text-slate-400 hover:text-white transition-colors duration-200 border border-slate-800 hover:border-slate-700 px-3 py-1 bg-slate-950/20"
          >
            [ REGISTER HISTORY LEDGER ]
          </Link>
        </div>
      </header>

      {/* Warning Alert Banner (If API feeds return degraded parameters) */}
      {error && (
        <div className="relative z-15 bg-amber-955/20 border-b border-amber-900/30 text-amber-500 font-mono text-[8px] tracking-wider text-center py-1 px-4 flex items-center justify-center space-x-2 shrink-0">
          <span className="w-1 h-1 bg-amber-500 rounded-full" />
          <span>DEGRADED LINK: TELEMETRY SYNC DELAYED - {error}</span>
        </div>
      )}

      {/* CORE COCKPIT INTERFACE: 3-Column Split Deck */}
      <section className="relative z-10 flex-grow grid grid-cols-12 min-h-0 w-full">
        {/* Left Column (Raw Telemetry Streams - 25% Width) */}
        <div className="col-span-3 h-full min-h-0">
          <LeftPanel />
        </div>

        {/* Center 3D Globe Deck (50% Width) */}
        <div className="col-span-6 h-full min-h-0 relative border-r border-l border-slate-900">
          <Globe3D />
        </div>

        {/* Right Column (Flight Threat Computer - 25% Width) */}
        <div className="col-span-3 h-full min-h-0">
          <RightPanel />
        </div>
      </section>

      {/* FOOTER STRIP */}
      <footer className="relative z-10 flex items-center justify-between px-5 py-1.5 bg-[#040812] border-t border-slate-900 text-[8.5px] font-mono text-slate-500 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-450 font-bold uppercase tracking-wider">LIVE MONITORING DATASTREAM</span>
        </div>
        
        <div className="flex items-center space-x-6">
          {lastUpdated && (
            <div>
              LAST SYNC: <span className="text-slate-350 font-bold">{lastUpdated}</span>
            </div>
          )}
          <div>
            SUBMISSION: <span className="text-slate-500 font-bold">ARCNIGHT 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
