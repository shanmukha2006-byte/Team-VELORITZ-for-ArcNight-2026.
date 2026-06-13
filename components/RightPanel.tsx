'use client';

import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { Terminal, Shield, Cpu, HardDrive } from 'lucide-react';

export default function RightPanel() {
  const { riskSummary, vulnerableSector, source, loading } = useTelemetryStore();
  const [logTime, setLogTime] = useState('');

  // Lock log timestamp on successful fetch
  useEffect(() => {
    if (!loading) {
      setLogTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }
  }, [loading]);

  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="flex flex-col h-full bg-[#050811] border-l border-[#1e2d4a]/50 p-4 space-y-4 overflow-hidden backdrop-blur-md">
      
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[#00ff88]/30 pb-2 mb-1">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#00ff88]" />
          <h2 className="text-xs font-black font-mono tracking-widest text-[#00ff88] uppercase select-none">
            TERRAGUARD AI :: THREAT COCKPIT
          </h2>
        </div>
        <div className="flex space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88]/80 animate-pulse" />
        </div>
      </div>

      {/* Terminal Screen Container */}
      <div className="flex-1 bg-[#02040a] border border-[#00ff88]/15 rounded-lg p-4 font-mono text-xs text-[#00ff88]/90 overflow-y-auto space-y-4 shadow-[inset_0_0_15px_rgba(0,255,136,0.03)] custom-scrollbar relative">
        
        {/* Terminal Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />

        {/* Console logs */}
        <div className="space-y-3 relative z-10 select-text">
          <div>
            <span className="text-[#00ff88]/50">[{loading ? nowTime : logTime}]</span> SYSTEM: Initializing vector synchronization sequence...
          </div>
          <div>
            <span className="text-[#00ff88]/50">[{loading ? nowTime : logTime}]</span> TELEMETRY: Ingestion streams online.
          </div>

          {loading ? (
            <div className="flex items-center space-x-2 text-cyan-400">
              <span className="text-cyan-400/50">[{nowTime}]</span>
              <span className="animate-pulse">Awaiting threat synthesis telemetry sync</span>
              <span className="w-1.5 h-3 bg-cyan-400 animate-blink" />
            </div>
          ) : (
            <>
              <div className="animate-fade-in text-cyan-400">
                <span className="text-cyan-400/50">[{logTime}]</span> ANALYSIS: Cognitive synthesis complete.
              </div>
              
              <div className="animate-fade-in border border-[#00ff88]/10 bg-[#061c11]/20 rounded p-3 space-y-2 mt-2">
                <div className="flex items-center space-x-1.5 text-white font-bold">
                  <Shield className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span>RISK ASSESSMENT FEED:</span>
                </div>
                <p className="text-[#00ff88] leading-relaxed pl-5 italic">
                  &ldquo;{riskSummary}&rdquo;
                </p>
              </div>

              <div className="animate-fade-in border border-amber-500/10 bg-[#2b1b06]/20 rounded p-3 space-y-2 mt-2">
                <div className="flex items-center space-x-1.5 text-white font-bold">
                  <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  <span>CRITICAL VULNERABILITY TARGET:</span>
                </div>
                <div className="text-amber-400 font-bold text-sm tracking-wider uppercase pl-5 animate-pulse">
                  &gt; {vulnerableSector}
                </div>
              </div>

              <div className="animate-fade-in border border-blue-500/10 bg-[#0a182b]/20 rounded p-3 space-y-2 mt-2 text-[10px] flex items-center justify-between text-blue-400">
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>SYNTHESIS ENGINE SOURCE:</span>
                </div>
                <span className="font-black font-mono tracking-widest uppercase border border-blue-500/25 px-1.5 py-0.5 rounded bg-blue-950/50">
                  {source}
                </span>
              </div>
            </>
          )}

          {/* Prompt blinking cursor */}
          {!loading && (
            <div className="flex items-center space-x-1 pt-2">
              <span className="text-[#00ff88]/50">[{nowTime}]</span>
              <span className="text-[#00ff88]/40">terraguard-ai:~$</span>
              <span className="w-1.5 h-3.5 bg-[#00ff88]/80 animate-blink" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
