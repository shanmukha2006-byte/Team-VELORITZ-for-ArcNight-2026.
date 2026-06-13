'use client';

import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';

export default function HeaderGauge() {
  const { stressIndex, loading } = useTelemetryStore();

  // Precision avionic matte colors
  let color = '#10B981'; // Emerald Stable
  let statusText = 'SYS ACTIVE // STABLE';
  let textColorClass = 'text-emerald-500';

  if (stressIndex >= 36 && stressIndex <= 70) {
    color = '#F59E0B'; // Muted Amber Alert
    statusText = 'ELEVATED THREAT VECTOR';
    textColorClass = 'text-amber-500';
  } else if (stressIndex > 70) {
    color = '#EF4444'; // Classic Crimson Hazard
    statusText = 'CRITICAL DEGRADATION';
    textColorClass = 'text-red-500';
  }

  // Circular gauge parameters
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stressIndex / 100) * circumference;

  return (
    <div className="flex items-center space-x-4 bg-[#090e18] border border-slate-800 px-5 py-2 select-none shadow-none">
      {/* Precision Dial */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Outer high-precision ticks */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#1e293b"
            strokeWidth="1.5"
            fill="transparent"
            strokeDasharray="1, 4.5"
          />
          {/* Background vector ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#0f172a"
            strokeWidth="2"
            fill="transparent"
          />
          {/* Active vector progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={loading ? '#334155' : color}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference * 0.75 : strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          {loading ? (
            <span className="text-[9px] font-bold text-slate-500 animate-pulse">SYNC</span>
          ) : (
            <>
              <span className="text-sm font-black tracking-tighter text-white">
                {stressIndex}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Avionic telemetry metrics */}
      <div className="flex flex-col justify-center min-w-[130px] font-mono">
        <div className="text-[8px] tracking-wider text-slate-500 uppercase">
          index value dial
        </div>
        <div className="text-[10px] font-black text-slate-300 tracking-wider">
          GLOBAL THREAT INDEX
        </div>
        <div className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${loading ? 'text-slate-500 animate-pulse' : textColorClass}`}>
          {loading ? 'CALCULATING...' : statusText}
        </div>
      </div>
    </div>
  );
}
