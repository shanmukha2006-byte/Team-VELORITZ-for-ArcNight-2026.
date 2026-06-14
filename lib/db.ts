import path from 'path';
import fs from 'fs';

// Original pre-seeded hazard logs data so the page is populated on first load
const originalData = [
  {
    id: 1,
    stress_index: 25,
    risk_summary: "Nominal tracking: minor coronal mass ejection detected by SOHO satellite; no hazard vectors in range.",
    vulnerable_sector: "Satellite Communications",
    source: "ai",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    stress_index: 78,
    risk_summary: "CRITICAL: Multiple high-mass orbital intercepts detected. Risk of kinetic degradation in LEO sectors.",
    vulnerable_sector: "Orbital Assets",
    source: "ai",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 3,
    stress_index: 12,
    risk_summary: "Nominal coverage: quiet solar winds; no critical thermal anomalies detected across L1 monitoring arrays.",
    vulnerable_sector: "Power Grid Infrastructure",
    source: "fallback",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 4,
    stress_index: 45,
    risk_summary: "Elevated threat rating: minor telemetry collision drifts detected on sector 08 orbital tracks.",
    vulnerable_sector: "Orbital Assets",
    source: "ai",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const dbPath = path.join(process.cwd(), 'database.json');

// Memory cache of logs
let logsCache: any[] | null = null;

function loadLogs(): any[] {
  if (logsCache) return logsCache;

  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      logsCache = JSON.parse(content);
      return logsCache || [];
    }
  } catch (error) {
    console.warn("Failed to read database.json, using fallback:", error);
  }

  // Seed with original data if file does not exist or fails
  logsCache = [...originalData];
  saveLogs(logsCache);
  return logsCache;
}

function saveLogs(logs: any[]) {
  logsCache = logs;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.warn("Failed to write to database.json (filesystem may be read-only):", error);
  }
}

export async function getHazardLogs() {
  const logs = loadLogs();
  return [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function insertHazardLog(log: {
  stress_index: number;
  risk_summary: string;
  vulnerable_sector: string;
  source: string;
}) {
  const logs = loadLogs();
  const nextId = logs.length > 0 ? Math.max(...logs.map(l => l.id || 0)) + 1 : 1;
  
  const newLog = {
    id: nextId,
    ...log,
    created_at: new Date().toISOString()
  };

  logs.push(newLog);
  saveLogs(logs);
}
