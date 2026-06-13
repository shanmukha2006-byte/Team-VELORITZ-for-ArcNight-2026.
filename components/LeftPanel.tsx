'use client';

import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { ShieldAlert, Orbit, Sun } from 'lucide-react';

export default function LeftPanel() {
  const { neows, donki, loading } = useTelemetryStore();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d]/90 border-r border-[#1e2d4a]/50 p-4 space-y-4 overflow-hidden backdrop-blur-md">
      
      {/* SECTION 1: NEAR-EARTH OBJECTS */}
      <div className="flex flex-col flex-1 min-h-[50%] overflow-hidden">
        <div className="flex items-center space-x-2 border-b border-[#1e2d4a]/40 pb-2 mb-2">
          <Orbit className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <h2 className="text-xs font-black font-mono tracking-widest text-cyan-400 uppercase">
            Near-Earth Objects (NeoWS)
          </h2>
        </div>

        {loading ? (
          // SKELETON LOADER
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#0f172a]/50 border border-[#1e2d4a]/30 rounded p-3 space-y-2 animate-pulse">
                <div className="h-3 bg-[#1e2d4a]/60 rounded w-3/4"></div>
                <div className="h-2 bg-[#1e2d4a]/40 rounded w-1/2"></div>
                <div className="h-2 bg-[#1e2d4a]/40 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : neows.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-[#0f172a]/20 border border-dashed border-[#1e2d4a]/30 rounded p-4 text-center">
            <span className="text-xs font-mono text-slate-500">NO ASTEROID VECTORS ACQUIRED</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {neows.map((asteroid) => (
              <div
                key={asteroid.id}
                className={`group relative bg-[#0f172a]/60 border rounded p-3 transition-all duration-300 hover:bg-[#131f3b]/70 ${
                  asteroid.isPotentiallyHazardous
                    ? 'border-red-900/50 hover:border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
                    : 'border-[#1e2d4a]/40 hover:border-cyan-800/50'
                }`}
              >
                {/* Hazard indicator glow */}
                {asteroid.isPotentiallyHazardous && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping m-3" />
                )}

                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold font-mono text-slate-200 group-hover:text-white transition-colors truncate max-w-[70%]">
                    {asteroid.name}
                  </span>
                  {asteroid.isPotentiallyHazardous && (
                    <span className="flex items-center space-x-0.5 bg-red-950/80 border border-red-500/30 text-[8px] font-mono font-black text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>HAZARD</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Diameter:</span>{' '}
                    <span className="text-slate-300">{asteroid.estimatedDiameterMeters.toFixed(1)} m</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Velocity:</span>{' '}
                    <span className="text-slate-300">{asteroid.relativeVelocityKmS.toFixed(1)} km/s</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Miss Dist:</span>{' '}
                    <span className="text-cyan-400">{formatNumber(asteroid.missDistanceKm)} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: SOLAR/GEOMAGNETIC ACTIVITY */}
      <div className="flex flex-col flex-1 min-h-[45%] overflow-hidden">
        <div className="flex items-center space-x-2 border-b border-[#1e2d4a]/40 pb-2 mb-2">
          <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
          <h2 className="text-xs font-black font-mono tracking-widest text-amber-500 uppercase">
            Space Weather Alerts (DONKI)
          </h2>
        </div>

        {loading ? (
          // SKELETON LOADER
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[1, 2].map((n) => (
              <div key={n} className="bg-[#0f172a]/50 border border-[#1e2d4a]/30 rounded p-3 space-y-2 animate-pulse">
                <div className="h-3 bg-[#1e2d4a]/60 rounded w-1/3"></div>
                <div className="h-2 bg-[#1e2d4a]/40 rounded w-3/4"></div>
                <div className="h-2 bg-[#1e2d4a]/40 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : donki.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-[#0f172a]/20 border border-dashed border-[#1e2d4a]/30 rounded p-4 text-center">
            <span className="text-xs font-mono text-slate-500">NO CORONAL ACTIVITY MONITORED</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {donki.map((event) => {
              // Color code the geomagnetic scale badge
              let scaleBadgeColor = 'bg-[#101b33] border-[#1e2d4a]/50 text-slate-400';
              if (event.geomagneticScale.match(/G[1-2]/i)) {
                scaleBadgeColor = 'bg-amber-950/80 border-amber-500/30 text-amber-400';
              } else if (event.geomagneticScale.match(/G[3-5]/i)) {
                scaleBadgeColor = 'bg-red-950/80 border-red-500/30 text-red-400 animate-pulse';
              }

              return (
                <div
                  key={event.id}
                  className="bg-[#0f172a]/60 border border-[#1e2d4a]/40 rounded p-3 transition-all duration-300 hover:bg-[#131f3b]/70 hover:border-amber-900/50"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide truncate max-w-[70%]">
                      {event.eventType}
                    </span>
                    {event.geomagneticScale !== 'none' && (
                      <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${scaleBadgeColor}`}>
                        {event.geomagneticScale}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 mt-2 space-y-1">
                    <div>
                      <span className="text-slate-500">Initiated:</span>{' '}
                      <span className="text-slate-300">{formatDate(event.startTime)}</span>
                    </div>
                    {event.plasmaVelocityKmS && (
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500">Plasma Velocity:</span>{' '}
                        <span className="text-amber-400">{event.plasmaVelocityKmS} km/s</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
