'use client';

import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';

export default function HeaderGauge() {
  const { stressIndex, loading } = useTelemetryStore();

  // Precision avionic color mapping
  let color = '#10B981'; // Nominal / Stable
  let statusText = 'NOMINAL';
  let textColorClass = 'text-emerald-500';

  if (stressIndex >= 36 && stressIndex <= 70) {
    color = '#F59E0B'; // Amber Alert
    statusText = 'ELEVATED';
    textColorClass = 'text-amber-500';
  } else if (stressIndex > 70) {
    color = '#EF4444'; // Critical Hazard
    statusText = 'CRITICAL';
    textColorClass = 'text-red-500';
  }

  // Circular gauge parameters
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stressIndex / 100) * circumference;

  return (
    <div className="flex items-center space-x-3 select-none">
      {/* Precision Dial */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
          {/* Outer high-precision ticks */}
          <circle
            cx="30"
            cy="30"
            r="26"
            stroke="#1e293b"
            strokeWidth="1"
            fill="transparent"
            strokeDasharray="1, 3"
          />
          {/* Background vector ring */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="#0f172a"
            strokeWidth="1.5"
            fill="transparent"
          />
          {/* Active vector progress */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke={loading ? '#334155' : color}
            strokeWidth="2.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference * 0.75 : strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex items-center justify-center font-mono">
          {loading ? (
            <span className="text-[8px] font-bold text-slate-500 animate-pulse">...</span>
          ) : (
            <span className="text-[11px] font-black tracking-tighter text-white">
              {stressIndex}
            </span>
          )}
        </div>
      </div>

      {/* Avionic telemetry labels */}
      <div className="flex flex-col justify-center font-mono leading-none">
        <span className="text-[8px] font-bold tracking-wider text-slate-500 uppercase">
          PLANETARY STRESS INDEX
        </span>
        <span className={`text-[10px] font-black tracking-widest uppercase mt-1 ${loading ? 'text-slate-500 animate-pulse' : textColorClass}`}>
          {loading ? 'CALCULATING...' : statusText}
        </span>
      </div>
    </div>
  );
}
