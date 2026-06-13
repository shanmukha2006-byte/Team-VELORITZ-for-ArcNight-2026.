'use client';

import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';

export default function HeaderGauge() {
  const { stressIndex, loading } = useTelemetryStore();

  // Determine color and status string based on the index
  let color = '#00ff88'; // stable green
  let glowColor = 'rgba(0, 255, 136, 0.4)';
  let statusText = 'STABLE CORE';
  let textColorClass = 'text-emerald-400';

  if (stressIndex >= 36 && stressIndex <= 70) {
    color = '#ffaa00'; // elevated amber
    glowColor = 'rgba(255, 170, 0, 0.4)';
    statusText = 'ELEVATED ALERT';
    textColorClass = 'text-amber-400';
  } else if (stressIndex > 70) {
    color = '#ff2244'; // critical crimson
    glowColor = 'rgba(255, 34, 68, 0.4)';
    statusText = 'CRITICAL HAZARD';
    textColorClass = 'text-red-500';
  }

  // Circular gauge settings
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stressIndex / 100) * circumference;

  return (
    <div className="flex items-center space-x-6 bg-[#0c1424]/80 border border-[#1e2d4a]/50 rounded-xl px-6 py-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-500 hover:border-blue-900/50">
      {/* Dynamic Circular Gauge */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* SVG Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-[#101b33]"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={loading ? '#3b82f6' : color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference * 0.75 : strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 4px ${loading ? 'rgba(59, 130, 246, 0.6)' : glowColor})`
            }}
          />
        </svg>
        
        {/* Value Label inside Circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <span className="text-xl font-bold font-mono text-blue-400 animate-pulse">SYNC</span>
          ) : (
            <>
              <span className="text-2xl font-black font-mono tracking-tight text-white select-none">
                {stressIndex}
              </span>
              <span className="text-[8px] font-mono tracking-widest text-slate-400 -mt-1">INDEX</span>
            </>
          )}
        </div>
      </div>

      {/* Index Status and Labeling */}
      <div className="flex flex-col justify-center min-w-[140px]">
        <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          Global Threat Vector
        </div>
        <div className="text-sm font-black font-mono tracking-wider text-white select-none mt-0.5">
          GLOBAL STRESS INDEX
        </div>
        <div className={`text-xs font-black font-mono tracking-widest uppercase mt-1 transition-colors duration-500 ${loading ? 'text-blue-400 animate-pulse' : textColorClass}`}>
          {loading ? 'SYNCHRONIZING...' : statusText}
        </div>
      </div>
    </div>
  );
}
