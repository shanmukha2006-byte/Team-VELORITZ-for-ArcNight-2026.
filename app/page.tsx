'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTelemetryStore, useTelemetryPolling } from '@/store/useTelemetryStore';
import HeaderGauge from '@/components/HeaderGauge';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import Globe3D from '@/components/Globe3D';
import { Shield, Calendar } from 'lucide-react';

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
    <main className="relative flex flex-col h-screen w-screen bg-[#070a13] text-slate-200 overflow-hidden select-none selection:bg-cyan-500/30">
      
      {/* Background grid-line overlay pattern for cockpit feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

      {/* TOP HEADER: Full-Width Strip */}
      <header className="relative z-10 grid grid-cols-3 items-center px-6 py-4 bg-[#0a0f1d]/85 border-b border-[#1e2d4a]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md shrink-0">
        
        {/* Left: Brand / Title */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-black tracking-widest text-white font-mono uppercase">
              TERRAGUARD 3D
            </h1>
          </div>
          <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
            Unified Planetary &amp; Atmospheric Threat Vector Intelligence Cockpit
          </p>
        </div>

        {/* Center: Stress index radial gauge */}
        <div className="flex justify-center">
          <HeaderGauge />
        </div>

        {/* Right: Operational Status / Logs Link */}
        <div className="flex items-center justify-end space-x-6">
          <div className="flex flex-col items-end font-mono text-[10px] space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-400 font-bold uppercase">SECURE LINK</span>
            </div>
            <span className="text-slate-400">SAT FEED STABLE</span>
          </div>

          <Link
            href="/history"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 hover:from-blue-800/60 hover:to-cyan-800/60 border border-cyan-500/30 hover:border-cyan-400/60 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>HISTORY LOGS</span>
          </Link>
        </div>
      </header>

      {/* Warning Banner if rates run dry / feed degraded */}
      {error && (
        <div className="relative z-15 bg-amber-950/60 border-b border-amber-500/30 text-amber-400 font-mono text-[10px] tracking-wider text-center py-1.5 px-4 animate-fade-in flex items-center justify-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>TELEMETRY FEED DEGRADED - USING CACHED/PARTIAL THREAT DATA: {error}</span>
        </div>
      )}

      {/* CORE INTERFACE: 3-Column Cockpit Layout */}
      <section className="relative z-10 flex-grow grid grid-cols-12 min-h-0 w-full">
        {/* Left Column (25% equivalent width) */}
        <div className="col-span-3 h-full min-h-0">
          <LeftPanel />
        </div>

        {/* Center 3D Globe Column (50% equivalent width) */}
        <div className="col-span-6 h-full min-h-0 relative border-r border-l border-[#1e2d4a]/50">
          <Globe3D />
        </div>

        {/* Right Column (25% equivalent width) */}
        <div className="col-span-3 h-full min-h-0">
          <RightPanel />
        </div>
      </section>

      {/* FOOTER METRIC STRIP */}
      <footer className="relative z-10 flex items-center justify-between px-6 py-2.5 bg-[#080d1a] border-t border-[#1e2d4a]/50 text-[10px] font-mono text-slate-500 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 uppercase font-black">LIVE TELEMETRY MONITORING</span>
        </div>
        
        <div className="flex items-center space-x-6">
          {lastUpdated && (
            <div>
              LAST SYNC: <span className="text-cyan-400 font-bold">{lastUpdated}</span>
            </div>
          )}
          <div>
            SUBMISSION: <span className="text-slate-400 font-bold">ARCNIGHT 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
