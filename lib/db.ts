import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Original pre-seeded hazard logs data so the page is populated on first load
const originalData = [
  {
    stress_index: 25,
    risk_summary: "Nominal tracking: minor coronal mass ejection detected by SOHO satellite; no hazard vectors in range.",
    vulnerable_sector: "Satellite Communications",
    source: "ai",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    stress_index: 78,
    risk_summary: "CRITICAL: Multiple high-mass orbital intercepts detected. Risk of kinetic degradation in LEO sectors.",
    vulnerable_sector: "Orbital Assets",
    source: "ai",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    stress_index: 12,
    risk_summary: "Nominal coverage: quiet solar winds; no critical thermal anomalies detected across L1 monitoring arrays.",
    vulnerable_sector: "Power Grid Infrastructure",
    source: "fallback",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    stress_index: 45,
    risk_summary: "Elevated threat rating: minor telemetry collision drifts detected on sector 08 orbital tracks.",
    vulnerable_sector: "Orbital Assets",
    source: "ai",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

let dbInstance: Database | null = null;
let useMemoryFallback = false;
let memoryDb: any[] = [...originalData].map((item, idx) => ({ id: idx + 1, ...item }));

export async function getDatabaseConnection() {
  if (dbInstance) return dbInstance;
  if (useMemoryFallback) return null;

  try {
    const dbPath = path.join(process.cwd(), 'database.db');
    
    // Open SQLite database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS hazard_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        stress_index INTEGER NOT NULL,
        risk_summary TEXT NOT NULL,
        vulnerable_sector TEXT NOT NULL,
        source TEXT NOT NULL
      )
    `);

    // Seed original data if empty
    const countResult = await db.get('SELECT COUNT(*) as count FROM hazard_logs');
    if (countResult && countResult.count === 0) {
      for (const log of originalData) {
        await db.run(
          `INSERT INTO hazard_logs (created_at, stress_index, risk_summary, vulnerable_sector, source)
           VALUES (?, ?, ?, ?, ?)`,
          [log.created_at, log.stress_index, log.risk_summary, log.vulnerable_sector, log.source]
        );
      }
    }

    dbInstance = db;
    return db;
  } catch (error) {
    console.warn("SQLite failed to initialize, falling back to in-memory store:", error);
    useMemoryFallback = true;
    return null;
  }
}

export async function getHazardLogs() {
  const db = await getDatabaseConnection();
  if (db) {
    try {
      return await db.all('SELECT * FROM hazard_logs ORDER BY created_at DESC LIMIT 50');
    } catch (error) {
      console.error("Failed to query SQLite logs, falling back to memory:", error);
    }
  }
  // Return memory logs
  return [...memoryDb].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function insertHazardLog(log: {
  stress_index: number;
  risk_summary: string;
  vulnerable_sector: string;
  source: string;
}) {
  const newLog = {
    ...log,
    created_at: new Date().toISOString()
  };

  const db = await getDatabaseConnection();
  if (db) {
    try {
      await db.run(
        `INSERT INTO hazard_logs (created_at, stress_index, risk_summary, vulnerable_sector, source)
         VALUES (?, ?, ?, ?, ?)`,
        [newLog.created_at, newLog.stress_index, newLog.risk_summary, newLog.vulnerable_sector, newLog.source]
      );
      return;
    } catch (error) {
      console.error("Failed to insert into SQLite, writing to memory:", error);
    }
  }

  // Push to memory fallback
  memoryDb.push({
    id: memoryDb.length + 1,
    ...newLog
  });
}
