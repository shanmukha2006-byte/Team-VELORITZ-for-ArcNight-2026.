'use client';

import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { Orbit, Sun } from 'lucide-react';

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
        hour12: false
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#040812] border-r border-slate-900 p-4 space-y-5 overflow-hidden select-none">
      
      {/* SECTION 1: NEAR-EARTH OBJECTS TELEMETRY GRID */}
      <div className="flex flex-col flex-1 min-h-[50%] overflow-hidden">
        <div className="flex items-center space-x-2 border-b border-slate-850 pb-2 mb-3">
          <Orbit className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-[10px] font-black font-mono tracking-widest text-slate-300 uppercase">
            NEAR-EARTH OBJECT VECTORS (NEOWS)
          </h2>
        </div>

        {loading ? (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-slate-900 h-10 w-full animate-pulse" />
            ))}
          </div>
        ) : neows.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 border border-slate-900 p-4 text-center">
            <span className="text-[9px] font-mono text-slate-600 uppercase">no telemetry acquired</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <table className="w-full text-left font-mono text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase text-[8px] tracking-wider">
                  <th className="pb-1.5 font-bold">Designation</th>
                  <th className="pb-1.5 font-bold text-right">Size</th>
                  <th className="pb-1.5 font-bold text-right">Velocity</th>
                  <th className="pb-1.5 font-bold text-right">Miss Distance</th>
                  <th className="pb-1.5 font-bold text-center">Hazard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {neows.map((asteroid) => (
                  <tr
                    key={asteroid.id}
                    className="hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-2 text-slate-300 font-bold truncate max-w-[80px]">
                      {asteroid.name.replace(/[()]/g, '')}
                    </td>
                    <td className="py-2 text-right text-slate-400">
                      {asteroid.estimatedDiameterMeters.toFixed(0)}m
                    </td>
                    <td className="py-2 text-right text-slate-400">
                      {asteroid.relativeVelocityKmS.toFixed(1)}k/s
                    </td>
                    <td className="py-2 text-right text-slate-400">
                      {formatNumber(asteroid.missDistanceKm / 1e6)}M km
                    </td>
                    <td className="py-2 text-center">
                      {asteroid.isPotentiallyHazardous ? (
                        <span className="inline-block bg-red-950/40 border border-red-900 text-red-500 text-[8px] font-bold px-1 rounded-sm uppercase tracking-wide">
                          YES
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[8px]">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: DONKI SPACE WEATHER ALERT TABLE */}
      <div className="flex flex-col flex-1 min-h-[45%] overflow-hidden">
        <div className="flex items-center space-x-2 border-b border-slate-850 pb-2 mb-3">
          <Sun className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-[10px] font-black font-mono tracking-widest text-slate-300 uppercase">
            SPACE WEATHER TELEMETRY (DONKI)
          </h2>
        </div>

        {loading ? (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[1, 2].map((n) => (
              <div key={n} className="border border-slate-900 h-10 w-full animate-pulse" />
            ))}
          </div>
        ) : donki.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 border border-slate-900 p-4 text-center">
            <span className="text-[9px] font-mono text-slate-600 uppercase">no solar activity monitored</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <table className="w-full text-left font-mono text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase text-[8px] tracking-wider">
                  <th className="pb-1.5 font-bold">Event Type</th>
                  <th className="pb-1.5 font-bold">Start Time</th>
                  <th className="pb-1.5 font-bold text-right">Velocity</th>
                  <th className="pb-1.5 font-bold text-center">Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {donki.map((event) => {
                  const isHighAlert = event.geomagneticScale.match(/G[3-5]/i);
                  const isLowAlert = event.geomagneticScale.match(/G[1-2]/i);

                  let alertBadge = <span className="text-slate-600 text-[8px]">--</span>;
                  if (isHighAlert) {
                    alertBadge = (
                      <span className="inline-block bg-red-950/40 border border-red-900 text-red-500 text-[8px] font-bold px-1 rounded-sm uppercase tracking-wide">
                        {event.geomagneticScale}
                      </span>
                    );
                  } else if (isLowAlert) {
                    alertBadge = (
                      <span className="inline-block bg-amber-950/40 border border-amber-900 text-amber-500 text-[8px] font-bold px-1 rounded-sm uppercase tracking-wide">
                        {event.geomagneticScale}
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-2 text-slate-300 font-bold uppercase">
                        {event.eventType}
                      </td>
                      <td className="py-2 text-slate-400">
                        {formatDate(event.startTime)}
                      </td>
                      <td className="py-2 text-right text-slate-400">
                        {event.plasmaVelocityKmS ? `${event.plasmaVelocityKmS} k/s` : '--'}
                      </td>
                      <td className="py-2 text-center">
                        {alertBadge}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
