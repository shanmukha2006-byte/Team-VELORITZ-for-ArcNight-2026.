'use client';

import React from 'react';
import { useTelemetryPolling } from '../store/useTelemetryStore';
import HeaderGauge from '../components/HeaderGauge';
import LeftPanel from '../components/LeftPanel';
import RightPanel from '../components/RightPanel';
import Globe3D from '../components/Globe3D';

export default function Home() {
  // Start the background synchronization engines
  useTelemetryPolling();

  return (
    <main className="flex flex-col h-screen w-screen bg-[#010204] text-slate-100 overflow-hidden p-3 space-y-3 selection:bg-cyan-500/30">
      {/* MAIN TOP HEADER OPERATIONAL BANNER */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#04060a] border border-slate-900 rounded-md shadow-md shrink-0">
        <div className="flex flex-col">
          <h1 className="text-md font-black tracking-widest text-white font-mono">
            TERRAGUARD 3D <span className="text-cyan-500 text-xs font-normal">v1.4</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase">
            PLANETARY VECTOR SECURITY INTELLIGENCE MATRIX // TEAM VELORITZ
          </p>
        </div>
        <HeaderGauge />
      </header>

      {/* THREE COLUMN GRID INTERFACE SHELL COCKPIT */}
      <section className="flex-1 flex gap-3 min-h-0 w-full">
        <div className="w-[24%] h-full shrink-0">
          <LeftPanel />
        </div>
        <div className="w-[52%] h-full grow">
          <Globe3D />
        </div>
        <div className="w-[24%] h-full shrink-0">
          <RightPanel />
        </div>
      </section>

      {/* FOOTER METRIC TRACKER STRIP */}
      <footer className="flex items-center justify-between px-3 py-1 bg-[#020407] border border-slate-950 rounded text-[9px] font-mono text-slate-600 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          <span>COCKPIT AGENTS SYSTEM SATELITTE FEED LIVE</span>
        </div>
        <span>EVENT CONTEXT: ARCNIGHT 2026 // TECH TRACK SUBMISSION</span>
      </footer>
    </main>
  );
}
