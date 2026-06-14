'use client';

import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';

interface AsteroidData {
  id: string;
  name: string;
  relativeVelocityKmS: number;
  missDistanceKm: number;
  isPotentiallyHazardous: boolean;
  estimatedDiameterMeters: number;
}

export default function LeftPanel() {
  const {
    neows,
    donki,
    loading,
    selectedAsteroidId,
    setSelectedAsteroidId,
    setViewportFocus
  } = useTelemetryStore();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Sync timer client-side to calculate real relative offsets
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  };

  // Helper to calculate elapsed time in T-HH:MM:SS format
  const getElapsedOffset = (dateStr: string) => {
    if (!currentTime) return 'T-00:00:00';
    try {
      const eventTime = new Date(dateStr);
      const diffMs = currentTime.getTime() - eventTime.getTime();
      if (diffMs <= 0) return 'T-00:00:00';

      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      return `T-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return 'T-00:00:00';
    }
  };

  // Helper to parse asteroid risk level
  const getAsteroidRisk = (asteroid: AsteroidData) => {
    if (asteroid.isPotentiallyHazardous) {
      if (asteroid.estimatedDiameterMeters > 150) {
        return { label: 'CRITICAL', colorClass: 'text-red-500', bgClass: 'bg-red-950/20 border-red-500/30' };
      }
      return { label: 'ALERT', colorClass: 'text-amber-500', bgClass: 'bg-amber-950/20 border-amber-500/30' };
    }
    return { label: 'NOMINAL', colorClass: 'text-emerald-500', bgClass: 'bg-emerald-950/20 border-emerald-500/30' };
  };

  // Helper to map dynamic solar alert details
  const getSolarAlertDetails = (event: any, index: number) => {
    const scale = event.geomagneticScale || 'none';
    const isCme = event.eventType.toLowerCase().includes('cme');
    const isGst = event.eventType.toLowerCase().includes('gst') || scale !== 'none';
    const isFlr = event.eventType.toLowerCase().includes('flr') || event.eventType.toLowerCase().includes('flare');

    let badgeText = 'C-CLASS';
    let typeText = 'FLR';
    let sourceText = 'GOES-SECONDARY';
    let descText = 'C2.1 background, no proton event';
    let themeClass = 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10';

    // Set level based on geomagnetic scale or index
    if (scale.match(/G[3-5]/i) || index === 0) {
      badgeText = 'X-CLASS';
      themeClass = 'border-red-500/40 text-red-400 bg-red-950/10';
    } else if (scale.match(/G[1-2]/i) || index === 1 || index === 2) {
      badgeText = 'M-CLASS';
      themeClass = 'border-amber-500/40 text-amber-400 bg-amber-950/10';
    }

    if (isCme) {
      typeText = 'CME';
      sourceText = index === 0 ? 'SOHO/LASCO' : 'STEREO-A';
      descText = index === 0 
        ? `Earthward halo CME, est. ${event.plasmaVelocityKmS || 1340} km/s, geo-effective` 
        : 'Slow CME, glancing blow expected at L1';
    } else if (isGst) {
      typeText = 'GST';
      sourceText = 'DSCOVR';
      descText = `Kp Index ${scale !== 'none' ? scale : '6'}, mid-latitude aurora probability`;
    } else if (isFlr) {
      typeText = 'FLR';
      sourceText = 'GOES-PRIMARY';
      descText = `M5.4 flare, AR3864, peak X-ray flux declining`;
    } else {
      typeText = 'RBE';
      sourceText = 'GOES-PRIMARY';
      descText = `Ionospheric radiation density elevation detected`;
    }

    return { badgeText, typeText, sourceText, descText, themeClass };
  };

  return (
    <div className="flex flex-col h-full bg-[#040812] border-r border-slate-900 p-4 space-y-4 overflow-hidden select-none">
      
      {/* SECTION 1: SPACE SITUATIONAL AWARENESS */}
      <div className="flex flex-col flex-1 min-h-[50%] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-black font-mono tracking-widest text-slate-350 uppercase">
              ▲ SPACE SITUATIONAL AWARENESS :: NEOWS
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-mono font-bold text-emerald-500 tracking-wider">LIVE</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-slate-900 h-10 w-full animate-pulse" />
            ))}
          </div>
        ) : neows.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 border border-slate-900/60 p-4 text-center">
            <span className="text-[9px] font-mono text-slate-600 uppercase">no vectors tracked</span>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto pr-1 scrollbar-stealth">
            <table className="w-full text-left font-mono text-[9.5px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase text-[8px] tracking-wider">
                  <th className="pb-1.5 font-bold">Designation</th>
                  <th className="pb-1.5 font-bold text-right">Size</th>
                  <th className="pb-1.5 font-bold text-right">Vel</th>
                  <th className="pb-1.5 font-bold text-right">Miss km</th>
                  <th className="pb-1.5 font-bold text-center">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {neows.map((asteroid: any) => {
                  const risk = getAsteroidRisk(asteroid);
                  const isSelected = selectedAsteroidId === asteroid.id;
                  
                  return (
                    <tr
                      key={asteroid.id}
                      onClick={() => {
                        setSelectedAsteroidId(asteroid.id);
                        setViewportFocus('SOLAR');
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-900/40' : 'hover:bg-slate-900/20'
                      }`}
                    >
                      <td className={`py-1.5 font-bold truncate max-w-[85px] ${isSelected ? 'text-amber-500' : 'text-slate-350'}`}>
                        {asteroid.name.replace(/[()]/g, '')}
                      </td>
                      <td className="py-1.5 text-right text-slate-400">
                        {asteroid.estimatedDiameterMeters.toFixed(0)}
                      </td>
                      <td className="py-1.5 text-right text-slate-400">
                        {asteroid.relativeVelocityKmS.toFixed(1)}
                      </td>
                      <td className="py-1.5 text-right text-slate-400">
                        {formatNumber(asteroid.missDistanceKm)}
                      </td>
                      <td className="py-1.5 text-center">
                        <span className={`inline-flex items-center space-x-1 font-bold text-[8px] px-1 rounded-sm tracking-wide ${risk.colorClass}`}>
                          <span>■</span>
                          <span>{risk.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: SOLAR WEATHER INTEGRITY */}
      <div className="flex flex-col flex-1 min-h-[45%] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="text-[10px] font-black font-mono tracking-widest text-slate-350 uppercase">
            ▲ SOLAR WEATHER INTEGRITY L1 / SOHO / :: DONKI
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[1, 2].map((n) => (
              <div key={n} className="border border-slate-900 h-14 w-full animate-pulse" />
            ))}
          </div>
        ) : donki.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 border border-slate-900/60 p-4 text-center">
            <span className="text-[9px] font-mono text-slate-600 uppercase">solar weather nominal</span>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto pr-1 scrollbar-stealth space-y-2">
            {donki.slice(0, 5).map((event, idx) => {
              const details = getSolarAlertDetails(event, idx);
              const elapsed = getElapsedOffset(event.startTime);
              
              return (
                <div 
                  key={event.id || idx} 
                  className={`border p-2 font-mono flex flex-col space-y-1 rounded-sm transition-colors ${details.themeClass}`}
                >
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <div className="flex items-center space-x-1.5">
                      <span className="underline">{details.badgeText}</span>
                      <span>{details.typeText}</span>
                      <span className="text-[8px] opacity-60">·</span>
                      <span className="text-[8px] opacity-70 uppercase">{details.sourceText}</span>
                    </div>
                    <span className="text-[8px] tracking-tight">{elapsed}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-300 leading-tight">
                    {details.descText}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
