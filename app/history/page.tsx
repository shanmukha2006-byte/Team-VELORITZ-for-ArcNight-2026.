'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldAlert, Calendar } from 'lucide-react';

interface HazardLog {
  id: number;
  created_at: string;
  stress_index: number;
  risk_summary: string;
  vulnerable_sector: string;
  source: string;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<HazardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('hazard_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching historical logs:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect to Supabase database.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Prepare chart coordinates (Oldest to Newest)
  const chartLogs = [...logs].reverse();
  const hasMultiplePoints = chartLogs.length > 1;

  // Generate SVG polyline coordinates
  const points = chartLogs
    .map((log, index) => {
      const x = hasMultiplePoints ? (index / (chartLogs.length - 1)) * 500 : 250;
      const y = 150 - (log.stress_index / 100) * 120; // safe bounding [30px to 150px]
      return `${x},${y}`;
    })
    .join(' ');

  // Create area closed polygon coordinates for gradient styling
  const areaPoints = chartLogs.length > 0
    ? `0,150 ${points} 500,150`
    : '';

  return (
    <main className="relative flex flex-col min-h-screen bg-[#070a13] text-slate-200 p-6 space-y-6 overflow-x-hidden select-none">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

      {/* Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#1e2d4a]/50 pb-4 shrink-0">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center justify-center p-2 rounded-lg bg-[#0e172a] border border-[#1e2d4a]/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-md font-black tracking-widest text-white font-mono uppercase flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>PLANETARY THREAT HISTORICAL LOGS</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
              Supabase Ledger Verification Registry // Historical Vector Indexes
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-2 bg-[#0e172a] hover:bg-[#131f3b] border border-[#1e2d4a]/50 hover:border-cyan-500/50 text-white font-mono text-xs px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH LOGS</span>
        </button>
      </header>

      {/* Main Content wrapper */}
      <div className="relative z-10 flex-grow grid grid-cols-12 gap-6 items-start">
        
        {/* CHART BOX (col-span-12 or col-span-8) */}
        <section className="col-span-12 bg-[#0a0f1d]/90 border border-[#1e2d4a]/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 border-b border-[#1e2d4a]/30 pb-2">
            <h2 className="text-xs font-black font-mono tracking-widest text-cyan-400 uppercase">
              GLOBAL STRESS TREND (LAST 50 INCIDENTS)
            </h2>
            <span className="text-[9px] font-mono text-slate-500">BOUNDS: 0 - 100 INDEX</span>
          </div>

          {loading ? (
            <div className="h-44 w-full flex items-center justify-center bg-[#050811]/50 border border-[#1e2d4a]/20 rounded-lg animate-pulse">
              <span className="text-xs font-mono text-cyan-500 tracking-wider">RETRIEVING LEDGER DATA...</span>
            </div>
          ) : error ? (
            <div className="h-44 w-full flex flex-col items-center justify-center bg-red-950/20 border border-red-500/20 rounded-lg text-center p-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mb-2 animate-bounce" />
              <div className="text-red-400 font-mono font-bold text-xs">DATABASE FEED OFFLINE</div>
              <p className="text-slate-400 font-mono text-[10px] max-w-sm mt-1">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="h-44 w-full flex flex-col items-center justify-center bg-[#050811]/50 border border-[#1e2d4a]/20 rounded-lg text-center p-4">
              <ShieldAlert className="w-6 h-6 text-amber-500 mb-2 animate-pulse" />
              <div className="text-amber-400 font-mono font-bold text-xs">NO INCIDENT LEDGERS FOUND</div>
              <p className="text-slate-400 font-mono text-[10px] max-w-sm mt-1">
                Run the main dashboard to acquire telemetry feeds and log them into the Supabase database.
              </p>
            </div>
          ) : (
            <div className="bg-[#050811] border border-[#1e2d4a]/30 rounded-lg p-3">
              {/* Native SVG Chart */}
              <svg className="w-full h-auto" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  {/* Neon green gradient fill under the line chart */}
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                  </linearGradient>
                  {/* Grid pattern */}
                  <pattern id="chartGrid" width="50" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#1e2d4a" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>

                {/* Grid Overlay */}
                <rect width="500" height="150" fill="url(#chartGrid)" />

                {/* SVG Area polygon (Shaded under line) */}
                {areaPoints && <polygon points={areaPoints} fill="url(#chartGrad)" />}

                {/* SVG Polyline (Trend line) */}
                {points && (
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(0, 255, 136, 0.4))' }}
                  />
                )}

                {/* Individual Data Points */}
                {chartLogs.map((log, index) => {
                  const x = hasMultiplePoints ? (index / (chartLogs.length - 1)) * 500 : 250;
                  const y = 150 - (log.stress_index / 100) * 120;
                  let dotColor = '#00ff88'; // green
                  if (log.stress_index >= 36 && log.stress_index <= 70) dotColor = '#ffaa00'; // amber
                  if (log.stress_index > 70) dotColor = '#ff2244'; // crimson

                  return (
                    <circle
                      key={log.id}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill={dotColor}
                      className="transition-all duration-300 hover:r-4 cursor-pointer"
                    />
                  );
                })}
              </svg>
            </div>
          )}
        </section>

        {/* LOG TABLE (col-span-12) */}
        <section className="col-span-12 bg-[#0a0f1d]/90 border border-[#1e2d4a]/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 border-b border-[#1e2d4a]/30 pb-2">
            <h2 className="text-xs font-black font-mono tracking-widest text-cyan-400 uppercase">
              HAZARD REGISTRY LOG LEDGER
            </h2>
            <span className="text-[9px] font-mono text-slate-500">TOTAL ENTRIES: {logs.length}</span>
          </div>

          <div className="overflow-x-auto border border-[#1e2d4a]/30 rounded-lg">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 border-b border-[#1e2d4a]/40">
                  <th className="p-3 uppercase tracking-wider text-[10px]">Timestamp</th>
                  <th className="p-3 uppercase tracking-wider text-[10px] text-center">Stress Index</th>
                  <th className="p-3 uppercase tracking-wider text-[10px]">Vulnerable Infrastructure</th>
                  <th className="p-3 uppercase tracking-wider text-[10px]">Risk Summary Feed</th>
                  <th className="p-3 uppercase tracking-wider text-[10px] text-right">Engine Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]/20 bg-[#050811]/30">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Querying Supabase registry database...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No logged planetary security snapshots available.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    // Color code stress index
                    let indexColorClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20';
                    if (log.stress_index >= 36 && log.stress_index <= 70) {
                      indexColorClass = 'text-amber-400 bg-amber-950/40 border-amber-500/20';
                    } else if (log.stress_index > 70) {
                      indexColorClass = 'text-red-400 bg-red-950/40 border-red-500/20';
                    }

                    return (
                      <tr key={log.id} className="hover:bg-[#131f3b]/30 transition-colors">
                        <td className="p-3 text-slate-300 text-[11px] whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded border text-[11px] min-w-[32px] ${indexColorClass}`}>
                            {log.stress_index}
                          </span>
                        </td>
                        <td className="p-3 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                          {log.vulnerable_sector}
                        </td>
                        <td className="p-3 text-slate-400 leading-normal max-w-sm text-[11px]">
                          {log.risk_summary}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`inline-block font-black text-[9px] px-1.5 py-0.5 rounded border uppercase ${
                            log.source === 'ai'
                              ? 'text-cyan-400 bg-cyan-950/30 border-cyan-500/20'
                              : 'text-slate-400 bg-[#101b33] border-[#1e2d4a]/50'
                          }`}>
                            {log.source}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
