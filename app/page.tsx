'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTelemetryStore, useTelemetryPolling } from '@/store/useTelemetryStore';
import HeaderGauge from '@/components/HeaderGauge';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import Globe3D from '@/components/Globe3D';
import { Calendar, Cpu } from 'lucide-react';

export default function Home() {
  // Start the background telemetry polling synchronization (5m intervals)
  useTelemetryPolling();

  const { loading, error } = useTelemetryStore();
  const [lastUpdated, setLastUpdated] = useState('');

  // Lock the last updated time when telemetry loading state switches to false
  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }
  }, [loading]);

  return (
    <main className="relative flex flex-col h-screen w-screen bg-[#030712] text-slate-200 overflow-hidden select-none">
      
      {/* Subtle dotted crosshair background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#475569_1px,transparent_1px)] bg-[size:16px_16px] z-0" />

      {/* TOP HEADER: Full-Width avionic strip */}
      <header className="relative z-10 grid grid-cols-3 items-center px-5 py-3 bg-[#040812] border-b border-slate-900 shrink-0">
        
        {/* Left: Telemetry Sector metadata */}
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-slate-400" />
            <h1 className="text-xs font-black tracking-widest text-slate-200 font-mono uppercase">
              TERRAGUARD 3D // COCKPIT
            </h1>
          </div>
          <p className="text-[8px] text-slate-500 font-mono tracking-wider uppercase">
            VECTOR INTEL FEED :: SECTOR_ATMOS_PLANETARY
          </p>
        </div>

        {/* Center: Stress dial */}
        <div className="flex justify-center">
          <HeaderGauge />
        </div>

        {/* Right: Operational Status / History Panel Navigation */}
        <div className="flex items-center justify-end space-x-4">
          <div className="flex flex-col items-end font-mono text-[9px] space-y-0.5">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-500" />
              <span className="text-emerald-500 font-bold uppercase">SAT LINK SECURE</span>
            </div>
            <span className="text-slate-500">FEED SYNC STATE: NOMINAL</span>
          </div>

          <Link
            href="/history"
            className="flex items-center space-x-1.5 bg-[#090e18] hover:bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold px-3 py-1.5 transition-colors duration-150"
          >
            <Calendar className="w-3 h-3" />
            <span>HISTORY LOGS</span>
          </Link>
        </div>
      </header>

      {/* Warning Alert Banner (If API feeds return degraded parameters) */}
      {error && (
        <div className="relative z-15 bg-amber-950/20 border-b border-amber-900/30 text-amber-500 font-mono text-[9px] tracking-wider text-center py-1.5 px-4 flex items-center justify-center space-x-2">
          <span className="w-1.5 h-1.5 bg-amber-500" />
          <span>DEGRADED LINK: FEED SYNCHRONIZATION ERROR - {error}</span>
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
      <footer className="relative z-10 flex items-center justify-between px-5 py-2 bg-[#040812] border-t border-slate-900 text-[9px] font-mono text-slate-500 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-emerald-500" />
          <span className="text-slate-400 font-bold uppercase">LIVE MONITORING DATASTREAM</span>
        </div>
        
        <div className="flex items-center space-x-6">
          {lastUpdated && (
            <div>
              LAST SYNC: <span className="text-slate-355 font-bold">{lastUpdated}</span>
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
