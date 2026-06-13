# TerraGuard 3D

**TerraGuard 3D** is a unified planetary & atmospheric threat intelligence dashboard developed for the **ArcNight 2026 SpaceTech track**. 

It aggregates real-time data from NASA's open telemetry feeds (Near-Earth Asteroids, Solar Storms, and Wildfires), runs the combined data through an AI threat assessment model to calculate a **Global Stress Index**, and visualizes all threats on an interactive 3D WebGL globe.

---

## 🚀 Key Features

- **3D Interactive Threat Globe**: A lightweight, low-poly holographic Earth rendering up to 50 active MODIS thermal hotspots and projecting orbit ring contours for hazardous near-Earth asteroids.
- **AI Threat Synthesis**: Evaluates planetary stress levels and forecasts target vulnerability sectors using the `Mistral-7B-Instruct-v0.2` model via Hugging Face.
- **Robust Math Heuristics**: Automatically falls back to local mathematical risk models if APIs hit rate limits, credentials are missing, or connection timeouts occur.
- **Supabase Auditing Ledger**: Logs all real-time analyses and index history into a Postgres database.
- **Native SVGs**: Responsive linear trend charts rendered procedurally without heavy external libraries.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Mission control dark aesthetics)
- **3D Graphics**: Three.js + React Three Fiber (`@react-three/fiber` & `@react-three/drei`)
- **State Management**: Zustand
- **Database**: Supabase (Postgres)
- **AI Inference**: Hugging Face Inference API (`mistralai/Mistral-7B-Instruct-v0.2`)

---

## 💾 Database Schema Setup

To support the historical ledger logs, run the following SQL command in your Supabase SQL Editor:

```sql
create table hazard_logs (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  stress_index integer not null,
  risk_summary text not null,
  vulnerable_sector text not null,
  source text not null
);
```

---

## ⚙️ Environment Variables

Create a `.env.local` file at the root of the project with these keys:

```env
# NASA Open API Access Key (Fallback is 'DEMO_KEY')
NASA_API_KEY=YOUR_NASA_API_KEY

# Supabase Postgres Ledger Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Hugging Face Model Inference Token
HF_API_TOKEN=your-hugging-face-token
```

---

## 🛸 Local Setup & Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Verify Production Compilations**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
